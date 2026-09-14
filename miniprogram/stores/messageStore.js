const { createStore } = require('../utils/createStore')
const authStore = require('./authStore')
const {
  fetchConversation,
  sendMessage: sendMessageRequest,
  markConversationRead,
  fetchUnreadSummary
} = require('../services/messages')
const { showError } = require('../utils/toast')

const initialState = {
  threads: {},
  unreadFlags: {},
  sending: false,
  error: null
}

const messageStore = createStore(initialState)

module.exports = messageStore

function getCurrentUserId() {
  return authStore.getState().user?.id || null
}

function ensureThread(userId) {
  const state = messageStore.getState()
  if (!state.threads[userId]) {
    messageStore.setState({
      threads: {
        ...state.threads,
        [userId]: {
          conversation: null,
          messages: [],
          loading: false,
          hasMore: true,
          error: null,
          pagination: {
            nextBeforeId: null
          }
        }
      }
    })
  }
}

function setThreadState(userId, partial) {
  const state = messageStore.getState()
  const prevThread = state.threads[userId] || {}
  messageStore.setState({
    threads: {
      ...state.threads,
      [userId]: {
        ...prevThread,
        ...partial
      }
    }
  })
}

function mergeMessages(existing = [], incoming = [], { prepend = false } = {}) {
  const existingIds = new Set(existing.map((msg) => msg.id))
  const filtered = incoming.filter((msg) => !existingIds.has(msg.id))
  return prepend ? [...filtered, ...existing] : [...existing, ...filtered]
}

function countConsecutiveOutgoing(messages = [], currentUserId) {
  if (!currentUserId || !messages.length) return 0
  let count = 0
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i]
    if (message.sender?.id === currentUserId || message.senderId === currentUserId) {
      count += 1
    } else {
      break
    }
  }
  return count
}

async function loadConversation(userId, { beforeId, limit = 20 } = {}) {
  ensureThread(userId)
  setThreadState(userId, { loading: true, error: null })

  try {
    const response = await fetchConversation(userId, {
      limit,
      ...(beforeId ? { beforeId } : {})
    })

    const thread = messageStore.getState().threads[userId] || {}
    const mergedMessages = mergeMessages(
      thread.messages || [],
      response.messages || [],
      { prepend: !!beforeId }
    )

    setThreadState(userId, {
      conversation: response.conversation || thread.conversation,
      messages: mergedMessages,
      loading: false,
      hasMore: response.pagination?.hasMore ?? thread.hasMore ?? false,
      pagination: {
        nextBeforeId: response.pagination?.nextBeforeId || null
      }
    })

    const unreadFlags = { ...messageStore.getState().unreadFlags }
    if (response.conversation?.unread === 0) {
      unreadFlags[userId] = false
      messageStore.setState({ unreadFlags })
    }

    return response
  } catch (error) {
    setThreadState(userId, { loading: false, error })
    if (!error?.toastShown) {
      showError(error?.message || '加载会话失败')
    }
    throw error
  }
}

async function sendMessage(userId, content) {
  const trimmed = (content || '').trim()
  if (!trimmed) {
    showError('请输入消息内容')
    return null
  }

  const currentUserId = getCurrentUserId()
  if (!currentUserId) {
    showError('请先登录')
    return null
  }

  const state = messageStore.getState()
  if (state.sending) {
    return null
  }

  ensureThread(userId)
  const thread = messageStore.getState().threads[userId]
  const consecutive = countConsecutiveOutgoing(thread.messages, currentUserId)
  if (consecutive >= 2) {
    showError('等待对方回复后再继续发送')
    return null
  }

  messageStore.setState({ sending: true, error: null })
  try {
    const response = await sendMessageRequest(userId, trimmed)

    const updatedThread = messageStore.getState().threads[userId] || {}
    const nextMessages = mergeMessages(updatedThread.messages || [], [response.message])

    setThreadState(userId, {
      messages: nextMessages,
      conversation: response.conversation || updatedThread.conversation
    })

    return response.message
  } catch (error) {
    messageStore.setState({ error })
    if (!error?.toastShown) {
      showError(error?.response?.data?.error || error?.message || '发送失败')
    }
    throw error
  } finally {
    messageStore.setState({ sending: false })
  }
}

async function markAsRead(userId) {
  ensureThread(userId)
  try {
    await markConversationRead(userId)

    const state = messageStore.getState()
    const thread = state.threads[userId] || {}
    if (thread.conversation) {
      setThreadState(userId, {
        conversation: { ...thread.conversation, unread: 0 }
      })
    }

    messageStore.setState({
      unreadFlags: {
        ...state.unreadFlags,
        [userId]: false
      }
    })
  } catch (error) {
    if (!error?.toastShown) {
      showError(error?.message || '标记已读失败')
    }
    throw error
  }
}

async function syncUnreadFlags() {
  try {
    const response = await fetchUnreadSummary()
    const flags = {}
    const summary = response.summary || []
    summary.forEach((item) => {
      flags[item.userId] = item.unread > 0
    })
    messageStore.setState({ unreadFlags: flags })
    return flags
  } catch (error) {
    // 不提示错误，避免频繁 toast
    return messageStore.getState().unreadFlags
  }
}

module.exports.loadConversation = loadConversation
module.exports.sendMessage = sendMessage
module.exports.markAsRead = markAsRead
module.exports.syncUnreadFlags = syncUnreadFlags
