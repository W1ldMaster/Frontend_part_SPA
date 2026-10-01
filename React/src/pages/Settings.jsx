import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { usersApi, getErrorMessage } from '../api/endpoints'
import { useAuth } from '../context/AuthContext.jsx'
import ConfirmModal from '../components/ConfirmModal'

export default function Settings() {
  const { user, reload, logout } = useAuth()
  const navigate = useNavigate()

  const [email, setEmail] = useState(user?.email || '')
  const [username, setUsername] = useState(user?.username || '')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')

  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [ok, setOk] = useState(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setOk(null)

    try {
      const payload = {}
      if (email && email !== user?.email) payload.email = email
      if (username && username !== user?.username) payload.username = username
      if (password) {
        if (password.length < 3) throw new Error('Пароль слишком короткий')
        if (password !== password2) throw new Error('Пароли не совпадают')
        payload.password = password
      }

      if (Object.keys(payload).length === 0) {
        setOk('Ничего не изменилось')
        return
      }

      await usersApi.updateMe(payload)
      await reload?.()
      setPassword('')
      setPassword2('')
      setOk('Сохранено')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const handleDeleteClick = () => {
    setError(null)
    setConfirmOpen(true)
  }

  const handleDeleteConfirmed = async () => {
    setBusy(true)
    try {
      await usersApi.deleteMe()
      setConfirmOpen(false)
      logout()
      navigate('/')
    } catch (err) {
      setError(getErrorMessage(err))
      setConfirmOpen(false)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page page--narrow">
      <div className="page__head">
        <h1 className="page__title">Настройки</h1>
        <Link to="/profile/me" className="btn btn-ghost">← Профиль</Link>
      </div>

      <form className="card post-form" onSubmit={submit}>
        <h3 className="post-form__title">Профиль</h3>

        {error && <div className="alert alert--error">{error}</div>}
        {ok && <div className="alert alert--ok">{ok}</div>}

        <label className="field">
          <span className="field__label">Email</span>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        <label className="field">
          <span className="field__label">Имя пользователя</span>
          <input
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>

        <h3 className="post-form__title" style={{ marginTop: 12 }}>Смена пароля</h3>

        <label className="field">
          <span className="field__label">Новый пароль (оставьте пустым, чтобы не менять)</span>
          <input
            className="input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
          />
        </label>

        <label className="field">
          <span className="field__label">Повторите пароль</span>
          <input
            className="input"
            type="password"
            value={password2}
            onChange={(e) => setPassword2(e.target.value)}
            autoComplete="new-password"
          />
        </label>

        <div className="post-form__actions">
          <button className="btn btn-primary" disabled={busy}>
            {busy ? 'Сохраняем…' : 'Сохранить'}
          </button>
        </div>
      </form>

      <div className="card">
        <h3 className="post-form__title">Опасная зона</h3>
        <p className="muted">Удаление аккаунта необратимо.</p>
        <button className="btn btn-danger" onClick={handleDeleteClick} disabled={busy}>
          Удалить аккаунт
        </button>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title="Удалить аккаунт безвозвратно?"
        message="Все ваши посты, комментарии и подписки будут удалены без возможности восстановления. Это действие необратимо."
        confirmText="Удалить аккаунт"
        cancelText="Отмена"
        danger
        busy={busy}
        onConfirm={handleDeleteConfirmed}
        onCancel={() => !busy && setConfirmOpen(false)}
      />
    </div>
  )
}