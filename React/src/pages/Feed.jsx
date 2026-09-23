import { useEffect, useState } from 'react'
import { postsApi, normalizePage, getErrorMessage } from '../api/endpoints'
import PostCard from '../components/PostCard.jsx'
import PostForm from '../components/PostForm.jsx'
import Loader from '../components/Loader.jsx'
import Pagination from '../components/Pagination.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { groupsApi } from '../api/endpoints'

export default function Feed() {
  const { token } = useAuth()
  const [q, setQ] = useState('')
  const [query, setQuery] = useState('')
  const [url, setUrl] = useState(null)
  const [page, setPage] = useState(1)
  const [data, setData] = useState({ items: [], next: null, previous: null, count: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [groups, setGroups] = useState([])

  useEffect(() => {
  groupsApi.list()
    .then((res) => setGroups(Array.isArray(res.data) ? res.data : res.data?.items ?? []))
    .catch(() => setGroups([]))
  }, [])

  const load = (opts = {}) => {
    setLoading(true)
    setError(null)
    postsApi.feed(opts)
      .then((res) => {
        setData(normalizePage(res.data))
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load(url ? { url } : { q: query })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, url])

  const submitSearch = (e) => {
    e.preventDefault()
    setUrl(null)
    setPage(1)
    setQuery(q.trim())
    if (!url) load({ q: q.trim() })
  }

  return (
    <div className="page">
      <div className="page__head">
        <h1 className="page__title">Лента</h1>
        {token && (
          <button className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Закрыть' : '+ Новый пост'}
          </button>
        )}
      </div>

      {showForm && (
        <PostForm
          groups={groups}
          onSaved={() => { setShowForm(false); load({ q: query }) }}
          onCancel={() => setShowForm(false)}
        />
      )}

      <form className="search" onSubmit={submitSearch}>
        <input
          className="input"
          placeholder="Поиск по тексту…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button className="btn btn-primary">Найти</button>
        {query && (
          <button type="button" className="btn btn-ghost" onClick={() => { setQ(''); setQuery(''); setUrl(null); setPage(1) }}>
            Сбросить
          </button>
        )}
      </form>

      {loading && <Loader />}
      {error && <div className="alert alert--error">{error}</div>}

      {!loading && !error && data.items.length === 0 && (
        <div className="empty">Постов пока нет</div>
      )}

      <div className="posts">
        {data.items.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onDeleted={(id) => setData((d) => ({ ...d, items: d.items.filter((p) => p.id !== id) }))}
          />
        ))}
      </div>

      <Pagination
        page={page}
        total={data.count}
        hasPrev={Boolean(data.previous)}
        hasNext={Boolean(data.next)}
        onPrev={() => { setUrl(data.previous); setPage((p) => Math.max(1, p - 1)) }}
        onNext={() => { setUrl(data.next); setPage((p) => p + 1) }}
      />
    </div>
  )
}