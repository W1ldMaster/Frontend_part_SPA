import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { postsApi, getErrorMessage } from '../api/endpoints'
import { useState } from 'react'

function shortDate(v) {
  if (!v) return ''
  try {
    return new Date(v).toLocaleString('ru-RU', {
      dateStyle: 'short',
      timeStyle: 'short',
    })
  } catch {
    return ''
  }
}

export default function PostCard({ post, onDeleted, onChanged }) {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const author = post.author || post.user || {}
  const authorName = author.username || post.author_username || 'anon'
  const group = post.group || null
  const body = post.text || post.content || ''
  const isOwner = user?.username && authorName === user.username

  const handleDelete = async () => {
    if (!window.confirm('Удалить пост?')) return
    setBusy(true)
    try {
      await postsApi.remove(post.id)
      onDeleted?.(post.id)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className="card post-card">
      <header className="post-card__head">
        <div>
          <Link to={`/profile/${authorName}`} className="post-card__author">
            @{authorName}
          </Link>
          {group && (
            <>
              <span className="dot">·</span>
              <Link to={`/groups/${group.slug}`} className="post-card__group">
                {group.title || group.name || group.slug}
              </Link>
            </>
          )}
          <span className="dot">·</span>
          <time className="muted">{shortDate(post.pub_date)}</time>
        </div>
      </header>

      <Link to={`/posts/${post.id}`} className="post-card__link">
        {post.title && <h3 className="post-card__title">{post.title}</h3>}
        {body && <p className="post-card__text">{body}</p>}
      </Link>

      {error && <div className="alert alert--error">{error}</div>}

      <footer className="post-card__foot">
        <Link to={`/posts/${post.id}`} className="btn btn-ghost btn-sm">
          Комментарии
        </Link>

        {token && isOwner && (
          <>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => onChanged?.(post)}
            >
              Изменить
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={handleDelete}
              disabled={busy}
            >
              Удалить
            </button>
          </>
        )}
      </footer>
    </article>
  )
}