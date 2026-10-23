import client from './client'

export function toPath(url) {
  if (!url) return null
  try {
    const u = new URL(url, window.location.origin)
    return u.pathname + u.search
  } catch {
    return url
  }
}

export function normalizePage(data) {
  if (Array.isArray(data)) {
    return { items: data, next: null, previous: null, count: data.length }
  }
  const items = data?.results ?? data?.items ?? data?.data ?? []
  return {
    items,
    next: data?.next ?? null,
    previous: data?.previous ?? null,
    count: data?.count ?? items.length,
  }
}

export function getErrorMessage(err) {
  const d = err?.response?.data
  if (!d) return err.message || 'Ошибка сети'
  if (typeof d === 'string') return d
  if (d.detail) return Array.isArray(d.detail) ? d.detail.map(x => x.msg).join(', ') : d.detail
  const first = Object.values(d)[0]
  if (Array.isArray(first)) return first.join(', ')
  return 'Что-то пошло не так'
}

export const postsApi = {
  feed: ({ q, url } = {}) => {
    if (url) return client.get(toPath(url))
    return client.get('/posts/', { params: q ? { q } : {} })
  },
  followFeed: ({ url } = {}) => client.get(url ? toPath(url) : '/follow/'),
  groupPosts: (slug) => client.get(`/groups/${slug}/`),
  listGroups: () => client.get('/groups/'),
  create: (data) => client.post('/posts/', data),
  update: (id, data) => client.patch(`/posts/${id}/`, data),
  remove: (id) => client.delete(`/posts/${id}/`),
  detail: (id) => client.get(`/posts/${id}`),
  addComment: (id, data) => client.post(`/posts/${id}/comments/`, data),
  like: (postId) => client.post(`/posts/${postId}/like`),
  unlike: (postId) => client.delete(`/posts/${postId}/like`),
  updateComment: (postId, commentId, data) => client.patch(`/posts/${postId}/comments/${commentId}/`, data),
  removeComment: (postId, commentId) => client.delete(`/posts/${postId}/comments/${commentId}/`),
}

export const usersApi = {
  me: () => client.get('/profile/me'),
  profile: (username) => client.get(`/profile/${username}`),
  follow: (username) => client.post(`/profile/${username}/follow/`),
  unfollow: (username) => client.delete(`/profile/${username}/follow/`),
  updateMe: (data) => client.patch('/users/me', data),
  deleteMe: () => client.delete('/users/me'),
}

export const authApi = {
  register: async ({ email, password, username }) => {
    const payload = { email, password }
    if (username) payload.username = username
    const res = await client.post('/auth/register', payload)
    return res.data
  },
  login: async (username, password) => {
    const body = new URLSearchParams({ username, password })
    const res = await client.post('/auth/jwt/login', body, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    return res.data
  },
}

export const groupsApi = {
  list: () => client.get('/groups/'),
  create: (data) => client.post('/groups/', data),
  detail: (slug) => client.get(`/groups/${slug}/`),
}