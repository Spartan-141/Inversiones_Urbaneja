import React, { useState, useEffect, useCallback } from 'react'
import { LuShoppingCart, LuDollarSign, LuTrendingUp, LuPackage, LuTriangleAlert, LuCircleAlert, LuRefreshCw } from 'react-icons/lu'
import { useApp } from '../context/AppContext.jsx'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'

export default function Dashboard() {
  const { fmt, fmtVes, tasa } = useApp()
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

  const chartColors = ['#38bdf8', '#22c55e', '#a855f7', '#f97316', '#eab308']

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="page-title">📊 Dashboard</h1>
          <p className="text-sm text-gray-500 capitalize mt-0.5">{hoy}</p>
        </div>
        <button onClick={load} disabled={loading} className="btn-ghost btn-sm gap-2">
          <LuRefreshCw className={loading ? 'animate-spin' : ''} /> Actualizar
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="kpi-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600/30 flex items-center justify-center">
              <LuDollarSign className="text-brand-400" />
            </div>
            <span className="kpi-label">Ventas Hoy</span>
          </div>
          <p className="kpi-value">{fmt(kpis?.ventas?.total_usd || 0)}</p>
          <p className="text-xs text-gray-500 mt-1">{fmtVes(kpis?.ventas?.total_usd || 0)}</p>
        </div>

        <div className="kpi-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-green-600/20 flex items-center justify-center">
              <LuShoppingCart className="text-green-400" />
            </div>
            <span className="kpi-label">Transacciones</span>
          </div>
          <p className="kpi-value">{kpis?.ventas?.total_transacciones || 0}</p>
          <p className="text-xs text-gray-500 mt-1">ventas registradas</p>
        </div>

        <div className="kpi-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center">
              <LuTrendingUp className="text-purple-400" />
            </div>
            <span className="kpi-label">Promedio Venta</span>
          </div>
          <p className="kpi-value">{fmt(kpis?.ventas?.promedio_usd || 0)}</p>
          <p className="text-xs text-gray-500 mt-1">por transacción</p>
        </div>

        <div className="kpi-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-orange-600/20 flex items-center justify-center">
              <LuPackage className="text-orange-400" />
            </div>
            <span className="kpi-label">Stock Bajo</span>
          </div>
          <p className="kpi-value text-accent-orange">{kpis?.stockBajo?.length || 0}</p>
          <p className="text-xs text-gray-500 mt-1">productos críticos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top products chart */}
        <div className="card">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <LuTrendingUp className="text-brand-400" /> Top 5 — Ventas de Hoy
          </h2>
          {kpis?.topHoy?.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={kpis.topHoy} layout="vertical" margin={{ left: 0, right: 16 }}>
                <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 11 }} tickFormatter={v => `$${v.toFixed(0)}`} />
                <YAxis type="category" dataKey="nombre" tick={{ fill: '#d1d5db', fontSize: 11 }} width={110} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1a2235', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  labelStyle={{ color: '#fff' }}
                  formatter={(v) => [`$${Number(v).toFixed(2)}`, 'Ingreso']}
                />
                <Bar dataKey="subtotal_usd" radius={[0, 6, 6, 0]}>
                  {(kpis?.topHoy || []).map((_, i) => (
                    <Cell key={i} fill={chartColors[i % chartColors.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-600 text-sm">
              {loading ? 'Cargando...' : 'Sin ventas hoy'}
            </div>
          )}
        </div>

        {/* Expiry alerts */}
        <div className="card">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <LuTriangleAlert className="text-accent-yellow" /> Alertas de Vencimiento
          </h2>
          {alertas.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-40 text-gray-600 text-sm gap-2">
              <LuCircleAlert className="text-3xl opacity-30" />
              <p>{loading ? 'Cargando...' : '✅ Ningún producto próximo a vencer'}</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {alertas.map(p => {
                const dias = Math.floor(p.dias_restantes)
                const vencido = dias < 0
                return (
                  <div key={p.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-sm
                      ${vencido
                        ? 'bg-red-900/20 border-red-500/30'
                        : 'bg-yellow-900/20 border-yellow-500/30'}`}>
                    <div>
                      <p className="font-medium text-white">{p.nombre}</p>
                      <p className="text-xs text-gray-400">
                        Stock: {Number(p.stock_actual).toFixed(p.unidad_medida === 'kg' ? 3 : 0)} {p.unidad_medida}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={`badge text-xs ${vencido ? 'badge-red' : 'badge-yellow'}`}>
                        {vencido ? `Vencido hace ${Math.abs(dias)}d` : `Vence en ${dias}d`}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{p.fecha_vencimiento}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Low stock warning */}
      {kpis?.stockBajo?.length > 0 && (
        <div className="card border-orange-500/20">
          <h2 className="font-semibold text-white mb-3 flex items-center gap-2">
            <LuPackage className="text-orange-400" /> Stock Bajo — Requiere reposición
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {kpis.stockBajo.map(p => (
              <div key={p.id} className="bg-orange-900/10 border border-orange-500/20 rounded-lg p-2.5 text-sm">
                <p className="font-medium text-white truncate">{p.nombre}</p>
                <div className="flex justify-between mt-1">
                  <span className="text-orange-400 font-mono text-xs">
                    Stock: {Number(p.stock_actual).toFixed(p.unidad_medida === 'kg' ? 3 : 0)} {p.unidad_medida}
                  </span>
                  <span className="text-gray-500 text-xs">Mín: {p.stock_minimo}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Exchange rate display */}
      <div className="card-sm flex items-center justify-between">
        <span className="text-xs text-gray-500 uppercase tracking-wider">Tasa BCV del Día</span>
        <span className="font-mono font-bold text-brand-400">Bs. {Number(tasa).toFixed(2)} / $1.00</span>
      </div>
    </div>
  )
}
