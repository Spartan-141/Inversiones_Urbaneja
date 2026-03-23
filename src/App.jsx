import React, { useState } from 'react'
import {
  LuLayoutDashboard, LuShoppingCart, LuPackage,
  LuCreditCard, LuLock, LuChartColumn, LuPencil, LuCheck, LuX, LuStore
} from 'react-icons/lu'
import { HashRouter, Routes, Route, NavLink } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext.jsx'
import Dashboard         from './pages/Dashboard.jsx'
import POS               from './pages/POS.jsx'
import Inventario        from './pages/Inventario.jsx'
import CuentasPorCobrar  from './pages/CuentasPorCobrar.jsx'
import CierreDeCaja      from './pages/CierreDeCaja.jsx'
import Reportes          from './pages/Reportes.jsx'

const NAV_ITEMS = [
  { to: '/',          icon: <LuLayoutDashboard />, label: 'Dashboard' },
  { to: '/pos',       icon: <LuShoppingCart />,    label: 'Ventas' },
  { to: '/inventario',icon: <LuPackage />,         label: 'Inventario' },
  { to: '/cuentas',   icon: <LuCreditCard />,      label: 'Cobrar' },
  { to: '/cierres',   icon: <LuLock />,            label: 'Caja' },
  { to: '/reportes',  icon: <LuChartColumn />,     label: 'Reportes' },
]

// ── Exchange Rate Bar (sidebar footer) ────────────────────────────────────────
function ExchangeRateBar() {
  const { tasa, updateTasa } = useApp()
  const [editing, setEditing] = useState(false)
  const [val, setVal]         = useState('')

  const start = () => { setVal(String(tasa)); setEditing(true) }
  const save  = async () => { await updateTasa(val); setEditing(false) }

  return (
    <div className="px-4 py-4 border-t border-white/5">
      <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Tasa del Día (Bs./$)</p>
      {editing ? (
        <div className="flex gap-2">
          <input className="input flex-1 text-sm h-9 font-mono" type="number" min="0.01" step="0.01"
            value={val} onChange={e => setVal(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') save(); if (e.key === 'Escape') setEditing(false) }}
            autoFocus />
          <button onClick={save} className="btn-primary w-9 h-9 p-0"><LuCheck className="text-lg" /></button>
          <button onClick={() => setEditing(false)} className="btn-ghost w-9 h-9 p-0"><LuX className="text-lg" /></button>
        </div>
      ) : (
        <button onClick={start}
          className="w-full flex items-center justify-between bg-brand-900/40 border border-brand-500/30 rounded-xl px-3 py-2 hover:border-brand-500 transition-colors group">
          <span className="text-white font-mono font-bold">Bs. {Number(tasa).toFixed(2)}</span>
          <LuPencil className="text-brand-400 group-hover:text-brand-300 text-sm" />
        </button>
      )}
    </div>
  )
}

// ── Desktop Sidebar ───────────────────────────────────────────────────────────
function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-60 bg-surface-800 border-r border-white/5 shrink-0">
      {/* Logo / Brand */}
      <div className="px-5 py-5 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center shrink-0">
            <LuStore className="text-white text-lg" />
          </div>
          <div>
            <p className="text-white font-bold text-sm leading-tight">Inversiones</p>
            <p className="text-brand-400 font-bold text-sm leading-tight">Urbaneja</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-brand-600/80 text-white shadow-glow'
                  : 'text-gray-400 hover:bg-surface-700 hover:text-white'
              }`
            }>
            <span className="text-lg w-6 flex items-center justify-center">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <ExchangeRateBar />
    </aside>
  )
}

// ── Mobile Bottom Nav ─────────────────────────────────────────────────────────
function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-800/95 backdrop-blur-lg border-t border-white/5">
      <div className="flex items-stretch">
        {NAV_ITEMS.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-all ${
                isActive ? 'text-brand-400' : 'text-gray-500 hover:text-gray-300'
              }`
            }>
            <span className="text-xl">{icon}</span>
            <span>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

// ── Main Layout ───────────────────────────────────────────────────────────────
function Layout() {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-hidden bg-surface-900">
        <Routes>
          <Route path="/"           element={<Dashboard />} />
          <Route path="/pos"        element={<POS />} />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/cuentas"    element={<CuentasPorCobrar />} />
          <Route path="/cierres"    element={<CierreDeCaja />} />
          <Route path="/reportes"   element={<Reportes />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}

// ── Root ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <Layout />
      </HashRouter>
    </AppProvider>
  )
}
