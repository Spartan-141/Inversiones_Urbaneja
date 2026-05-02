import React, { useState } from 'react'
import {
  LuLayoutDashboard, LuShoppingCart, LuPackage,
  LuCreditCard, LuLock, LuChartColumn, LuStore
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

// ── Desktop Sidebar ───────────────────────────────────────────────────────────
function Sidebar() {
  const { config } = useApp()
  return (
    <aside className="hidden md:flex flex-col w-[260px] bg-surface-800/40 backdrop-blur-3xl border-r border-white/5 shrink-0 shadow-2xl z-10 relative">
      {/* Decorative gradient orb behind logo */}
      <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none -z-10"></div>
      
      {/* Logo / Brand */}
      <div className="px-6 py-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shrink-0 shadow-glow">
            <LuStore className="text-white text-xl" />
          </div>
          <div>
            <p className="text-white font-black text-sm uppercase tracking-wider leading-none mb-1">Inversiones</p>
            <p className="text-indigo-400 font-bold text-[11px] uppercase tracking-[0.2em] leading-none">Urbaneja</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 space-y-2 overflow-y-auto mt-4">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] px-4 mb-6">Menu Principal</p>
        {NAV_ITEMS.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) =>
              `group flex items-center gap-4 px-5 py-3.5 rounded-[1.25rem] text-[13px] font-bold transition-all duration-300 relative overflow-hidden ${
                isActive
                  ? 'text-white shadow-lg bg-surface-700/50 shadow-indigo-500/5'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`
            }>
            {({ isActive }) => (
              <>
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-600/10 to-transparent pointer-events-none"></div>
                )}
                <span className={`text-xl w-6 flex items-center justify-center transition-all duration-300 ${isActive ? 'text-indigo-400 scale-110 drop-shadow-[0_0_8px_oklch(65%_0.18_250_/_50%)]' : 'group-hover:scale-110'}`}>
                  {icon}
                </span>
                <span className="relative z-10 tracking-wide uppercase text-[11px] font-black tracking-[0.05em]">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-6 mt-auto">
        <div className="bg-surface-700/50 rounded-2xl p-4 border border-white/5 backdrop-blur-md relative overflow-hidden">
          {/* Subtle glow inside footer */}
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-emerald-500/20 blur-3xl rounded-full"></div>
          
          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-2 relative z-10">Estado del Sistema</p>
          <div className="flex items-center gap-2 relative z-10">
            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-pulse"></div>
            <p className="text-xs font-bold text-emerald-400 tracking-wide">En Línea (VES)</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

// ── Mobile Bottom Nav ─────────────────────────────────────────────────────────
function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface-800/95 backdrop-blur-lg border-t border-white/5 px-2 pb-safe">
      <div className="flex items-stretch h-16">
        {NAV_ITEMS.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-bold transition-all ${
                isActive ? 'text-indigo-400' : 'text-slate-500'
              }`
            }>
            <span className="text-xl">{icon}</span>
            <span className="tracking-tighter">{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

// ── Main Layout ───────────────────────────────────────────────────────────────
function Layout() {
  return (
    <div className="flex h-screen overflow-hidden bg-surface-900 text-slate-200">
      <Sidebar />
      <main className="flex-1 overflow-hidden relative">
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
