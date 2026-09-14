import { createStore } from '../utils/createStore'
import { fetchNotices, fetchNoticeDetail, createNotice, updateNotice, deleteNotice } from '../services/notices'
import { showSuccess } from '../utils/toast'

const noticeStore = createStore({
  list: [],
  loading: false,
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0,
    hasMore: true
  },
  filters: {
    keyword: '',
    category: ''
  },
  currentNotice: null
})

export default noticeStore

export async function loadNotices(params = {}) {
  noticeStore.setState({ loading: true })
  const state = noticeStore.getState()
  try {
    const page = params.page || state.pagination.page
    const pageSize = params.pageSize || state.pagination.pageSize
    const response = await fetchNotices({
      page,
      limit: pageSize,
      search: params.keyword !== undefined ? params.keyword : state.filters.keyword,
      category: params.category !== undefined ? params.category : state.filters.category,
      sort: params.sort || 'newest'
    })
    const items = response.notices || response.items || response.data || []
    const paginationData = response.pagination || {}
    const total = response.total || paginationData.total || 0
    noticeStore.setState({
      list: page === 1 ? items : [...state.list, ...items],
      pagination: {
        page,
        pageSize,
        total,
        hasMore: page * pageSize < total
      },
      filters: {
        keyword: params.keyword !== undefined ? params.keyword : state.filters.keyword,
        category: params.category !== undefined ? params.category : state.filters.category
      }
    })
  } finally {
    noticeStore.setState({ loading: false })
  }
}

export async function loadNoticeDetail(id) {
  const detail = await fetchNoticeDetail(id)
  noticeStore.setState({ currentNotice: detail.notice || detail })
  return noticeStore.getState().currentNotice
}

export async function saveNotice(payload) {
  const currentNotice = noticeStore.getState().currentNotice
  if (currentNotice && currentNotice.id) {
    const updated = await updateNotice(currentNotice.id, payload)
    showSuccess('通知已更新')
    return updated
  }
  const created = await createNotice(payload)
  showSuccess('通知已发布')
  return created
}

export async function removeNotice(id) {
  await deleteNotice(id)
  showSuccess('通知已删除')
  const list = noticeStore.getState().list
  noticeStore.setState({ list: list.filter((item) => item.id !== id) })
}

export function resetCurrentNotice() {
  noticeStore.setState({ currentNotice: null })
}
