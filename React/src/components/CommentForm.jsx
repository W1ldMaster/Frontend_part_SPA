import { useState } from 'react'
import { postsApi, getErrorMessage } from '../api/endpoints'

export default function CommentForm({ postId, parentId = null, onCreated, onCancel }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    if (!text.trim()) return

    setBusy(true)
    setError(null)
    try {
      const payload = { text, parent_id: parentId }
      const res = await postsApi.addComment(postId, payload)
      setText('')
      onCreated?.(res.data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={submit} className="comment-form">
      {error && <div className="alert alert--error">{error}</div>}
      <textarea
        className="input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={parentId ? "Написать ответ..." : "Оставить комментарий..."}
        rows={2}
      />
      <div className="comment-form__actions">
        <button className="btn btn-primary btn-sm" disabled={busy}>
          {busy ? 'Отправка...' : 'Отправить'}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={onCancel}>
            Отмена
          </button>
        )}
      </div>
    </form>
  )
}