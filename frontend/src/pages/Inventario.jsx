import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, AlertTriangle, Package, Layers, Barcode, Calculator } from 'lucide-react'
import Swal from 'sweetalert2'
import clienteAxios from '../api/axios'

// Importamos nuestros componentes de Nivel Senior
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function Inventario() {
  const [productos, setProductos] = useState([])
  const [categorias, setCategorias] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [modalAbierto, setModalAbierto] = useState(false)
  const [editandoId, setEditandoId] = useState(null)
  
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
      const res = await clienteAxios.get('productos/')
      setProductos(res.data)
    } catch (error) { console.error("Error cargando productos:", error) }
  }

  const cargarCategorias = async () => {
    try {
      const res = await clienteAxios.get('categorias/')
      setCategorias(res.data)
    } catch (error) { console.error("Error cargando categorias:", error) }
  }

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

  // SOLUCIÓN 1: Protección contra valores nulos al editar
  const abrirModalEditar = (prod) => {
    setEditandoId(prod.id)
    setFormData({
      nombre: prod.nombre, 
      categoria: prod.categoria,
      codigo_barras: prod.codigo_barras || '', 
      tipo_presentacion: prod.tipo_presentacion || 'COMPLETO',
      precio_compra_caja: prod.precio_compra_caja || '0.00', 
      precio_venta_caja: prod.precio_venta_caja || '0.00',
      precio_venta_blister: prod.precio_venta_blister || '0.00', 
      precio_venta_unidad: prod.precio_venta_unidad || '0.00',
      unidades_por_blister: (prod.unidades_por_blister || 1).toString(), 
      unidades_por_caja: (prod.unidades_por_caja || 1).toString(),
      stock_actual_unidades: (prod.stock_actual_unidades || 0).toString(), 
      stock_minimo_alerta: (prod.stock_minimo_alerta || 5).toString()
    })
    setModalAbierto(true)
  }

  // SOLUCIÓN 2: Limpieza de datos antes de crear/actualizar
  const guardarProducto = async (e) => {
    e.preventDefault()
    if (!formData.categoria) {
      Swal.fire('Atención', 'Debes seleccionar una categoría', 'warning')
      return
    }

    const payload = { ...formData };
    
    // Forzamos a que si un campo de precio está vacío, envíe '0.00' al backend
    payload.precio_compra_caja = payload.precio_compra_caja || '0.00';
    payload.precio_venta_caja = payload.precio_venta_caja || '0.00';
    payload.precio_venta_blister = payload.precio_venta_blister || '0.00';
    payload.precio_venta_unidad = payload.precio_venta_unidad || '0.00';
    payload.stock_actual_unidades = payload.stock_actual_unidades || '0';
    payload.stock_minimo_alerta = payload.stock_minimo_alerta || '5';

    if (payload.tipo_presentacion === 'SIMPLE') {
      payload.unidades_por_caja = '1'; payload.unidades_por_blister = '1';
      payload.precio_venta_caja = '0.00'; payload.precio_venta_blister = '0.00';
    } else if (payload.tipo_presentacion === 'CAJA_UNIDAD') {
      payload.unidades_por_blister = '1'; payload.precio_venta_blister = '0.00';
    }

    try {
      if (editandoId) {
        await clienteAxios.put(`productos/${editandoId}/`, payload)
      } else {
        await clienteAxios.post('productos/', payload)
      }

      Swal.fire('Operación Exitosa', editandoId ? 'Producto y stock actualizados' : 'Producto creado correctamente', 'success')
      setModalAbierto(false)
      cargarProductos()
    } catch (error) {
      const errorMsg = error.response?.data ? JSON.stringify(error.response.data) : 'No se pudo conectar con el servidor'
      Swal.fire('Error al guardar', errorMsg, 'error')
    }
  }

  // SOLUCIÓN 3: Explicar por qué Django bloquea la eliminación
  const eliminarProducto = (id, nombre) => {
    Swal.fire({
      title: '¿Estás seguro?', text: `Vas a eliminar permanentemente: ${nombre}`, icon: 'warning',
      showCancelButton: true, confirmButtonColor: '#d33', cancelButtonColor: '#3085d6',
      confirmButtonText: 'Sí, eliminar', cancelButtonText: 'Cancelar'
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await clienteAxios.delete(`productos/${id}/`)
          Swal.fire('Eliminado', 'Producto borrado del inventario.', 'success')
          cargarProductos()
        } catch (error) { 
          // Si Django lanza error 500, es porque el producto tiene facturas asociadas
          const status = error.response?.status;
          if (status === 500 || status === 400 || status === 403) {
            Swal.fire('Acción Denegada', 'No puedes eliminar un producto que ya tiene ventas registradas porque dañaría la contabilidad. Si ya no lo vendes, edítalo y pon su stock en 0.', 'error')
          } else {
            Swal.fire('Error', 'Problema de conexión al eliminar el producto.', 'error') 
          }
        }
      }
    })
  }

  // NUEVA FUNCIÓN: Cálculo de Capital Invertido
  const calcularValorInventario = () => {
    const totalInvertido = productos.reduce((suma, prod) => {
      const precioCompra = parseFloat(prod.precio_compra_caja) || 0;
      const unidadesPorCaja = parseInt(prod.unidades_por_caja) || 1;
      const stockActual = parseInt(prod.stock_actual_unidades) || 0;

      // Dividimos el costo de la caja entre las unidades para saber el costo real de cada pastilla física en stock
      const costoPorUnidad = unidadesPorCaja > 0 ? (precioCompra / unidadesPorCaja) : 0;
      
      return suma + (costoPorUnidad * stockActual);
    }, 0);

    Swal.fire({
      title: 'Capital en Inventario',
      html: `
        <p class="text-gray-600 mb-2">El dinero total invertido en la mercancía física actual es de:</p>
        <h2 class="text-4xl font-bold text-[#2C46AF] mt-4 mb-2">$${totalInvertido.toLocaleString('es-CO')}</h2>
      `,
      icon: 'info',
      confirmButtonColor: '#2C46AF',
      confirmButtonText: 'Entendido'
    });
  };

  return (
    <div className="flex flex-col h-full bg-gray-100 p-6 overflow-hidden">
      
      {/* ENCABEZADO */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Inventario</h1>
          <p className="text-gray-500">Gestiona tus medicamentos y existencias</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={calcularValorInventario} icon={Calculator}>
            Calcular Inversión
          </Button>
          <Button onClick={abrirModalCrear} icon={Plus}>
            Nuevo Producto
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md flex flex-col flex-1 overflow-hidden">
        {/* BARRA DE HERRAMIENTAS */}
        <div className="p-4 border-b flex gap-4 items-center bg-gray-50">
          
          <Input 
            placeholder="Buscar producto por nombre o código..." 
            value={busqueda} 
            onChange={(e) => setBusqueda(e.target.value)}
            icon={Search}
            className="flex-1 max-w-md"
          />
          
          <button  
            onClick={() => setFiltroBajoStock(!filtroBajoStock)}
            className={`flex items-center px-4 py-2.5 rounded-lg font-semibold transition-all duration-300 ${
              filtroBajoStock 
                ? 'bg-red-100 text-red-700 border border-red-300 shadow-sm' 
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
                      ? "El inventario se encuentra estable. No hay alertas." 
                      : "No se encontraron productos."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL INTELIGENTE (Ahora con Componentes UI) */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
            
            <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-800 flex items-center">
                <Package className="mr-2 text-[#2C46AF]" /> 
                {editandoId ? 'Modificar Producto' : 'Registrar Nuevo Producto'}
              </h2>
              <button onClick={() => setModalAbierto(false)} className="text-gray-500 hover:text-red-600 font-bold text-xl transition-colors">&times;</button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <form id="formProducto" onSubmit={guardarProducto} className="grid grid-cols-2 gap-6">
                
                {/* COLUMNA IZQUIERDA */}
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-700 border-b pb-2">Información Principal</h3>
                  
                  <Input required name="nombre" value={formData.nombre} onChange={handleChange} label="Nombre del Producto" placeholder="Ej. Acetaminofén 500mg" />

                  <div className="grid grid-cols-2 gap-4">
                    {/* Los Selects los mantenemos nativos pero con el estilo de nuestros inputs (p-2.5) */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-600 mb-1">Categoría <span className="text-red-500">*</span></label>
                      <select required name="categoria" value={formData.categoria} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#2C46AF] focus:ring-1 focus:ring-[#2C46AF] bg-white">
                        <option value="">- Seleccione -</option>
                        {categorias.map(c => (<option key={c.id} value={c.id}>{c.nombre}</option>))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-blue-700 flex items-center mb-1"><Layers className="w-4 h-4 mr-1"/> Comportamiento <span className="text-red-500">*</span></label>
                      <select required name="tipo_presentacion" value={formData.tipo_presentacion} onChange={handleChange} className="w-full p-2.5 border border-[#2C46AF] rounded-lg bg-blue-50 focus:outline-none focus:border-[#1E3185] focus:ring-1 focus:ring-[#1E3185] font-semibold text-[#1E3185]">
                        <option value="SIMPLE">Unidad Simple</option>
                        <option value="CAJA_UNIDAD">Caja y Unidad</option>
                        <option value="COMPLETO">Pastillas (Caja, Blíster, Und)</option>
                      </select>
                    </div>
                  </div>

                  <Input name="codigo_barras" value={formData.codigo_barras} onChange={handleChange} label="Código de Barras" icon={Barcode} placeholder="Escanea aquí..." />

                  {formData.tipo_presentacion !== 'SIMPLE' && (
                    <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded border">
                      {formData.tipo_presentacion === 'COMPLETO' && (
                        <Input required type="number" min="1" name="unidades_por_blister" value={formData.unidades_por_blister} onChange={handleChange} label="Unidades x Blíster" />
                      )}
                      <Input required type="number" min="1" name="unidades_por_caja" value={formData.unidades_por_caja} onChange={handleChange} label="Unidades x Caja" />
                    </div>
                  )}
                </div>

                {/* COLUMNA DERECHA */}
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-700 border-b pb-2">Finanzas y Stock</h3>
                  
                  <Input required type="number" step="0.01" name="precio_compra_caja" value={formData.precio_compra_caja} onChange={handleChange} label={`Costo Compra ${formData.tipo_presentacion === 'SIMPLE' ? '(Unidad)' : '(Caja)'}`} />

                  <div className={`grid ${formData.tipo_presentacion === 'COMPLETO' ? 'grid-cols-3' : formData.tipo_presentacion === 'CAJA_UNIDAD' ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}> 
                    {formData.tipo_presentacion !== 'SIMPLE' && (
                      <Input required type="number" step="0.01" name="precio_venta_caja" value={formData.precio_venta_caja} onChange={handleChange} label="P. Venta Caja" />
                    )} 
                    {formData.tipo_presentacion === 'COMPLETO' && (
                      <Input type="number" step="0.01" name="precio_venta_blister" value={formData.precio_venta_blister} onChange={handleChange} label="P. Venta Blíster" />
                    )}
                    <Input type="number" step="0.01" name="precio_venta_unidad" value={formData.precio_venta_unidad} onChange={handleChange} label="P. Venta Unidad" />
                  </div>

                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mt-4">
                    <h4 className="text-sm font-bold text-amber-800 flex items-center mb-3">
                      <AlertTriangle className="w-4 h-4 mr-1" /> Control Físico (En unidades min.)
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <Input required type="number" name="stock_actual_unidades" value={formData.stock_actual_unidades} onChange={handleChange} label="Stock Actual" />
                      <Input required type="number" name="stock_minimo_alerta" value={formData.stock_minimo_alerta} onChange={handleChange} label="Stock Mínimo" />
                    </div>
                  </div>
                </div>

              </form>
            </div>

            <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setModalAbierto(false)}>
                Cancelar
              </Button>
              <Button type="submit" form="formProducto" variant="primary">
                {editandoId ? 'Actualizar Cambios' : 'Guardar Producto'}
              </Button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}