const { get, post, del } = require('../utils/request')

function fetchAllowedLoginEmails() {
  return get('/admin/allowed-login-emails')
}

function createAllowedLoginEmail(data = {}) {
  return post('/admin/allowed-login-emails', data)
}

function deleteAllowedLoginEmail(id) {
  return del(`/admin/allowed-login-emails/${id}`)
}

module.exports.fetchAllowedLoginEmails = fetchAllowedLoginEmails
module.exports.createAllowedLoginEmail = createAllowedLoginEmail
module.exports.deleteAllowedLoginEmail = deleteAllowedLoginEmail
