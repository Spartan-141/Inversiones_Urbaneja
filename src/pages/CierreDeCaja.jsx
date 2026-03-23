import React, { useState, useEffect, useCallback } from 'react'
import { LuLock, LuDollarSign, LuBanknote, LuSmartphone, LuLandmark, LuRefreshCw, LuCircleCheck, LuTriangleAlert } from 'react-icons/lu'
import { useApp } from '../context/AppContext.jsx'
import { format } from 'date-fns'
import AlertModal from '../components/AlertModal.jsx'

export default function CierreDeCaja() {
  const { tasa, fmt } = useApp()
  const [resumen, setResumen] = useState(null)
  const [cerrado, setCerrado] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [alertMsg, setAlertMsg] = useState('')
  const [notas, setNotas] = useState('')

  // Physical cash count inputs
  const [contado, setContado] = useState({
    efectivo_usd: '', efectivo_ves: '', digital_ves: '',
  })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [res, cierre] = await Promise.all([
        window.api.invoke('cierres:getResumenHoy'),
        window.api.invoke('cierres:getHoy'),
      ])
      setResumen(res)
      setCerrado(cierre)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const c = (k) => parseFloat(contado[k]) || 0

  const dif_usd = c('efectivo_usd') - (resumen?.efectivo_usd_sistema || 0)
  const dif_ves = c('efectivo_ves') - (resumen?.efectivo_ves_sistema || 0)
  const dif_dig = c('digital_ves')  - (resumen?.digital_ves_sistema  || 0)

  const handleCerrar = async () => {
    if (!resumen) return
    setSaving(true)
    try {
      await window.api.invoke('cierres:cerrar', {
        fecha: resumen.fecha,
        tasa_cierre: tasa,
        totalVentasCount: resumen.totalVentasCount,
        ingresos_usd: resumen.ingresos_usd,
        efectivo_usd_sistema: resumen.efectivo_usd_sistema,
        efectivo_ves_sistema: resumen.efectivo_ves_sistema,
        digital_ves_sistema:  resumen.digital_ves_sistema,
        efectivo_usd_contado: c('efectivo_usd'),
        efectivo_ves_contado: c('efectivo_ves'),
        digital_ves_contado:  c('digital_ves'),
        diferencia_usd: dif_usd,
        diferencia_ves: dif_ves + dif_dig,
        pendiente_cobrar_usd: resumen.pendiente_cobrar_usd,
        notas,
      })
      load()
    } catch (e) {
      setAlertMsg(`Error al cerrar: ${e.message}`)
    } finally {
      setSaving(false)
    }
  }

  const DifBadge = ({ val, currency = '$' }) => {
    if (Math.abs(val) < 0.01) return <span className="badge badge-green">✓ Cuadra</span>
    if (val < 0) return <span className="badge badge-red">Faltante {currency}{Math.abs(val).toFixed(2)}</span>
    return <span className="badge badge-yellow">Sobrante {currency}{Math.abs(val).toFixed(2)}</span>
  }

  if (loading) {
    return <div className="flex items-center justify-center h-full text-gray-500">Cargando...</div>
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title flex items-center gap-2"><LuLock className="text-brand-400" /> Cierre de Caja</h1>
          <p className="text-sm text-gray-500 mt-0.5">{format(new Date(), 'dd/MM/yyyy')}</p>
        </div>
        <button onClick={load} className="btn-ghost btn-sm"><LuRefreshCw /> Actualizar</button>
      </div>

      {/* Already closed notice */}
      {cerrado && (
        <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-4 flex items-center gap-3">
          <LuCircleCheck className="text-green-400 text-2xl shrink-0" />
          <div>
            <p className="font-semibold text-green-300">Caja cerrada hoy</p>
            <p className="text-sm text-gray-400">Cerrado a las {cerrado.cerrado_en?.split(' ')[1] || ''}</p>
          </div>
        </div>
      )}

      {/* Today's sales summary */}
      <div className="card">
        <h2 className="font-semibold text-white mb-4">📊 Resumen de Ventas del Día</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
          <div className="card-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Transacciones</p>
            <p className="text-2xl font-bold text-white mt-1">{resumen?.totalVentasCount || 0}</p>
          </div>
          <div className="card-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Total Ingresos</p>
            <p className="text-2xl font-bold text-brand-400 mt-1">${Number(resumen?.ingresos_usd || 0).toFixed(2)}</p>
            <p className="text-xs text-gray-500">Bs. {((resumen?.ingresos_usd || 0) * tasa).toLocaleString('es-VE', { maximumFractionDigits: 2 })}</p>
          </div>
          <div className="card-sm">
            <p className="text-xs text-gray-500 uppercase tracking-wider">Pendiente Cobrar</p>
            <p className="text-2xl font-bold text-red-400 mt-1">${Number(resumen?.pendiente_cobrar_usd || 0).toFixed(2)}</p>
          </div>
        </div>

        {/* By payment method — system amounts */}
        <h3 className="text-sm font-semibold text-gray-400 mb-2 uppercase tracking-wider">Desglose por Método (Sistema)</h3>
        <div className="space-y-2">
          {[
            { key: 'efectivo_usd', label: '$ Efectivo USD',    icon: <LuDollarSign className="text-brand-400" />, val: resumen?.efectivo_usd_sistema, isUsd: true },
            { key: 'efectivo_ves', label: 'Bs. Efectivo',       icon: <LuBanknote className="text-green-400" />,  val: resumen?.efectivo_ves_sistema, isUsd: false },
            { key: 'digital_ves', label: 'Digital (Pago Móvil + Transf.)', icon: <LuSmartphone className="text-purple-400" />, val: resumen?.digital_ves_sistema, isUsd: false },
          ].map(m => (
            <div key={m.key} className="flex items-center justify-between bg-surface-700 rounded-xl px-4 py-2.5">
              <div className="flex items-center gap-2 text-sm text-gray-300">
                {m.icon} {m.label}
              </div>
              <span className="font-mono font-bold text-white text-sm">
                {m.isUsd ? `$${Number(m.val || 0).toFixed(2)}` : `Bs. ${Number(m.val || 0).toLocaleString('es-VE', { maximumFractionDigits: 2 })}`}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Physical count inputs */}
      {!cerrado && (
        <div className="card">
          <h2 className="font-semibold text-white mb-1">🧾 Conteo Físico</h2>
          <p className="text-xs text-gray-500 mb-4">Ingresa lo que contaste en caja para comparar con el sistema</p>

          <div className="space-y-4">
            {[
              { key: 'efectivo_usd', label: '$ Efectivo USD en caja', icon: <LuDollarSign />, placeholder: '0.00', sistema: resumen?.efectivo_usd_sistema, isUsd: true },
              { key: 'efectivo_ves', label: 'Bs. Efectivo en caja',    icon: <LuBanknote />,  placeholder: '0.00', sistema: resumen?.efectivo_ves_sistema, isUsd: false },
              { key: 'digital_ves', label: 'Bs. Digital (Pago Móvil + Transf.)', icon: <LuSmartphone />, placeholder: '0.00', sistema: resumen?.digital_ves_sistema, isUsd: false },
            ].map(m => {
              const contadoVal = parseFloat(contado[m.key]) || 0
              const sistemaVal = m.sistema || 0
              const diff = contadoVal - sistemaVal
              return (
                <div key={m.key}>
                  <div className="flex items-center justify-between mb-1">
                    <label className="label flex items-center gap-1 mb-0">{m.icon} {m.label}</label>
                    <span className="text-xs text-gray-500">
                      Sistema: {m.isUsd ? `$${sistemaVal.toFixed(2)}` : `Bs. ${sistemaVal.toLocaleString('es-VE', { maximumFractionDigits: 2 })}`}
                    </span>
                  </div>
                  <input className="input font-mono" type="number" min="0" step="0.01" placeholder={m.placeholder}
                    value={contado[m.key]} onChange={e => setContado(p => ({ ...p, [m.key]: e.target.value }))} />
                  {contadoVal > 0 && (
                    <div className="mt-1 flex justify-end">
                      <DifBadge val={diff} currency={m.isUsd ? '$' : 'Bs.'} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          <div className="mt-4">
            <label className="label">Notas (opcional)</label>
            <textarea className="input resize-none" rows={2} placeholder="Observaciones del cierre..."
              value={notas} onChange={e => setNotas(e.target.value)} />
          </div>

          <button onClick={handleCerrar} disabled={saving} className="btn-danger btn-lg w-full mt-4">
            <LuLock /> {saving ? 'Cerrando...' : 'Cerrar Caja del Día'}
          </button>
          <p className="text-xs text-gray-600 text-center mt-2">⚠️ Esta operación guarda el registro del día. No elimina datos.</p>
        </div>
      )}

      {alertMsg && <AlertModal title="Error" message={alertMsg} onClose={() => setAlertMsg('')} />}
    </div>
  )
}
