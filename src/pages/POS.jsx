import React, { useState, useEffect, useCallback, useRef } from 'react'
import {
  LuBanknote, LuSmartphone, LuLandmark, LuSearch, LuTrash2,
  LuDollarSign, LuShoppingCart, LuCircleCheck, LuClipboardList,
  LuScale, LuStar, LuPlus, LuMinus, LuX, LuPackage
} from 'react-icons/lu'
import { useApp } from '../context/AppContext.jsx'
import { format } from 'date-fns'
import AlertModal from '../components/AlertModal.jsx'

// ── Payment methods ───────────────────────────────────────────────────────────
const METODOS = [
  { key: 'efectivo_usd', label: '$ Efectivo USD',    icon: <LuDollarSign /> },
  { key: 'efectivo_ves', label: 'Bs. Efectivo',       icon: <LuBanknote /> },
  { key: 'pago_movil',   label: 'Bs. Pago Móvil',    icon: <LuSmartphone /> },
  { key: 'transferencia',label: 'Bs. Transferencia', icon: <LuLandmark /> },
]

// ── Category color palette ────────────────────────────────────────────────────
const CAT_COLORS = [
  'from-blue-600/30 to-blue-900/20 border-blue-500/30',
  'from-purple-600/30 to-purple-900/20 border-purple-500/30',
  'from-teal-600/30 to-teal-900/20 border-teal-500/30',
  'from-rose-600/30 to-rose-900/20 border-rose-500/30',
  'from-amber-600/30 to-amber-900/20 border-amber-500/30',
  'from-indigo-600/30 to-indigo-900/20 border-indigo-500/30',
  'from-cyan-600/30 to-cyan-900/20 border-cyan-500/30',
  'from-green-600/30 to-green-900/20 border-green-500/30',
]

// ── Ticket printing ───────────────────────────────────────────────────────────
function printTicket({ venta, detalles, pagos, config, tasa }) {
  const w = window.open('', '_blank', 'width=350,height=700')
  const ancho = config?.impresora_ancho === '58' ? '58mm' : '80mm'
  const total_ves = (venta.total_usd * tasa).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Ticket</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Courier New', monospace; font-size: 11px; width: ${ancho}; padding: 6px; color:#000; }
    h1 { font-size:14px; text-align:center; font-weight:bold; }
    .center { text-align:center; }
    .divider { border-top: 1px dashed #000; margin: 5px 0; }
    .row { display:flex; justify-content:space-between; margin: 2px 0; }
    .bold { font-weight:bold; }
    .total { font-size:14px; font-weight:bold; }
    .small { font-size:10px; }
  </style></head><body>
  <h1>${config?.nombre_tienda || 'Inversiones Urbaneja'}</h1>
  <p class="center small">${config?.direccion_tienda || 'Venezuela'}</p>
  <p class="center small">${config?.telefono_tienda || ''}</p>
  <div class="divider"></div>
  <p>Fecha: ${format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
  <p>N° Venta: #${venta.id}</p>
  ${venta.cliente_nombre ? `<p>Cliente: ${venta.cliente_nombre}</p>` : ''}
  <div class="divider"></div>
  ${detalles.map(d => {
    const cantLabel = d.unidad_medida === 'kg'
      ? `${Number(d.cantidad).toFixed(3)} kg`
      : `${d.cantidad} unid`
    return `<p class="bold">${d.nombre}</p>
    <div class="row"><span>${cantLabel} x $${Number(d.precio_unitario_usd).toFixed(2)}</span><span>$${Number(d.subtotal_usd).toFixed(2)}</span></div>`
  }).join('')}
  <div class="divider"></div>
  ${venta.descuento_otorgado_usd > 0 ? `<div class="row"><span>Descuento:</span><span>-$${Number(venta.descuento_otorgado_usd).toFixed(2)}</span></div>` : ''}
  <div class="row total"><span>TOTAL:</span><span>$${Number(venta.total_usd).toFixed(2)}</span></div>
  <div class="row small"><span></span><span>Bs. ${total_ves}</span></div>
  <div class="divider"></div>
  ${pagos.map(p => `<div class="row small"><span>${METODOS.find(m => m.key === p.metodo)?.label || p.metodo}:</span><span>$${Number(p.monto_usd).toFixed(2)}</span></div>`).join('')}
  <div class="divider"></div>
  <p class="center small">${config?.ticket_pie || '¡Gracias por su compra!'}</p>
  <p class="center small">Tasa: Bs. ${Number(tasa).toFixed(2)}/$</p>
  </body></html>`)
  w.document.close()
  setTimeout(() => { w.print(); w.close() }, 400)
}

// ── Peso Modal (for kg products) ──────────────────────────────────────────────
function PesoModal({ producto, onClose, onAdd }) {
  const { fmt } = useApp()
  const [peso, setPeso] = useState('')
  const inputRef = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const pesoNum   = parseFloat(peso) || 0
  const subtotal  = pesoNum * producto.precio_venta_usd
  const valid     = pesoNum > 0 && pesoNum <= (producto.stock_actual + 0.001)

  const handleAdd = () => {
    if (!valid) return
    onAdd({ peso: pesoNum, subtotal })
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal max-w-sm">
        <div className="flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <LuScale className="text-orange-400 text-xl" />
            <h2 className="text-lg font-bold">{producto.nombre}</h2>
          </div>
          <button onClick={onClose} className="btn-ghost btn-sm"><LuX /></button>
        </div>

        <div className="bg-orange-900/20 border border-orange-500/30 rounded-xl p-3 mb-4 text-sm text-orange-300">
          Stock disponible: <strong>{Number(producto.stock_actual).toFixed(3)} kg</strong>
          &nbsp;· Precio: <strong>${Number(producto.precio_venta_usd).toFixed(2)}/kg</strong>
        </div>

        <label className="label">Peso (kg)</label>
        <input ref={inputRef} className="input text-2xl font-mono text-center mb-1"
          type="number" min="0.001" step="0.001" max={producto.stock_actual}
          placeholder="0.000"
          value={peso} onChange={e => setPeso(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleAdd()} />
        <p className="text-xs text-gray-500 mb-4 text-center">Ej: 0.350 = 350 gramos · 1.5 = kilo y medio</p>

        {pesoNum > 0 && (
          <div className="bg-surface-700 rounded-xl p-3 mb-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Subtotal:</span>
              <span className="font-bold text-white">${subtotal.toFixed(2)}</span>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
          <button onClick={handleAdd} disabled={!valid} className="btn-primary flex-1">
            <LuPlus /> Agregar
          </button>
        </div>
        {pesoNum > producto.stock_actual + 0.001 && (
          <p className="text-red-400 text-xs text-center mt-2">⚠️ Stock insuficiente</p>
        )}
      </div>
    </div>
  )
}

// ── Payment Modal ─────────────────────────────────────────────────────────────
function PagoModal({ totalFinal, exactTotalVes, tasa, config, onClose, onConfirm }) {
  const [pagos, setPagos]             = useState({ efectivo_usd: '', efectivo_ves: '', pago_movil: '', transferencia: '' })
  const [clienteNombre, setCliente]   = useState('')
  const [saving, setSaving]           = useState(false)

  const totalPagadoUsd = Object.entries(pagos).reduce((acc, [key, val]) => {
    const num = parseFloat(val) || 0
    if (key === 'efectivo_usd') return acc + num
    return acc + (num / tasa)
  }, 0)

  const totalPagadoVes = Object.entries(pagos).reduce((acc, [key, val]) => {
    const num = parseFloat(val) || 0
    if (key === 'efectivo_usd') return acc + (num * tasa)
    return acc + num
  }, 0)

  const faltaUsd  = Math.max(0, totalFinal - totalPagadoUsd)
  const faltaVes  = Math.max(0, exactTotalVes - totalPagadoVes)
  const vueltoUsd = totalPagadoUsd > totalFinal ? totalPagadoUsd - totalFinal : 0
  const vueltoVes = totalPagadoVes > exactTotalVes ? totalPagadoVes - exactTotalVes : 0
  const esCredito = faltaUsd > 0.005

  const confirm = async () => {
    if (esCredito && !clienteNombre.trim()) { alert('Se requiere nombre del cliente para ventas a crédito'); return }
    setSaving(true)
    try {
      const pagosArr = Object.entries(pagos)
        .filter(([_, v]) => parseFloat(v) > 0)
        .map(([key, val]) => {
          const num   = parseFloat(val) || 0
          const isVes = key !== 'efectivo_usd'
          return { metodo: key, monto_usd: isVes ? num / tasa : num, monto_ves: isVes ? num : num * tasa }
        })
      await onConfirm({ pagosArr, clienteNombre, esCredito, falta: faltaUsd })
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-lg">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold">💳 Registrar Pago</h2>
          <button onClick={onClose} className="btn-ghost btn-sm text-xl"><LuX /></button>
        </div>

        {/* Total to charge */}
        <div className="bg-brand-900/30 border border-brand-500/30 rounded-xl p-4 mb-5 text-center">
          <p className="text-gray-400 text-sm">Total a cobrar</p>
          <p className="text-4xl font-bold text-white">${Number(totalFinal).toFixed(2)}</p>
          <p className="text-sm text-gray-400 mt-1">
            Bs. {exactTotalVes.toLocaleString('es-VE', { maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* Payment method inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          {METODOS.map(m => (
            <div key={m.key}>
              <label className="label flex items-center gap-1">{m.icon} {m.label}</label>
              <input className="input" type="number" min="0" step="0.01" placeholder="0.00"
                value={pagos[m.key]} onChange={e => setPagos(p => ({ ...p, [m.key]: e.target.value }))} />
            </div>
          ))}
        </div>

        {/* Payment summary */}
        <div className="bg-surface-700 rounded-xl p-4 space-y-2 text-sm mb-4">
          <div className="flex justify-between">
            <span className="text-gray-400">Total pagado:</span>
            <span className="text-white font-semibold">
              ${totalPagadoUsd.toFixed(2)} / Bs.{totalPagadoVes.toLocaleString('es-VE', { maximumFractionDigits: 2 })}
            </span>
          </div>
          {faltaUsd > 0.005 && (
            <div className="flex justify-between">
              <span className="text-red-400">Falta por pagar:</span>
              <span className="text-red-400 font-bold">
                ${faltaUsd.toFixed(2)} / Bs.{faltaVes.toLocaleString('es-VE', { maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
          {vueltoUsd > 0.005 && (
            <div className="flex justify-between">
              <span className="text-accent-green">Vuelto:</span>
              <span className="text-accent-green font-bold">
                ${vueltoUsd.toFixed(2)} / Bs.{vueltoVes.toLocaleString('es-VE', { maximumFractionDigits: 2 })}
              </span>
            </div>
          )}
        </div>

        {/* Credit: require customer name */}
        {esCredito && (
          <div className="mb-4 p-3 bg-accent-yellow/10 border border-accent-yellow/30 rounded-xl">
            <p className="text-accent-yellow text-sm mb-2">
              ⚠️ Esta venta quedará como <strong>crédito</strong>. Se requiere nombre del cliente.
            </p>
            <input className="input" placeholder="Nombre del cliente *"
              value={clienteNombre} onChange={e => setCliente(e.target.value)} />
          </div>
        )}

        <div className="flex gap-3 justify-end flex-wrap">
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={confirm}
            disabled={saving || (totalPagadoUsd < 0.005 && !esCredito)}
            className="btn-success btn-lg">
            {saving ? '⏳ Guardando...' : esCredito ? '📋 Guardar como Crédito' : '✅ Confirmar Venta'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── POS Main ──────────────────────────────────────────────────────────────────
export default function POS() {
  const { fmt, fmtVes, tasa, config } = useApp()
  const [query, setQuery]       = useState('')
  const [results, setResults]   = useState([])
  const [showDrop, setShowDrop] = useState(false)
  const [favoritos, setFavoritos] = useState([])
  const [cart, setCart]         = useState([])
  const [descuento, setDescuento] = useState('')
  const [modal, setModal]       = useState(null)   // 'peso' | 'pago' | 'ticket'
  const [pendingKg, setPendingKg] = useState(null)  // product awaiting kg input
  const [lastVenta, setLastVenta] = useState(null)
  const [alertMsg, setAlertMsg] = useState('')
  const searchRef = useRef(null)

  // Load favorites on mount
  useEffect(() => {
    window.api.invoke('productos:favoritos').then(setFavoritos).catch(console.error)
  }, [])

  // Real-time search (debounced)
  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const t = setTimeout(async () => {
      const prods = await window.api.invoke('productos:search', query)
      setResults(prods)
      setShowDrop(true)
    }, 180)
    return () => clearTimeout(t)
  }, [query])

  // ── Cart helpers ─────────────────────────────────────────────────────────────
  const addProductUnit = useCallback((item) => {
    setCart(prev => {
      const exists = prev.find(c => c.ref_id === item.id)
      if (exists) {
        if (exists.cantidad >= item.stock_actual) {
          setAlertMsg(`Solo quedan ${item.stock_actual} en stock de "${item.nombre}"`)
          return prev
        }
        return prev.map(c => c.ref_id === item.id
          ? { ...c, cantidad: c.cantidad + 1, subtotal_usd: (c.cantidad + 1) * c.precio_unitario_usd }
          : c)
      }
      if (item.stock_actual < 1) {
        setAlertMsg(`Sin stock disponible de "${item.nombre}"`)
        return prev
      }
      return [...prev, {
        tipo: 'producto', ref_id: item.id, nombre: item.nombre,
        unidad_medida: 'unidad', cantidad: 1,
        precio_unitario_usd: item.precio_venta_usd,
        subtotal_usd: item.precio_venta_usd,
        stock_actual: item.stock_actual,
      }]
    })
  }, [])

  const addProductKg = useCallback((item, peso, subtotal) => {
    // kg products always add a fresh line (no quantity merge)
    if (peso <= 0 || peso > item.stock_actual + 0.001) {
      setAlertMsg(`Stock insuficiente para "${item.nombre}"`)
      return
    }
    setCart(prev => [...prev, {
      tipo: 'producto', ref_id: item.id, nombre: item.nombre,
      unidad_medida: 'kg', cantidad: peso,
      precio_unitario_usd: item.precio_venta_usd,
      subtotal_usd: subtotal,
      stock_actual: item.stock_actual,
    }])
  }, [])

  const selectProduct = useCallback((item) => {
    setQuery(''); setResults([]); setShowDrop(false)
    if (item.unidad_medida === 'kg') {
      setPendingKg(item); setModal('peso')
    } else {
      addProductUnit(item)
    }
  }, [addProductUnit])

  const updateQty = (idx, qty) => {
    if (qty < 0.001) { removeItem(idx); return }
    setCart(prev => {
      const item = prev[idx]
      if (item.unidad_medida === 'unidad') {
        const safeQty = Math.min(Math.floor(qty), item.stock_actual)
        return prev.map((c, i) => i === idx
          ? { ...c, cantidad: safeQty, subtotal_usd: safeQty * c.precio_unitario_usd }
          : c)
      }
      // kg: free float
      return prev.map((c, i) => i === idx
        ? { ...c, cantidad: qty, subtotal_usd: qty * c.precio_unitario_usd }
        : c)
    })
  }

  const removeItem = (idx) => setCart(prev => prev.filter((_, i) => i !== idx))
  const clearCart  = () => { setCart([]); setDescuento(''); setLastVenta(null) }

  // ── Totals ───────────────────────────────────────────────────────────────────
  const subtotal_usd  = cart.reduce((s, c) => s + c.subtotal_usd, 0)
  const descValUsd    = parseFloat(descuento) || 0
  const totalFinalUsd = Math.max(0, subtotal_usd - descValUsd)
  const totalFinalVes = totalFinalUsd * tasa

  // ── Confirm sale ─────────────────────────────────────────────────────────────
  const confirmarVenta = async ({ pagosArr, clienteNombre, esCredito, falta }) => {
    const cabecera = {
      subtotal_usd, descuento_otorgado_usd: descValUsd, total_usd: totalFinalUsd,
      tasa_cambio: tasa, estado: esCredito ? 'credito' : 'pagada',
      cliente_nombre: clienteNombre || '', saldo_pendiente_usd: esCredito ? falta : 0,
    }
    const result = await window.api.invoke('ventas:create', { cabecera, detalles: cart, pagos: pagosArr })
    setLastVenta({ venta: { ...cabecera, id: result.id }, detalles: cart, pagos: pagosArr })
    setModal(null)
    clearCart()
    setModal('ticket')
    // Refresh favorites stock
    window.api.invoke('productos:favoritos').then(setFavoritos)
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Favorites Panel ─────────────────────────────────────────────── */}
      {favoritos.length > 0 && (
        <div className="border-b border-white/5 bg-surface-800/50 px-3 py-2.5">
          <div className="flex items-center gap-2 mb-2">
            <LuStar className="text-amber-400 text-sm" />
            <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">Acceso Rápido</span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {favoritos.map((p, i) => {
              const outOfStock = p.stock_actual <= 0
              const colorClass = CAT_COLORS[i % CAT_COLORS.length]
              return (
                <button
                  key={p.id}
                  disabled={outOfStock}
                  onClick={() => selectProduct(p)}
                  title={`${p.nombre} — $${Number(p.precio_venta_usd).toFixed(2)}${p.unidad_medida === 'kg' ? '/kg' : ''}`}
                  className={`flex-shrink-0 flex flex-col items-center justify-center gap-1 p-2 rounded-xl border bg-gradient-to-br ${colorClass}
                    text-white text-xs font-medium text-center min-w-[80px] max-w-[100px]
                    transition-all duration-150 active:scale-95 cursor-pointer
                    ${outOfStock ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105'}`}>
                  <span className="text-base">{p.unidad_medida === 'kg' ? '⚖️' : '📦'}</span>
                  <span className="leading-tight line-clamp-2 text-center">{p.nombre}</span>
                  <span className="text-[10px] opacity-70">${Number(p.precio_venta_usd).toFixed(2)}{p.unidad_medida === 'kg' ? '/kg' : ''}</span>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* ── Main area: Search + Cart + Totals ───────────────────────────── */}
      <div className="flex flex-1 overflow-hidden min-h-0">

        {/* Left: Search + Cart */}
        <div className="flex-1 flex flex-col p-3 sm:p-4 gap-3 overflow-hidden min-h-0">

          {/* Header + search */}
          <div className="flex items-center gap-3">
            <h1 className="page-title whitespace-nowrap flex items-center gap-2">
              <LuShoppingCart className="text-brand-400" /> Punto de Venta
            </h1>
            <div className="ml-auto text-xs text-gray-500 bg-surface-700 border border-white/5 rounded-lg px-3 py-1.5">
              Tasa: <span className="font-mono text-brand-400 font-bold">Bs. {Number(tasa).toFixed(2)}</span>
            </div>
          </div>

          {/* Search input with live dropdown */}
          <div className="relative">
            <div className="absolute left-3 top-2.5 text-gray-500 pointer-events-none">
              <LuSearch />
            </div>
            <input ref={searchRef}
              className="input pl-9 text-base"
              placeholder="🔍 Buscar por nombre o código de barras..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => results.length && setShowDrop(true)}
              onBlur={() => setTimeout(() => setShowDrop(false), 200)}
              onKeyDown={e => {
                if (e.key === 'Enter' && results.length === 1) selectProduct(results[0])
                if (e.key === 'Escape') { setQuery(''); setResults([]) }
              }}
            />
            {query && (
              <button className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
                onClick={() => { setQuery(''); setResults([]) }}>
                <LuX />
              </button>
            )}

            {/* Dropdown results */}
            {showDrop && results.length > 0 && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-surface-700 border border-white/10 rounded-xl shadow-2xl z-30 max-h-64 overflow-y-auto animate-slide-in">
                {results.map((r, i) => (
                  <button key={i} onMouseDown={() => selectProduct(r)}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-surface-600 text-left border-b border-white/5 last:border-0 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{r.unidad_medida === 'kg' ? '⚖️' : '📦'}</span>
                      <div>
                        <p className="text-white text-sm font-medium">{r.nombre}</p>
                        {r.codigo && <p className="text-gray-500 text-xs font-mono">{r.codigo}</p>}
                        <p className="text-gray-500 text-xs">Stock: {Number(r.stock_actual).toFixed(r.unidad_medida === 'kg' ? 3 : 0)} {r.unidad_medida}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold text-sm">${Number(r.precio_venta_usd).toFixed(2)}{r.unidad_medida === 'kg' ? '/kg' : ''}</p>
                      {r.stock_actual <= 0 && <p className="text-red-400 text-xs">Sin stock</p>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cart table */}
          <div className="flex-1 overflow-y-auto card min-h-0">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-gray-600 gap-3 py-10">
                <LuShoppingCart className="text-5xl opacity-20" />
                <p className="text-sm">El carrito está vacío</p>
                <p className="text-xs text-gray-500">Busca un producto o usa el acceso rápido</p>
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th className="text-center w-28">Cant.</th>
                    <th className="text-right hidden sm:table-cell">P. Unit</th>
                    <th className="text-right">Subtotal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item, i) => (
                    <tr key={i}>
                      <td>
                        <p className="font-medium text-white text-xs sm:text-sm">{item.nombre}</p>
                        <p className="text-xs text-gray-500">
                          {item.unidad_medida === 'kg'
                            ? <span className="text-orange-400">⚖️ {Number(item.cantidad).toFixed(3)} kg</span>
                            : <span className="text-brand-400">📦 {item.cantidad} unid</span>
                          }
                        </p>
                      </td>
                      <td className="text-center">
                        {item.unidad_medida === 'kg' ? (
                          <input type="number" min="0.001" step="0.001"
                            value={Number(item.cantidad).toFixed(3)}
                            onChange={e => updateQty(i, parseFloat(e.target.value) || 0)}
                            className="input-sm w-20 text-center" />
                        ) : (
                          <div className="flex items-center justify-center gap-0.5">
                            <button onClick={() => updateQty(i, item.cantidad - 1)} className="btn-ghost btn-sm w-6 h-6 p-0"><LuMinus className="text-xs" /></button>
                            <input type="number" min="1" value={item.cantidad}
                              onChange={e => updateQty(i, parseInt(e.target.value) || 1)}
                              className="input-sm w-10 text-center" />
                            <button onClick={() => updateQty(i, item.cantidad + 1)} className="btn-ghost btn-sm w-6 h-6 p-0"><LuPlus className="text-xs" /></button>
                          </div>
                        )}
                      </td>
                      <td className="text-right text-gray-400 hidden sm:table-cell">
                        ${Number(item.precio_unitario_usd).toFixed(2)}{item.unidad_medida === 'kg' ? '/kg' : ''}
                      </td>
                      <td className="text-right font-semibold text-white">${Number(item.subtotal_usd).toFixed(2)}</td>
                      <td>
                        <button onClick={() => removeItem(i)} className="btn-ghost btn-sm text-red-400 hover:text-red-300">
                          <LuX className="text-sm" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Right: Totals Panel */}
        <div className="w-72 bg-surface-800 border-l border-white/5 flex flex-col p-4 gap-4 shrink-0">
          <h2 className="font-bold text-lg text-white">Resumen</h2>

          <div className="flex-1 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Subtotal:</span>
              <span className="text-white">${subtotal_usd.toFixed(2)}</span>
            </div>

            <div>
              <label className="label">Descuento (USD)</label>
              <input className="input" type="number" min="0" step="0.01" placeholder="0.00"
                value={descuento}
                onChange={e => { const v = e.target.value; if ((parseFloat(v) || 0) <= subtotal_usd) setDescuento(v) }} />
            </div>

            <div className="border-t border-white/10 pt-3">
              <div className="flex justify-between items-baseline">
                <span className="text-gray-300 font-medium">Total Final:</span>
                <span className="text-2xl font-bold text-white">${totalFinalUsd.toFixed(2)}</span>
              </div>
              <p className="text-right text-xs text-gray-500 mt-1">
                Bs. {totalFinalVes.toLocaleString('es-VE', { maximumFractionDigits: 2 })}
              </p>
            </div>

            {/* Cart item count */}
            {cart.length > 0 && (
              <p className="text-xs text-gray-500 text-center">
                {cart.length} {cart.length === 1 ? 'artículo' : 'artículos'} en el carrito
              </p>
            )}
          </div>

          <div className="space-y-2">
            <button onClick={() => cart.length && setModal('pago')} disabled={cart.length === 0}
              className="btn-success btn-lg w-full">
              💳 COBRAR {cart.length > 0 ? `$${totalFinalUsd.toFixed(2)}` : ''}
            </button>
            <button onClick={clearCart} disabled={cart.length === 0} className="btn-ghost w-full text-sm">
              <LuTrash2 /> Limpiar carrito
            </button>
          </div>
        </div>
      </div>

      {/* ── Modals ──────────────────────────────────────────────────────── */}

      {/* Peso modal for kg products */}
      {modal === 'peso' && pendingKg && (
        <PesoModal
          producto={pendingKg}
          onClose={() => { setModal(null); setPendingKg(null) }}
          onAdd={({ peso, subtotal }) => {
            addProductKg(pendingKg, peso, subtotal)
            setModal(null); setPendingKg(null)
          }} />
      )}

      {/* Payment modal */}
      {modal === 'pago' && (
        <PagoModal totalFinal={totalFinalUsd} exactTotalVes={totalFinalVes} tasa={tasa} config={config}
          onClose={() => setModal(null)} onConfirm={confirmarVenta} />
      )}

      {/* Sale success / ticket modal */}
      {modal === 'ticket' && lastVenta && (
        <div className="modal-backdrop">
          <div className="modal max-w-sm text-center">
            <LuCircleCheck className="text-6xl text-accent-green mb-4 mx-auto" />
            <h2 className="text-xl font-bold text-white mb-1">¡Venta Registrada!</h2>
            <p className="text-gray-400 text-sm mb-2">
              Venta #{lastVenta.venta.id} ·{' '}
              {lastVenta.venta.estado === 'credito'
                ? <><LuClipboardList className="inline text-accent-yellow" /> A crédito — {lastVenta.venta.cliente_nombre}</>
                : 'Pagada'}
            </p>
            <p className="text-lg font-bold text-brand-400 mb-6">{fmt(lastVenta.venta.total_usd)} · {fmtVes(lastVenta.venta.total_usd)}</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <button onClick={() => setModal(null)} className="btn-secondary">Cerrar</button>
              <button onClick={() => printTicket({ ...lastVenta, config, tasa })} className="btn-primary">
                🖨️ Imprimir Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Alert modal */}
      {alertMsg && <AlertModal title="Aviso" message={alertMsg} onClose={() => setAlertMsg('')} />}
    </div>
  )
}
