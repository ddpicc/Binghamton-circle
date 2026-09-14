const { createStore } = require('../utils/createStore')
const {
  fetchActivities,
  fetchActivityDetail,
  updateActivity,
  joinActivity,
  deleteActivity
} = require('../services/activities')

const activityStore = createStore({
  activities: [],
  currentActivity: null,
  loading: false,
  categories: [],
  selectedCategory: 'all'
})

module.exports = activityStore

async function loadActivities(params = {}) {
  activityStore.setState({ loading: true })
  try {
    const response = await fetchActivities({ limit: 20, ...params })
    activityStore.setState({
      activities: response.items || response.activities || [],
      loading: false
    })
  } catch (error) {
    console.error('Failed to load activities:', error)
    activityStore.setState({ loading: false })
  }
}

async function loadActivityDetail(id, { withLoading = true } = {}) {
  if (withLoading) {
    activityStore.setState({ loading: true })
  }
  try {
    const response = await fetchActivityDetail(id)
    const activity =
      response.item ||
      response.data ||
      response.activity ||
      response.result ||
      response
    const currentActivities = activityStore.getState().activities
    const index = currentActivities.findIndex(a => a.id == id)

    if (activity) {
      // 更新活动列表中的对应项
      if (index > -1) {
        const updatedActivities = [...currentActivities]
        updatedActivities[index] = activity
        activityStore.setState({
          activities: updatedActivities,
          currentActivity: activity,
          loading: false
        })
      } else {
        activityStore.setState({
          currentActivity: activity,
          loading: false
        })
      }
      return activity
    } else {
      activityStore.setState({ currentActivity: null, loading: false })
      return null
    }
  } catch (error) {
    console.error('Failed to load activity detail:', error)
    if (withLoading) {
      activityStore.setState({ loading: false })
    }
    throw error
  }
}

async function updateActivityData(id, data) {
  try {
    await updateActivity(id, data)
    const currentActivities = activityStore.getState().activities
    const index = currentActivities.findIndex(a => a.id == id)
    if (index > -1) {
      const updatedActivities = [...currentActivities]
      updatedActivities[index] = { ...updatedActivities[index], ...data }
      activityStore.setState({ activities: updatedActivities })
    }
  } catch (error) {
    console.error('Failed to update activity:', error)
  }
}

function setCurrentActivity(activity) {
  activityStore.setState({ currentActivity: activity })
}

function clearCurrentActivity() {
  activityStore.setState({ currentActivity: null })
}

function setActivitiesFilter(category) {
  activityStore.setState({ selectedCategory: category })
}

module.exports.loadActivities = loadActivities
module.exports.loadActivityDetail = loadActivityDetail
module.exports.updateActivityData = updateActivityData
module.exports.setCurrentActivity = setCurrentActivity
module.exports.clearCurrentActivity = clearCurrentActivity
module.exports.setActivitiesFilter = setActivitiesFilter
 
async function toggleJoinActivity(id) {
  try {
    const result = await joinActivity(id)
    await loadActivityDetail(id, { withLoading: false })
    return result
  } catch (error) {
    console.error('Failed to toggle join activity:', error)
    throw error
  }
}

module.exports.toggleJoinActivity = toggleJoinActivity

async function removeActivity(id) {
  try {
    const result = await deleteActivity(id)
    const state = activityStore.getState()
    const activities = (state.activities || []).filter((item) => Number(item.id) !== Number(id))
    const nextState = { activities }

    if (state.currentActivity && Number(state.currentActivity.id) === Number(id)) {
      nextState.currentActivity = null
    }

    activityStore.setState(nextState)
    return result
  } catch (error) {
    console.error('Failed to delete activity:', error)
    throw error
  }
}

module.exports.removeActivity = removeActivity
