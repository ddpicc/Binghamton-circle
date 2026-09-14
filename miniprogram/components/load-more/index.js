Component({
  properties: {
    loading: {
      type: Boolean,
      value: false
    },
    hasMore: {
      type: Boolean,
      value: false
    }
  },
  methods: {
    handleLoadMore() {
      if (this.data.loading || !this.data.hasMore) return
      this.triggerEvent('loadmore')
    }
  }
})
