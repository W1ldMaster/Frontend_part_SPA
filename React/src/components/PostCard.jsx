import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { postsApi, getErrorMessage } from '../api/endpoints'
import { useState } from 'react'
import ConfirmModal from './ConfirmModal'

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
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const [isLiked, setIsLiked] = useState(post.is_liked || false)
  const [likesCount, setLikesCount] = useState(post.likes_count || 0)
  const [likeBusy, setLikeBusy] = useState(false)

  const author = post.author || post.user || {}
  const authorName = author.username || post.author_username || 'anon'
  const group = post.group || null
  const body = post.text || post.content || ''
  const isOwner = user?.username && authorName === user.username

  const handleDeleteClick = () => {
    setError(null)
    setConfirmOpen(true)
  }

  const handleDeleteConfirmed = async () => {
    setBusy(true)
    try {
      await postsApi.remove(post.id)
      setConfirmOpen(false)
      onDeleted?.(post.id)
    } catch (err) {
      setError(getErrorMessage(err))
      setConfirmOpen(false)
    } finally {
      setBusy(false)
    }
  }

  const handleLike = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!token || likeBusy) return

    setLikeBusy(true)
    try {
      if (isLiked) {
        await postsApi.unlike(post.id)
        setLikesCount((c) => Math.max(0, c - 1))
      } else {
        await postsApi.like(post.id)
        setLikesCount((c) => c + 1)
      }
      setIsLiked(!isLiked)
    } catch (err) {
      console.error(err)
    } finally {
      setLikeBusy(false)
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
        {post.image && (
          <img
            src={post.image}
            alt="Вложение"
            style={{ maxWidth: '100%', borderRadius: '8px', marginTop: '12px' }}
          />
        )}
      </Link>

      {error && <div className="alert alert--error">{error}</div>}

      <footer className="post-card__foot" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <Link to={`/posts/${post.id}`} className="btn btn-ghost btn-sm">
          Комментарии
        </Link>

        {token && (
          <button
            type="button"
            className={`btn btn-sm ${isLiked ? 'btn-primary' : 'btn-ghost'}`}
            onClick={handleLike}
            disabled={likeBusy}
          >
            {isLiked ? '❤️' : '🤍'} {likesCount}
          </button>
        )}

        {token && isOwner && (
          <>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => onChanged?.(post)}
            >
              Изменить
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={handleDeleteClick}
              disabled={busy}
            >
              Удалить
            </button>
          </>
        )}
      </footer>

      <ConfirmModal
        open={confirmOpen}
        title="Удалить пост?"
        message="Пост и все комментарии к нему будут удалены безвозвратно."
        confirmText="Удалить"
        cancelText="Отмена"
        danger
        busy={busy}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => !busy && setConfirmOpen(false)}
      />
    </article>
  )
}