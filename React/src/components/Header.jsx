import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useTheme } from '../context/ThemeContext.jsx'

export default function Header() {
  const { token, user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="header">
      <div className="container header__inner">
        <Link to="/" className="logo">
          <span className="logo__dot" /> Social
        </Link>

        <nav className="nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) => 'nav__link' + (isActive ? ' is-active' : '')}
          >
            Лента
          </NavLink>

          {token && (
            <NavLink
              to="/follow"
              className={({ isActive }) => 'nav__link' + (isActive ? ' is-active' : '')}
            >
              Подписки
            </NavLink>
          )}

          <NavLink
            to="/groups"
            className={({ isActive }) => 'nav__link' + (isActive ? ' is-active' : '')}
          >
            Группы
          </NavLink>
        </nav>

        <div className="header__actions">
          <button
            className="theme-toggle"
            onClick={toggleTheme}
            title="Сменить тему"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>

          {token ? (
            <>
              <Link to="/profile/me" className="btn btn-ghost">
                {user?.username ? `@${user.username}` : 'Профиль'}
              </Link>

              <Link to="/settings" className="btn btn-ghost" title="Настройки">
                ⚙️
              </Link>

              <button className="btn btn-primary" onClick={handleLogout}>
                Выйти
              </button>
            </>
          ) : (
            <Link to="/login" className="btn btn-primary">
              Войти
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}