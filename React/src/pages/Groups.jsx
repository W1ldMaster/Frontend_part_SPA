import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { groupsApi, getErrorMessage } from '../api/endpoints'
import { useAuth } from '../context/AuthContext.jsx'
import Loader from '../components/Loader.jsx'

function slugify(s) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9а-яё\s-]/gi, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export default function Groups() {
  const { token } = useAuth()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)

  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [busy, setBusy] = useState(false)
  const [formError, setFormError] = useState(null)

  const load = () => {
    setLoading(true)
    setError(null)
    groupsApi.list()
      .then((res) => setGroups(Array.isArray(res.data) ? res.data : res.data?.items ?? []))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const onTitleChange = (v) => {
    setTitle(v)
    // авто-slug — только если пользователь ещё не правил вручную
    if (!slug || slug === slugify(title)) {
      setSlug(slugify(v))
    }
  }

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setFormError(null)
    try {
      await groupsApi.create({ title, slug, description })
      setTitle('')
      setSlug('')
      setDescription('')
      setShowForm(false)
      load()
    } catch (err) {
      setFormError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page">
      <div className="page__head">
        <h1 className="page__title">Группы</h1>
        {token && (
          <button className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? 'Закрыть' : '+ Создать группу'}
          </button>
        )}
      </div>

      {showForm && (
        <form className="card post-form" onSubmit={submit}>
          <h3 className="post-form__title">Новая группа</h3>

          {formError && <div className="alert alert--error">{formError}</div>}

          <label className="field">
            <span className="field__label">Название</span>
            <input
              className="input"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              required
            />
          </label>

          <label className="field">
            <span className="field__label">Slug (URL)</span>
            <input
              className="input"
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              required
            />
          </label>

          <label className="field">
            <span className="field__label">Описание</span>
            <textarea
              className="input textarea"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <div className="post-form__actions">
            <button className="btn btn-primary" disabled={busy}>
              {busy ? 'Создаём…' : 'Создать'}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
              Отмена
            </button>
          </div>
        </form>
      )}

      {loading && <Loader />}
      {error && <div className="alert alert--error">{error}</div>}
      {!loading && !error && groups.length === 0 && <div className="empty">Групп пока нет</div>}

      <div className="grid">
        {groups.map((g) => (
          <Link key={g.id ?? g.slug} to={`/groups/${g.slug}`} className="card group-card">
            <h3 className="group-card__title">{g.title || g.name || g.slug}</h3>
            {g.description && <p className="muted">{g.description}</p>}
            <span className="group-card__slug">/{g.slug}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}