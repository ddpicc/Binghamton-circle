import { createStore } from '../utils/createStore'
import {
  fetchPosts,
  createPost,
  deletePost,
  toggleLike,
  fetchComments,
  createComment,
  createReply
} from '../services/treehole'
import { showSuccess } from '../utils/toast'

const treeHoleStore = createStore({
  posts: [],
  loading: false,
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0,
    hasMore: true
  },
  comments: {}
})

export default treeHoleStore

export async function loadPosts(params = {}) {
  treeHoleStore.setState({ loading: true })
  const state = treeHoleStore.getState()
  try {
    const page = params.page || state.pagination.page
    const pageSize = params.pageSize || state.pagination.pageSize
    const response = await fetchPosts({ page, limit: pageSize })
    const items = response.items || response.posts || response.data || []
    const pagination = response.pagination || {}
    const total =
      response.total || pagination.total || (Array.isArray(items) ? items.length : 0)
    const totalPages = pagination.totalPages || (total && pageSize ? Math.ceil(total / pageSize) : 0)
    treeHoleStore.setState({
      posts: page === 1 ? items : [...state.posts, ...items],
      pagination: {
        page,
        pageSize,
        total,
        hasMore: totalPages ? page < totalPages : page * pageSize < total
      }
    })
  } catch (error) {
    console.error('Failed to load tree hole posts:', error)
    treeHoleStore.setState({
      posts: params.page && params.page > 1 ? state.posts : [],
      pagination: {
        page: params.page || 1,
        pageSize: params.pageSize || state.pagination.pageSize,
        total: params.page && params.page > 1 ? state.pagination.total : 0,
        hasMore: false
      }
    })
  } finally {
    treeHoleStore.setState({ loading: false })
  }
}

export async function publishPost(payload) {
  const response = await createPost(payload)
  showSuccess('发布成功')
  treeHoleStore.setState({ posts: [response.post || response, ...treeHoleStore.getState().posts] })
}

export async function removePost(id) {
  await deletePost(id)
  showSuccess('删除成功')
  const { posts } = treeHoleStore.getState()
  treeHoleStore.setState({ posts: posts.filter((item) => item.id !== id) })
}

export async function likePost(id) {
  const response = await toggleLike(id)
  const { posts } = treeHoleStore.getState()
  treeHoleStore.setState({
    posts: posts.map((item) =>
      item.id === id
        ? {
            ...item,
            is_liked: response.liked,
            like_count:
              typeof response.like_count === 'number'
                ? response.like_count
                : Math.max(0, Number(item.like_count || 0) + (response.liked ? 1 : -1))
          }
        : item
    )
  })
}

export async function loadComments(id) {
  const response = await fetchComments(id)
  const comments = response.comments || response.data || []
  treeHoleStore.setState({
    comments: {
      ...treeHoleStore.getState().comments,
      [id]: comments
    }
  })
}

export async function addComment(postId, payload) {
  await createComment(postId, payload)
  showSuccess('评论成功')
  await loadComments(postId)
}

export async function addReply(postId, commentId, payload) {
  await createReply(postId, commentId, payload)
  showSuccess('回复成功')
  await loadComments(postId)
}
