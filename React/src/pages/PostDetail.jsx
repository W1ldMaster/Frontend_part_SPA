import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { postsApi, getErrorMessage } from '../api/endpoints'
import CommentForm from '../components/CommentForm.jsx'
import PostForm from '../components/PostForm.jsx'
import Loader from '../components/Loader.jsx'
import { useAuth } from '../context/AuthContext.jsx'

function shortDate(v) {
  if (!v) return ''
  try { return new Date(v).toLocaleString('ru-RU') } catch { return '' }
}

export default function PostDetail() {
  const { postId } = useParams()
  const navigate = useNavigate()
  const { token, user } = useAuth()

  const [post, setPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editing, setEditing] = useState(false)
  const [busy, setBusy] = useState(false)

  const load = useCallback(() => {
  setLoading(true)
  setError(null)
  postsApi.detail(postId)
    .then((res) => {
      const data = res.data
      setPost(data.post ?? data)
    })
    .catch((err) => setError(getErrorMessage(err)))
    .finally(() => setLoading(false))
}, [postId])

  useEffect(() => { load() }, [load])

  const onDelete = async () => {
    if (!window.confirm('Удалить пост?')) return
    setBusy(true)
    try {
      await postsApi.remove(postId)
      navigate('/')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  if (loading) return <Loader />
  if (error) return <div className="alert alert--error">{error}</div>
  if (!post) return <div className="empty">Пост не найден</div>

  const author = post.author || post.user || {}
  const authorName = author.username || post.author_username || 'anon'
  const comments = post.comments || post.comments_list || []
  const isOwner = user?.username && authorName === user.username

  if (editing) {
    return (
      <div className="page">
        <PostForm
          initial={post}
          onSaved={() => { setEditing(false); load() }}
          onCancel={() => setEditing(false)}
        />
      </div>
    )
  }

  return (
    <div className="page">
      <Link to="/" className="btn btn-ghost btn-sm">← К ленте</Link>

      <article className="card post-detail">
        <header className="post-detail__head">
          <Link to={`/profile/${authorName}`} className="post-card__author">@{authorName}</Link>
          <time className="muted">{shortDate(post.created_at || post.created)}</time>
        </header>

        {post.title && <h1 className="post-detail__title">{post.title}</h1>}
        <p className="post-detail__text">{post.text || post.content}</p>

        {isOwner && (
          <div className="post-detail__actions">
            <button className="btn btn-ghost" onClick={() => setEditing(true)}>Изменить</button>
            <button className="btn btn-danger" onClick={onDelete} disabled={busy}>Удалить</button>
          </div>
        )}
      </article>

      <h2 className="section-title">Комментарии ({comments.length})</h2>

      {token && (
        <CommentForm
          postId={post.id}
          onCreated={(c) => setPost((p) => ({ ...p, comments: [...(p.comments || []), c] }))}
        />
      )}

      <div className="comments">
        {comments.length === 0 && <div className="empty">Комментариев пока нет</div>}
        {comments.map((c) => {
          const cAuthor = c.author || c.user || {}
          const cName = cAuthor.username || c.author_username || 'anon'
          return (
            <div key={c.id} className="card comment">
              <div className="comment__head">
                <Link to={`/profile/${cName}`} className="post-card__author">@{cName}</Link>
                <time className="muted">{shortDate(c.created_at || c.created)}</time>
              </div>
              <p>{c.text || c.content}</p>
            </div>
          )
        })}
      </div>
    </div>
  )
}