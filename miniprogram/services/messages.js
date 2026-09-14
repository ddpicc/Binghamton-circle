const { get, post } = require('../utils/request')

function fetchConversation(userId, params = {}) {
  return get(`/messages/conversations/${userId}`, params)
}

function sendMessage(userId, content) {
  return post(`/messages/conversations/${userId}/messages`, { content })
}

function markConversationRead(userId) {
  return post(`/messages/conversations/${userId}/read`, {})
}

function fetchUnreadSummary() {
  return get('/messages/unread-summary')
}

module.exports = {
  fetchConversation,
  sendMessage,
  markConversationRead,
  fetchUnreadSummary
}
