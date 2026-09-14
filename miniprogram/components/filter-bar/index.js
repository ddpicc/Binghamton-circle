Component({
  properties: {
    options: {
      type: Array,
      value: []
    },
    value: {
      type: String,
      value: ''
    },
    type: {
      type: String,
      value: 'tabs'
    }
  },
  methods: {
    handleSelect(e) {
      const { value } = e.currentTarget.dataset
      this.triggerEvent('change', value)
    }
  }
})
