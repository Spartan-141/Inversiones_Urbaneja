import React, { useState, useEffect, useCallback } from 'react'
import { LuChartColumn, LuSearch, LuRefreshCw, LuCalendar, LuX } from 'react-icons/lu'
import { useApp } from '../context/AppContext.jsx'
import { format } from 'date-fns'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

const hoyStr = () => new Date().toISOString().split('T')[0]
const inicioMes = () => {
  const d = new Date(); d.setDate(1)
  return d.toISOString().split('T')[0]
}

const ESTADO_BADGE = {
  pagada:  <span className="badge badge-green badge-sm">Pagada</span>,
  credito: <span className="badge badge-yellow badge-sm">Crédito</span>,
}

export default function Reportes() {
  const { fmt, fmtVes } = useApp()
  const [desde, setDesde] = useState(inicioMes())
  const [hasta, setHasta] = useState(hoyStr())
  const [data, setData]   = useState(null)
  const [top, setTop]     = useState([])
  const [loading, setLoading] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [rep, topP] = await Promise.all([
        window.api.invoke('reportes:ventasPeriodo', { fecha_desde: desde, fecha_hasta: hasta }),
        window.api.invoke('reportes:topProductos',  { fecha_desde: desde, fecha_hasta: hasta, limit: 8 }),
      ])
      setData(rep)
      setTop(topP)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [desde, hasta])

  useEffect(() => { load() }, [load])

  const METODO_LABEL = {
    efectivo_usd: '$ Efectivo USD',
    efectivo_ves: 'Bs. Efectivo',
    pago_movil:   'Bs. Pago Móvil',
    transferencia:'Bs. Transferencia',
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="page-title flex items-center gap-2"><LuChartColumn className="text-brand-400" /> Reportes</h1>
        <button onClick={load} disabled={loading} className="btn-ghost btn-sm gap-1">
          <LuRefreshCw className={loading ? 'animate-spin' : ''} /> Actualizar
        </button>
      </div>

      {/* Date range filter */}
      <div className="card flex flex-wrap items-end gap-4">
        <div>
          <label className="label flex items-center gap-1"><LuCalendar /> Desde</label>
          <input className="input" type="date" value={desde} onChange={e => setDesde(e.target.value)} />
        </div>
        <div>
          <label className="label flex items-center gap-1"><LuCalendar /> Hasta</label>
          <input className="input" type="date" value={hasta} onChange={e => setHasta(e.target.value)} />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => { setDesde(hoyStr()); setHasta(hoyStr()) }} className="btn-secondary btn-sm">Hoy</button>
          <button onClick={() => { setDesde(inicioMes()); setHasta(hoyStr()) }} className="btn-secondary btn-sm">Este mes</button>
        </div>
      </div>

      {/* Summary KPIs */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="kpi-card">
            <p className="kpi-label">Ventas</p>
            <p className="kpi-value">{data.resumen?.total_ventas || 0}</p>
          </div>
          <div className="kpi-card">
            <p className="kpi-label">Ingresos</p>
            <p className="kpi-value text-brand-400">{fmt(data.resumen?.ingresos_usd || 0)}</p>
            <p className="text-xs text-gray-500">{fmtVes(data.resumen?.ingresos_usd || 0)}</p>
          </div>
          <div className="kpi-card">
            <p className="kpi-label">Descuentos</p>
            <p className="kpi-value text-accent-yellow">{fmt(data.resumen?.descuentos_usd || 0)}</p>
          </div>
          <div className="kpi-card">
            <p className="kpi-label">Pendiente Cobrar</p>
            <p className="kpi-value text-red-400">{fmt(data.resumen?.pendiente_cobrar_usd || 0)}</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Payment method breakdown */}
        {data?.pagos?.length > 0 && (
          <div className="card">
            <h2 className="font-semibold text-white mb-4">💳 Desglose por Método de Pago</h2>
            <div className="space-y-2">
              {data.pagos.map(p => (
                <div key={p.metodo} className="flex items-center justify-between bg-surface-700 rounded-xl px-3 py-2 text-sm">
                  <span className="text-gray-300">{METODO_LABEL[p.metodo] || p.metodo}</span>
                  <span className="font-mono font-bold text-white">${Number(p.total_usd).toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top products */}
        {top.length > 0 && (
          <div className="card">
            <h2 className="font-semibold text-white mb-4">🏆 Productos Más Vendidos</h2>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={top} layout="vertical" margin={{ left: 0, right: 16 }}>
                <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={v => `$${v.toFixed(0)}`} />
                <YAxis type="category" dataKey="nombre" tick={{ fill: '#d1d5db', fontSize: 11 }} width={120} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a2235', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  formatter={(v) => [`$${Number(v).toFixed(2)}`, 'Ingreso']} />
                <Bar dataKey="total_usd" fill="#38bdf8" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Transactions table */}
      {data?.ventas?.length > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-white/5">
            <h2 className="font-semibold text-white">📋 Historial de Ventas</h2>
          </div>
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th className="pl-4">#</th>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th className="text-right">Total USD</th>
                  <th className="text-center">Estado</th>
                </tr>
              </thead>
              <tbody>
                {data.ventas.slice(0, 50).map(v => (
                  <tr key={v.id} className="hover:bg-white/2">
                    <td className="pl-4 text-gray-500 text-xs">#{v.id}</td>
                    <td className="text-xs text-gray-400">{format(new Date(v.fecha), 'dd/MM/yy HH:mm')}</td>
                    <td className="text-sm text-gray-300">{v.cliente_nombre || '—'}</td>
                    <td className="text-right font-semibold text-white text-sm">${Number(v.total_usd).toFixed(2)}</td>
                    <td className="text-center">{ESTADO_BADGE[v.estado]}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {data?.ventas?.length === 0 && !loading && (
        <div className="flex flex-col items-center justify-center h-32 text-gray-600 gap-2">
          <LuChartColumn className="text-4xl opacity-20" />
          <p className="text-sm">No hay ventas en el período seleccionado</p>
        </div>
      )}
    </div>
  )
}
