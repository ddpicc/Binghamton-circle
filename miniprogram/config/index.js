// 小程序API配置
// 开发环境本地直连（仅在 USE_CLOUD_CONTAINER=false 时生效）
const API_BASE_URL = 'http://localhost:3000/api'
const USE_CLOUD_CONTAINER = true
const CLOUDBASE_ENV = 'prod-7gk0oh2eb2a5fd9c'
const CLOUDBASE_SERVICE = 'express-k0lk'

// 如果是生产环境或需要其他API地址，请修改下面这个值
// const API_BASE_URL = 'https://your-api-domain.com/api'
const REQUEST_TIMEOUT = 30000

const COLOR_PALETTE = {
  primary: '#006633',
  primaryLight: '#00a86b',
  primaryDark: '#004225',
  background: '#f6f8fb',
  text: '#1f2933',
  muted: '#6b7280'
}

module.exports.API_BASE_URL = API_BASE_URL
module.exports.REQUEST_TIMEOUT = REQUEST_TIMEOUT
module.exports.COLOR_PALETTE = COLOR_PALETTE
module.exports.USE_CLOUD_CONTAINER = USE_CLOUD_CONTAINER
module.exports.CLOUDBASE_ENV = CLOUDBASE_ENV
module.exports.CLOUDBASE_SERVICE = CLOUDBASE_SERVICE
