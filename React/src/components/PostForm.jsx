import { useState } from 'react'
import { postsApi, getErrorMessage } from '../api/endpoints'

export default function PostForm({ initial, groups = [], onSaved, onCancel }) {
  const [title, setTitle] = useState(initial?.title || '')
  const [text, setText] = useState(initial?.text || initial?.content || '')
  const [groupId, setGroupId] = useState(initial?.group_id || '')
  const [imageFile, setImageFile] = useState(null)

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()

    if (!title.trim()) {
      setError('Заголовок обязателен для заполнения')
      return
    }

    setBusy(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('title', title)
      formData.append('text', text)

      if (groupId) {
        formData.append('group_id', groupId)
      }

      if (imageFile) {
        formData.append('image', imageFile)
      }

      if (initial?.id) {
        await postsApi.update(initial.id, formData)
      } else {
        await postsApi.create(formData)
      }
      onSaved?.()
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="card post-form" onSubmit={submit}>
      {error && <div className="alert alert--error">{error}</div>}

      <label className="field">
        <span className="field__label">Заголовок</span>
        <input
          className="input"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="О чём этот пост?"
          required
        />
      </label>

      <label className="field">
        <span className="field__label">Текст поста</span>
        <textarea
          className="input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          required
        />
      </label>

      {groups.length > 0 && (
        <label className="field">
          <span className="field__label">Группа (необязательно)</span>
          <select className="input" value={groupId} onChange={(e) => setGroupId(e.target.value)}>
            <option value="">Без группы</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.title}</option>
            ))}
          </select>
        </label>
      )}

      <label className="field">
        <span className="field__label">Картинка (необязательно)</span>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setImageFile(e.target.files[0])}
        />
      </label>

      <div className="post-form__actions">
        <button className="btn btn-primary" disabled={busy}>
          {busy ? 'Сохранение...' : 'Сохранить'}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={busy}>
            Отмена
          </button>
        )}
      </div>
    </form>
  )
}