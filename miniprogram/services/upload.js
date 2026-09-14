import { API_BASE_URL, USE_CLOUD_CONTAINER } from '../config/index'
import { getToken } from '../utils/storage'
import { showError } from '../utils/toast'

function getFileExt(filePath = '') {
  const cleanPath = filePath.split('?')[0]
  const index = cleanPath.lastIndexOf('.')
  if (index === -1) return 'jpg'
  return cleanPath.slice(index + 1).toLowerCase() || 'jpg'
}

function buildCloudPath(filePath = '') {
  const ext = getFileExt(filePath)
  const ts = Date.now()
  const random = Math.random().toString(36).slice(2, 10)
  return `uploads/${ts}-${random}.${ext}`
}

function uploadByCloud(filePath) {
  return new Promise((resolve, reject) => {
    wx.cloud.uploadFile({
      cloudPath: buildCloudPath(filePath),
      filePath,
      success(res) {
        resolve(res.fileID || '')
      },
      fail(err) {
        reject(err)
      }
    })
  })
}

function uploadByBackend(filePath, token) {
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: `${API_BASE_URL}/uploads/image`,
      filePath,
      name: 'image',
      header: token ? { Authorization: `Bearer ${token}` } : {},
      success(res) {
        try {
          const data = JSON.parse(res.data)
          if (res.statusCode >= 200 && res.statusCode < 300) {
            const url = data
              ? data.url || data?.image?.url || data?.file?.url || data?.data?.url || (Array.isArray(data.urls) ? data.urls[0] : '')
              : ''
            resolve(url || '')
          } else {
            const message = data && (data.error || data.message) ? data.error || data.message : '上传失败'
            reject(new Error(message))
          }
        } catch (err) {
          reject(err)
        }
      },
      fail(err) {
        reject(err)
      }
    })
  })
}

export function uploadImages(filePaths = []) {
  if (!Array.isArray(filePaths)) {
    return Promise.resolve([])
  }

  const token = getToken()
  const hasCloudUpload =
    typeof wx !== 'undefined' &&
    wx.cloud &&
    typeof wx.cloud.uploadFile === 'function'
  const useCloudUpload = Boolean(USE_CLOUD_CONTAINER && hasCloudUpload)

  const uploadPromises = filePaths.map((path) => {
    return new Promise(async (resolve, reject) => {
      try {
        const value = useCloudUpload
          ? await uploadByCloud(path)
          : await uploadByBackend(path, token)
        resolve(value)
      } catch (error) {
        if (useCloudUpload) {
          console.error('cloud upload failed', error)
          showError('上传失败，请重试')
        } else if (error && error.message) {
          showError(error.message)
        } else {
          showError('上传失败，请重试')
        }
        reject(error)
      }
    })
  })

  return Promise.all(uploadPromises)
}
