export default function Loader({ text = 'Загрузка…' }) {
  return (
    <div className="loader">
      <span className="spinner" />
      <span>{text}</span>
    </div>
  )
}