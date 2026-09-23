import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { getErrorMessage } from '../api/endpoints'

export default function Login() {
  const { login, register } = useAuth()
  const navigate = useNavigate()

  // 'login' | 'register'
  const [mode, setMode] = useState('login')

  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        if (password.length < 3) throw new Error('Пароль слишком короткий')
        if (password !== password2) throw new Error('Пароли не совпадают')
        await register(email, password, username)
      }
      navigate('/')
    } catch (err) {
      setError(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const switchMode = (m) => {
    setMode(m)
    setError(null)
  }

  return (
    <div className="page page--narrow">
      <div className="card auth-card">
        <h1 className="page__title">
          {mode === 'register' ? 'Регистрация' : 'Вход'}
        </h1>

        <div className="tabs">
          <button
            type="button"
            className={'tab' + (mode === 'login' ? ' is-active' : '')}
            onClick={() => switchMode('login')}
          >
            Вход
          </button>
          <button
            type="button"
            className={'tab' + (mode === 'register' ? ' is-active' : '')}
            onClick={() => switchMode('register')}
          >
            Регистрация
          </button>
        </div>

        {error && <div className="alert alert--error">{error}</div>}

        <form onSubmit={submit} className="auth-form">
          {mode === 'login' && (
            <>
              <label className="field">
                <span className="field__label">Email</span>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </label>
              <label className="field">
                <span className="field__label">Пароль</span>
                <input
                  className="input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </label>
            </>
          )}

          {mode === 'register' && (
            <>
              <label className="field">
                <span className="field__label">Email</span>
                <input
                  className="input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </label>
              <label className="field">
                <span className="field__label">Имя пользователя</span>
                <input
                  className="input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                />
              </label>
              <label className="field">
                <span className="field__label">Пароль</span>
                <input
                  className="input"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
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
                  required
                />
              </label>
            </>
          )}

          <button className="btn btn-primary" disabled={busy}>
            {busy
              ? 'Подождите…'
              : mode === 'register'
                ? 'Зарегистрироваться'
                : 'Войти'}
          </button>

          {mode === 'login' && (
            <p className="auth-hint">
              Нет аккаунта?{' '}
              <button type="button" className="link-btn" onClick={() => switchMode('register')}>
                Создать
              </button>
            </p>
          )}

          {mode === 'register' && (
            <p className="auth-hint">
              Уже есть аккаунт?{' '}
              <button type="button" className="link-btn" onClick={() => switchMode('login')}>
                Войти
              </button>
            </p>
          )}
        </form>
      </div>
    </div>
  )
}