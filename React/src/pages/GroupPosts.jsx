import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { postsApi, normalizePage, getErrorMessage } from '../api/endpoints'
import PostCard from '../components/PostCard.jsx'
import Loader from '../components/Loader.jsx'

export default function GroupPosts() {
  const { slug } = useParams()
  const [group, setGroup] = useState(null)
  const [data, setData] = useState({ items: [], next: null, previous: null, count: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    postsApi.groupPosts(slug)
      .then((res) => {
        // Backend отдаёт { group, posts }, где posts — это Page[PostList]
        const payload = res.data
        setGroup(payload?.group ?? null)
        setData(normalizePage(payload?.posts ?? { items: [] }))
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [slug])

  return (
    <div className="page">
      <div className="page__head">
        <h1 className="page__title">
          {group?.title ? `${group.title}` : `Группа /${slug}`}
        </h1>
        <Link to="/groups" className="btn btn-ghost">← Все группы</Link>
      </div>

      {group?.description && <p className="muted">{group.description}</p>}

      {loading && <Loader />}
      {error && <div className="alert alert--error">{error}</div>}
      {!loading && !error && data.items.length === 0 && (
        <div className="empty">В группе ещё нет постов</div>
      )}

      <div className="posts">
        {data.items.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            onDeleted={(id) =>
              setData((d) => ({ ...d, items: d.items.filter((p) => p.id !== id) }))
            }
          />
        ))}
      </div>
    </div>
  )
}