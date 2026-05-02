import React from 'react'

export default function AlertModal({ title = 'Aviso', message, onClose }) {
  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal text-center">
        <h2 className="text-xl font-bold mb-2">{title}</h2>
        <p className="text-sm mb-6" style={{ color: 'var(--fg-muted)' }}>{message}</p>
        <button onClick={onClose} className="btn-primary w-full">Entendido</button>
      </div>
    </div>
  )
}
