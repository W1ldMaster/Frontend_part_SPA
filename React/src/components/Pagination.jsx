export default function Pagination({ onPrev, onNext, hasPrev, hasNext, page, total }) {
  if (!hasPrev && !hasNext) return null
  return (
    <div className="pagination">
      <button className="btn btn-ghost" disabled={!hasPrev} onClick={onPrev}>← Назад</button>
      <span className="pagination__label">
        Страница {page}{typeof total === 'number' ? ` · всего ${total}` : ''}
      </span>
      <button className="btn btn-ghost" disabled={!hasNext} onClick={onNext}>Вперёд →</button>
    </div>
  )
}