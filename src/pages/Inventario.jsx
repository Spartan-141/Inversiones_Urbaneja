import React, { useState, useEffect, useCallback } from 'react'
import {
  LuPlus, LuPencil, LuTrash2, LuSearch, LuX, LuStar, LuStarOff,
  LuPackage, LuScale, LuCalendar, LuTriangleAlert, LuRefreshCw
} from 'react-icons/lu'
import AlertModal from '../components/AlertModal.jsx'

const EMPTY_FORM = {
  codigo: '', nombre: '', marca: '', categoria_id: '',
  unidad_medida: 'unidad', precio_compra_usd: '', precio_venta_usd: '',
  stock_actual: '', stock_minimo: '', fecha_vencimiento: '', es_favorito: false, descripcion: '',
}

export default function Inventario() {
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [query, setQuery]       = useState('')
  const [catFilter, setCatFilter] = useState('')
  const [modal, setModal]       = useState(null)   // 'form' | 'delete'
  const [form, setForm]         = useState(EMPTY_FORM)
  const [editId, setEditId]     = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [alertMsg, setAlertMsg] = useState('')
  const [saving, setSaving]     = useState(false)

  const load = useCallback(async () => {
    const [prods, cats] = await Promise.all([
      window.api.invoke('productos:list', { query, categoria_id: catFilter || undefined }),
      window.api.invoke('categorias:list'),
    ])
    setProductos(prods)
    setCategorias(cats)
  }, [query, catFilter])

  useEffect(() => { load() }, [load])

  const openNew = () => { setForm(EMPTY_FORM); setEditId(null); setModal('form') }
  const openEdit = (p) => {
    setForm({
      codigo: p.codigo || '', nombre: p.nombre, marca: p.marca || '',
      categoria_id: p.categoria_id || '', unidad_medida: p.unidad_medida || 'unidad',
      precio_compra_usd: p.precio_compra_usd, precio_venta_usd: p.precio_venta_usd,
      stock_actual: p.stock_actual, stock_minimo: p.stock_minimo,
      fecha_vencimiento: p.fecha_vencimiento || '', es_favorito: !!p.es_favorito,
      descripcion: p.descripcion || '',
    })
    setEditId(p.id)
    setModal('form')
  }

  const handleSave = async () => {
    if (!form.nombre.trim()) { setAlertMsg('El nombre es obligatorio'); return }
    if (!form.precio_venta_usd || parseFloat(form.precio_venta_usd) < 0) { setAlertMsg('El precio de venta debe ser mayor o igual a 0'); return }
    setSaving(true)
    try {
      const payload = {
        ...form,
        precio_compra_usd: parseFloat(form.precio_compra_usd) || 0,
        precio_venta_usd:  parseFloat(form.precio_venta_usd)  || 0,
        stock_actual:      parseFloat(form.stock_actual)       || 0,
        stock_minimo:      parseFloat(form.stock_minimo)       || 0,
        categoria_id:      form.categoria_id ? parseInt(form.categoria_id) : null,
        es_favorito:       form.es_favorito ? 1 : 0,
        fecha_vencimiento: form.fecha_vencimiento || null,
      }
      if (editId) {
        await window.api.invoke('productos:update', { ...payload, id: editId })
      } else {
        await window.api.invoke('productos:create', payload)
      }
      setModal(null)
      load()
    } catch (e) {
      setAlertMsg(`Error al guardar: ${e.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await window.api.invoke('productos:delete', deleteTarget.id)
    setModal(null)
    setDeleteTarget(null)
    load()
  }

  const toggleFav = async (p) => {
    await window.api.invoke('productos:toggleFavorito', p.id)
    load()
  }

  const stockWarning = (p) => {
    if (p.stock_minimo > 0 && p.stock_actual <= p.stock_minimo) return true
    return false
  }

  const expiryWarning = (p) => {
    if (!p.fecha_vencimiento) return null
    const diff = (new Date(p.fecha_vencimiento) - new Date()) / (1000 * 60 * 60 * 24)
    if (diff < 0) return 'vencido'
    if (diff <= 7) return 'proximo'
    return null
  }

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }))

  // Stock decimal places based on unit
  const stockDecimals = form.unidad_medida === 'kg' ? 3 : 0
  const stockStep     = form.unidad_medida === 'kg' ? '0.001' : '1'

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/5 bg-surface-800 flex-wrap">
        <h1 className="page-title flex items-center gap-2">
          <LuPackage className="text-brand-400" /> Inventario
        </h1>
        <div className="flex-1 relative min-w-0 max-w-xs">
          <LuSearch className="absolute left-3 top-2.5 text-gray-500 pointer-events-none" />
          <input className="input pl-9 py-2" placeholder="Buscar producto..."
            value={query} onChange={e => setQuery(e.target.value)} />
          {query && <button onClick={() => setQuery('')} className="absolute right-3 top-2.5 text-gray-400"><LuX className="text-sm" /></button>}
        </div>
        <select className="select py-2 max-w-[160px]" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">Todas las categorías</option>
          {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </select>
        <button onClick={load} className="btn-ghost btn-sm"><LuRefreshCw /></button>
        <button onClick={openNew} className="btn-primary ml-auto">
          <LuPlus /> Nuevo Producto
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-y-auto p-4">
        {productos.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-600 gap-2">
            <LuPackage className="text-4xl opacity-20" />
            <p className="text-sm">No se encontraron productos</p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <table>
              <thead>
                <tr className="px-4">
                  <th className="pl-4 py-3">Producto</th>
                  <th>Categoría</th>
                  <th className="text-center">Unidad</th>
                  <th className="text-right">P. Compra</th>
                  <th className="text-right">P. Venta</th>
                  <th className="text-right">Stock</th>
                  <th className="text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productos.map(p => {
                  const exp = expiryWarning(p)
                  const low = stockWarning(p)
                  return (
                    <tr key={p.id} className="hover:bg-white/2">
                      <td className="pl-4">
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="font-medium text-white text-sm flex items-center gap-1.5">
                              {p.nombre}
                              {p.es_favorito ? <LuStar className="text-amber-400 text-xs" title="Favorito" /> : null}
                            </p>
                            {p.marca && <p className="text-xs text-gray-500">{p.marca}</p>}
                            {p.codigo && <p className="text-xs text-gray-600 font-mono">{p.codigo}</p>}
                          </div>
                        </div>
                        {exp === 'vencido' && (
                          <span className="badge badge-red badge-sm mt-0.5">⚠️ Vencido</span>
                        )}
                        {exp === 'proximo' && (
                          <span className="badge badge-yellow badge-sm mt-0.5">⏰ Próximo a vencer</span>
                        )}
                      </td>
                      <td>
                        <span className="text-gray-400 text-xs">{p.categoria_nombre || '—'}</span>
                      </td>
                      <td className="text-center">
                        {p.unidad_medida === 'kg'
                          ? <span className="badge badge-orange badge-sm"><LuScale className="text-[10px]" /> kg</span>
                          : <span className="badge badge-blue badge-sm"><LuPackage className="text-[10px]" /> unid</span>
                        }
                      </td>
                      <td className="text-right text-gray-400 text-sm">${Number(p.precio_compra_usd).toFixed(2)}</td>
                      <td className="text-right font-semibold text-white text-sm">${Number(p.precio_venta_usd).toFixed(2)}</td>
                      <td className="text-right">
                        <span className={`font-mono text-sm font-semibold ${low ? 'text-orange-400' : 'text-white'}`}>
                          {Number(p.stock_actual).toFixed(p.unidad_medida === 'kg' ? 3 : 0)}
                        </span>
                        {low && <LuTriangleAlert className="inline ml-1 text-orange-400 text-xs" />}
                      </td>
                      <td>
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => toggleFav(p)} title={p.es_favorito ? 'Quitar de favoritos' : 'Marcar como favorito'}
                            className={`btn-ghost btn-sm ${p.es_favorito ? 'text-amber-400' : 'text-gray-500'}`}>
                            {p.es_favorito ? <LuStar /> : <LuStarOff />}
                          </button>
                          <button onClick={() => openEdit(p)} className="btn-ghost btn-sm text-brand-400">
                            <LuPencil />
                          </button>
                          <button onClick={() => { setDeleteTarget(p); setModal('delete') }}
                            className="btn-ghost btn-sm text-red-400">
                            <LuTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {modal === 'form' && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal-lg">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold">{editId ? '✏️ Editar Producto' : '➕ Nuevo Producto'}</h2>
              <button onClick={() => setModal(null)} className="btn-ghost btn-sm"><LuX /></button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="label">Nombre *</label>
                <input className="input" placeholder="Ej: Harina PAN 1kg"
                  value={form.nombre} onChange={e => f('nombre', e.target.value)} />
              </div>

              <div>
                <label className="label">Código de Barras</label>
                <input className="input font-mono" placeholder="Ej: 7591111001234"
                  value={form.codigo} onChange={e => f('codigo', e.target.value)} />
              </div>

              <div>
                <label className="label">Marca</label>
                <input className="input" placeholder="Ej: Polar"
                  value={form.marca} onChange={e => f('marca', e.target.value)} />
              </div>

              <div>
                <label className="label">Categoría</label>
                <select className="select" value={form.categoria_id} onChange={e => f('categoria_id', e.target.value)}>
                  <option value="">Sin categoría</option>
                  {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
              </div>

              <div>
                <label className="label">Unidad de Medida</label>
                <div className="flex gap-3 mt-1">
                  {['unidad', 'kg'].map(u => (
                    <label key={u} className={`flex items-center gap-2 px-4 py-2 rounded-xl border cursor-pointer transition-colors
                      ${form.unidad_medida === u
                        ? 'bg-brand-600/20 border-brand-500/50 text-brand-300'
                        : 'bg-surface-700 border-white/10 text-gray-400 hover:border-white/20'}`}>
                      <input type="radio" name="unidad" value={u} className="hidden"
                        checked={form.unidad_medida === u} onChange={() => f('unidad_medida', u)} />
                      {u === 'kg' ? <LuScale className="text-orange-400" /> : <LuPackage className="text-blue-400" />}
                      <span className="font-medium capitalize">{u === 'kg' ? 'Kilogramos' : 'Por Unidad'}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="label">Precio de Compra (USD)</label>
                <input className="input" type="number" min="0" step="0.01" placeholder="0.00"
                  value={form.precio_compra_usd} onChange={e => f('precio_compra_usd', e.target.value)} />
              </div>

              <div>
                <label className="label">Precio de Venta (USD) *</label>
                <input className="input" type="number" min="0" step="0.01" placeholder="0.00"
                  value={form.precio_venta_usd} onChange={e => f('precio_venta_usd', e.target.value)} />
              </div>

              <div>
                <label className="label">Stock Actual {form.unidad_medida === 'kg' ? '(kg)' : '(unidades)'}</label>
                <input className="input" type="number" min="0" step={stockStep} placeholder="0"
                  value={form.stock_actual} onChange={e => f('stock_actual', e.target.value)} />
              </div>

              <div>
                <label className="label">Stock Mínimo {form.unidad_medida === 'kg' ? '(kg)' : '(unidades)'}</label>
                <input className="input" type="number" min="0" step={stockStep} placeholder="0"
                  value={form.stock_minimo} onChange={e => f('stock_minimo', e.target.value)} />
              </div>

              <div>
                <label className="label flex items-center gap-1"><LuCalendar /> Fecha de Vencimiento (opcional)</label>
                <input className="input" type="date"
                  value={form.fecha_vencimiento} onChange={e => f('fecha_vencimiento', e.target.value)} />
              </div>

              <div className="flex items-center gap-3 pt-5">
                <label className="flex items-center gap-2 cursor-pointer">
                  <div className={`relative w-10 h-6 rounded-full border-2 transition-colors
                    ${form.es_favorito ? 'bg-amber-500 border-amber-400' : 'bg-surface-600 border-white/10'}`}
                    onClick={() => f('es_favorito', !form.es_favorito)}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform
                      ${form.es_favorito ? 'translate-x-4' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-sm text-gray-300 flex items-center gap-1">
                    <LuStar className={form.es_favorito ? 'text-amber-400' : 'text-gray-500'} />
                    Acceso rápido (Favorito)
                  </span>
                </label>
              </div>

              <div className="sm:col-span-2">
                <label className="label">Descripción (opcional)</label>
                <textarea className="input resize-none" rows={2} placeholder="Notas adicionales..."
                  value={form.descripcion} onChange={e => f('descripcion', e.target.value)} />
              </div>
            </div>

            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setModal(null)} className="btn-secondary">Cancelar</button>
              <button onClick={handleSave} disabled={saving} className="btn-primary">
                {saving ? '⏳ Guardando...' : editId ? '✅ Guardar Cambios' : '➕ Crear Producto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm modal */}
      {modal === 'delete' && deleteTarget && (
        <div className="modal-backdrop" onClick={e => e.target === e.currentTarget && setModal(null)}>
          <div className="modal max-w-sm text-center">
            <LuTrash2 className="text-4xl text-red-400 mb-4 mx-auto" />
            <h2 className="text-lg font-bold mb-2">¿Eliminar producto?</h2>
            <p className="text-gray-400 text-sm mb-6">
              Se eliminará permanentemente <strong className="text-white">"{deleteTarget.nombre}"</strong>.
              Esta acción no se puede deshacer.
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setModal(null)} className="btn-secondary">Cancelar</button>
              <button onClick={handleDelete} className="btn-danger">Eliminar</button>
            </div>
          </div>
        </div>
      )}

      {alertMsg && <AlertModal title="Aviso" message={alertMsg} onClose={() => setAlertMsg('')} />}
    </div>
  )
}
