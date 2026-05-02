import React, { useState, useEffect, useCallback, useRef } from 'react'
import { LuPlus, LuPencil, LuTrash2, LuSearch, LuTrendingDown, LuTriangleAlert, LuFolderOpen, LuCheck, LuX, LuChevronLeft, LuChevronRight, LuPackage } from 'react-icons/lu'
import { useApp } from '../context/AppContext.jsx'
import JsBarcode from 'jsbarcode'
import ConfirmationModal from '../components/ConfirmationModal.jsx'

// ── Barcode display ──────────────────────────────────────────────────────────
function BarcodeImg({ code }) {
  const ref = useRef(null)
  useEffect(() => {
    if (ref.current && code) {
      try { JsBarcode(ref.current, code, { format: 'CODE128', height: 40, displayValue: false, background: 'transparent', lineColor: '#6366f1' }) }
      catch { }
    }
  }, [code])
  return code ? <svg ref={ref} className="h-10 mx-auto" /> : null
}

// ── Product form modal ──────────────────────────────────────────────────────
function ProductoModal({ producto, categorias, onClose, onSave }) {
  const blank = {
    codigo: '', nombre: '', marca: '',
    precio_compra: '', precio_venta: '',
    stock_actual: 0, stock_minimo: 0, categoria_id: '', unidad_medida: 'unidad', descripcion: '',
  }
  const [form, setForm] = useState(producto ? { ...blank, ...producto } : blank)
  const [saving, setSaving] = useState(false)

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))
  
  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const data = {
        ...form,
        precio_compra: parseFloat(form.precio_compra) || 0,
        precio_venta: parseFloat(form.precio_venta) || 0,
        stock_actual: parseFloat(form.stock_actual) || 0,
        stock_minimo: parseFloat(form.stock_minimo) || 0,
        categoria_id: form.categoria_id ? parseInt(form.categoria_id) : null,
      }
      if (producto?.id) {
        await window.api.invoke('productos:update', { id: producto.id, ...data })
      } else {
        await window.api.invoke('productos:create', data)
      }
      onSave()
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-lg">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{producto ? 'Editar Producto' : 'Nuevo Producto'}</h2>
          <button onClick={onClose} className="btn-ghost btn-sm text-xl">✕</button>
        </div>
        <form onSubmit={submit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Nombre *</label>
              <input className="input h-11" required value={form.nombre} onChange={e => set('nombre', e.target.value)} />
            </div>
            <div>
              <label className="label">Código (Opcional)</label>
              <input className="input h-11" value={form.codigo} onChange={e => set('codigo', e.target.value)} />
            </div>
            <div>
              <label className="label">Marca</label>
              <input className="input h-11" value={form.marca} onChange={e => set('marca', e.target.value)} />
            </div>
            <div>
              <label className="label">Categoría</label>
              <select className="select h-11" value={form.categoria_id} onChange={e => set('categoria_id', e.target.value)}>
                <option value="">Sin categoría</option>
                {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Unidad de Medida</label>
              <select className="select h-11" value={form.unidad_medida} onChange={e => set('unidad_medida', e.target.value)}>
                <option value="unidad">Unidad (Un)</option>
                <option value="kg">Kilogramos (Kg)</option>
                <option value="litro">Litros (L)</option>
              </select>
            </div>
            <div></div> {/* spacer */}

            <div className="col-span-1 sm:col-span-2 pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
              <div>
                <label className="label">Precio Compra (Bs.)</label>
                <input className="input h-11 font-bold text-indigo-400" type="number" step="0.01" required value={form.precio_compra} onChange={e => set('precio_compra', e.target.value)} />
              </div>
              <div>
                <label className="label">Precio Venta (Bs.)</label>
                <input className="input h-11 font-bold text-emerald-400" type="number" step="0.01" required value={form.precio_venta} onChange={e => set('precio_venta', e.target.value)} />
              </div>
            </div>

            <div className="col-span-1 sm:col-span-2 pt-4 border-t border-white/5 grid grid-cols-2 gap-4">
              <div>
                <label className="label">Stock Actual</label>
                <input className="input h-11" type="number" step="0.01" value={form.stock_actual} onChange={e => set('stock_actual', e.target.value)} />
              </div>
              <div>
                <label className="label">Stock Mínimo (Alerta)</label>
                <input className="input h-11" type="number" step="0.01" value={form.stock_minimo} onChange={e => set('stock_minimo', e.target.value)} />
              </div>
            </div>
          </div>

          <div>
            <label className="label">Descripción</label>
            <textarea className="input h-20 resize-none py-3" value={form.descripcion} onChange={e => set('descripcion', e.target.value)} />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button type="button" onClick={onClose} className="btn-secondary btn-lg">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-primary btn-lg px-8">
              {saving ? '⏳ Guardando...' : '💾 Guardar Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Merma modal ──────────────────────────────────────────────────────────────
function MermaModal({ producto, onClose, onSave }) {
  const [form, setForm] = useState({ cantidad: 1, motivo: 'daño', notas: '' })
  const [saving, setSaving] = useState(false)
  const set = (k, v) => setForm(p => ({ ...p, [k]: v }))

  const submit = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      // In Urbaneja we might not have a mermas use case yet, I'll use a direct call or stub
      // For now, let's assume mermas:create exists
      await window.api.invoke('mermas:create', {
        producto_id: producto.id,
        cantidad: parseFloat(form.cantidad),
        motivo: form.motivo,
        notas: form.notas,
      })
      onSave()
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <h2 className="text-xl font-bold text-amber-500 mb-2">📉 Registrar Merma</h2>
        <p className="text-sm mb-6 text-slate-400">Descontar stock de <strong>{producto.nombre}</strong></p>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label">Cantidad a descontar ({producto.unidad_medida})</label>
            <input className="input" type="number" step="0.01" min="0.01" max={producto.stock_actual} required
              value={form.cantidad} onChange={e => set('cantidad', e.target.value)} />
          </div>
          <div>
            <label className="label">Motivo</label>
            <select className="select" value={form.motivo} onChange={e => set('motivo', e.target.value)}>
              <option value="daño">Daño / Vencimiento</option>
              <option value="robo">Robo / Extravío</option>
              <option value="uso_interno">Uso Interno</option>
              <option value="otro">Otro</option>
            </select>
          </div>
          <div>
            <label className="label">Notas</label>
            <textarea className="input h-20 resize-none" value={form.notas} onChange={e => set('notas', e.target.value)} />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancelar</button>
            <button type="submit" disabled={saving} className="btn-danger">Registrar</button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Inventario ──────────────────────────────────────────────────────────
export default function Inventario() {
  const { fmt } = useApp()
  const [data, setData] = useState({ productos: [], total: 0, pages: 0 })
  const [page, setPage] = useState(1)
  const [categorias, setCategorias] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('')
  const [filterBajoStock, setFilterBajoStock] = useState(false)
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)

  const load = useCallback(async (p = 1) => {
    setLoading(true)
    try {
      const [paginatedData, cats] = await Promise.all([
        window.api.invoke('productos:paginated', {
          page: p,
          perPage: 25,
          search: search || undefined,
          categoria_id: filterCat || undefined,
          bajo_stock: filterBajoStock || undefined,
        }),
        window.api.invoke('categorias:list'),
      ])
      setData(paginatedData)
      setCategorias(cats)
      setPage(p)
    } finally { setLoading(false) }
  }, [search, filterCat, filterBajoStock])

  useEffect(() => { load(1) }, [load])

  const handleDelete = async () => {
    await window.api.invoke('productos:delete', confirmDelete.id)
    setConfirmDelete(null)
    load(page)
  }

  return (
    <div className="page flex flex-col h-full overflow-hidden">
      <div className="page-header shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
            <LuPackage size={24} />
          </div>
          <div>
            <h1 className="page-title text-slate-900">Inventario</h1>
            <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mt-1">{data.total} productos registrados</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setModal('crear')} className="btn-primary">
            <LuPlus size={18} /> Nuevo Producto
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 items-center mb-4 bg-slate-100 p-2 rounded-2xl border border-slate-200 shrink-0">
        <div className="relative flex-1 min-w-[250px] group">
          <LuSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={20} />
          <input className="input pl-12 h-11 bg-white border-slate-200 shadow-sm text-slate-900 placeholder:text-slate-400" placeholder="Buscar por nombre, marca o código..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="select h-11 w-56 bg-white border-slate-200 shadow-sm font-medium text-slate-700" value={filterCat} onChange={e => setFilterCat(e.target.value)}>
          <option value="">Todas las categorías</option>
          {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <label className="flex items-center gap-3 text-sm font-bold text-slate-700 cursor-pointer bg-white h-11 px-5 rounded-xl shadow-sm border border-slate-200 select-none transition-colors hover:bg-slate-50">
          <input type="checkbox" className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500" checked={filterBajoStock} onChange={e => setFilterBajoStock(e.target.checked)} />
          SOLO BAJO STOCK
        </label>
      </div>

      <div className="table-wrapper flex-1 min-h-0 overflow-y-auto">
        <table className="w-full relative">
          <thead className="sticky top-0 z-10 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200">
            <tr>
              <th className="py-4 px-6 text-left text-[11px] font-black uppercase tracking-widest text-slate-500">Producto</th>
              <th className="py-4 px-6 text-left text-[11px] font-black uppercase tracking-widest text-slate-500">Categoría</th>
              <th className="py-4 px-6 text-right text-[11px] font-black uppercase tracking-widest text-slate-500">Compra</th>
              <th className="py-4 px-6 text-right text-[11px] font-black uppercase tracking-widest text-slate-500">Venta</th>
              <th className="py-4 px-6 text-center text-[11px] font-black uppercase tracking-widest text-slate-500">Stock</th>
              <th className="py-4 px-6 text-right text-[11px] font-black uppercase tracking-widest text-slate-500">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-20 font-bold uppercase tracking-widest text-slate-400">Cargando inventario...</td></tr>
            ) : data.productos.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-20 font-bold uppercase tracking-widest text-slate-400">No hay productos que coincidan.</td></tr>
            ) : data.productos.map(p => {
              const bajo = p.stock_actual <= p.stock_minimo
              return (
                <tr key={p.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 shrink-0">
                        <LuPackage size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm leading-tight">{p.nombre}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mt-1">{p.marca || 'Genérico'} · <span className="text-indigo-500">{p.codigo || 'S/C'}</span></p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6"><span className="badge badge-blue">{p.categoria_nombre || 'Sin Categoría'}</span></td>
                  <td className="py-4 px-6 text-right font-mono text-slate-500 text-sm">{fmt(p.precio_compra)}</td>
                  <td className="py-4 px-6 text-right font-black text-emerald-600 text-base">{fmt(p.precio_venta)}</td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex flex-col items-center">
                      <span className={`font-black text-lg leading-none ${bajo ? 'text-red-600' : 'text-slate-900'}`}>{p.stock_actual}</span>
                      <span className="text-[9px] font-bold uppercase text-slate-500 tracking-widest mt-1">{p.unidad_medida}</span>
                      {bajo && <span className="flex items-center justify-center gap-1 text-[9px] text-red-700 mt-1.5 font-bold uppercase tracking-widest bg-red-50 px-2 py-0.5 rounded-md border border-red-200"><LuTriangleAlert size={10} /> MÍN {p.stock_minimo}</span>}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setSelected(p); setModal('editar') }} className="w-9 h-9 rounded-lg flex items-center justify-center text-indigo-600 bg-indigo-50 hover:bg-indigo-600 hover:text-white transition-colors border border-indigo-100 hover:border-transparent"><LuPencil size={16} /></button>
                      <button onClick={() => { setSelected(p); setModal('merma') }} className="w-9 h-9 rounded-lg flex items-center justify-center text-amber-600 bg-amber-50 hover:bg-amber-500 hover:text-white transition-colors border border-amber-100 hover:border-transparent"><LuTrendingDown size={16} /></button>
                      <button onClick={() => setConfirmDelete(p)} className="w-9 h-9 rounded-lg flex items-center justify-center text-red-600 bg-red-50 hover:bg-red-600 hover:text-white transition-colors border border-red-100 hover:border-transparent"><LuTrash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {data.pages > 1 && (
        <div className="flex items-center justify-between mt-4 px-2 shrink-0">
          <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest">Página <span className="text-slate-900">{page}</span> de <span className="text-slate-900">{data.pages}</span></p>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => load(page - 1)} className="btn-secondary h-10 px-4"><LuChevronLeft /> Ant</button>
            <button disabled={page === data.pages} onClick={() => load(page + 1)} className="btn-secondary h-10 px-4">Sig <LuChevronRight /></button>
          </div>
        </div>
      )}

      {(modal === 'crear' || modal === 'editar') && (
        <ProductoModal producto={modal === 'editar' ? selected : null} categorias={categorias}
          onClose={() => setModal(null)} onSave={() => { setModal(null); load(page) }} />
      )}
      {modal === 'merma' && selected && (
        <MermaModal producto={selected} onClose={() => setModal(null)} onSave={() => { setModal(null); load(page) }} />
      )}
      {confirmDelete && (
        <ConfirmationModal title="¿Eliminar Producto?" message={`¿Estás seguro que deseas eliminar "${confirmDelete.nombre}"? Esta acción no se puede deshacer.`}
          onConfirm={handleDelete} onCancel={() => setConfirmDelete(null)} isDanger />
      )}
    </div>
  )
}
