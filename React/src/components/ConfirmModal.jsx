import { useEffect } from 'react'
import '../styles/ConfirmModal.css'

export default function ConfirmModal({
  open,
  title = 'Подтвердите действие',
  message,
  confirmText = 'OK',
  cancelText = 'Отмена',
  danger = false,
  busy = false,
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) onCancel?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, busy, onCancel])

  if (!open) return null

  return (
    <div
      className="modal-overlay"
      onClick={() => !busy && onCancel?.()}
    >
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="modal__title">{title}</h2>
        {message && <p className="modal__message">{message}</p>}
        <div className="modal__actions">
          <button
            type="button"
            className="modal__btn modal__btn--cancel"
            onClick={onCancel}
            disabled={busy}
          >
            {cancelText}
          </button>
          <button
            type="button"
            className={`modal__btn ${danger ? 'modal__btn--danger' : 'modal__btn--confirm'}`}
            onClick={onConfirm}
            disabled={busy}
          >
            {busy ? 'Удаление…' : confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}