const axios = require('axios');

const MSG_SEC_CHECK_URL = 'http://api.weixin.qq.com/wxa/msg_sec_check';

class WechatContentSecurityError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'WechatContentSecurityError';
    this.code = options.code || 'WECHAT_CONTENT_SECURITY_ERROR';
    this.statusCode = options.statusCode || 400;
    this.details = options.details;
  }
}

function logSecurityEvent(type, payload = {}) {
  console.log('[wechat-content-security]', JSON.stringify({
    type,
    ...payload,
    timestamp: new Date().toISOString()
  }));
}

function isFeatureEnabled() {
  return process.env.WECHAT_CONTENT_SECURITY_ENABLED !== 'false';
}

function normalizeOpenId(user, requestHeaders = {}) {
  return (
    requestHeaders['x-wx-openid'] ||
    requestHeaders['X-WX-OPENID'] ||
    user?.wechat_openid ||
    user?.openid ||
    ''
  );
}

function buildBlockMessage(result = {}) {
  return '所发布内容含违规信息';
}

async function checkTextSecurity({
  content,
  title,
  nickname,
  openid,
  scene,
  fromAppId
}) {
  if (!content || !String(content).trim()) {
    throw new WechatContentSecurityError('待检测内容不能为空', {
      code: 'CONTENT_EMPTY',
      statusCode: 400
    });
  }

  if (!openid) {
    logSecurityEvent('check_skipped_missing_openid', {
      scene,
      contentLength: String(content).trim().length
    });
    throw new WechatContentSecurityError('当前账号缺少微信身份信息，无法进行内容安全校验', {
      code: 'WECHAT_OPENID_MISSING',
      statusCode: 400
    });
  }

  const payload = {
    version: 2,
    scene,
    openid,
    content: String(content).trim()
  };

  if (title) payload.title = String(title).trim();
  if (nickname) payload.nickname = String(nickname).trim();

  logSecurityEvent('check_started', {
    scene,
    openidSuffix: openid.slice(-6),
    contentLength: payload.content.length,
    hasTitle: Boolean(payload.title),
    hasNickname: Boolean(payload.nickname),
    fromAppId: fromAppId || null
  });

  let response;
  try {
    const url = fromAppId ? `${MSG_SEC_CHECK_URL}?from_appid=${encodeURIComponent(fromAppId)}` : MSG_SEC_CHECK_URL;
    response = await axios.post(url, payload, { timeout: 8000 });
  } catch (error) {
    logSecurityEvent('check_request_error', {
      scene,
      code: error.code || null,
      message: error.message
    });
    throw new WechatContentSecurityError('微信内容安全校验请求失败', {
      code: 'WECHAT_CONTENT_SECURITY_REQUEST_FAILED',
      statusCode: 502,
      details: {
        scene,
        code: error.code || null,
        message: error.message
      }
    });
  }

  const data = response.data || {};
  if (data.errcode && data.errcode !== 0) {
    logSecurityEvent('check_api_failed', {
      scene,
      errcode: data.errcode,
      errmsg: data.errmsg,
      traceId: data.trace_id || null
    });
    let message = data.errmsg || '微信内容安全校验失败';
    let statusCode = 502;

    if (data.errcode === 61010) {
      message = '用户未在近两小时访问小程序，请返回小程序后重试';
      statusCode = 400;
    } else if (data.errcode === 40003 || data.errcode === 43104) {
      message = '当前微信身份信息无效，请重新登录后重试';
      statusCode = 400;
    } else if (data.errcode === 40129) {
      message = '内容安全校验场景配置错误';
      statusCode = 500;
    }

    throw new WechatContentSecurityError(message, {
      code: 'WECHAT_CONTENT_SECURITY_API_FAILED',
      statusCode,
      details: data
    });
  }

  const result = data.result || {};
  logSecurityEvent('check_completed', {
    scene,
    suggest: result.suggest || 'unknown',
    label: result.label || null,
    traceId: data.trace_id || null
  });

  if (result.suggest === 'pass') {
    return data;
  }

  throw new WechatContentSecurityError(buildBlockMessage(result), {
    code: result.suggest === 'review' ? 'CONTENT_REVIEW_REQUIRED' : 'CONTENT_BLOCKED',
    statusCode: 400,
    details: data
  });
}

async function assertMiniProgramTextSecurity({
  user,
  content,
  title,
  nickname,
  scene,
  requestHeaders,
  fromAppId
}) {
  if (!isFeatureEnabled()) {
    logSecurityEvent('feature_disabled', { scene });
    return { skipped: true };
  }

  return checkTextSecurity({
    content,
    title,
    nickname,
    scene,
    openid: normalizeOpenId(user, requestHeaders),
    fromAppId
  });
}

async function assertMiniProgramTextSecurityForTexts({
  user,
  scene,
  texts = [],
  requestHeaders,
  fromAppId
}) {
  const normalizedTexts = (Array.isArray(texts) ? texts : [])
    .map((item) => (typeof item === 'string' ? item : String(item || '')))
    .map((item) => item.trim())
    .filter(Boolean);

  for (const text of normalizedTexts) {
    await assertMiniProgramTextSecurity({
      user,
      content: text,
      scene,
      requestHeaders,
      fromAppId
    });
  }
}

module.exports = {
  assertMiniProgramTextSecurity,
  assertMiniProgramTextSecurityForTexts,
  WechatContentSecurityError
};
