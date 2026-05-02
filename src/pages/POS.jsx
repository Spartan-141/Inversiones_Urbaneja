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
          <h2 className="text-xl font-bold text-slate-900">💳 Registrar Pago</h2>
          <button onClick={onClose} className="btn-ghost btn-sm text-xl text-slate-500 hover:text-slate-800">✕</button>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-6 mb-6 text-center shadow-sm">
          <p className="text-[11px] uppercase tracking-[0.2em] font-black mb-3 text-slate-500">Total a cobrar</p>
          <p className="text-5xl font-black text-brand-600 tracking-tighter">{fmt(totalFinal)}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {METODOS.map(m => (
            <div key={m.key}>
              <label className="label text-slate-700">{m.icon} {m.label}</label>
              <input className="input h-12 text-lg font-bold bg-white border-slate-200 text-slate-900 shadow-sm" type="number" min="0" step="0.01" placeholder="0,00"
                value={pagos[m.key]} onChange={e => setPagos(p => ({ ...p, [m.key]: e.target.value }))} />
            </div>
          ))}
        </div>

        <div className="rounded-xl p-4 space-y-3 text-sm mb-6 bg-white border border-slate-200 shadow-sm">
          <div className="flex justify-between"><span className="text-slate-500">Total pagado:</span><span className="font-bold text-slate-900">{fmt(totalPagado)}</span></div>
          {esCredito && <div className="flex justify-between"><span className="text-red-500 font-semibold">Falta por pagar:</span><span className="text-red-600 font-bold">{fmt(falta)}</span></div>}
          {vuelto > 0.05 && <div className="flex justify-between"><span className="text-emerald-500 font-semibold">Vuelto:</span><span className="text-emerald-600 font-bold">{fmt(vuelto)}</span></div>}
        </div>

        <div className={`mb-6 p-4 rounded-xl border ${esCredito ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'}`}>
          {esCredito && <p className="text-amber-600 text-xs font-bold uppercase mb-2">⚠️ Venta a Crédito — Se requiere nombre</p>}
          <input
            className="input bg-white border-slate-200 text-slate-900 shadow-sm"
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
    <div className="flex flex-col md:flex-row h-full overflow-hidden relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-50 rounded-full blur-[120px] pointer-events-none"></div>

      {/* Left: Cart Area */}
      <div className="flex-1 flex flex-col p-4 sm:p-6 gap-4 overflow-hidden min-h-0 z-10">
        <div className="flex items-center justify-between">
          <h1 className="page-title text-slate-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100">
              <LuShoppingCart size={22} />
            </div>
            Punto de Venta
          </h1>
        </div>

        {/* Search Bar */}
        <div className="relative group z-20 shrink-0">
          <div className="relative bg-white rounded-xl border border-slate-200 flex items-center shadow-sm transition-all group-focus-within:border-brand-500 group-focus-within:shadow-md">
            <div className="pl-4 text-slate-400 group-focus-within:text-brand-600 transition-colors">
              <LuSearch size={20} />
            </div>
            <input ref={searchRef} className="w-full bg-transparent border-none text-slate-900 h-12 pl-3 pr-4 text-base font-medium outline-none placeholder:text-slate-400"
              placeholder="Buscar producto por nombre o código de barras..."
              value={query} onChange={e => setQuery(e.target.value)}
              onFocus={() => results.length && setShowSearch(true)}
              onBlur={() => setTimeout(() => setShowSearch(false), 200)} />
          </div>
          
          {/* Search Dropdown */}
          {showSearch && results.length > 0 && (
            <div className="absolute left-0 right-0 top-[calc(100%+8px)] bg-white border border-slate-200 rounded-2xl shadow-xl z-50 max-h-[60vh] overflow-y-auto animate-slide-up p-2">
              {results.map((r, i) => (
                <button key={i} onMouseDown={() => addToCart(r)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-all rounded-xl border-b border-slate-100 last:border-0 group/item">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-indigo-600 group-hover/item:bg-indigo-50 group-hover/item:text-indigo-700 transition-all border border-slate-200 group-hover/item:border-indigo-100">
                      <LuPackage size={24} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-base text-slate-900 leading-tight">{r.nombre}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="badge badge-blue">{r.codigo || 'S/C'}</span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.1em]">Stock: {r.stock_actual} {r.unidad_medida}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-black text-xl text-emerald-600">{fmt(r.precio_venta)}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto min-h-0 relative rounded-2xl border border-slate-200 bg-slate-50/50 p-2">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 opacity-60">
              <div className="w-20 h-20 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2 border border-slate-200">
                <LuShoppingCart size={40} />
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-slate-700 tracking-tight">Carrito Vacío</p>
                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1">Agrega productos para comenzar</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-2 p-1">
              {cart.map((item, i) => (
                <div key={i} className="flex items-center justify-between bg-white border border-slate-200 rounded-xl p-3 shadow-sm hover:border-slate-300 transition-colors group">
                  <div className="flex-1">
                    <p className="font-bold text-sm text-slate-900">{item.nombre}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Unit: {fmt(item.precio_unitario)}</span>
                      <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">Stock: {item.stock_actual}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 bg-slate-50 rounded-lg p-1 border border-slate-200">
                      <button onClick={()=>updateQty(i,item.cantidad - (item.unidad_medida==='kg' ? 0.1 : 1))} className="w-7 h-7 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"><LuMinus size={14}/></button>
                      <input type="number" step={item.unidad_medida==='kg' ? "0.01" : "1"}
                        className="w-10 text-center font-bold bg-transparent text-slate-900 border-none outline-none text-sm p-0"
                        value={item.cantidad}
                        onChange={e=>updateQty(i, e.target.value)} />
                      <button onClick={()=>updateQty(i,item.cantidad + (item.unidad_medida==='kg' ? 0.1 : 1))} className="w-7 h-7 rounded-md flex items-center justify-center text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition-colors"><LuPlus size={14}/></button>
                    </div>
                    
                    <div className="w-24 text-right">
                      <p className="font-black text-base text-emerald-600">{fmt(item.subtotal)}</p>
                    </div>
                    
                    <button onClick={()=>removeItem(i)} className="w-8 h-8 rounded-lg flex items-center justify-center text-red-500 opacity-60 hover:bg-red-50 hover:text-red-600 hover:opacity-100 transition-colors">
                      <LuTrash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right: Receipt / Summary Panel */}
      <div className={`md:w-[320px] bg-slate-50 border-l border-slate-200 flex flex-col z-20 ${cart.length > 0 ? 'flex' : 'hidden md:flex'}`}>
        <div className="p-6 border-b border-slate-200 bg-white">
          <h2 className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600 flex items-center gap-2">
            <LuClipboardList size={16} /> Resumen de Venta
          </h2>
        </div>
        
        <div className="flex-1 flex flex-col p-6 gap-6 overflow-y-auto">
          {/* Totals Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Subtotal</span>
              <span className="font-black text-slate-900">{fmt(subtotal)}</span>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Descuento</label>
                <div className="flex bg-slate-200 p-1 rounded-md">
                  <button onClick={() => setTipoDescuento('ves')} className={`px-3 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all ${tipoDescuento==='ves' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>Bs</button>
                  <button onClick={() => setTipoDescuento('perc')} className={`px-3 py-1 rounded text-[9px] font-black uppercase tracking-wider transition-all ${tipoDescuento==='perc' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>%</button>
                </div>
              </div>
              <div className="relative">
                <input className="input h-10 text-base text-right font-bold pr-10 bg-white border-slate-200 text-slate-900" placeholder="0,00"
                  value={descuento} onChange={e => setDescuento(e.target.value.replace(/[^0-9.]/g,''))} />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-sm">{tipoDescuento === 'ves' ? 'Bs' : '%'}</span>
              </div>
            </div>
            
            {descVal > 0 && (
              <div className="flex justify-between items-center text-sm py-2 border-t border-dashed border-slate-300">
                <span className="text-red-500 font-bold uppercase tracking-widest text-[10px]">Descuento Aplicado</span>
                <span className="font-bold text-red-500">- {fmt(descVal)}</span>
              </div>
            )}
          </div>

          <div className="mt-auto pt-6 border-t border-slate-200 relative">
            <div className="flex flex-col mb-6">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-1">Total a Pagar</span>
              <span className="text-4xl font-black text-emerald-600 tracking-tight">{fmt(totalFinal)}</span>
            </div>
            
            <button onClick={() => cart.length && setModal('pago')} disabled={cart.length === 0}
              className="btn-success h-14 w-full text-base shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
              <span className="relative flex items-center justify-center gap-2">
                Cobrar Ahora <LuCircleCheck size={18} />
              </span>
            </button>
            
            <button onClick={clearCart} disabled={cart.length===0} 
              className="w-full text-center mt-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest hover:text-red-500 transition-colors py-1">
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
          <div className="modal text-center max-w-sm">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5 border border-emerald-200">
              <LuCircleCheck className="text-3xl text-emerald-600" />
            </div>
            <h2 className="text-2xl font-black mb-2 text-slate-900 tracking-tight">¡Venta Exitosa!</h2>
            <p className="text-xs mb-6 text-slate-500 font-medium">
              Folio <span className="font-bold text-indigo-700 bg-indigo-50 px-2 py-1 rounded border border-indigo-100 ml-1">#{lastVenta.venta.id}</span>
              <br/><br/>
              <span className="uppercase tracking-widest text-[10px] font-bold">{lastVenta.venta.estado === 'credito' ? 'Venta a Crédito' : 'Pago Completo'}</span>
            </p>
            <div className="flex flex-col gap-3">
              <button onClick={()=>printTicket({...lastVenta, config})} className="btn-primary h-12 w-full">Imprimir Ticket</button>
              <button onClick={()=>setModal(null)} className="btn-secondary h-12 w-full">Nueva Venta</button>
            </div>
          </div>
        </div>
      )}

      {alertMsg && <AlertModal message={alertMsg} onClose={() => setAlertMsg('')} />}
    </div>
  )
}

