const { get, put } = require('../utils/request')

function fetchHomeBanner(options = {}) {
  return get('/home/banner', {}, { authMode: 'optional', ...options })
}

function updateHomeBanner(data = {}) {
  return put('/home/banner', data)
}

module.exports.fetchHomeBanner = fetchHomeBanner
module.exports.updateHomeBanner = updateHomeBanner
