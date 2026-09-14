const { get, put, post, del } = require('../utils/request')

function fetchActivities(params = {}, options = {}) {
  return get('/activities', params, { authMode: 'optional', ...options })
}

function fetchActivityDetail(id, options = {}) {
  return get(`/activities/${id}`, {}, { authMode: 'optional', ...options })
}

function createActivity(data) {
  return post('/activities', data)
}

function updateActivity(id, data) {
  return put(`/activities/${id}`, data)
}

function deleteActivity(id) {
  return del(`/activities/${id}`)
}

function joinActivity(id, data = {}) {
  return post(`/activities/${id}/join`, data)
}

function cancelJoinActivity(id) {
  return del(`/activities/${id}/join`)
}

function fetchActivityParticipants(id, options = {}) {
  return get(`/activities/${id}/participants`, {}, { authMode: 'optional', ...options })
}

module.exports.fetchActivities = fetchActivities
module.exports.fetchActivityDetail = fetchActivityDetail
module.exports.createActivity = createActivity
module.exports.updateActivity = updateActivity
module.exports.deleteActivity = deleteActivity
module.exports.joinActivity = joinActivity
module.exports.cancelJoinActivity = cancelJoinActivity
module.exports.fetchActivityParticipants = fetchActivityParticipants
