import { useEffect, useState } from 'react'
import { postsApi, normalizePage, getErrorMessage } from '../api/endpoints'
import PostCard from '../components/PostCard.jsx'
import Loader from '../components/Loader.jsx'
import Pagination from '../components/Pagination.jsx'

export default function FollowFeed() {
  const [url, setUrl] = useState(null)
  const [page, setPage] = useState(1)
  const [data, setData] = useState({ items: [], next: null, previous: null, count: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    postsApi.followFeed({ url })
      .then((res) => setData(normalizePage(res.data)))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [url])

  return (
    <div className="page">
      <div className="page__head">
        <h1 className="page__title">Подписки</h1>
      </div>

      {loading && <Loader />}
      {error && <div className="alert alert--error">{error}</div>}
      {!loading && !error && data.items.length === 0 && (
        <div className="empty">Здесь появятся посты тех, на кого вы подписаны</div>
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