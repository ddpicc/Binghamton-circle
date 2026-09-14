import o2oStore, { loadCategories, loadO2ODetail, loadO2OList, saveO2OItem } from '../../../stores/o2oStore'
import { uploadImages } from '../../../services/upload'
import { ensureLogin } from '../../../utils/auth'

Page({
  data: {
    safeTop: 20,
    id: null,
    categoryOptions: [],
    categoryIndex: 0,
    isRentalCategory: false,
    priceTypes: ['fixed', 'negotiable', 'free'],
    priceTypeIndex: 0,
    conditionLabels: {
      new: '全新',
      like_new: '九成新',
      good: '成色良好',
      fair: '正常使用痕迹',
      poor: '老旧'
    },
    conditions: ['new', 'like_new', 'good', 'fair', 'poor'],
    conditionIndex: 0,
    conditionText: '全新',
    tradeMethod: 'pickup',
    houseTypes: [
      { label: '整租', value: 'whole' },
      { label: '合租', value: 'share' },
      { label: '单间', value: 'single' }
    ],
    houseTypeIndex: 0,
    roomConfigs: ['1室1厅', '2室1厅', '2室2厅', '3室1厅', '3室2厅', '其他'],
    roomConfigIndex: 0,
    orientations: ['南', '北', '东', '西', '南北'],
    orientationIndex: 0,
    minLeaseOptions: ['1个月', '3个月', '6个月', '1年', '面议'],
    minLeaseIndex: 0,
    facilityOptions: ['空调', '暖气', '热水器', '洗衣机', '冰箱', '电视', '宽带', '家具', '燃气', '电梯', '停车位', '阳台'],
    imageSlots: Array(8).fill(''),
    images: [],
    uploading: false,
    form: {
      title: '',
      category_id: '',
      price: '',
      price_type: 'fixed',
      condition: 'new',
      location: '',
      contact_info: '',
      description: '',
      deposit: '',
      house_type: 'whole',
      room_config: '1室1厅',
      area: '',
      floor: '',
      orientation: '南',
      facilities: [],
      move_in_date: '',
      min_lease: '1个月'
    },
    saving: false
  },

  async onLoad(options) {
    const sys = wx.getSystemInfoSync()
    this.setData({ safeTop: sys.statusBarHeight || 20 })

    const allowed = await ensureLogin({
      title: '登录后可发布闲置',
      content: '浏览闲置列表无需登录，发布或编辑商品时需要先登录。'
    })
    if (!allowed) {
      wx.navigateBack({
        fail: () => wx.switchTab({ url: '/pages/o2o/list/index' })
      })
      return
    }

    this.unsubscribe = o2oStore.subscribe((state) => {
      if (state.categories.length) {
        const categoryOptions = state.categories.map((item) => ({
          label: item.displayName || item.name,
          value: item.id,
          code: item.code || ''
        }))
        this.setData({ categoryOptions })
        if (!this.data.form.category_id && categoryOptions.length) {
          this.setData({ 'form.category_id': categoryOptions[0].value })
        }
        this.syncCategoryState(this.data.form.category_id)
      }
    })

    loadCategories()

    const { id } = options
    if (id) {
      this.setData({ id })
      loadO2ODetail(id).then((detail) => {
        const contact = detail.contact_info
        let contactInfoText = ''
        if (typeof contact === 'string') {
          contactInfoText = contact
        } else if (contact && typeof contact === 'object') {
          contactInfoText = [contact.wechat, contact.phone, contact.email].filter(Boolean).join(' / ')
        }
        this.setData({
          images: detail.images || [],
          imageSlots: this.buildImageSlots(detail.images || []),
          form: {
            title: detail.title,
            category_id: detail.category_id,
            price: detail.price,
            price_type: detail.price_type || 'fixed',
            condition: detail.condition || 'new',
            location: detail.location || '',
            contact_info: contactInfoText,
            description: detail.description || '',
            deposit: detail.deposit || '',
            house_type: detail.house_type || 'whole',
            room_config: detail.room_config || '1室1厅',
            area: detail.area || '',
            floor: detail.floor || '',
            orientation: detail.orientation || '南',
            facilities: detail.facilities || [],
            move_in_date: detail.move_in_date ? String(detail.move_in_date).slice(0, 10) : '',
            min_lease: detail.min_lease || '1个月'
          }
        })
        this.syncCategoryState(detail.category_id)
        this.updatePriceTypeIndex(detail.price_type)
        this.updateConditionIndex(detail.condition)
        this.updateHouseTypeIndex(detail.house_type)
        this.updateRoomConfigIndex(detail.room_config)
        this.updateOrientationIndex(detail.orientation)
        this.updateMinLeaseIndex(detail.min_lease)
        this.setData({
          conditionText: this.data.conditionLabels[detail.condition || 'new'] || '全新',
          tradeMethod: detail.price_type === 'fixed' ? 'delivery' : 'pickup'
        })
      })
    }
  },

  onUnload() {
    this.unsubscribe && this.unsubscribe()
  },

  updateCategoryIndex(categoryId) {
    const index = this.data.categoryOptions.findIndex((item) => String(item.value) === String(categoryId))
    if (index >= 0) {
      this.setData({ categoryIndex: index })
    }
  },

  syncCategoryState(categoryId) {
    this.updateCategoryIndex(categoryId)
    const option = this.data.categoryOptions.find((item) => String(item.value) === String(categoryId))
    const isRentalCategory = option?.code === 'rental'
    this.setData({ isRentalCategory: !!isRentalCategory })
  },

  updatePriceTypeIndex(priceType = 'fixed') {
    const index = this.data.priceTypes.findIndex((item) => item === priceType)
    if (index >= 0) {
      this.setData({ priceTypeIndex: index })
    }
  },

  updateConditionIndex(condition = 'new') {
    const index = this.data.conditions.findIndex((item) => item === condition)
    if (index >= 0) {
      this.setData({
        conditionIndex: index,
        conditionText: this.data.conditionLabels[condition] || '成色良好'
      })
    }
  },

  updateHouseTypeIndex(houseType = 'whole') {
    const index = this.data.houseTypes.findIndex((item) => item.value === houseType)
    if (index >= 0) {
      this.setData({ houseTypeIndex: index })
    }
  },

  updateRoomConfigIndex(roomConfig = '1室1厅') {
    const index = this.data.roomConfigs.findIndex((item) => item === roomConfig)
    if (index >= 0) {
      this.setData({ roomConfigIndex: index })
    }
  },

  updateOrientationIndex(orientation = '南') {
    const index = this.data.orientations.findIndex((item) => item === orientation)
    if (index >= 0) {
      this.setData({ orientationIndex: index })
    }
  },

  updateMinLeaseIndex(minLease = '1个月') {
    const index = this.data.minLeaseOptions.findIndex((item) => item === minLease)
    if (index >= 0) {
      this.setData({ minLeaseIndex: index })
    }
  },

  buildImageSlots(images = []) {
    const targetSize = images.length >= 9 ? 9 : 8
    const list = images.slice(0, targetSize)
    while (list.length < targetSize) list.push('')
    return list
  },

  handleBack() {
    wx.navigateBack()
  },

  handleInput(e) {
    const { field } = e.currentTarget.dataset
    this.setData({ [`form.${field}`]: e.detail.value })
  },

  handleCategoryChange(e) {
    const index = Number(e.detail.value)
    const option = this.data.categoryOptions[index]
    const value = option ? option.value : ''
    const isRentalCategory = option?.code === 'rental'
    const nextData = {
      categoryIndex: index,
      isRentalCategory: !!isRentalCategory,
      'form.category_id': value
    }

    if (isRentalCategory) {
      nextData['form.price_type'] = 'fixed'
      nextData['form.condition'] = 'new'
      nextData.priceTypeIndex = this.data.priceTypes.findIndex((item) => item === 'fixed')
    }

    this.setData(nextData)
  },

  handlePriceTypeChange(e) {
    const index = Number(e.detail.value)
    const value = this.data.priceTypes[index]
    this.setData({ priceTypeIndex: index, 'form.price_type': value })
  },

  handleConditionChange(e) {
    const index = Number(e.detail.value)
    const value = this.data.conditions[index]
    this.setData({
      conditionIndex: index,
      conditionText: this.data.conditionLabels[value] || '成色良好',
      'form.condition': value
    })
  },

  handleConditionTagTap() {
    const nextIndex = (this.data.conditionIndex + 1) % this.data.conditions.length
    const value = this.data.conditions[nextIndex]
    this.setData({
      conditionIndex: nextIndex,
      conditionText: this.data.conditionLabels[value] || '成色良好',
      'form.condition': value
    })
  },

  handleTradeMethodTap(e) {
    if (this.data.isRentalCategory) return
    const { method } = e.currentTarget.dataset
    if (!method || method === this.data.tradeMethod) return
    const nextPriceType = method === 'delivery' ? 'fixed' : 'negotiable'
    this.setData({
      tradeMethod: method,
      'form.price_type': nextPriceType,
      priceTypeIndex: this.data.priceTypes.findIndex((item) => item === nextPriceType)
    })
  },

  async handleChooseImages() {
    if (this.data.uploading) return
    const remaining = 9 - this.data.images.length
    if (remaining <= 0) {
      wx.showToast({ title: '最多上传 9 张', icon: 'none' })
      return
    }
    try {
      const result = await wx.chooseMedia({
        count: remaining,
        mediaType: ['image'],
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      })
      const tempFiles = result.tempFiles || []
      const filePaths = tempFiles.map((file) => file.tempFilePath).filter(Boolean)
      if (!filePaths.length) return
      this.setData({ uploading: true })
      const uploaded = await uploadImages(filePaths)
      const nextImages = [...this.data.images, ...uploaded.filter(Boolean)].slice(0, 9)
      this.setData({
        images: nextImages,
        imageSlots: this.buildImageSlots(nextImages)
      })
    } catch (error) {
      console.error('handleChooseImages error', error)
    } finally {
      this.setData({ uploading: false })
    }
  },

  handlePreviewImage(e) {
    const { index } = e.currentTarget.dataset
    const current = this.data.images[index]
    if (!current) return
    wx.previewImage({
      urls: this.data.images,
      current
    })
  },

  handleRemoveImage(e) {
    const { index } = e.currentTarget.dataset
    const nextImages = this.data.images.filter((_, i) => i !== Number(index))
    this.setData({
      images: nextImages,
      imageSlots: this.buildImageSlots(nextImages)
    })
  },

  handleHouseTypeChange(e) {
    const index = Number(e.detail.value)
    const option = this.data.houseTypes[index]
    this.setData({
      houseTypeIndex: index,
      'form.house_type': option ? option.value : 'whole'
    })
  },

  handleRoomConfigChange(e) {
    const index = Number(e.detail.value)
    this.setData({
      roomConfigIndex: index,
      'form.room_config': this.data.roomConfigs[index] || '1室1厅'
    })
  },

  handleOrientationChange(e) {
    const index = Number(e.detail.value)
    this.setData({
      orientationIndex: index,
      'form.orientation': this.data.orientations[index] || '南'
    })
  },

  handleMinLeaseChange(e) {
    const index = Number(e.detail.value)
    this.setData({
      minLeaseIndex: index,
      'form.min_lease': this.data.minLeaseOptions[index] || '1个月'
    })
  },

  handleMoveInDateChange(e) {
    this.setData({ 'form.move_in_date': e.detail.value })
  },

  handleFacilityToggle(e) {
    const { value } = e.currentTarget.dataset
    if (!value) return
    const facilities = Array.isArray(this.data.form.facilities) ? [...this.data.form.facilities] : []
    const index = facilities.indexOf(value)
    if (index >= 0) {
      facilities.splice(index, 1)
    } else {
      facilities.push(value)
    }
    this.setData({ 'form.facilities': facilities })
  },

  async handleSubmit() {
    if (!this.data.form.title) {
      wx.showToast({ title: '请输入标题', icon: 'none' })
      return
    }
    if (!this.data.form.category_id) {
      wx.showToast({ title: '请选择分类', icon: 'none' })
      return
    }
    if (!this.data.form.description) {
      wx.showToast({ title: '请输入描述', icon: 'none' })
      return
    }
    if (this.data.isRentalCategory) {
      if (!this.data.form.deposit) {
        wx.showToast({ title: '请输入押金', icon: 'none' })
        return
      }
      if (!this.data.form.area) {
        wx.showToast({ title: '请输入面积', icon: 'none' })
        return
      }
      if (!this.data.form.move_in_date) {
        wx.showToast({ title: '请选择入住时间', icon: 'none' })
        return
      }
    }
    this.setData({ saving: true })
    try {
      const payload = {
        id: this.data.id ? Number(this.data.id) : undefined,
        title: this.data.form.title,
        category_id: this.data.form.category_id,
        price: Number(this.data.form.price) || 0,
        price_type: this.data.isRentalCategory ? 'fixed' : this.data.form.price_type,
        condition: this.data.isRentalCategory ? 'new' : this.data.form.condition,
        location: this.data.form.location,
        contact_info: this.data.form.contact_info,
        description: this.data.form.description,
        images: this.data.images
      }
      if (this.data.isRentalCategory) {
        payload.deposit = Number(this.data.form.deposit) || 0
        payload.house_type = this.data.form.house_type
        payload.room_config = this.data.form.room_config
        payload.area = Number(this.data.form.area) || 0
        payload.floor = this.data.form.floor
        payload.orientation = this.data.form.orientation
        payload.facilities = this.data.form.facilities
        payload.move_in_date = this.data.form.move_in_date
        payload.min_lease = this.data.form.min_lease
      }
      await saveO2OItem(payload)
      await loadO2OList({ page: 1, pageSize: 10 })
      wx.showToast({ title: '已保存', icon: 'success' })
      wx.navigateBack()
    } finally {
      this.setData({ saving: false })
    }
  }
})
