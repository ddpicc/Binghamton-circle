const { get } = require('../utils/request')

function fetchUserPublicProfile(userId) {
  return get(`/users/${userId}/profile`)
}

module.exports.fetchUserPublicProfile = fetchUserPublicProfile
