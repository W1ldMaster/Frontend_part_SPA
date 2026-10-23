import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { postsApi, groupsApi, getErrorMessage } from '../api/endpoints'
import CommentForm from '../components/CommentForm.jsx'
import PostForm from '../components/PostForm.jsx'
import Loader from '../components/Loader.jsx'
import ConfirmModal from '../components/ConfirmModal.jsx'
import { useAuth } from '../context/AuthContext.jsx'

function shortDate(v) {
  if (!v) return ''
  try { return new Date(v).toLocaleString('ru-RU') } catch { return '' }
}

function CommentNode({ comment, postId, user, token, onReplySuccess, onDelete, onEdit }) {
  const [replyOpen, setReplyOpen] = useState(false)
  const cAuthor = comment.author || comment.user || {}
  const cName = cAuthor.username || comment.author_username || 'anon'
  const isCAdmin = user?.username === cName

  return (
    <div style={{ marginLeft: '20px', borderLeft: '2px solid #333', paddingLeft: '12px', marginTop: '12px' }}>
      <div className="comment__head">
        <Link to={`/profile/${cName}`} className="post-card__author">@{cName}</Link>
        <time className="muted" style={{ marginLeft: '8px' }}>{shortDate(comment.pub_date || comment.created_at)}</time>
      </div>
      <p style={{ marginTop: '4px' }}>{comment.text || comment.content}</p>

      <div style={{ display: 'flex', gap: '8px', marginTop: '8px', marginBottom: '8px' }}>
        {token && (
          <button className="btn btn-ghost btn-sm" onClick={() => setReplyOpen(!replyOpen)}>
            {replyOpen ? 'Отмена' : 'Ответить'}
          </button>
        )}
        {isCAdmin && (
          <>
            <button className="btn btn-ghost btn-sm" onClick={() => onEdit(comment)}>Изменить</button>
            <button className="btn btn-danger btn-sm" onClick={() => onDelete(comment.id)}>Удалить</button>
          </>
        )}
      </div>

      {replyOpen && (
        <CommentForm
          postId={postId}
          parentId={comment.id}
          onCreated={(newReply) => {
            setReplyOpen(false)
            onReplySuccess(newReply, comment.id)
          }}
          onCancel={() => setReplyOpen(false)}
        />
      )}

      {comment.replies && comment.replies.length > 0 && (
        <div>
          {comment.replies.map(reply => (
            <CommentNode
              key={reply.id}
              comment={reply}
              postId={postId}
              user={user}
              token={token}
              onReplySuccess={onReplySuccess}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}
    </div>
  )
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
  const [groups, setGroups] = useState([])

  const [isLiked, setIsLiked] = useState(false)
  const [likesCount, setLikesCount] = useState(0)
  const [likeBusy, setLikeBusy] = useState(false)

  const [editingCommentId, setEditingCommentId] = useState(null)
  const [editCommentText, setEditCommentText] = useState('')
  const [commentBusy, setCommentBusy] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deletingCommentId, setDeletingCommentId] = useState(null)

  useEffect(() => {
    groupsApi.list()
      .then((res) => setGroups(Array.isArray(res.data) ? res.data : res.data?.items ?? []))
      .catch(() => setGroups([]))
  }, [])

  const load = useCallback(() => {
    setLoading(true)
    setError(null)
    postsApi.detail(postId)
      .then((res) => {
        const data = res.data.post ?? res.data
        setPost(data)
        setIsLiked(data.is_liked || false)
        setLikesCount(data.likes_count || 0)
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }, [postId])

  useEffect(() => { load() }, [load])

  const handleDeletePostClick = () => {
    setError(null)
    setConfirmOpen(true)
  }

  const handleDeletePostConfirmed = async () => {
    setBusy(true)
    try {
      await postsApi.remove(postId)
      setConfirmOpen(false)
      navigate('/')
    } catch (err) {
      setError(getErrorMessage(err))
      setConfirmOpen(false)
    } finally {
      setBusy(false)
    }
  }

  const handleLike = async () => {
    if (!token || likeBusy) return
    setLikeBusy(true)
    try {
      if (isLiked) {
        await postsApi.unlike(postId)
        setLikesCount((c) => Math.max(0, c - 1))
      } else {
        await postsApi.like(postId)
        setLikesCount((c) => c + 1)
      }
      setIsLiked(!isLiked)
    } catch (err) {
      console.error(err)
    } finally {
      setLikeBusy(false)
    }
  }

  const handleCommentCreated = (newComment, parentId = null) => {
    setPost((p) => {
      if (!parentId) {
        return { ...p, comments: [...(p.comments || []), newComment] }
      }
      const addReply = (comments) => {
        return comments.map(c => {
          if (c.id === parentId) {
            return { ...c, replies: [...(c.replies || []), newComment] }
          }
          if (c.replies && c.replies.length > 0) {
            return { ...c, replies: addReply(c.replies) }
          }
          return c
        })
      }
      return { ...p, comments: addReply(p.comments || []) }
    })
  }

  const startEditComment = (comment) => {
    setEditingCommentId(comment.id)
    setEditCommentText(comment.text || comment.content || '')
  }

  const saveComment = async (commentId) => {
    if (!editCommentText.trim() || commentBusy) return
    setCommentBusy(true)
    try {
      const res = await postsApi.updateComment(postId, commentId, { text: editCommentText })
      setPost((p) => {
        const updateText = (comments) => comments.map(c => {
          if (c.id === commentId) return { ...c, text: res.data.text }
          if (c.replies) return { ...c, replies: updateText(c.replies) }
          return c
        })
        return { ...p, comments: updateText(p.comments || []) }
      })
      setEditingCommentId(null)
    } catch (err) {
      alert('Ошибка при редактировании: ' + getErrorMessage(err))
    } finally {
      setCommentBusy(false)
    }
  }

  const requestDeleteComment = (commentId) => {
    setDeletingCommentId(commentId)
    setConfirmOpen(true)
  }

  const handleDeleteCommentConfirmed = async () => {
    setCommentBusy(true)
    try {
      await postsApi.removeComment(postId, deletingCommentId)
      setPost((p) => {
        const removeComment = (comments) => {
          return comments
            .filter(c => c.id !== deletingCommentId)
            .map(c => ({ ...c, replies: c.replies ? removeComment(c.replies) : [] }))
        }
        return { ...p, comments: removeComment(p.comments || []) }
      })
      setConfirmOpen(false)
      setDeletingCommentId(null)
    } catch (err) {
      alert('Ошибка при удалении: ' + getErrorMessage(err))
    } finally {
      setCommentBusy(false)
    }
  }

  if (loading) return <Loader />
  if (error) return <div className="alert alert--error">{error}</div>
  if (!post) return <div className="empty">Пост не найден</div>

  const author = post.author || post.user || {}
  const authorName = author.username || post.author_username || 'anon'
  const isOwner = user?.username && authorName === user.username
  const rootComments = (post.comments || post.comments_list || []).filter(c => !c.parent_id)

  if (editing) {
    return (
      <div className="page">
        <PostForm initial={post} groups={groups} onSaved={() => { setEditing(false); load() }} onCancel={() => setEditing(false)} />
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

        {post.image && (
          <img
            src={post.image}
            alt="Вложение"
            style={{ maxWidth: '100%', borderRadius: '12px', marginTop: '16px', marginBottom: '16px' }}
          />
        )}

        <div className="post-detail__actions" style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '16px' }}>
          {token && (
            <button type="button" className={`btn ${isLiked ? 'btn-primary' : 'btn-ghost'}`} onClick={handleLike} disabled={likeBusy}>
              {isLiked ? '❤️' : '🤍'} {likesCount}
            </button>
          )}
          {isOwner && (
            <>
              <button type="button" className="btn btn-ghost" onClick={() => setEditing(true)}>Изменить</button>
              <button type="button" className="btn btn-danger" onClick={handleDeletePostClick} disabled={busy}>Удалить</button>
            </>
          )}
        </div>
      </article>

      <h2 className="section-title">Комментарии ({rootComments.length})</h2>

      {token && (
        <CommentForm postId={post.id} onCreated={(c) => handleCommentCreated(c, null)} />
      )}

      <div className="comments" style={{ marginTop: '20px' }}>
        {rootComments.length === 0 && <div className="empty">Комментариев пока нет</div>}

        {rootComments.map((c) => (
          <div key={c.id} className="card comment" style={{ padding: '12px' }}>
            {editingCommentId === c.id ? (
               <div style={{ marginTop: '8px' }}>
                 <textarea className="input" value={editCommentText} onChange={(e) => setEditCommentText(e.target.value)} rows={3} style={{ width: '100%', marginBottom: '8px' }} />
                 <div style={{ display: 'flex', gap: '8px' }}>
                   <button className="btn btn-primary btn-sm" onClick={() => saveComment(c.id)} disabled={commentBusy}>Сохранить</button>
                   <button className="btn btn-ghost btn-sm" onClick={() => setEditingCommentId(null)} disabled={commentBusy}>Отмена</button>
                 </div>
               </div>
            ) : (
               <CommentNode
                 comment={c}
                 postId={post.id}
                 user={user}
                 token={token}
                 onReplySuccess={handleCommentCreated}
                 onDelete={requestDeleteComment}
                 onEdit={startEditComment}
               />
            )}
          </div>
        ))}
      </div>

      <ConfirmModal
        open={confirmOpen && !deletingCommentId}
        title="Удалить пост?"
        message="Пост и все комментарии к нему будут удалены безвозвратно."
        confirmText="Удалить"
        cancelText="Отмена"
        danger
        busy={busy}
        onConfirm={handleDeletePostConfirmed}
        onCancel={() => !busy && setConfirmOpen(false)}
      />

      <ConfirmModal
        open={confirmOpen && !!deletingCommentId}
        title="Удалить комментарий?"
        message="Все ответы на этот комментарий тоже будут удалены."
        confirmText="Удалить"
        cancelText="Отмена"
        danger
        busy={commentBusy}
        onConfirm={handleDeleteCommentConfirmed}
        onCancel={() => { if (!commentBusy) { setConfirmOpen(false); setDeletingCommentId(null) } }}
      />
    </div>
  )
}