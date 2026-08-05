export default function StatusMessage({
  type = 'info',
  title,
  message,
  onClose,
}) {
  if (!message) {
    return null
  }

  return (
    <div
      className={`status-message status-message-${type}`}
      role={type === 'error' ? 'alert' : 'status'}
    >
      <div>
        {title && <strong>{title}</strong>}
        <p>{message}</p>
      </div>

      {onClose && (
        <button
          type="button"
          className="status-message-close"
          onClick={onClose}
          aria-label="Dismiss message"
        >
          ×
        </button>
      )}
    </div>
  )
}
