import React, { useState, useEffect, useCallback } from 'react'
import { LuShoppingCart, LuTrendingUp, LuPackage, LuTriangleAlert, LuCircleAlert, LuRefreshCw, LuBanknote } from 'react-icons/lu'
import { useApp } from '../context/AppContext.jsx'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function Dashboard() {
  const { fmt } = useApp()
  const [kpis, setKpis]     = useState(null)
  const [alertas, setAlertas] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [k, a] = await Promise.all([
        window.api.invoke('reportes:kpisHoy'),
        window.api.invoke('productos:alertasVencimiento'),
      ])
      setKpis(k)
      setAlertas(a)
    } catch (e) {
      console.error('Dashboard load error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const hoy = format(new Date(), "EEEE, d 'de' MMMM yyyy", { locale: es })
  const chartColors = [
    'oklch(65% 0.18 250)', // Indigo
    'oklch(72% 0.16 150)', // Emerald
    'oklch(82% 0.14 85)',  // Amber
    'oklch(62% 0.22 25)',  // Rose
    'oklch(78% 0.12 210)'  // Sky
  ]

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="text-sm text-slate-400 capitalize mt-1 tracking-wide">{hoy}</p>
        </div>
        <button onClick={load} disabled={loading} className="btn-secondary">
          <LuRefreshCw className={loading ? 'animate-spin' : ''} /> Actualizar
        </button>
      </div>

      {/* Editorial Metrics (Avoiding AI/SaaS Clichés) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card-elevated p-8 relative overflow-hidden group border-emerald-500/10">
          <div className="flex flex-col h-full">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-emerald-500/80 mb-4">Ventas Brutas</span>
            <span className="text-4xl font-black text-white tracking-tighter mb-2">{fmt(kpis?.ventas?.total_ves || 0)}</span>
            <div className="mt-auto flex items-center gap-2">
              <div className="w-8 h-1 bg-emerald-500/30 rounded-full overflow-hidden">
                <div className="w-full h-full bg-emerald-500 animate-pulse"></div>
              </div>
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">En tiempo real</span>
            </div>
          </div>
        </div>

        <div className="card-elevated p-8 relative overflow-hidden group border-indigo-500/10">
          <div className="flex flex-col h-full">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-indigo-400 mb-4">Volumen Operativo</span>
            <span className="text-4xl font-black text-white tracking-tighter mb-2">{kpis?.ventas?.total_transacciones || 0}</span>
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Facturas procesadas</p>
          </div>
        </div>

        <div className="card-elevated p-8 relative overflow-hidden group border-purple-500/10">
          <div className="flex flex-col h-full">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-purple-400 mb-4">Ticket de Compra</span>
            <span className="text-4xl font-black text-white tracking-tighter mb-2">{fmt(kpis?.ventas?.promedio_ves || 0)}</span>
            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">Valor promedio por cliente</p>
          </div>
        </div>

        <div className="card-elevated p-8 relative overflow-hidden group border-amber-500/20 bg-amber-500/[0.02]">
          <div className="flex flex-col h-full">
            <span className="text-[10px] font-black uppercase tracking-[0.25em] text-amber-500 mb-4">Stock Crítico</span>
            <span className="text-4xl font-black text-amber-500 tracking-tighter mb-2">{kpis?.stockBajo?.length || 0}</span>
            <p className="text-[10px] text-amber-500/60 uppercase font-black tracking-widest">SKUs por reponer</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        {/* Top products chart */}
        <div className="card p-8 flex flex-col">
          <h2 className="font-black text-lg mb-6 flex items-center gap-3 text-white">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400"><LuTrendingUp size={18} /></div>
            Top 5 — Productos hoy
          </h2>
          <div className="flex-1 min-h-[250px]">
            {kpis?.topHoy?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={kpis.topHoy} layout="vertical" margin={{ left: -20, right: 20 }}>
                  <XAxis type="number" hide />
                  <YAxis type="category" dataKey="nombre" tick={{ fill: '#cbd5e1', fontSize: 11, fontWeight: 'bold' }} width={140} axisLine={false} tickLine={false} />
                  <Tooltip
                    cursor={{ fill: 'oklch(100% 0 0 / 2%)' }}
                    contentStyle={{ backgroundColor: 'oklch(22% 0.025 250)', border: '1px solid oklch(100% 0 0 / 10%)', borderRadius: '24px', boxShadow: '0 20px 40px oklch(0% 0 0 / 40%)' }}
                    itemStyle={{ color: 'oklch(72% 0.16 150)', fontWeight: '900' }}
                    formatter={(v) => [fmt(v), 'Total']}
                  />
                  <Bar dataKey="subtotal" radius={[0, 8, 8, 0]} barSize={28}>
                    {(kpis?.topHoy || []).map((_, i) => (
                      <Cell key={i} fill={chartColors[i % chartColors.length]} style={{ filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.3))' }} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex flex-col items-center justify-center h-full opacity-20">
                <LuShoppingCart size={64} className="mb-4" />
                <p className="text-sm font-bold tracking-widest uppercase">Sin ventas registradas hoy</p>
              </div>
            )}
          </div>
        </div>

        {/* Expiry alerts */}
        <div className="card p-8 flex flex-col">
          <h2 className="font-black text-lg mb-6 flex items-center gap-3 text-white">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-500"><LuTriangleAlert size={18} /></div>
            Alertas de Vencimiento
          </h2>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3">
            {alertas.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full opacity-20 mt-10">
                <LuCircleAlert size={64} className="mb-4" />
                <p className="text-sm font-bold tracking-widest uppercase">No hay alertas de vencimiento</p>
              </div>
            ) : (
              alertas.map(p => {
                const dias = Math.floor(p.dias_restantes)
                const vencido = dias < 0
                return (
                  <div key={p.id}
                    className={`flex items-center justify-between p-4 rounded-2xl border transition-all duration-200 hover:scale-[1.02]
                      ${vencido ? 'bg-red-500/10 border-red-500/30' : 'bg-surface-700/50 border-white/5 hover:border-amber-500/30 hover:bg-amber-500/5'}`}>
                    <div>
                      <p className="font-bold text-sm text-white">{p.nombre}</p>
                      <p className="text-[11px] text-slate-400 uppercase tracking-widest mt-1 font-bold">
                        Stock: {p.stock_actual} {p.unidad_medida}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`badge ${vencido ? 'badge-red' : 'badge-yellow'}`}>
                        {vencido ? `Vencido` : `Vence en ${dias}d`}
                      </span>
                      <p className="text-[10px] text-slate-500 font-mono mt-1.5 font-bold tracking-wider">{p.fecha_vencimiento}</p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
