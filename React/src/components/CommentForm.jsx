import { useState } from 'react'
import { postsApi, getErrorMessage } from '../api/endpoints'

export default function CommentForm({ postId, onCreated }) {
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    if (!text.trim()) return
    setBusy(true)
    setError(null)
    try {
      const { data } = await postsApi.addComment(postId, { text })
      setText('')
      onCreated?.(data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="comment-form" onSubmit={submit}>
      {error && <div className="alert alert--error">{error}</div>}
      <textarea
        className="input textarea"
        rows={3}
        placeholder="Написать комментарий…"
        value={text}
        onChange={(e) => setText(e.target.value)}
      />
      <button className="btn btn-primary" disabled={busy || !text.trim()}>
        {busy ? 'Отправка…' : 'Отправить'}
      </button>
    </form>
  )
}