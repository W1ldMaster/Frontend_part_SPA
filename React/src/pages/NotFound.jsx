import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="page page--narrow">
      <div className="empty">
        <h1>404</h1>
        <p className="muted">Страница не найдена</p>
        <Link to="/" className="btn btn-primary">На главную</Link>
      </div>
    </div>
  )
}