import { uploadImages } from '../../services/upload'
import { showError, showSuccess } from '../../utils/toast'

Component({
  properties: {
    value: {
      type: Array,
      value: []
    },
    max: {
      type: Number,
      value: 5
    },
    maxSize: {
      type: Number,
      value: 10 * 1024 * 1024
    },
    autoUpload: {
      type: Boolean,
      value: true
    }
  },

  data: {
    uploading: false
  },

  methods: {
    async handleSelect() {
      if (this.data.uploading) return
      try {
        const remaining = this.data.max - this.data.value.length
        if (remaining <= 0) {
          showError('已达到图片数量上限')
          return
        }
        const result = await wx.chooseMedia({
          count: remaining,
          mediaType: ['image'],
          sizeType: ['compressed'],
          sourceType: ['album', 'camera']
        })
        const files = result.tempFiles || []
        const oversize = files.filter((file) => file.size > this.data.maxSize)
        if (oversize.length) {
          showError(`图片大小不能超过 ${Math.round(this.data.maxSize / 1024 / 1024)}MB`)
        }
        const allowedFiles = files.filter((file) => file.size <= this.data.maxSize)
        const filePaths = allowedFiles.map((file) => file.tempFilePath)
        if (!filePaths.length) return
        if (!this.data.autoUpload) {
          const next = [...this.data.value, ...filePaths]
          this.triggerEvent('change', next)
          showSuccess('图片已添加')
          return
        }

        this.setData({ uploading: true })
        const uploaded = await uploadImages(filePaths)
        const next = [...this.data.value, ...uploaded.filter(Boolean)]
        this.triggerEvent('change', next)
        showSuccess('上传成功')
      } catch (error) {
        console.error('upload error', error)
      } finally {
        if (this.data.autoUpload) {
          this.setData({ uploading: false })
        }
      }
    },

    handlePreview(e) {
      const { index } = e.currentTarget.dataset
      wx.previewImage({
        urls: this.data.value,
        current: this.data.value[index]
      })
    },

    handleRemove(e) {
      const { index } = e.currentTarget.dataset
      const next = this.data.value.filter((_, i) => i !== index)
      this.triggerEvent('change', next)
    }
  }
})
