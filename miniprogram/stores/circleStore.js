import { createStore } from '../utils/createStore'
import {
  fetchCircles,
  fetchMyCircles,
  fetchCircleDetail,
  fetchCirclePosts,
  fetchPendingRequests,
  fetchCircleMembers,
  joinCircle,
  quitCircle,
  createCirclePost,
  createCircleComment,
  updateCircle,
  deleteCirclePost,
  handleJoinRequest,
  removeCircleMember,
  transferCircle,
  createCircle
} from '../services/circles'
import { fetchFollowingPosts } from '../services/posts'
import { normalizePostImages, normalizeImageUrl } from '../utils/media'
import { showSuccess, showError } from '../utils/toast'

const initialListState = {
  items: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0,
    hasMore: true
  },
  filters: {
    search: '',
    categoryId: '',
    sortBy: 'created_at',
    sortOrder: 'DESC',
    visibility: 'all'
  }
}

const initialOverviewState = {
  loading: false,
  error: null,
  myCircles: [],
  hotCircles: [],
  stats: {
    total: 0,
    joined: 0
  }
}

const initialDetailState = {
  data: null,
  loading: false,
  error: null
}

const initialThreadsState = {
  items: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0,
    hasMore: true
  },
  filters: {
    sortBy: 'created_at',
    sortOrder: 'DESC'
  },
  circleId: null
}

const initialFollowingState = {
  items: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0,
    hasMore: true
  },
  filters: {
    circleId: '',
    sortBy: 'created_at',
    sortOrder: 'DESC'
  }
}

const initialMembersState = {
  items: [],
  loading: false,
  error: null,
  pagination: {
    page: 1,
    pageSize: 20,
    total: 0,
    hasMore: true
  },
  filters: {
    role: '',
    status: 'approved',
    search: ''
  },
  pending: {
    items: [],
    loading: false,
    error: null
  },
  circleId: null
}

const initialState = {
  list: { ...initialListState },
  overview: { ...initialOverviewState },
  detail: { ...initialDetailState },
  threads: { ...initialThreadsState },
  following: { ...initialFollowingState },
  members: { ...initialMembersState },
  // legacy fields for兼容旧页面，将在重构完成后移除
  circles: [],
  loading: false,
  pagination: { ...initialListState.pagination },
  filters: { ...initialListState.filters },
  currentCircle: null,
  posts: [],
  postsLoading: false
}

const circleStore = createStore(initialState)

function setListState(partial) {
  const prev = circleStore.getState().list
  const next = { ...prev, ...partial }
  circleStore.setState({
    list: next,
    circles: next.items,
    loading: next.loading,
    pagination: next.pagination,
    filters: next.filters
  })
}

function setOverviewState(partial) {
  const prev = circleStore.getState().overview
  const next = { ...prev, ...partial }
  circleStore.setState({ overview: next })
}

function setDetailState(partial) {
  const prev = circleStore.getState().detail
  const next = { ...prev, ...partial }
  circleStore.setState({ detail: next, currentCircle: next.data })
}

function setThreadsState(partial) {
  const prev = circleStore.getState().threads
  const next = { ...prev, ...partial }
  circleStore.setState({ threads: next, posts: next.items, postsLoading: next.loading })
}

function setFollowingState(partial) {
  const prev = circleStore.getState().following
  const next = { ...prev, ...partial }
  circleStore.setState({ following: next })
}

function setMembersState(partial) {
  const prev = circleStore.getState().members
  const next = { ...prev, ...partial }
  circleStore.setState({ members: next })
}

export default circleStore

export async function loadCircles(params = {}) {
  const state = circleStore.getState()
  const page = params.page || state.list.pagination.page
  const pageSize = params.pageSize || state.list.pagination.pageSize

  const filters = {
    ...state.list.filters,
    ...(params.search !== undefined ? { search: params.search } : {}),
    ...(params.categoryId !== undefined ? { categoryId: params.categoryId } : {}),
    ...(params.sortBy ? { sortBy: params.sortBy } : {}),
    ...(params.sortOrder ? { sortOrder: params.sortOrder } : {}),
    ...(params.visibility ? { visibility: params.visibility } : {})
  }

  setListState({ loading: true, error: null, filters })

  try {
    const requestParams = {
      page,
      limit: pageSize,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder
    }

    if (filters.search) {
      requestParams.search = filters.search
    }
    if (filters.categoryId) {
      requestParams.category_id = filters.categoryId
    }
    if (filters.visibility === 'public') {
      requestParams.is_private = false
    } else if (filters.visibility === 'private') {
      requestParams.is_private = true
    }

    const response = await fetchCircles(requestParams)
    const rawItems = response.circles || response.items || response.data || []
    const normalizedItems = rawItems.map((item) => ({
      ...item,
      cover_image: normalizeImageUrl(item?.cover_image)
    }))
    const total = response.pagination?.total ?? response.total ?? rawItems.length ?? 0
    const totalPages = response.pagination?.totalPages ?? response.totalPages ?? (pageSize ? Math.ceil(total / pageSize) : 1)

    const existingIds = new Set(state.list.items.map((item) => item.id))
    const nextItems =
      page === 1
        ? normalizedItems
        : [
            ...state.list.items,
            ...normalizedItems.filter((item) => !existingIds.has(item.id))
          ]

    setListState({
      loading: false,
      items: nextItems,
      pagination: {
        page,
        pageSize,
        total,
        hasMore: page < totalPages
      }
    })
  } catch (error) {
    console.error('loadCircles error', error)
    setListState({ loading: false, error: error || new Error('获取圈子失败') })
    showError('获取圈子失败')
  }
}

export async function refreshCircles(params = {}) {
  await loadCircles({ ...params, page: 1 })
}

export async function loadOverviewData() {
  setOverviewState({ loading: true, error: null })
  try {
    const [my, hot] = await Promise.all([
      fetchMyCircles(),
      fetchCircles({ page: 1, limit: 6, sortBy: 'member_count', sortOrder: 'DESC' })
    ])

    const myCirclesRaw = my?.circles || my?.items || my || []
    const hotCirclesRaw = hot?.circles || hot?.items || []
    const myCircles = myCirclesRaw.map((circle) => ({
      ...circle,
      cover_image: normalizeImageUrl(circle?.cover_image)
    }))
    const hotCircles = hotCirclesRaw.map((circle) => ({
      ...circle,
      cover_image: normalizeImageUrl(circle?.cover_image)
    }))
    const total = hot?.pagination?.total ?? hot?.total ?? hotCircles.length

    setOverviewState({
      loading: false,
      myCircles,
      hotCircles,
      stats: {
        total,
        joined: myCircles.length
      }
    })
  } catch (error) {
    console.error('loadOverviewData error', error)
    setOverviewState({ loading: false, error })
  }
}

export async function loadCircleDetail(id) {
  setDetailState({ loading: true, error: null })
  try {
    const detail = await fetchCircleDetail(id)
    const data = detail.circle || detail
    const normalizedDetail = data
      ? {
          ...data,
          cover_image: normalizeImageUrl(data.cover_image)
        }
      : null
    setDetailState({ loading: false, data: normalizedDetail })
    return normalizedDetail
  } catch (error) {
    console.error('loadCircleDetail error', error)
    setDetailState({ loading: false, error })
    showError('获取圈子详情失败')
    return null
  }
}

export async function loadCircleThreads(circleId, params = {}) {
  const state = circleStore.getState()
  const page = params.page || state.threads.pagination.page
  const pageSize = params.pageSize || state.threads.pagination.pageSize
  const filters = {
    ...state.threads.filters,
    ...(params.sortBy ? { sortBy: params.sortBy } : {}),
    ...(params.sortOrder ? { sortOrder: params.sortOrder } : {})
  }

  const append = page > 1
  const isNewCircle = state.threads.circleId !== circleId
  if (!append && isNewCircle) {
    setThreadsState({
      loading: true,
      error: null,
      filters,
      circleId,
      items: [],
      pagination: {
        page,
        pageSize,
        total: 0,
        hasMore: true
      }
    })
  } else {
    setThreadsState({
      loading: true,
      error: null,
      filters,
      circleId,
      pagination: { ...state.threads.pagination, page },
      items: append ? state.threads.items : state.threads.items
    })
  }

  try {
    const response = await fetchCirclePosts(circleId, {
      page,
      limit: pageSize,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder
    })
    const items = response.posts || response.items || []
    const total = response.pagination?.total ?? response.total ?? items.length
    const totalPages = response.pagination?.totalPages ?? response.totalPages ?? (pageSize ? Math.ceil(total / pageSize) : 1)

    const nextItems = append ? [...state.threads.items, ...items] : items

    setThreadsState({
      loading: false,
      items: nextItems,
      circleId,
      pagination: {
        page,
        pageSize,
        total,
        hasMore: page < totalPages
      }
    })
  } catch (error) {
    console.error('loadCircleThreads error', error)
    setThreadsState({ loading: false, error })
    showError('获取帖子失败')
  }
}

export async function loadFollowingFeed(params = {}) {
  console.log('loadFollowingFeed 开始，参数:', params)
  const state = circleStore.getState()
  const page = params.page || state.following.pagination.page
  const pageSize = params.pageSize || state.following.pagination.pageSize
  const filters = {
    ...state.following.filters,
    ...(params.circleId !== undefined ? { circleId: params.circleId } : {}),
    ...(params.sortBy ? { sortBy: params.sortBy } : {}),
    ...(params.sortOrder ? { sortOrder: params.sortOrder } : {})
  }

  console.log('loadFollowingFeed 请求参数:', { page, pageSize, filters })

  const append = page > 1

  setFollowingState({ loading: true, error: null, filters })

  try {
    console.log('loadFollowingFeed 开始请求API')
    const response = await fetchFollowingPosts({
      page,
      limit: pageSize,
      circle_id: filters.circleId || undefined,
      sortBy: filters.sortBy,
      sortOrder: filters.sortOrder
    })

    console.log('loadFollowingFeed API响应:', response)

    const rawItems = response.posts || response.items || response.data || []
    console.log('=== normalizePostImages 调试 ===')
    console.log('原始数据:', rawItems.map(item => ({
      id: item.id,
      title: item.title,
      images: item.images,
      images_type: typeof item.images,
      images_is_array: Array.isArray(item.images)
    })))

    const items = rawItems.map((post) => ({
      ...post,
      images: normalizePostImages(post?.images)
    }))

    console.log('处理后数据:', items.map(item => ({
      id: item.id,
      title: item.title,
      images: item.images,
      images_type: typeof item.images,
      images_is_array: Array.isArray(item.images)
    })))
    const total = response.pagination?.total ?? response.total ?? items.length
    const totalPages = response.pagination?.totalPages ?? response.totalPages ?? (pageSize ? Math.ceil(total / pageSize) : 1)

    console.log('loadFollowingFeed 处理数据:', { itemsCount: items.length, total, totalPages })

    const nextItems = append ? [...state.following.items, ...items] : items

    setFollowingState({
      loading: false,
      items: nextItems,
      pagination: {
        page,
        pageSize,
        total,
        hasMore: page < totalPages
      }
    })

    console.log('loadFollowingFeed 完成状态更新')
  } catch (error) {
    console.error('loadFollowingFeed error', error)
    setFollowingState({ loading: false, error })
    showError('加载圈子动态失败')
  }
}

export async function loadCircleMembers(circleId, params = {}) {
  console.log('=== loadCircleMembers 开始 ===')
  console.log('circleId:', circleId)
  console.log('params:', params)

  const state = circleStore.getState()
  const page = params.page || state.members.pagination.page
  const pageSize = params.pageSize || state.members.pagination.pageSize
  const filters = {
    ...state.members.filters,
    ...(params.role !== undefined ? { role: params.role } : {}),
    ...(params.status ? { status: params.status } : {}),
    ...(params.search !== undefined ? { search: params.search } : {})
  }

  console.log('请求参数:', {
    circleId,
    page,
    pageSize,
    filters
  })

  const isNewCircle = state.members.circleId !== circleId
  setMembersState({
    loading: true,
    error: null,
    filters,
    circleId,
    items: page === 1 && isNewCircle ? [] : state.members.items
  })

  try {
    const response = await fetchCircleMembers(circleId, {
      page,
      limit: pageSize,
      role: filters.role || undefined,
      status: filters.status || undefined,
      search: filters.search || undefined
    })

    console.log('API响应:', response)

    const members = response.members || response.items || []
    const total = response.pagination?.total ?? response.total ?? members.length
    const totalPages = response.pagination?.totalPages ?? response.totalPages ?? (pageSize ? Math.ceil(total / pageSize) : 1)

    console.log('处理后的数据:', {
      members: members,
      total,
      totalPages,
      hasMore: page < totalPages
    })

    setMembersState({
      loading: false,
      items: members,
      circleId,
      pagination: {
        page,
        pageSize,
        total,
        hasMore: page < totalPages
      }
    })
    return members
  } catch (error) {
    console.error('loadCircleMembers error', error)
    setMembersState({ loading: false, error })
    showError('获取成员列表失败')
    return []
  }
}

export async function loadPendingJoinRequests(circleId) {
  setMembersState({
    pending: {
      ...circleStore.getState().members.pending,
      loading: true,
      error: null
    }
  })

  try {
    const response = await fetchPendingRequests(circleId)
    const items = response.requests || response.items || response || []
    setMembersState({
      pending: {
        items,
        loading: false,
        error: null
      }
    })
  } catch (error) {
    console.error('loadPendingJoinRequests error', error)
    setMembersState({
      pending: {
        items: [],
        loading: false,
        error
      }
    })
    showError('获取申请列表失败')
  }
}

export async function approveJoinRequest(circleId, memberId) {
  await handleJoinRequest(circleId, memberId, { action: 'approve' })
  showSuccess('已通过申请')
  await Promise.all([loadPendingJoinRequests(circleId), loadCircleMembers(circleId)])
}

export async function rejectJoinRequest(circleId, memberId, reason = '') {
  await handleJoinRequest(circleId, memberId, { action: 'reject', reason })
  showSuccess('已拒绝申请')
  await Promise.all([loadPendingJoinRequests(circleId), loadCircleMembers(circleId)])
}

export async function removeMember(circleId, memberId) {
  await removeCircleMember(circleId, memberId)
  showSuccess('已移除成员')
  await loadCircleMembers(circleId)
}

export async function transferCircleOwnership(circleId, targetMemberId) {
  await transferCircle(circleId, targetMemberId)
  showSuccess('圈子已转让')
  await loadCircleDetail(circleId)
}

export async function joinCircleAction(circleId) {
  const response = await joinCircle(circleId)
  const membership = response?.data || response
  const status = membership?.status || 'approved'
  const approved = status === 'approved'

  showSuccess(response?.message || (approved ? '已加入圈子' : '申请已提交，等待审核'))
  const state = circleStore.getState()
  const updatedList = state.list.items.map((item) =>
    item.id === circleId ? { ...item, is_member: approved } : item
  )
  setListState({ items: updatedList })

  if (state.detail.data && state.detail.data.id === circleId) {
    setDetailState({ data: { ...state.detail.data, is_member: approved } })
  }

  await Promise.all([
    loadOverviewData(),
    loadCircleMembers(circleId, { status: 'approved' })
  ])

  if (approved) {
    await loadFollowingFeed({ page: 1 })
  }
}

export async function quitCircleAction(circleId) {
  await quitCircle(circleId)
  showSuccess('已退出圈子')
  const state = circleStore.getState()
  const updatedList = state.list.items.map((item) =>
    item.id === circleId ? { ...item, is_member: false } : item
  )
  setListState({ items: updatedList })

  if (state.detail.data && state.detail.data.id === circleId) {
    setDetailState({ data: { ...state.detail.data, is_member: false } })
  }

  await Promise.all([
    loadOverviewData(),
    loadCircleMembers(circleId, { status: 'approved' })
  ])

  await loadFollowingFeed({ page: 1 })
}

export async function createCirclePostAction(circleId, payload) {
  await createCirclePost(circleId, payload)
  showSuccess('发布成功')
  await loadCircleThreads(circleId, { page: 1 })
  await loadFollowingFeed({ page: 1 })
}

export async function createCircleCommentAction(circleId, postId, payload) {
  await createCircleComment(postId, payload)
  showSuccess('评论成功')
  await loadCircleThreads(circleId, { page: 1 })
}

export async function deleteCirclePostAction(circleId, postId) {
  await deleteCirclePost(postId)
  showSuccess('帖子已删除')
  await loadCircleThreads(circleId, { page: 1 })
}

export async function updateCircleAction(circleId, payload) {
  const response = await updateCircle(circleId, payload)
  const data = response.circle || response
  showSuccess('圈子信息已更新')
  setDetailState({ data })
  await refreshCircles({ page: 1 })
}

export async function createCircleAction(payload) {
  const response = await createCircle(payload)
  const data = response.circle || response
  showSuccess('圈子创建成功')
  await refreshCircles({ page: 1 })
  await loadOverviewData()
  return data
}

export function resetCircleStore() {
  circleStore.resetState()
}
