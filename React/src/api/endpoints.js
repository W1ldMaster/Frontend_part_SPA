import client from './client'

// Утилита: превращает абсолютный URL (next/previous) в относительный путь,
// чтобы запрос уходил через Vite-proxy
export function toPath(url) {
  if (!url) return null
  try {
    const u = new URL(url, window.location.origin)
    return u.pathname + u.search
  } catch {
    return url
  }
}

// Нормализация ответа Page[...] — поддерживаем DRF-пагинацию и обычные массивы
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
  // FastAPI-ошибки валидации
  const first = Object.values(d)[0]
  if (Array.isArray(first)) return first.join(', ')
  return 'Что-то пошло не так'
}

export const postsApi = {
  // GET /posts/?q=
  feed: ({ q, url } = {}) => {
    if (url) return client.get(toPath(url))
    return client.get('/posts/', { params: q ? { q } : {} })
  },
  // GET /follow/
  followFeed: ({ url } = {}) => client.get(url ? toPath(url) : '/follow/'),
  // GET /groups/{slug}/
  groupPosts: (slug) => client.get(`/groups/${slug}/`),
  // GET /groups/
  listGroups: () => client.get('/groups/'),
  // POST /posts/
  create: (data) => client.post('/posts/', data),
  // PATCH /posts/{id}/
  update: (id, data) => client.patch(`/posts/${id}/`, data),
  // DELETE /posts/{id}/
  remove: (id) => client.delete(`/posts/${id}/`),
  // GET /posts/{id}
  detail: (id) => client.get(`/posts/${id}`),
  // POST /posts/{id}/comments/
  addComment: (id, data) => client.post(`/posts/${id}/comments/`, data),
}

export const usersApi = {
  // GET /profile/me
  me: () => client.get('/profile/me'),
  // GET /profile/{username}
  profile: (username) => client.get(`/profile/${username}`),
  // POST /profile/{username}/follow/
  follow: (username) => client.post(`/profile/${username}/follow/`),
  // DELETE /profile/{username}/follow/
  unfollow: (username) => client.delete(`/profile/${username}/follow/`),
}

// FastAPI-Users:
//   POST /auth/register  { email, password, username? }  → 201 { id, email, ... }
//   POST /auth/jwt/login form-urlencoded { username, password } → { access_token }
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
    return res.data // { access_token, token_type }
  },
}

export const groupsApi = {
  list: () => client.get('/groups/'),
  create: (data) => client.post('/groups/', data),
  detail: (slug) => client.get(`/groups/${slug}/`),
}