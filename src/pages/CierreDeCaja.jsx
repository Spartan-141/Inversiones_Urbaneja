import React, { useState, useEffect, useCallback } from 'react'
import { LuLock, LuBanknote, LuSmartphone, LuLandmark, LuRefreshCw, LuCircleCheck, LuTriangleAlert } from 'react-icons/lu'
import { useApp } from '../context/AppContext.jsx'
import { format } from 'date-fns'
import AlertModal from '../components/AlertModal.jsx'

export default function CierreDeCaja() {
  const { fmt } = useApp()
  const [resumen, setResumen] = useState(null)
  const [cerrado, setCerrado] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [alertMsg, setAlertMsg] = useState('')
  const [notas, setNotas] = useState('')

  // Physical cash count inputs
  const [contado, setContado] = useState({
    efectivo: '', digital: '',
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

  const getSist = (metodo) => {
    if (!resumen?.pagos) return 0
    return resumen.pagos.filter(p => {
      if (metodo === 'efectivo') return p.metodo === 'efectivo'
      return p.metodo === 'pago_movil' || p.metodo === 'transferencia'
    }).reduce((acc, p) => acc + p.total, 0)
  }

  const sistEfe = getSist('efectivo')
  const sistDig = getSist('digital')
  const difEfe = c('efectivo') - sistEfe
  const difDig = c('digital') - sistDig
  const totalSist = sistEfe + sistDig
  const totalCont = c('efectivo') + c('digital')

  const handleCerrar = async () => {
    if (!resumen) return
    setSaving(true)
    try {
      await window.api.invoke('cierres:cerrar', {
        fecha: resumen.fecha,
        totalVentasCount: resumen.totalVentasCount,
        ingresos: resumen.ingresos,
        efectivo_sistema: sistEfe,
        digital_sistema:  sistDig,
        efectivo_contado: c('efectivo'),
        digital_contado:  c('digital'),
        diferencia: difEfe + difDig,
        pendiente_cobrar: resumen.pendiente_cobrar,
        ganancia_neta: 0, // Simplified for now
        notas,
      })
      load()
    } catch (e) {
      setAlertMsg(`Error al cerrar: ${e.message}`)
    } finally {
      setSaving(false)
    }
  }

  const DifBadge = ({ val }) => {
    if (Math.abs(val) < 0.05) return <span className="badge-green">✓ Cuadra</span>
    if (val < 0) return <span className="badge-red">Faltante {fmt(Math.abs(val))}</span>
    return <span className="badge-yellow">Sobrante {fmt(val)}</span>
  }

  if (loading) return <div className="page justify-center items-center opacity-50"><LuRefreshCw className="animate-spin text-4xl" /></div>

  return (
    <div className="page max-w-4xl mx-auto">
      <div className="page-header">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-glow">
            <LuLock size={24} />
          </div>
          <div>
            <h1 className="page-title text-white">Cierre de Caja</h1>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">{format(new Date(), 'dd/MM/yyyy')}</p>
          </div>
        </div>
        <button onClick={load} className="btn-secondary h-12 w-12 flex items-center justify-center"><LuRefreshCw size={20} className={loading ? 'animate-spin' : ''} /></button>
      </div>

      {cerrado && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-3xl p-6 flex items-center gap-5 animate-fade-in shadow-inner">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 shadow-glow-success border border-emerald-500/20">
            <LuCircleCheck size={28} />
          </div>
          <div>
            <p className="text-xl font-black text-emerald-400 leading-tight">Caja cerrada hoy</p>
            <p className="text-sm font-bold text-emerald-500/60 uppercase tracking-widest mt-1">El cierre se completó exitosamente a las {cerrado.cerrado_en?.split(' ')[1] || ''}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Transacciones" value={resumen?.totalVentasCount || 0} icon={<LuShoppingCart className="text-indigo-400" />} />
        <StatCard label="Ingresos (Sistema)" value={fmt(resumen?.ingresos || 0)} colorClass="text-emerald-400" icon={<LuBanknote />} />
        <StatCard label="Por Cobrar" value={fmt(resumen?.pendiente_cobrar || 0)} colorClass="text-red-400" icon={<LuTriangleAlert />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* System Summary */}
        <div className="card p-8 bg-surface-800/50 backdrop-blur-md border border-white/5 rounded-3xl">
          <h2 className="font-black text-xl mb-6 flex items-center gap-3 text-indigo-400 uppercase tracking-widest"><LuBanknote size={24} /> Datos del Sistema</h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center bg-surface-900/80 p-5 rounded-2xl shadow-inner border border-white/5">
              <span className="flex items-center gap-3 text-sm font-bold text-slate-300 uppercase tracking-widest"><LuBanknote className="text-emerald-400" size={18} /> Efectivo</span>
              <span className="font-black text-xl text-white">{fmt(sistEfe)}</span>
            </div>
            <div className="flex justify-between items-center bg-surface-900/80 p-5 rounded-2xl shadow-inner border border-white/5">
              <span className="flex items-center gap-3 text-sm font-bold text-slate-300 uppercase tracking-widest"><LuSmartphone className="text-indigo-400" size={18} /> Digital</span>
              <span className="font-black text-xl text-white">{fmt(sistDig)}</span>
            </div>
            <div className="flex justify-between items-center border-t border-dashed border-white/10 pt-6 mt-6">
              <span className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Total Esperado</span>
              <span className="text-3xl font-black text-indigo-400">{fmt(totalSist)}</span>
            </div>
          </div>
        </div>

        {/* Physical Count */}
        <div className="card p-8 bg-surface-800/50 backdrop-blur-md border border-white/5 rounded-3xl">
          <h2 className="font-black text-xl mb-6 flex items-center gap-3 text-amber-500 uppercase tracking-widest"><LuLock size={24} /> Conteo en Caja</h2>
          {cerrado ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center p-5 rounded-2xl bg-surface-900/80 shadow-inner border border-white/5">
                <span className="text-sm font-bold text-slate-300 uppercase tracking-widest">Efectivo Contado</span>
                <span className="font-black text-xl text-white">{fmt(cerrado.efectivo_contado)}</span>
              </div>
              <div className="flex justify-between items-center p-5 rounded-2xl bg-surface-900/80 shadow-inner border border-white/5">
                <span className="text-sm font-bold text-slate-300 uppercase tracking-widest">Digital Contado</span>
                <span className="font-black text-xl text-white">{fmt(cerrado.digital_contado)}</span>
              </div>
              <div className="flex justify-between items-center pt-6 mt-6 border-t border-dashed border-white/10">
                <span className="text-sm font-black uppercase tracking-[0.2em] text-slate-500">Diferencia Total</span>
                <DifBadge val={cerrado.diferencia} />
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <label className="label">Efectivo físico en caja (Bs.)</label>
                <input className="input h-14 text-xl font-black bg-surface-900 border-none shadow-inner text-emerald-400" type="number" step="0.01" placeholder="0,00"
                  value={contado.efectivo} onChange={e => setContado(p => ({ ...p, efectivo: e.target.value }))} />
              </div>
              <div>
                <label className="label">Digital (Pago Móvil / Transf.) en banco (Bs.)</label>
                <input className="input h-14 text-xl font-black bg-surface-900 border-none shadow-inner text-indigo-400" type="number" step="0.01" placeholder="0,00"
                  value={contado.digital} onChange={e => setContado(p => ({ ...p, digital: e.target.value }))} />
              </div>
              <div className="pt-6 border-t border-dashed border-white/10 space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-500 uppercase tracking-widest">Dif. Efectivo:</span>
                  <DifBadge val={difEfe} />
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="font-bold text-slate-500 uppercase tracking-widest">Dif. Digital:</span>
                  <DifBadge val={difDig} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {!cerrado && (
        <div className="card p-8 bg-surface-800/50 backdrop-blur-md border border-red-500/10 rounded-3xl mt-6 shadow-[0_0_40px_rgba(239,68,68,0.05)]">
          <label className="label text-slate-300 font-bold uppercase tracking-widest text-xs mb-3">Notas / Observaciones del Cierre</label>
          <textarea className="input h-24 resize-none mb-6 bg-surface-900 border-none shadow-inner text-white p-5 rounded-2xl" placeholder="Ej: Faltante de 5 Bs por redondeo..."
            value={notas} onChange={e => setNotas(e.target.value)} />
          <button onClick={handleCerrar} disabled={saving} className="btn-danger btn-lg w-full h-16 text-lg font-black uppercase tracking-widest shadow-glow-danger relative overflow-hidden group rounded-2xl">
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
            <span className="relative flex items-center justify-center gap-2">
              {saving ? '⏳ Procesando Cierre...' : '🔒 Cerrar Caja del Día'}
            </span>
          </button>
          <p className="text-center text-[10px] text-red-400/60 font-bold mt-4 uppercase tracking-[0.2em]">
            ⚠️ Al cerrar la caja se bloquean los registros de este día para el reporte final.
          </p>
        </div>
      )}

      {alertMsg && <AlertModal message={alertMsg} onClose={() => setAlertMsg('')} />}
    </div>
  )
}

function StatCard({ label, value, colorClass = '', icon }) {
  return (
    <div className="stat-card">
      <p className="stat-label flex items-center gap-2">{icon} {label}</p>
      <p className={`stat-value ${colorClass}`}>{value}</p>
    </div>
  )
}
import { LuShoppingCart } from 'react-icons/lu'
