import React, { useState, useEffect, useCallback } from 'react'
import { LuTrendingUp, LuBanknote, LuSmartphone, LuLandmark, LuCreditCard, LuRefreshCw, LuEye, LuChartColumn, LuChevronLeft, LuChevronRight, LuDownload, LuSearch, LuX, LuCalendar, LuList, LuShoppingCart, LuTrendingDown } from 'react-icons/lu'
import { useApp } from '../context/AppContext.jsx'
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isToday, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

const METODO_LABEL = {
  efectivo:      <><LuBanknote className="inline mb-1" /> Efectivo</>,
  pago_movil:    <><LuSmartphone className="inline mb-1" /> Pago Móvil</>,
  transferencia: <><LuLandmark className="inline mb-1" /> Transferencia</>,
}

// ── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, colorClass = '', icon }) {
  return (
    <div className="stat-card">
      <p className="stat-label flex items-center gap-2">
        {icon && <span className="opacity-50">{icon}</span>}
        {label}
      </p>
      <p className={`stat-value ${colorClass}`}>{value}</p>
      {sub && <p className="text-[10px] text-slate-500 uppercase mt-1 truncate">{sub}</p>}
    </div>
  )
}

// ── Venta Detail Modal ────────────────────────────────────────────────────────
function VentaDetailModal({ v, fmt, onClose }) {
  const totalPagado = [...(v.pagos || []), ...(v.abonos || [])].reduce((acc, p) => acc + (p.monto || 0), 0)

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-lg max-w-2xl">
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-1">Detalle de Venta</p>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <span className="font-mono opacity-50">#{v.id}</span>
              <span className={v.estado === 'pagada' ? 'badge-green' : 'badge-yellow'}>{v.estado}</span>
            </h2>
            <p className="text-xs text-slate-500 mt-1">{v.fecha?.slice(0, 16)} &middot; {v.cliente_nombre || 'Sin cliente'}</p>
          </div>
          <button onClick={onClose} className="btn-ghost btn-sm text-xl">✕</button>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="card p-4 bg-surface-700/50">
            <p className="text-[10px] font-bold uppercase text-slate-500 mb-1">Total</p>
            <p className="text-lg font-bold">{fmt(v.total)}</p>
          </div>
          <div className="card p-4 bg-emerald-500/10 border-emerald-500/20">
            <p className="text-[10px] font-bold uppercase text-emerald-500/60 mb-1">Cobrado</p>
            <p className="text-lg font-bold text-emerald-400">{fmt(totalPagado)}</p>
          </div>
          <div className="card p-4 bg-red-500/10 border-red-500/20">
            <p className="text-[10px] font-bold uppercase text-red-500/60 mb-1">Pendiente</p>
            <p className="text-lg font-bold text-red-400">{fmt(v.saldo_pendiente)}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-6">
          <div className="table-wrapper">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th>Artículo</th>
                  <th className="text-center">Cant.</th>
                  <th className="text-right">Precio</th>
                  <th className="text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(v.detalles || []).map((d, i) => (
                  <tr key={i}>
                    <td className="font-bold text-indigo-300">{d.nombre}</td>
                    <td className="text-center">{d.cantidad} {d.unidad_medida}</td>
                    <td className="text-right text-slate-400">{fmt(d.precio_unitario)}</td>
                    <td className="text-right font-bold">{fmt(d.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {(v.pagos?.length > 0 || v.abonos?.length > 0) && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Historial de Pagos</p>
              <div className="space-y-2">
                {[...(v.pagos || []), ...(v.abonos || [])].map((p, i) => (
                  <div key={i} className="flex justify-between items-center bg-surface-700/50 px-4 py-3 rounded-xl border border-white/5">
                    <span className="flex items-center gap-3 text-sm">
                      <span className="text-indigo-400">{METODO_LABEL[p.metodo] || p.metodo}</span>
                      <span className="text-[10px] text-slate-500">{p.fecha?.slice(0, 16)}</span>
                    </span>
                    <span className="text-emerald-400 font-bold">{fmt(p.monto)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end mt-6">
          <button onClick={onClose} className="btn-secondary px-8">Cerrar</button>
        </div>
      </div>
    </div>
  )
}

// ── Calendario de Ventas ─────────────────────────────────────────────────────
function CalendarioVentas({ fmt }) {
  const today = new Date()
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [calData, setCalData] = useState([])
  const [loading, setLoading] = useState(false)
  const [selectedDay, setSelectedDay] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await window.api.invoke('ventas:calendario', { year: viewDate.getFullYear(), month: viewDate.getMonth() + 1 })
      setCalData(data || [])
    } finally { setLoading(false) }
  }, [viewDate])

  useEffect(() => { load() }, [load])

  const days = []
  let cur = startOfWeek(startOfMonth(viewDate), { weekStartsOn: 1 })
  const end = endOfWeek(endOfMonth(viewDate), { weekStartsOn: 1 })
  while (cur <= end) { days.push(cur); cur = addDays(cur, 1) }

  const dataMap = {}
  calData.forEach(d => { dataMap[d.fecha] = d })

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))} className="btn-ghost p-2"><LuChevronLeft /></button>
            <h2 className="text-xl font-bold capitalize">{format(viewDate, 'MMMM yyyy', { locale: es })}</h2>
            <button onClick={() => setViewDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))} className="btn-ghost p-2"><LuChevronRight /></button>
          </div>
          <button onClick={load} className="btn-ghost"><LuRefreshCw className={loading ? 'animate-spin' : ''} /></button>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'].map(d => (
            <div key={d} className="text-center text-[10px] font-bold uppercase text-slate-500 py-2">{d}</div>
          ))}
          {days.map((day, i) => {
            const dateStr = format(day, 'yyyy-MM-dd')
            const dayData = dataMap[dateStr]
            const isCurMonth = isSameMonth(day, viewDate)
            const isTodayDay = isToday(day)
            const hasVentas = dayData?.total_ventas > 0

            return (
              <div key={i} className={`
                min-h-[80px] p-2 rounded-xl border transition-all
                ${isCurMonth ? 'bg-surface-700/30 border-white/5 cursor-pointer hover:bg-surface-600/50' : 'opacity-10 pointer-events-none'}
                ${isTodayDay ? 'ring-2 ring-indigo-500 bg-indigo-500/5' : ''}
                ${hasVentas ? 'bg-indigo-500/10' : ''}
              `} onClick={() => isCurMonth && setSelectedDay(dateStr)}>
                <span className={`text-[10px] font-bold ${isTodayDay ? 'text-indigo-400' : 'text-slate-500'}`}>{format(day, 'd')}</span>
                {hasVentas && (
                  <div className="mt-2 space-y-1">
                    <p className="text-[10px] font-bold text-indigo-300 leading-none">{dayData.total_ventas} vts</p>
                    <p className="text-[9px] text-emerald-400 font-bold leading-none">{fmt(dayData.ingresos)}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ── Main Reportes ────────────────────────────────────────────────────────────
export default function Reportes() {
  const { fmt } = useApp()
  const [tab, setTab] = useState('historial')
  const [data, setData] = useState({ ventas: [], total: 0, pages: 0, resumen: {} })
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [mode, setMode] = useState('day')
  const [day, setDay] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [month, setMonth] = useState(format(new Date(), 'yyyy-MM'))
  const [selectedVenta, setSelectedVenta] = useState(null)

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    let fechaDesde, fechaHasta
    if (mode === 'day') { fechaDesde = day; fechaHasta = day }
    else {
      const [y, m] = month.split('-')
      fechaDesde = `${month}-01`
      fechaHasta = format(endOfMonth(new Date(y, m-1)), 'yyyy-MM-dd')
    }

    try {
      const result = await window.api.invoke('ventas:paginated', { page: p, perPage: 25, fechaDesde, fechaHasta })
      setData(result)
      setPage(p)
    } finally { setLoading(false) }
  }, [mode, day, month])

  useEffect(() => { if (tab === 'historial') load(1) }, [load, tab])

  const exportCsv = () => {
    const headers = ['ID', 'Fecha', 'Cliente', 'Estado', 'Total', 'Pendiente']
    const rows = data.ventas.map(v => [v.id, v.fecha, `"${v.cliente_nombre}"`, v.estado, v.total, v.saldo_pendiente].join(','))
    const csv = [headers.join(','), ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reporte_ventas_${format(new Date(), 'yyyyMMdd')}.csv`
    a.click()
  }

  const resumen = data.resumen || {}

  return (
    <div className="page">
      <div className="page-header">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-glow">
            <LuChartColumn size={24} />
          </div>
          <div>
            <h1 className="page-title text-white">Reportes</h1>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Análisis de ventas y rendimiento</p>
          </div>
        </div>
        <div className="flex bg-surface-800 p-1 rounded-xl border border-white/5 shadow-inner">
          <button onClick={() => setTab('historial')} className={`px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${tab === 'historial' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}>Historial</button>
          <button onClick={() => setTab('calendario')} className={`px-5 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${tab === 'calendario' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}>Calendario</button>
        </div>
      </div>

      {tab === 'calendario' ? (
        <CalendarioVentas fmt={fmt} />
      ) : (
        <div className="space-y-6">
          <div className="card p-5 flex flex-wrap gap-4 items-end bg-surface-800/50 backdrop-blur-xl border border-white/5 rounded-3xl">
            <div className="flex bg-surface-900 p-1 rounded-xl shadow-inner border border-white/5">
              <button onClick={() => setMode('day')} className={`px-5 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${mode==='day' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}>Por Día</button>
              <button onClick={() => setMode('month')} className={`px-5 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest transition-all ${mode==='month' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}>Por Mes</button>
            </div>
            {mode === 'day' ? (
              <input type="date" className="input h-12 w-48 bg-surface-900 border-none shadow-inner text-white font-medium" value={day} onChange={e => setDay(e.target.value)} />
            ) : (
              <input type="month" className="input h-12 w-48 bg-surface-900 border-none shadow-inner text-white font-medium" value={month} onChange={e => setMonth(e.target.value)} />
            )}
            <button onClick={() => load(1)} className="w-12 h-12 rounded-xl bg-surface-700 flex items-center justify-center text-indigo-400 hover:bg-indigo-500/20 transition-colors ml-auto border border-white/5"><LuRefreshCw className={loading ? 'animate-spin' : ''} size={20} /></button>
            <button onClick={exportCsv} className="h-12 px-5 rounded-xl bg-indigo-500/10 flex items-center gap-2 text-indigo-400 font-bold hover:bg-indigo-500 hover:text-white transition-colors border border-indigo-500/20 uppercase tracking-widest text-xs"><LuDownload size={18} /> CSV</button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <StatCard label="Ingresos Totales" value={fmt(resumen.ingresos)} colorClass="text-emerald-400" icon={<LuTrendingUp />} />
            <StatCard label="Total Facturas" value={data.total} icon={<LuShoppingCart />} />
            <StatCard label="Descuentos" value={fmt(resumen.descuentos)} icon={<LuTrendingDown />} />
            <StatCard label="Por Cobrar" value={fmt(resumen.pendiente_cobrar)} colorClass="text-red-400" icon={<LuBanknote />} />
          </div>

          <div className="table-wrapper flex-1 min-h-0 bg-surface-800/30 backdrop-blur-sm border border-white/5 rounded-3xl p-1">
            <table>
              <thead className="sticky top-0 z-10 bg-surface-800/80 backdrop-blur-xl">
                <tr>
                  <th>Folio</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Estado</th>
                  <th className="text-right">Total</th>
                  <th className="text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {data.ventas.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-20 opacity-50 font-bold uppercase tracking-widest text-slate-400">No hay ventas registradas</td></tr>
                ) : data.ventas.map(v => (
                  <tr key={v.id}>
                    <td className="font-bold text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-md w-max inline-block mt-3 border border-indigo-500/20">#{v.id}</td>
                    <td className="text-xs font-bold uppercase tracking-widest text-slate-500">{v.fecha?.slice(0, 16)}</td>
                    <td className="font-bold text-white">{v.cliente_nombre || 'Consumidor Final'}</td>
                    <td><span className={v.estado === 'pagada' ? 'badge badge-green' : 'badge badge-yellow'}>{v.estado}</span></td>
                    <td className="text-right font-black text-lg text-emerald-400">{fmt(v.total)}</td>
                    <td className="text-center">
                      <button onClick={async () => {
                        const full = await window.api.invoke('ventas:get_by_id', v.id)
                        setSelectedVenta(full)
                      }} className="w-10 h-10 rounded-xl inline-flex items-center justify-center text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500 hover:text-white transition-colors"><LuEye size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedVenta && <VentaDetailModal v={selectedVenta} fmt={fmt} onClose={() => setSelectedVenta(null)} />}
    </div>
  )
}
