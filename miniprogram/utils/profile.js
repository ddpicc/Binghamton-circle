function isPlaceholderNickname(value = '') {
  const name = String(value || '').trim()
  if (!name) return true
  if (name === '微信用户') return true
  return /^wx_[a-z0-9_]+$/i.test(name)
}

function isPlaceholderAvatar(url = '') {
  const value = String(url || '').trim().toLowerCase()
  if (!value) return true
  if (value.includes('default') && value.includes('avatar')) return true
  if (value.includes('wx.qlogo.cn') && value.includes('/132')) return true
  if (value.includes('thirdwx.qlogo.cn') && value.includes('/132')) return true
  return false
}

function needsProfileCompletion(user = null) {
  // 未登录时不触发资料完善提醒
  if (!user) return false
  const profile = user.profile || user.profileDetails || user
  return isPlaceholderNickname(profile?.nickname) || isPlaceholderAvatar(profile?.avatar)
}

module.exports.isPlaceholderNickname = isPlaceholderNickname
module.exports.isPlaceholderAvatar = isPlaceholderAvatar
module.exports.needsProfileCompletion = needsProfileCompletion
