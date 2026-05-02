import React, { useState } from 'react'
import {
  LuLayoutDashboard, LuShoppingCart, LuPackage,
  LuCreditCard, LuChartColumn, LuStore
} from 'react-icons/lu'
import { HashRouter, Routes, Route, NavLink } from 'react-router-dom'
import { AppProvider, useApp } from './context/AppContext.jsx'
import Dashboard         from './pages/Dashboard.jsx'
import POS               from './pages/POS.jsx'
import Inventario        from './pages/Inventario.jsx'
import CuentasPorCobrar  from './pages/CuentasPorCobrar.jsx'
import Reportes          from './pages/Reportes.jsx'

const NAV_ITEMS = [
  { to: '/',          icon: <LuLayoutDashboard />, label: 'Dashboard' },
  { to: '/pos',       icon: <LuShoppingCart />,    label: 'Ventas' },
  { to: '/inventario',icon: <LuPackage />,         label: 'Inventario' },
  { to: '/cuentas',   icon: <LuCreditCard />,      label: 'Cobrar' },
  { to: '/reportes',  icon: <LuChartColumn />,     label: 'Reportes' },
]

// ── Desktop Sidebar ───────────────────────────────────────────────────────────
function Sidebar() {
  return (
    <aside
      className="hidden md:flex flex-col shrink-0 z-10"
      style={{
        width: '240px',
        margin: '16px 0 16px 16px',
        borderRadius: '24px',
        background: '#ffffff',
        boxShadow: '0 8px 32px -4px rgba(0,0,0,0.08), 0 1px 4px rgba(0,0,0,0.04)',
        border: '1px solid rgba(0,0,0,0.06)',
      }}
    >
      {/* Logo / Brand */}
      <div style={{ padding: '28px 20px 16px' }}>
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center shrink-0"
            style={{
              width: '40px', height: '40px',
              borderRadius: '12px',
              background: '#111827',
            }}
          >
            <LuStore className="text-white" size={20} />
          </div>
          <div>
            <p style={{ color: '#111827', fontWeight: 900, fontSize: '13px', letterSpacing: '0.05em', lineHeight: 1.1, textTransform: 'uppercase' }}>
              Inversiones
            </p>
            <p style={{ color: '#6b7280', fontWeight: 700, fontSize: '10px', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              Urbaneja
            </p>
          </div>
        </div>
      </div>

      {/* Section label */}
      <p style={{ color: '#d1d5db', fontSize: '10px', fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', padding: '8px 24px', marginBottom: '4px' }}>
        Menú
      </p>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '0 12px', overflowY: 'auto' }}>
        {NAV_ITEMS.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 14px',
              borderRadius: '14px',
              marginBottom: '4px',
              fontSize: '12px',
              fontWeight: 800,
              textDecoration: 'none',
              letterSpacing: '0.04em',
              transition: 'all 0.2s ease',
              background: isActive ? '#d9f99d' : 'transparent',
              color: isActive ? '#1a2e05' : '#6b7280',
            })}
          >
            {({ isActive }) => (
              <>
                <span style={{ fontSize: '18px', display: 'flex', alignItems: 'center', color: isActive ? '#3f6212' : '#9ca3af' }}>
                  {icon}
                </span>
                <span style={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div style={{ padding: '16px 20px 24px' }}>
        <div style={{
          background: '#f9fafb',
          borderRadius: '14px',
          padding: '12px 16px',
          border: '1px solid rgba(0,0,0,0.06)',
        }}>
          <p style={{ color: '#9ca3af', fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '6px' }}>Estado</p>
          <div className="flex items-center gap-2">
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: '#10b981',
              boxShadow: '0 0 8px rgba(16,185,129,0.6)',
              animation: 'pulse 2s infinite',
            }} />
            <p style={{ fontSize: '11px', fontWeight: 700, color: '#059669' }}>En Línea (VES)</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

// ── Mobile Bottom Nav ─────────────────────────────────────────────────────────
function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 pb-safe"
      style={{ background: '#ffffff', borderTop: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 -4px 20px rgba(0,0,0,0.06)' }}
    >
      <div className="flex items-stretch h-16">
        {NAV_ITEMS.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} end={to === '/'}
            style={({ isActive }) => ({
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '3px',
              fontSize: '10px', fontWeight: 700, textDecoration: 'none',
              color: isActive ? '#3f6212' : '#9ca3af',
              background: isActive ? 'rgba(163,230,53,0.1)' : 'transparent',
              transition: 'all 0.2s',
            })}
          >
            <span style={{ fontSize: '20px' }}>{icon}</span>
            <span style={{ letterSpacing: '0.03em', textTransform: 'uppercase' }}>{label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}

// ── Main Layout ───────────────────────────────────────────────────────────────
function Layout() {
  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #dde1ea 0%, #d0d5e0 100%)' }}
    >
      <Sidebar />
      {/* Main content area — white rounded card */}
      <main
        className="flex-1 overflow-hidden relative"
        style={{
          margin: '16px 16px 16px 12px',
          borderRadius: '24px',
          background: '#f0f1f5',
          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <Routes>
          <Route path="/"           element={<Dashboard />} />
          <Route path="/pos"        element={<POS />} />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/cuentas"    element={<CuentasPorCobrar />} />
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

