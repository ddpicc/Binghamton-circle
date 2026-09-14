const { createStore } = require('../utils/createStore')
const { fetchLifeMap, fetchLifeCategories, fetchLifeGuides } = require('../services/life')

const lifeStore = createStore({
  mapPoints: [],
  categories: [],
  selectedCategory: 'all',
  loading: false,
  guides: []
})

module.exports = lifeStore

async function loadLifeCategories() {
  if (lifeStore.getState().categories.length) return
  const response = await fetchLifeCategories()
  lifeStore.setState({ categories: response.categories || response.data || [] })
}

async function loadLifeMap(category = 'all') {
  lifeStore.setState({ loading: true, selectedCategory: category })
  try {
    const response = await fetchLifeMap({ category: category === 'all' ? '' : category })
    lifeStore.setState({ mapPoints: response.points || response.items || [] })
  } finally {
    lifeStore.setState({ loading: false })
  }
}

async function loadGuides() {
  const response = await fetchLifeGuides({ limit: 20 })
  lifeStore.setState({ guides: response.items || response.guides || [] })
}

module.exports.loadLifeCategories = loadLifeCategories
module.exports.loadLifeMap = loadLifeMap
module.exports.loadGuides = loadGuides
