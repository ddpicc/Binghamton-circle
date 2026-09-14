import { API_BASE_URL } from '../config/index'

// 取出 API 基础地址并去掉 /api 前缀，便于构造静态资源地址
const API_HOST = API_BASE_URL.replace(/\/api\/?$/, '')

function fixDoubleEncodedUrl(url) {
  if (!url || typeof url !== 'string') return url

  const hasDoubleEncodingPattern = /%C3%[0-9A-F]{2}|%C2%[0-9A-F]{2}/i.test(url)
  if (!hasDoubleEncodingPattern) {
    return url
  }

  try {
    const decodedOnce = decodeURIComponent(url)
    // 如果解码后仍然包含乱码字符，则尝试按 Latin1 再转换一次
    if (/[\u00C0-\u017F]/.test(decodedOnce)) {
      try {
        // escape 将字符重新编码成 %XX，再由 decodeURIComponent 转回 UTF-8
        return decodeURIComponent(escape(decodedOnce))
      } catch (innerErr) {
        console.warn('Failed to rehydrate UTF-8 characters from Latin1 string:', innerErr)
      }
    }
    return decodedOnce
  } catch (err) {
    console.warn('Failed to fix double-encoded URL:', err, url)
    return url
  }
}

export function normalizeImageUrl(url) {
  if (!url) return ''
  if (typeof url !== 'string') return ''

  const trimmed = fixDoubleEncodedUrl(url.trim())
  if (!trimmed) return ''

  // 云开发 fileID（cloud://）直接透传给小程序组件
  if (/^cloud:\/\//i.test(trimmed)) {
    return trimmed
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed
  }

  if (trimmed.startsWith('//')) {
    return `https:${trimmed}`
  }

  const normalizedPath = fixDoubleEncodedUrl(trimmed.startsWith('/') ? trimmed : `/${trimmed}`)
  return fixDoubleEncodedUrl(`${API_HOST}${normalizedPath}`)
}

export function normalizePostImages(images) {
  if (!images) return []

  if (typeof images === 'string') {
    const url = normalizeImageUrl(images)
    return url ? [url] : []
  }

  if (!Array.isArray(images)) {
    return []
  }

  return images
    .map((item) => {
      if (!item) return ''
      if (typeof item === 'string') {
        return normalizeImageUrl(item)
      }
      if (typeof item === 'object') {
        const candidate = item.url || item.path || item.key || ''
        return normalizeImageUrl(candidate)
      }
      return ''
    })
    .filter((url) => !!url)
}
