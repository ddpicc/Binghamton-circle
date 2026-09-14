const {
  API_BASE_URL,
  REQUEST_TIMEOUT,
  USE_CLOUD_CONTAINER,
  CLOUDBASE_ENV,
  CLOUDBASE_SERVICE
} = require('../config/index')
const { getToken, getRefreshToken, clearSession } = require('./storage')
const { resetAuthState, updateAuthState } = require('../stores/authStore')
const { redirectToLogin } = require('./auth')
const { hideLoading, showError } = require('./toast')

const CONTENT_SECURITY_ERROR_CODES = new Set([
  'CONTENT_BLOCKED',
  'CONTENT_REVIEW_REQUIRED',
  'WECHAT_CONTENT_SECURITY_API_FAILED'
])

let refreshingPromise = null

function normalizeApiError(responseData = {}) {
  const code = responseData.code || ''
  if (CONTENT_SECURITY_ERROR_CODES.has(code)) {
    return '所发布内容含违规信息'
  }
  return (responseData && (responseData.error || responseData.message)) || '请求失败'
}

function createRequestError(message, extras = {}) {
  const error = new Error(message)
  Object.keys(extras).forEach((key) => {
    error[key] = extras[key]
  })
  return error
}

function buildUrl(url) {
  if (/^https?:\/\//.test(url)) {
    return url
  }
  return `${API_BASE_URL}${url}`
}

function buildContainerPath(url) {
  const normalized = url.startsWith('/') ? url : `/${url}`
  if (normalized.startsWith('/api/')) {
    return normalized
  }
  return `/api${normalized}`
}

async function tryRefreshAccessToken() {
  const state = require('../stores/authStore').getState()
  const refreshToken = state.refreshToken || getRefreshToken()
  if (!refreshToken) return false

  if (!refreshingPromise) {
    refreshingPromise = (async () => {
      try {
        const result = await new Promise((resolve, reject) => {
          executeNetworkRequest(
            {
              url: '/auth/refresh-token',
              method: 'POST',
              data: { refreshToken },
              header: {},
              showLoading: false
            },
            {
              onSuccess: (res) => {
                if (res.statusCode >= 200 && res.statusCode < 300) {
                  resolve(res.data || {})
                  return
                }
                reject(new Error('REFRESH_FAILED'))
              },
              onFail: () => reject(new Error('REFRESH_NETWORK_FAILED')),
              onComplete: () => {}
            }
          )
        })
        const accessToken = result && (result.accessToken || result.token)
        if (!accessToken) return false

        updateAuthState({
          token: accessToken,
          refreshToken,
          user: state.user,
          emailVerified: state.emailVerified,
          hasPassword: state.hasPassword
        })
        return true
      } catch (error) {
        console.error('refresh access token failed', error)
        return false
      } finally {
        refreshingPromise = null
      }
    })()
  }

  return refreshingPromise
}

function executeNetworkRequest({ url, method, data, header, showLoading }, handlers) {
  const { onSuccess, onFail, onComplete } = handlers

  const token = getToken()
  const cacheHeaders = {
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache',
    'Expires': '0'
  }

  const requestHeaders = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...cacheHeaders,
    ...header
  }

  if (USE_CLOUD_CONTAINER) {
    wx.cloud.callContainer({
      config: { env: CLOUDBASE_ENV },
      path: buildContainerPath(url),
      method,
      data,
      header: {
        ...requestHeaders,
        'X-WX-SERVICE': CLOUDBASE_SERVICE
      },
      success: onSuccess,
      fail: onFail,
      complete: onComplete
    })
    return
  }

  wx.request({
    url: buildUrl(url),
    method,
    data,
    header: requestHeaders,
    success: onSuccess,
    fail: onFail,
    complete: onComplete
  })
}

function request({
  url,
  method = 'GET',
  data = {},
  header = {},
  showLoading = false,
  authMode = 'required',
  _retryAuth = true
}) {
  if (showLoading) {
    wx.showNavigationBarLoading()
  }

  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      showError('请求超时，请稍后再试')
      reject(createRequestError('Request timeout', { toastShown: true, code: 'REQUEST_TIMEOUT' }))
    }, REQUEST_TIMEOUT)

    const onSuccess = async (res) => {
      clearTimeout(timeoutId)
      const statusCode = res.statusCode
      const responseData = res.data

      if (statusCode >= 200 && statusCode < 300) {
        resolve(responseData)
        return
      }

      if (statusCode === 401) {
        const isRefreshApi = String(url || '').includes('/auth/refresh-token')
        const state = require('../stores/authStore').getState()
        const hasSessionToken = Boolean((state && state.token) || getToken())
        const hasRefreshToken = Boolean((state && state.refreshToken) || getRefreshToken())
        const hasSession = hasSessionToken || hasRefreshToken

        if (_retryAuth && !isRefreshApi && hasSession) {
          const refreshed = await tryRefreshAccessToken()
          if (refreshed) {
            try {
              const retryResult = await request({
                url,
                method,
                data,
                header,
                showLoading,
                authMode,
                _retryAuth: false
              })
              resolve(retryResult)
              return
            } catch (retryError) {
              reject(retryError)
              return
            }
          }
        }

        if (hasSession) {
          resetAuthState()
          clearSession()
        }

        if (authMode === 'optional') {
          reject(createRequestError('Unauthorized', {
            toastShown: false,
            statusCode,
            code: 'UNAUTHORIZED',
            response: responseData,
            silentAuthFailure: true
          }))
          return
        }

        redirectToLogin()
        reject(createRequestError('Unauthorized', {
          toastShown: false,
          statusCode,
          code: 'UNAUTHORIZED',
          response: responseData
        }))
        return
      }

      const errorMessage = normalizeApiError(responseData)
      showError(errorMessage)
      reject(createRequestError(errorMessage, {
        toastShown: true,
        statusCode,
        code: responseData?.code || null,
        response: responseData
      }))
    }

    const onFail = (err) => {
      clearTimeout(timeoutId)
      showError('网络异常，请检查连接')
      reject(createRequestError(err?.message || 'Network Error', {
        toastShown: true,
        code: 'NETWORK_ERROR',
        cause: err
      }))
    }

    const onComplete = () => {
      if (showLoading) {
        wx.hideNavigationBarLoading()
        hideLoading()
      }
    }

    executeNetworkRequest(
      { url, method, data, header, showLoading },
      { onSuccess, onFail, onComplete }
    )
  })
}

function get(url, params = {}, options = {}) {
  return request({
    url,
    method: 'GET',
    data: params,
    ...options
  })
}

function post(url, data = {}, options = {}) {
  return request({ url, method: 'POST', data, ...options })
}

function put(url, data = {}, options = {}) {
  return request({ url, method: 'PUT', data, ...options })
}

function del(url, data = {}, options = {}) {
  return request({ url, method: 'DELETE', data, ...options })
}

module.exports.request = request
module.exports.get = get
module.exports.post = post
module.exports.put = put
module.exports.del = del
