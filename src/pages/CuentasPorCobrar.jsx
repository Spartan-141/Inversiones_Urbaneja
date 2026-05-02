import React, { useState, useEffect, useCallback } from 'react'
import { LuCreditCard, LuSearch, LuX, LuBanknote, LuSmartphone, LuLandmark, LuChevronDown, LuChevronUp, LuRefreshCw } from 'react-icons/lu'
import { useApp } from '../context/AppContext.jsx'
import { format } from 'date-fns'
import AlertModal from '../components/AlertModal.jsx'

const METODOS = [
  { key: 'efectivo',      label: 'Efectivo',       icon: <LuBanknote /> },
  { key: 'pago_movil',    label: 'Pago Móvil',     icon: <LuSmartphone /> },
  { key: 'transferencia', label: 'Transferencia',  icon: <LuLandmark /> },
]

function AbonarModal({ venta, onClose, onDone, fmt }) {
  const [pagos, setPagos] = useState({ efectivo: '', pago_movil: '', transferencia: '' })
  const [saving, setSaving] = useState(false)
  const [alertMsg, setAlertMsg] = useState('')

  const totalAbonado = Object.values(pagos).reduce((acc, v) => acc + (parseFloat(v) || 0), 0)
  const nuevoSaldo = Math.max(0, venta.saldo_pendiente - totalAbonado)
  const valid = totalAbonado > 0.05

  const confirm = async () => {
    setSaving(true)
    try {
      const pagosArr = Object.entries(pagos)
        .filter(([, v]) => parseFloat(v) > 0)
        .map(([k, v]) => ({ metodo: k, monto: parseFloat(v) || 0 }))
      await window.api.invoke('cuentas:abonar', { venta_id: venta.id, pagosArr })
      onDone()
    } catch (e) {
      setAlertMsg(`Error: ${e.message}`)
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-lg max-w-xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">💰 Registrar Abono</h2>
          <button onClick={onClose} className="btn-ghost btn-sm text-xl">✕</button>
        </div>

        <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-2xl p-6 mb-6 text-center">
          <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-1">Saldo pendiente</p>
          <p className="text-4xl font-bold">{fmt(venta.saldo_pendiente)}</p>
          {venta.cliente_nombre && <p className="text-xs text-slate-500 mt-2 font-medium">Deudor: {venta.cliente_nombre}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {METODOS.map(m => (
            <div key={m.key}>
              <label className="label">{m.icon} {m.label}</label>
              <input className="input h-12 text-lg font-bold" type="number" min="0" step="0.01" placeholder="0,00"
                value={pagos[m.key]} onChange={e => setPagos(p => ({ ...p, [m.key]: e.target.value }))} />
            </div>
          ))}
        </div>

        {valid && (
          <div className="bg-surface-700 rounded-xl p-4 mb-6 text-sm space-y-2">
            <div className="flex justify-between"><span className="text-slate-400">Total a abonar:</span><span className="font-bold text-emerald-400">{fmt(totalAbonado)}</span></div>
            <div className="flex justify-between">
              <span className="text-slate-400">Restante tras abono:</span>
              <span className={`font-bold ${nuevoSaldo <= 0.05 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {fmt(nuevoSaldo)} {nuevoSaldo <= 0.05 ? '✅ Saldado' : ''}
              </span>
            </div>
          </div>
        )}

        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary btn-lg">Cancelar</button>
          <button onClick={confirm} disabled={!valid || saving} className="btn-success btn-lg px-8">
            {saving ? '⏳ Guardando...' : '✅ Confirmar Abono'}
          </button>
        </div>
      </div>
      {alertMsg && <AlertModal title="Error" message={alertMsg} onClose={() => setAlertMsg('')} />}
    </div>
  )
}

export default function CuentasPorCobrar() {
  const { fmt } = useApp()
  const [cuentas, setCuentas]     = useState([])
  const [query, setQuery]         = useState('')
  const [abonarTarget, setAbonar] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await window.api.invoke('cuentas:list')
      setCuentas(data)
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const filtered = cuentas.filter(c =>
    !query || c.cliente_nombre?.toLowerCase().includes(query.toLowerCase())
  )

  const totalPendiente = filtered.reduce((s, c) => s + (c.saldo_pendiente || 0), 0)

  return (
    <div className="page">
      <div className="page-header">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-glow">
            <LuCreditCard size={24} />
          </div>
          <div>
            <h1 className="page-title text-white">Cuentas por Cobrar</h1>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">{filtered.length} deudas pendientes registradas</p>
          </div>
        </div>
        <button onClick={load} className="btn-secondary h-12 w-12 flex items-center justify-center"><LuRefreshCw size={20} className={loading ? 'animate-spin' : ''} /></button>
      </div>

      <div className="flex flex-wrap gap-4 items-center mb-4 bg-surface-800/50 backdrop-blur-md p-4 rounded-3xl border border-white/5">
        <div className="relative flex-1 min-w-[250px] group">
          <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors" size={20} />
          <input className="input pl-12 h-12 bg-surface-900 border-none shadow-inner text-white font-medium" placeholder="Buscar por cliente..."
            value={query} onChange={e => setQuery(e.target.value)} />
        </div>
        <div className="flex items-center gap-4 bg-surface-900 border border-white/5 shadow-inner rounded-2xl px-6 h-12">
          <p className="text-[11px] font-black uppercase tracking-widest text-red-500/60">Total Pendiente</p>
          <p className="text-xl font-black text-red-400">{fmt(totalPendiente)}</p>
        </div>
      </div>

      <div className="table-wrapper flex-1 min-h-0 bg-surface-800/30 backdrop-blur-sm border border-white/5 rounded-3xl p-1">
        <table>
          <thead className="sticky top-0 z-10 bg-surface-800/80 backdrop-blur-xl">
            <tr>
              <th>Cliente / Deudor</th>
              <th>Venta Origen</th>
              <th className="text-right">Monto Original</th>
              <th className="text-right">Saldo Pendiente</th>
              <th className="text-center">Acción</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loading ? (
              <tr><td colSpan={5} className="text-center py-20 opacity-50 font-bold uppercase tracking-widest text-slate-400">Cargando cuentas...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-20 opacity-50 font-bold uppercase tracking-widest text-slate-400">No hay cuentas pendientes.</td></tr>
            ) : filtered.map(c => (
              <tr key={c.id}>
                <td>
                  <p className="font-bold text-white text-base leading-tight">{c.cliente_nombre || 'Sin nombre'}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{format(new Date(c.fecha), 'dd/MM/yyyy HH:mm')}</p>
                </td>
                <td><span className="font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-md border border-indigo-500/20">#{c.id}</span></td>
                <td className="text-right text-slate-400 font-medium text-sm">{fmt(c.total)}</td>
                <td className="text-right font-black text-red-400 text-lg">{fmt(c.saldo_pendiente)}</td>
                <td className="text-center">
                  <button onClick={() => setAbonar(c)} className="btn-success h-10 px-5 text-xs">Abonar</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {abonarTarget && (
        <AbonarModal
          venta={abonarTarget} fmt={fmt}
          onClose={() => setAbonar(null)}
          onDone={() => { setAbonar(null); load() }} />
      )}
    </div>
  )
}
