import api from './api'

export interface UploadedFile {
  filename: string
  originalName: string
  mimetype: string
  size: number
  path: string
  url: string
}

export interface FileInfo {
  filename: string
  size: number
  created: string
  modified: string
  path: string
  url: string
}

export const uploadService = {
  // 上传单个文件
  uploadSingle: async (file: File): Promise<{ file: UploadedFile; message: string }> => {
    const formData = new FormData()
    formData.append('file', file)
    
    return api.post('/uploads/single', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 上传多个文件
  uploadMultiple: async (files: File[]): Promise<{ files: UploadedFile[]; message: string; count: number }> => {
    const formData = new FormData()
    files.forEach(file => {
      formData.append('files', file)
    })
    
    return api.post('/uploads/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 上传图片
  uploadImage: async (file: File, folder = 'images'): Promise<{ image: UploadedFile; message: string }> => {
    const formData = new FormData()
    formData.append('image', file)
    if (folder) {
      formData.append('folder', folder)
    }
    
    return api.post('/uploads/image', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    })
  },

  // 删除文件
  deleteFile: async (filename: string): Promise<{ message: string }> => {
    return api.delete(`/uploads/${filename}`)
  },

  // 获取文件信息
  getFileInfo: async (filename: string): Promise<{ file: FileInfo }> => {
    return api.get(`/uploads/info/${filename}`)
  }
}
