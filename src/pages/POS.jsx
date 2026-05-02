import React, { useState, useEffect, useCallback, useRef } from 'react'
import { LuBanknote, LuSmartphone, LuLandmark, LuSearch, LuTrash2, LuPlus, LuMinus, LuShoppingCart, LuCircleCheck, LuClipboardList, LuPackage } from 'react-icons/lu'
import { useApp } from '../context/AppContext.jsx'
import { format } from 'date-fns'
import AlertModal from '../components/AlertModal.jsx'

const METODOS = [
  { key: 'efectivo',      label: 'Efectivo',       icon: <LuBanknote /> },
  { key: 'pago_movil',    label: 'Pago Móvil',     icon: <LuSmartphone /> },
  { key: 'transferencia', label: 'Transferencia',  icon: <LuLandmark /> },
]

// ── Ticket printing ───────────────────────────────────────────────────────────
function printTicket({ venta, detalles, pagos, config }) {
  const w = window.open('', '_blank', 'width=350,height=600')
  const ancho = config?.impresora_ancho === '58' ? '58mm' : '80mm'
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
  ${detalles.map(d=>`
    <p class="bold">${d.nombre}</p>
    <div class="row"><span>${d.cantidad} ${d.unidad_medida} x Bs.${Number(d.precio_unitario).toLocaleString('es-VE',{minimumFractionDigits:2})}</span><span>Bs.${Number(d.subtotal).toLocaleString('es-VE',{minimumFractionDigits:2})}</span></div>
  `).join('')}
  <div class="divider"></div>
  ${venta.descuento_otorgado > 0 ? `<div class="row"><span>Descuento:</span><span>-Bs.${Number(venta.descuento_otorgado).toLocaleString('es-VE',{minimumFractionDigits:2})}</span></div>` : ''}
  <div class="row total"><span>TOTAL:</span><span>Bs.${Number(venta.total).toLocaleString('es-VE',{minimumFractionDigits:2})}</span></div>
  <div class="divider"></div>
  ${pagos.map(p=>`<div class="row small"><span>${METODOS.find(m=>m.key===p.metodo)?.label||p.metodo}:</span><span>Bs.${Number(p.monto).toLocaleString('es-VE',{minimumFractionDigits:2})}</span></div>`).join('')}
  <div class="divider"></div>
  <p class="center small">${config?.ticket_pie || '¡Gracias por su compra!'}</p>
  </body></html>`)
  w.document.close()
  setTimeout(() => { w.print(); w.close() }, 400)
}

// ── Payment Modal ─────────────────────────────────────────────────────────────
function PagoModal({ totalFinal, onClose, onConfirm, onError, fmt }) {
  const [pagos, setPagos] = useState({ efectivo: '', pago_movil: '', transferencia: '' })
  const [clienteNombre, setClienteNombre] = useState('')
  const [saving, setSaving] = useState(false)

  const totalPagado = Object.values(pagos).reduce((acc, val) => acc + (parseFloat(val) || 0), 0)
  const falta = Math.max(0, totalFinal - totalPagado)
  const vuelto = totalPagado > totalFinal ? totalPagado - totalFinal : 0
  const esCredito = falta > 0.05

  const confirm = async () => {
    if (esCredito && !clienteNombre.trim()) { onError('Se requiere el nombre del cliente cuando la venta es a crédito.'); return; }
    setSaving(true)
    try {
      const pagosArr = Object.entries(pagos)
        .filter(([_, v]) => parseFloat(v) > 0)
        .map(([key, val]) => ({ metodo: key, monto: parseFloat(val) || 0 }))
      await onConfirm({ pagosArr, clienteNombre, esCredito, falta: esCredito ? falta : 0 })
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal-lg">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-xl font-bold">💳 Registrar Pago</h2>
          <button onClick={onClose} className="btn-ghost btn-sm text-xl">✕</button>
        </div>

        <div className="bg-surface-900 border border-border-strong rounded-[2rem] p-8 mb-8 text-center shadow-inner">
          <p className="text-[11px] uppercase tracking-[0.2em] font-black mb-3" style={{ color: 'var(--fg-muted)' }}>Total a cobrar</p>
          <p className="text-5xl font-black text-indigo-400 tracking-tighter">{fmt(totalFinal)}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {METODOS.map(m => (
            <div key={m.key}>
              <label className="label">{m.icon} {m.label}</label>
              <input className="input h-12 text-lg font-bold" type="number" min="0" step="0.01" placeholder="0,00"
                value={pagos[m.key]} onChange={e => setPagos(p => ({ ...p, [m.key]: e.target.value }))} />
            </div>
          ))}
        </div>

        <div className="rounded-xl p-4 space-y-3 text-sm mb-6" style={{ backgroundColor: 'var(--surface-700)' }}>
          <div className="flex justify-between"><span style={{ color: 'var(--fg-muted)' }}>Total pagado:</span><span className="font-bold">{fmt(totalPagado)}</span></div>
          {esCredito && <div className="flex justify-between"><span className="text-red-400 font-semibold">Falta por pagar:</span><span className="text-red-400 font-bold">{fmt(falta)}</span></div>}
          {vuelto > 0.05 && <div className="flex justify-between"><span className="text-emerald-400 font-semibold">Vuelto:</span><span className="text-emerald-400 font-bold">{fmt(vuelto)}</span></div>}
        </div>

        <div className={`mb-6 p-4 rounded-xl border ${esCredito ? 'bg-amber-500/10 border-amber-500/30' : 'border-white/5'}`}
          style={!esCredito ? { backgroundColor: 'var(--surface-700)' } : {}}>
          {esCredito && <p className="text-amber-500 text-xs font-bold uppercase mb-2">⚠️ Venta a Crédito — Se requiere nombre</p>}
          <input
            className="input"
            placeholder={esCredito ? "Nombre del cliente *" : "Nombre del cliente (Opcional)"}
            value={clienteNombre}
            onChange={e => setClienteNombre(e.target.value)}
          />
        </div>

        <div className="flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary btn-lg">Cancelar</button>
          <button onClick={confirm} disabled={saving || (totalPagado < 0.05 && !esCredito)}
            className="btn-success btn-lg px-10">
            {saving ? '⏳ Guardando...' : esCredito ? '📋 Guardar Crédito' : '✅ Confirmar Venta'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ── POS Main ──────────────────────────────────────────────────────────────────
export default function POS() {
  const { fmt, config } = useApp()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [cart, setCart] = useState([])
  const [descuento, setDescuento] = useState('')
  const [tipoDescuento, setTipoDescuento] = useState('ves') // 'ves', 'perc'
  const [modal, setModal] = useState(null)
  const [lastVenta, setLastVenta] = useState(null)
  const [showSearch, setShowSearch] = useState(false)
  const [alertMsg, setAlertMsg] = useState('')
  const [summaryOpen, setSummaryOpen] = useState(false)
  const searchRef = useRef(null)

  // Real-time search
  useEffect(() => {
    if (!query.trim()) { setResults([]); return }
    const timer = setTimeout(async () => {
      const prods = await window.api.invoke('productos:search', query)
      setResults(prods)
      setShowSearch(true)
    }, 200)
    return () => clearTimeout(timer)
  }, [query])

  const addToCart = (item) => {
    setCart(prev => {
      const exists = prev.find(c => c.ref_id === item.id)
      if (exists) {
        if (item.unidad_medida === 'unidad') {
          if (exists.cantidad >= item.stock_actual) {
            setAlertMsg(`Stock insuficiente: ${item.stock_actual} en existencia.`)
            return prev
          }
          return prev.map(c => c.ref_id === item.id
            ? { ...c, cantidad: c.cantidad + 1, subtotal: (c.cantidad + 1) * c.precio_unitario }
            : c)
        }
        return prev // For kg, we might want a different logic or just ignore repeat click
      }
      
      if (item.stock_actual <= 0) {
        setAlertMsg(`Sin existencia de ${item.nombre}`)
        return prev
      }

      const precio = item.precio_venta || 0
      return [...prev, {
        tipo: 'producto',
        ref_id: item.id,
        nombre: item.nombre,
        cantidad: 1,
        unidad_medida: item.unidad_medida || 'unidad',
        precio_unitario: precio,
        subtotal: precio,
        stock_actual: item.stock_actual
      }]
    })
    setQuery(''); setResults([]); setShowSearch(false)
  }

  const updateQty = (idx, qty) => {
    const q = parseFloat(qty) || 0
    if (q <= 0) { removeItem(idx); return }
    setCart(prev => {
      const item = prev[idx]
      if (item.unidad_medida === 'unidad' && q > item.stock_actual) {
        setAlertMsg(`Stock insuficiente: ${item.stock_actual} en existencia.`)
        return prev.map((c, i) => i===idx ? { ...c, cantidad: item.stock_actual, subtotal: item.stock_actual * c.precio_unitario } : c)
      }
      return prev.map((c, i) => i===idx ? { ...c, cantidad: q, subtotal: q * c.precio_unitario } : c)
    })
  }

  const removeItem = (idx) => setCart(prev => prev.filter((_, i) => i!==idx))
  const clearCart = (keepVenta = false) => { setCart([]); setDescuento(''); if (!keepVenta) setLastVenta(null) }

  const subtotal = cart.reduce((s, c) => s + c.subtotal, 0)
  const valorInput = parseFloat(descuento) || 0
  let descVal = tipoDescuento === 'ves' ? valorInput : (subtotal * valorInput) / 100
  if (isNaN(descVal) || descVal < 0) descVal = 0
  if (descVal > subtotal) descVal = subtotal
  const totalFinal = Math.max(0, subtotal - descVal)

  const confirmarVenta = async ({ pagosArr, clienteNombre, esCredito, falta }) => {
    const cabecera = {
      subtotal,
      descuento_otorgado: descVal,
      total: totalFinal,
      estado: esCredito ? 'credito' : 'pagada',
      cliente_nombre: clienteNombre || '',
      saldo_pendiente: esCredito ? falta : 0,
      notas: '',
    }
    const result = await window.api.invoke('ventas:create', { cabecera, detalles: cart, pagos: pagosArr })
    const ventaConId = { ...cabecera, id: result.id }
    setLastVenta({ venta: ventaConId, detalles: cart, pagos: pagosArr })
    clearCart(true)
    setModal('ticket')
  }

  return (
    <div className="flex flex-col md:flex-row h-full overflow-hidden bg-surface-900 relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Left: Cart Area */}
      <div className="flex-1 flex flex-col p-4 sm:p-8 gap-6 overflow-hidden min-h-0 z-10">
        <div className="flex items-center justify-between">
          <h1 className="page-title text-white flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-400">
              <LuShoppingCart size={22} />
            </div>
            Punto de Venta
          </h1>
        </div>

        {/* Big Search Bar */}
        <div className="relative group z-20">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500"></div>
          <div className="relative bg-surface-800/80 backdrop-blur-md rounded-2xl border border-white/10 flex items-center shadow-lg transition-all group-focus-within:border-indigo-500/50 group-focus-within:shadow-glow">
            <div className="pl-6 text-indigo-400">
              <LuSearch size={24} />
            </div>
            <input ref={searchRef} className="w-full bg-transparent border-none text-white h-16 pl-4 pr-6 text-lg font-medium outline-none placeholder:text-slate-500"
              placeholder="Buscar producto por nombre o código de barras..."
              value={query} onChange={e => setQuery(e.target.value)}
              onFocus={() => results.length && setShowSearch(true)}
              onBlur={() => setTimeout(() => setShowSearch(false), 200)} />
          </div>
          
          {/* Search Dropdown (Impeccable Layering) */}
          {showSearch && results.length > 0 && (
            <div className="absolute left-0 right-0 top-[calc(100%+16px)] bg-surface-800/98 backdrop-blur-3xl border border-border-strong rounded-[2rem] shadow-modal z-50 max-h-[60vh] overflow-y-auto animate-slide-up p-2">
              {results.map((r, i) => (
                <button key={i} onMouseDown={() => addToCart(r)}
                  className="w-full flex items-center justify-between px-6 py-5 hover:bg-white/5 transition-all rounded-2xl border-b border-white/5 last:border-0 group/item">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 rounded-2xl bg-surface-700 flex items-center justify-center text-indigo-400 group-hover/item:bg-indigo-500/20 group-hover/item:text-indigo-300 transition-all shadow-inner">
                      <LuPackage size={28} />
                    </div>
                    <div className="text-left">
                      <p className="font-black text-lg text-white leading-tight tracking-tight">{r.nombre}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="badge badge-blue">{r.codigo || 'S/C'}</span>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em]">Stock: {r.stock_actual} {r.unidad_medida}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-2xl text-emerald-400 tracking-tighter">{fmt(r.precio_venta)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cart Items Grid/List */}
        <div className="flex-1 overflow-y-auto min-h-0 relative rounded-3xl border border-white/5 bg-surface-800/30 backdrop-blur-sm p-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-4 opacity-40">
              <div className="w-24 h-24 rounded-full bg-surface-700 flex items-center justify-center text-slate-500 mb-4 shadow-inner">
                <LuShoppingCart size={48} />
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-slate-300 tracking-tight">Carrito Vacío</p>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-2">Agrega productos para comenzar</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2 p-2">
              {cart.map((item, i) => (
                <div key={i} className="flex items-center justify-between bg-surface-800/80 backdrop-blur-md border border-white/5 rounded-2xl p-4 shadow-sm hover:border-white/10 transition-colors group">
                  <div className="flex-1">
                    <p className="font-bold text-base text-white">{item.nombre}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Unit: {fmt(item.precio_unitario)}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400/70">Stock: {item.stock_actual}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-1 bg-surface-900 rounded-xl p-1 border border-white/5">
                      <button onClick={()=>updateQty(i,item.cantidad - (item.unidad_medida==='kg' ? 0.1 : 1))} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-surface-700 hover:text-white transition-colors"><LuMinus size={14}/></button>
                      <input type="number" step={item.unidad_medida==='kg' ? "0.01" : "1"}
                        className="w-12 text-center font-bold bg-transparent text-white border-none outline-none text-sm"
                        value={item.cantidad}
                        onChange={e=>updateQty(i, e.target.value)} />
                      <button onClick={()=>updateQty(i,item.cantidad + (item.unidad_medida==='kg' ? 0.1 : 1))} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:bg-surface-700 hover:text-white transition-colors"><LuPlus size={14}/></button>
                    </div>
                    
                    <div className="w-32 text-right">
                      <p className="font-black text-lg text-emerald-400">{fmt(item.subtotal)}</p>
                    </div>
                    
                    <button onClick={()=>removeItem(i)} className="w-10 h-10 rounded-xl flex items-center justify-center text-red-500/50 hover:bg-red-500/10 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100">
                      <LuTrash2 size={18} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Receipt / Summary Panel */}
      <div className={`md:w-[380px] bg-surface-800 border-l border-white/5 flex flex-col z-20 shadow-[-10px_0_30px_rgba(0,0,0,0.5)] ${cart.length > 0 ? 'flex' : 'hidden md:flex'}`}>
        <div className="p-8 border-b border-white/5 bg-surface-900/50">
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-indigo-400 flex items-center gap-3">
            <LuClipboardList size={18} /> Resumen de Venta
          </h2>
        </div>
        
        <div className="flex-1 flex flex-col p-8 gap-8 overflow-y-auto">
          {/* Totals Section */}
          <div className="space-y-5">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400 font-bold uppercase tracking-widest text-[11px]">Subtotal</span>
              <span className="font-bold text-white">{fmt(subtotal)}</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Descuento</label>
                <div className="flex bg-surface-900 p-1 rounded-lg border border-white/5">
                  <button onClick={() => setTipoDescuento('ves')} className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${tipoDescuento==='ves' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}>Bs</button>
                  <button onClick={() => setTipoDescuento('perc')} className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${tipoDescuento==='perc' ? 'bg-indigo-500 text-white shadow-md' : 'text-slate-500 hover:text-white'}`}>%</button>
                </div>
              </div>
              <div className="relative">
                <input className="input h-14 text-xl text-right font-bold pr-12" placeholder="0,00"
                  value={descuento} onChange={e => setDescuento(e.target.value.replace(/[^0-9.]/g,''))} />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-500">{tipoDescuento === 'ves' ? 'Bs' : '%'}</span>
              </div>
            </div>
            
            {descVal > 0 && (
              <div className="flex justify-between items-center text-sm py-3 border-t border-dashed border-white/10">
                <span className="text-red-400 font-bold uppercase tracking-widest text-[11px]">Descuento Aplicado</span>
                <span className="font-bold text-red-400">- {fmt(descVal)}</span>
              </div>
            )}
          </div>

          <div className="mt-auto pt-8 border-t border-white/10 relative">
            <div className="flex flex-col mb-8">
              <span className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Total a Pagar</span>
              <span className="text-5xl font-black text-emerald-400 tracking-tight">{fmt(totalFinal)}</span>
            </div>
            
            <button onClick={() => cart.length && setModal('pago')} disabled={cart.length === 0}
              className="btn-success h-16 w-full text-lg shadow-glow-success relative overflow-hidden group">
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
              <span className="relative flex items-center justify-center gap-2">
                Cobrar Ahora <LuCircleCheck size={20} />
              </span>
            </button>
            
            <button onClick={clearCart} disabled={cart.length===0} 
              className="w-full text-center mt-5 text-[11px] font-bold text-slate-500 uppercase tracking-widest hover:text-red-400 transition-colors py-2">
              Vaciar Carrito
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      {modal === 'pago' && (
        <PagoModal totalFinal={totalFinal} fmt={fmt}
          onClose={()=>setModal(null)} onConfirm={confirmarVenta} onError={setAlertMsg} />
      )}

      {modal === 'ticket' && lastVenta && (
        <div className="modal-backdrop">
          <div className="modal text-center max-w-sm border-emerald-500/30">
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-glow-success">
              <LuCircleCheck className="text-4xl text-emerald-400" />
            </div>
            <h2 className="text-3xl font-black mb-2 text-white tracking-tight">¡Venta Exitosa!</h2>
            <p className="text-sm mb-8 text-slate-400 font-medium">
              Folio <span className="font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-md ml-1">#{lastVenta.venta.id}</span>
              <br/><br/>
              <span className="uppercase tracking-widest text-[10px] font-bold">{lastVenta.venta.estado === 'credito' ? 'Venta a Crédito' : 'Pago Completo'}</span>
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={()=>printTicket({...lastVenta, config})} className="btn-primary h-14 w-full">Imprimir Ticket</button>
              <button onClick={()=>setModal(null)} className="btn-secondary h-14 w-full">Nueva Venta</button>
            </div>
          </div>
        </div>
      )}

      {alertMsg && <AlertModal message={alertMsg} onClose={() => setAlertMsg('')} />}
    </div>
  )
}
