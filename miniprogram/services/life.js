const { get } = require('../utils/request')

function fetchLifeMap(params = {}) {
  return get('/life-map', params)
}

function fetchLifeCategories() {
  return get('/life-map/categories')
}

function fetchLifeGuides(params = {}) {
  return get('/life/guides', params)
}

module.exports.fetchLifeMap = fetchLifeMap
module.exports.fetchLifeCategories = fetchLifeCategories
module.exports.fetchLifeGuides = fetchLifeGuides
