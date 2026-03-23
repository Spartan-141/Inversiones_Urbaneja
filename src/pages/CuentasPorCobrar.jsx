import React, { useState, useEffect, useCallback } from 'react'
import {
  LuCreditCard, LuSearch, LuX, LuDollarSign, LuBanknote,
  LuSmartphone, LuLandmark, LuChevronDown, LuChevronUp, LuRefreshCw
} from 'react-icons/lu'
import { useApp } from '../context/AppContext.jsx'
import { format } from 'date-fns'
import AlertModal from '../components/AlertModal.jsx'

const METODOS = [
  { key: 'efectivo_usd', label: '$ Efectivo USD',    icon: <LuDollarSign /> },
  { key: 'efectivo_ves', label: 'Bs. Efectivo',       icon: <LuBanknote /> },
  { key: 'pago_movil',   label: 'Bs. Pago Móvil',    icon: <LuSmartphone /> },
  { key: 'transferencia',label: 'Bs. Transferencia', icon: <LuLandmark /> },
]

function AbonarModal({ venta, tasa, onClose, onDone }) {
  const [pagos, setPagos] = useState({ efectivo_usd: '', efectivo_ves: '', pago_movil: '', transferencia: '' })
  const [saving, setSaving] = useState(false)
  const [alertMsg, setAlertMsg] = useState('')

  const totalAbonado = Object.entries(pagos).reduce((acc, [k, v]) => {
    const n = parseFloat(v) || 0
    return acc + (k === 'efectivo_usd' ? n : n / tasa)
  }, 0)
  const nuevoSaldo = Math.max(0, venta.saldo_pendiente_usd - totalAbonado)
  const valid = totalAbonado > 0.005

  const confirm = async () => {
    setSaving(true)
    try {
      const pagosArr = Object.entries(pagos)
        .filter(([, v]) => parseFloat(v) > 0)
        .map(([k, v]) => {
          const n = parseFloat(v) || 0
          const isVes = k !== 'efectivo_usd'
          return { metodo: k, monto_usd: isVes ? n / tasa : n, monto_ves: isVes ? n : n * tasa }
        })
      await window.api.invoke('cuentas:abonar', { venta_id: venta.id, pagosArr, tasa })
      onDone()
    } catch (e) {
      setAlertMsg(`Error: ${e.message}`)
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">💰 Registrar Abono</h2>
          <button onClick={onClose} className="btn-ghost btn-sm"><LuX /></button>
        </div>

        <div className="bg-brand-900/30 border border-brand-500/30 rounded-xl p-4 mb-4 text-center">
          <p className="text-gray-400 text-sm">Saldo pendiente</p>
          <p className="text-3xl font-bold text-white">${Number(venta.saldo_pendiente_usd).toFixed(2)}</p>
          <p className="text-sm text-gray-400">Bs. {(venta.saldo_pendiente_usd * tasa).toLocaleString('es-VE', { maximumFractionDigits: 2 })}</p>
          {venta.cliente_nombre && <p className="text-xs text-gray-500 mt-1">Cliente: {venta.cliente_nombre}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {METODOS.map(m => (
            <div key={m.key}>
              <label className="label flex items-center gap-1">{m.icon} {m.label}</label>
              <input className="input" type="number" min="0" step="0.01" placeholder="0.00"
                value={pagos[m.key]} onChange={e => setPagos(p => ({ ...p, [m.key]: e.target.value }))} />
            </div>
          ))}
        </div>

        {valid && (
          <div className="bg-surface-700 rounded-xl p-3 mb-4 text-sm space-y-1">
            <div className="flex justify-between"><span className="text-gray-400">Abonando:</span><span className="text-white font-semibold">${totalAbonado.toFixed(2)}</span></div>
            <div className="flex justify-between">
              <span className="text-gray-400">Nuevo saldo:</span>
              <span className={`font-bold ${nuevoSaldo < 0.005 ? 'text-accent-green' : 'text-accent-yellow'}`}>
                ${nuevoSaldo.toFixed(2)} {nuevoSaldo < 0.005 ? '✅ Saldado' : ''}
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={confirm} disabled={!valid || saving} className="btn-success">
            {saving ? '⏳ Guardando...' : '✅ Registrar Abono'}
          </button>
        </div>
      </div>
      {alertMsg && <AlertModal title="Error" message={alertMsg} onClose={() => setAlertMsg('')} />}
    </div>
  )
}

export default function CuentasPorCobrar() {
  const { fmt, tasa } = useApp()
  const [cuentas, setCuentas]     = useState([])
  const [query, setQuery]         = useState('')
  const [expanded, setExpanded]   = useState(null)
  const [abonarTarget, setAbonar] = useState(null)

  const load = useCallback(async () => {
    const data = await window.api.invoke('cuentas:list')
    setCuentas(data)
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = cuentas.filter(c =>
    !query || c.cliente_nombre?.toLowerCase().includes(query.toLowerCase())
  )

  const totalPendiente = filtered.reduce((s, c) => s + c.saldo_pendiente_usd, 0)

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-surface-800 flex-wrap">
        <h1 className="page-title flex items-center gap-2">
          <LuCreditCard className="text-brand-400" /> Cuentas por Cobrar
        </h1>
        <div className="relative min-w-0 max-w-xs flex-1">
          <LuSearch className="absolute left-3 top-2.5 text-gray-500 pointer-events-none" />
          <input className="input pl-9" placeholder="Buscar por cliente..."
            value={query} onChange={e => setQuery(e.target.value)} />
          {query && <button onClick={() => setQuery('')} className="absolute right-3 top-2.5 text-gray-400"><LuX className="text-sm" /></button>}
        </div>
        <button onClick={load} className="btn-ghost btn-sm ml-auto"><LuRefreshCw /></button>
      </div>

      {/* Summary bar */}
      <div className="px-4 py-2 bg-red-900/10 border-b border-red-500/20 flex items-center justify-between">
        <span className="text-sm text-gray-400">{filtered.length} crédito{filtered.length !== 1 ? 's' : ''} pendiente{filtered.length !== 1 ? 's' : ''}</span>
        <span className="font-bold text-red-400">${totalPendiente.toFixed(2)} · Bs. {(totalPendiente * tasa).toLocaleString('es-VE', { maximumFractionDigits: 2 })}</span>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-600 gap-2">
            <LuCreditCard className="text-4xl opacity-20" />
            <p className="text-sm">No hay cuentas pendientes</p>
          </div>
        ) : filtered.map(c => (
          <div key={c.id} className="card p-0 overflow-hidden">
            <button className="w-full flex items-center justify-between p-4 hover:bg-white/2 transition-colors"
              onClick={() => setExpanded(expanded === c.id ? null : c.id)}>
              <div className="text-left">
                <p className="font-semibold text-white">{c.cliente_nombre || 'Sin nombre'}</p>
                <p className="text-xs text-gray-500">{format(new Date(c.fecha), 'dd/MM/yyyy HH:mm')} · Venta #{c.id}</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="font-bold text-red-400">${Number(c.saldo_pendiente_usd).toFixed(2)}</p>
                  <p className="text-xs text-gray-500">de ${Number(c.total_usd).toFixed(2)}</p>
                </div>
                <button onClick={e => { e.stopPropagation(); setAbonar(c) }} className="btn-success btn-sm shrink-0">
                  Abonar
                </button>
                {expanded === c.id ? <LuChevronUp className="text-gray-400" /> : <LuChevronDown className="text-gray-400" />}
              </div>
            </button>
            {expanded === c.id && (
              <div className="px-4 pb-4 border-t border-white/5">
                <p className="text-xs text-gray-500 mb-2 mt-3 uppercase tracking-wider">Total original: {fmt(c.total_usd)}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {abonarTarget && (
        <AbonarModal
          venta={abonarTarget} tasa={tasa}
          onClose={() => setAbonar(null)}
          onDone={() => { setAbonar(null); load() }} />
      )}
    </div>
  )
}
