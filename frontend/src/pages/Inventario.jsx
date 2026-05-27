import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, AlertTriangle, Package, Layers } from 'lucide-react'
import Swal from 'sweetalert2'

export default function Inventario() {
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  
  // NUEVO ESTADO: Controla si el filtro de bajo stock está activo
  const [filtroBajoStock, setFiltroBajoStock] = useState(false)
  
  const estadoInicial = {
    nombre: '', categoria: '', codigo_barras: '', tipo_presentacion: 'COMPLETO',
    precio_compra_caja: '0.00', precio_venta_caja: '0.00', precio_venta_blister: '0.00',
    precio_venta_unidad: '0.00', unidades_por_blister: '1', unidades_por_caja: '1',
    stock_actual_unidades: '0', stock_minimo_alerta: '5'
  }

  const [formData, setFormData] = useState(estadoInicial)

  useEffect(() => {
    cargarProductos()
    cargarCategorias()
  }, [])

  const cargarProductos = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/productos/')
      const data = await res.json()
      setProductos(data)
    } catch (error) { console.error("Error:", error) }
  }

  const cargarCategorias = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/categorias/')
      const data = await res.json()
      setCategorias(data)
    } catch (error) { console.error("Error:", error) }
  }

  // LÓGICA DE FILTRADO MEJORADA (Buscador + Botón de Bajo Stock)
  const productosFiltrados = productos.filter(p => {
    const coincideBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
                             (p.codigo_barras && p.codigo_barras.includes(busqueda))
    
    const coincideStock = filtroBajoStock ? p.stock_actual_unidades <= p.stock_minimo_alerta : true;

    return coincideBusqueda && coincideStock;
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const abrirModalCrear = () => {
    setEditandoId(null)
    setFormData(estadoInicial)
    setModalAbierto(true)
  }

  const abrirModalEditar = (prod) => {
    setEditandoId(prod.id)
    setFormData({
      nombre: prod.nombre, categoria: prod.categoria,
      codigo_barras: prod.codigo_barras || '', tipo_presentacion: prod.tipo_presentacion || 'COMPLETO',
      precio_compra_caja: prod.precio_compra_caja, precio_venta_caja: prod.precio_venta_caja,
      precio_venta_blister: prod.precio_venta_blister || '0.00', precio_venta_unidad: prod.precio_venta_unidad || '0.00',
      unidades_por_blister: prod.unidades_por_blister.toString(), unidades_por_caja: prod.unidades_por_caja.toString(),
      stock_actual_unidades: prod.stock_actual_unidades.toString(), stock_minimo_alerta: prod.stock_minimo_alerta.toString()
    })
    setModalAbierto(true)
  }

  const guardarProducto = async (e) => {
    e.preventDefault()
    if (!formData.categoria) {
      Swal.fire('Atención', 'Debes seleccionar una categoría', 'warning')
      return
    }

    const payload = { ...formData };
    if (payload.tipo_presentacion === 'SIMPLE') {
      payload.unidades_por_caja = '1'; payload.unidades_por_blister = '1';
      payload.precio_venta_caja = '0.00'; payload.precio_venta_blister = '0.00';
    } else if (payload.tipo_presentacion === 'CAJA_UNIDAD') {
      payload.unidades_por_blister = '1'; payload.precio_venta_blister = '0.00';
    }

    const url = editandoId ? `http://127.0.0.1:8000/api/productos/${editandoId}/` : 'http://127.0.0.1:8000/api/productos/'
    const metodo = editandoId ? 'PUT' : 'POST'

    try {
      const res = await fetch(url, {
        method: metodo, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        Swal.fire('¡Éxito!', editandoId ? 'Producto actualizado' : 'Producto creado', 'success')
        setModalAbierto(false)
        cargarProductos()
      } else {
        const errorData = await res.json()
        Swal.fire('Error', JSON.stringify(errorData), 'error')
      }
    } catch (error) {
      Swal.fire('Error', 'No se pudo conectar con el servidor', 'error')
    }
  }

  const eliminarProducto = (id, nombre) => {
    Swal.fire({
      title: '¿Estás seguro?', text: `Vas a eliminar: ${nombre}`, icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const res = await fetch(`http://127.0.0.1:8000/api/productos/${id}/`, { method: 'DELETE' })
          if (res.ok) {
            Swal.fire('Eliminado', 'Producto borrado.', 'success'); cargarProductos()
          } else { Swal.fire('Error', 'No se pudo eliminar.', 'error') }
        } catch (error) { Swal.fire('Error', 'Problema de conexión.', 'error') }
      }
    })
  }

  return (
    <div className="flex flex-col h-full bg-gray-100 p-6 overflow-hidden">
      
      {/* ENCABEZADO */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Inventario</h1>
          <p className="text-gray-500">Gestiona tus medicamentos y existencias</p>
        </div>
        <button onClick={abrirModalCrear} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-bold shadow-md flex items-center transition-colors">
          <Plus className="w-5 h-5 mr-2" /> Nuevo Producto
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md flex flex-col flex-1 overflow-hidden">
        {/* BARRA DE HERRAMIENTAS (Buscador + Filtro) */}
        <div className="p-4 border-b flex gap-4 items-center bg-gray-50">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input 
              type="text" 
              className="w-full pl-10 p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white" 
              placeholder="Buscar producto por nombre o código..." 
              value={busqueda} 
              onChange={(e) => setBusqueda(e.target.value)} 
            />
          </div>
          
          {/* BOTÓN DE ALERTA DE STOCK */}
          <button 
            onClick={() => setFiltroBajoStock(!filtroBajoStock)}
            className={`flex items-center px-4 py-2 rounded-lg font-semibold transition-all duration-300 ${
              filtroBajoStock 
                ? 'bg-red-100 text-red-700 border-2 border-red-300 shadow-sm' 
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'
            }`}
          >
            <AlertTriangle className={`w-5 h-5 mr-2 ${filtroBajoStock ? 'text-red-600 animate-pulse' : 'text-gray-400'}`} />
            {filtroBajoStock ? 'Mostrando Recompras' : 'Ver Bajo Stock'}
          </button>
        </div>

        {/* TABLA */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white sticky top-0 shadow-sm z-10">
              <tr>
                <th className="p-4 border-b text-gray-600 font-semibold">Cód. Barras</th>
                <th className="p-4 border-b text-gray-600 font-semibold">Nombre</th>
                <th className="p-4 border-b text-gray-600 font-semibold text-center">Tipo</th>
                <th className="p-4 border-b text-gray-600 font-semibold text-center">Stock Físico</th>
                <th className="p-4 border-b text-center text-gray-600 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productosFiltrados.map(prod => (
                <tr key={prod.id} className="hover:bg-blue-50 border-b transition-colors">
                  <td className="p-4 text-gray-600 font-mono text-sm">{prod.codigo_barras || <span className="text-gray-400 italic">-</span>}</td>
                  <td className="p-4 font-bold text-gray-800">{prod.nombre}</td>
                  <td className="p-4 text-center">
                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold border">
                      {prod.tipo_presentacion === 'SIMPLE' ? 'UNIDAD' : prod.tipo_presentacion === 'CAJA_UNIDAD' ? 'CAJA/UND' : 'COMPLETO'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${prod.stock_actual_unidades <= prod.stock_minimo_alerta ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {prod.stock_actual_unidades} und.
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-3">
                      <button onClick={() => abrirModalEditar(prod)} className="text-blue-500 hover:text-blue-700 transition-colors"><Edit className="w-5 h-5" /></button>
                      <button onClick={() => eliminarProducto(prod.id, prod.nombre)} className="text-red-500 hover:text-red-700 transition-colors"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {productosFiltrados.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500 italic">
                    {filtroBajoStock 
                      ? "¡Excelente! No hay productos con bajo stock en este momento." 
                      : "No hay productos registrados o que coincidan con la búsqueda."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL INTELIGENTE (Permanece exactamente igual) */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            
            <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <Package className="mr-2 text-blue-600" /> 
                {editandoId ? 'Modificar Producto' : 'Registrar Nuevo Producto'}
              </h2>
              <button onClick={() => setModalAbierto(false)} className="text-gray-500 hover:text-red-600 font-bold text-xl">&times;</button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form id="formProducto" onSubmit={guardarProducto} className="grid grid-cols-2 gap-6">
                
                {/* COLUMNA IZQUIERDA */}
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-700 border-b pb-2">Información Principal</h3>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-600">Nombre del Producto *</label>
                    <input required name="nombre" value={formData.nombre} onChange={handleChange} type="text" className="w-full p-2 border rounded focus:border-blue-500 outline-none" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-600">Categoría *</label>
                      <select required name="categoria" value={formData.categoria} onChange={handleChange} className="w-full p-2 border rounded focus:border-blue-500 outline-none">
                        <option value="">- Seleccione -</option>
                        {categorias.map(c => (<option key={c.id} value={c.id}>{c.nombre}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-blue-700 flex items-center"><Layers className="w-4 h-4 mr-1"/> Comportamiento *</label>
                      <select required name="tipo_presentacion" value={formData.tipo_presentacion} onChange={handleChange} className="w-full p-2 border rounded border-blue-300 bg-blue-50 focus:border-blue-600 outline-none font-semibold text-blue-900">
                        <option value="SIMPLE">Unidad Simple</option>
                        <option value="CAJA_UNIDAD">Caja y Unidad</option>
                        <option value="COMPLETO">Pastillas (Caja, Blíster, Und)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-600 flex justify-between">Código de Barras</label>
                    <input name="codigo_barras" value={formData.codigo_barras} onChange={handleChange} type="text" placeholder="Escanea aquí..." className="w-full p-2 border rounded border-blue-300 focus:border-blue-600 outline-none" />
                  </div>

                  {formData.tipo_presentacion !== 'SIMPLE' && (
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded border">
                      {formData.tipo_presentacion === 'COMPLETO' && (
                        <div>
                          <label className="block text-sm font-semibold text-gray-600">Unidades x Blíster</label>
                          <input required name="unidades_por_blister" value={formData.unidades_por_blister} onChange={handleChange} type="number" min="1" className="w-full p-2 border rounded" />
                        </div>
                      )}
                      <div>
                        <label className="block text-sm font-semibold text-gray-600">Unidades x Caja</label>
                        <input required name="unidades_por_caja" value={formData.unidades_por_caja} onChange={handleChange} type="number" min="1" className="w-full p-2 border rounded" />
                      </div>
                    </div>
                  )}
                </div>

                {/* COLUMNA DERECHA */}
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-700 border-b pb-2">Finanzas y Stock</h3>
                  
                  <div>
                    <label className="block text-sm font-semibold text-gray-600 text-red-600">
                      Costo de Compra {formData.tipo_presentacion === 'SIMPLE' ? '(Por Unidad)' : '(Por Caja Entera)'} *
                    </label>
                    <input required name="precio_compra_caja" value={formData.precio_compra_caja} onChange={handleChange} type="number" step="0.01" className="w-full p-2 border rounded border-red-200" />
                  </div>

                  <div className={`grid ${formData.tipo_presentacion === 'COMPLETO' ? 'grid-cols-3' : formData.tipo_presentacion === 'CAJA_UNIDAD' ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}>
                    
                    {formData.tipo_presentacion !== 'SIMPLE' && (
                      <div>
                        <label className="block text-xs font-bold text-green-700">P. Venta Caja</label>
                        <input required name="precio_venta_caja" value={formData.precio_venta_caja} onChange={handleChange} type="number" step="0.01" className="w-full p-2 border rounded border-green-200" />
                      </div>
                    )}
                    
                    {formData.tipo_presentacion === 'COMPLETO' && (
                      <div>
                        <label className="block text-xs font-bold text-green-700">P. Venta Blíster</label>
                        <input name="precio_venta_blister" value={formData.precio_venta_blister} onChange={handleChange} type="number" step="0.01" className="w-full p-2 border rounded" />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-green-700">P. Venta Unidad</label>
                      <input name="precio_venta_unidad" value={formData.precio_venta_unidad} onChange={handleChange} type="number" step="0.01" className="w-full p-2 border rounded border-green-200" />
                    </div>
                  </div>

                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mt-4">
                    <h4 className="text-sm font-bold text-amber-800 flex items-center mb-2">
                      <AlertTriangle className="w-4 h-4 mr-1" /> Control Físico (En unidades min.)
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-600">Stock Actual</label>
                        <input required name="stock_actual_unidades" value={formData.stock_actual_unidades} onChange={handleChange} type="number" className="w-full p-2 border rounded" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-600">Stock Mínimo (Alerta)</label>
                        <input required name="stock_minimo_alerta" value={formData.stock_minimo_alerta} onChange={handleChange} type="number" className="w-full p-2 border rounded" />
                      </div>
                    </div>
                  </div>
                </div>

              </form>
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end gap-4">
              <button type="button" onClick={() => setModalAbierto(false)} className="px-6 py-2 text-gray-600 font-bold hover:bg-gray-200 rounded-lg transition-colors">Cancelar</button>
              <button type="submit" form="formProducto" className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-md transition-colors">{editandoId ? 'Actualizar Cambios' : 'Guardar Producto'}</button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}