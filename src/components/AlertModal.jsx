import React from 'react'
import { LuTriangleAlert, LuX } from 'react-icons/lu'

export default function AlertModal({ title = 'Aviso', message, onClose }) {
  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal max-w-sm text-center">
        <div className="flex justify-center mb-4">
          <div className="w-14 h-14 rounded-full bg-accent-yellow/10 border border-accent-yellow/30 flex items-center justify-center">
            <LuTriangleAlert className="text-3xl text-accent-yellow" />
          </div>
        </div>
        <h2 className="text-lg font-bold text-white mb-2">{title}</h2>
        <p className="text-gray-400 text-sm mb-6">{message}</p>
        <button onClick={onClose} className="btn-primary w-full">Aceptar</button>
      </div>
    </div>
  )
}
