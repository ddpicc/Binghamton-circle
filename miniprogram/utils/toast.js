function showSuccess(message = '操作成功') {
  wx.showToast({ title: message, icon: 'success', duration: 2000 })
}

function showError(message = '出错了，请稍后重试') {
  wx.showToast({ title: message, icon: 'none', duration: 2500 })
}

function showLoading(message = '加载中') {
  wx.showLoading({ title: message, mask: true })
}

function hideLoading() {
  wx.hideLoading()
}

module.exports.showSuccess = showSuccess
module.exports.showError = showError
module.exports.showLoading = showLoading
module.exports.hideLoading = hideLoading
