import { useEffect, useState } from 'react'
import { postsApi, getErrorMessage } from '../api/endpoints'

export default function PostForm({ initial, groups = [], onSaved, onCancel }) {
  const [title, setTitle] = useState(initial?.title || '')
  const [text, setText] = useState(initial?.text || initial?.content || '')
  const [groupId, setGroupId] = useState(initial?.group_id || initial?.group?.id || '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    setTitle(initial?.title || '')
    setText(initial?.text || initial?.content || '')
    setGroupId(initial?.group_id || initial?.group?.id || '')
  }, [initial])

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const payload = { title, text }
      if (groupId) payload.group_id = Number(groupId)
      const { data } = initial?.id
        ? await postsApi.update(initial.id, payload)
        : await postsApi.create(payload)
      onSaved?.(data)
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="card post-form" onSubmit={submit}>
      <h3 className="post-form__title">{initial?.id ? 'Редактировать пост' : 'Новый пост'}</h3>

      {error && <div className="alert alert--error">{error}</div>}

      <label className="field">
        <span className="field__label">Заголовок</span>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} required />
      </label>

      <label className="field">
        <span className="field__label">Текст</span>
        <textarea
          className="input textarea"
          rows={5}
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
        />
      </label>

      <label className="field">
        <span className="field__label">Группа (необязательно)</span>
        <select
          className="input"
          value={groupId}
          onChange={(e) => setGroupId(e.target.value)}
        >
          <option value="">— Без группы —</option>
          {groups.map((g) => (
            <option key={g.id ?? g.slug} value={g.id}>
              {g.title || g.name || g.slug}
            </option>
          ))}
        </select>
      </label>

      <div className="post-form__actions">
        <button className="btn btn-primary" disabled={busy}>
          {busy ? 'Сохраняем…' : 'Опубликовать'}
        </button>
        {onCancel && (
          <button type="button" className="btn btn-ghost" onClick={onCancel}>Отмена</button>
        )}
      </div>
    </form>
  )
}