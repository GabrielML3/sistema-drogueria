import { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import clienteAxios from '../../../api/axios'

export function useInventario() {
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
    } catch (error) {
      console.error(error)
    }
  }

  const cargarCategorias = async () => {
    try {
      const res = await clienteAxios.get('categorias/')
      setCategorias(res.data)
    } catch (error) {
      console.error(error)
    }
  }

  const productosFiltrados = productos.filter(p => { 
    const coincideBusqueda = p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
                             (p.codigo_barras && p.codigo_barras.includes(busqueda))
    const coincideStock = filtroBajoStock ? p.stock_actual_unidades <= p.stock_minimo_alerta : true
    return coincideBusqueda && coincideStock
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
      nombre: prod.nombre, 
      categoria: prod.categoria,
      codigo_barras: prod.codigo_barras || '', 
      tipo_presentacion: prod.tipo_presentacion || 'COMPLETO',
      precio_compra_caja: prod.precio_compra_caja || '0.00', 
      precio_venta_caja: prod.precio_venta_caja || '0.00',
      precio_venta_blister: prod.precio_venta_blister || '0.00', 
      precio_venta_unidad: prod.precio_venta_unidad || '0.00',
      unidades_por_blister: (prod.unidades_por_blister ?? 1).toString(), 
      unidades_por_caja: (prod.unidades_por_caja ?? 1).toString(),
      stock_actual_unidades: (prod.stock_actual_unidades ?? 0).toString(), 
      stock_minimo_alerta: (prod.stock_minimo_alerta ?? 5).toString()
    })
    setModalAbierto(true)
  }

  const guardarProducto = async (e) => {
    e.preventDefault()
    if (!formData.categoria) {
      Swal.fire('Atención', 'Debes seleccionar una categoría', 'warning')
      return
    }

    const payload = { ...formData }
    
    payload.precio_compra_caja = payload.precio_compra_caja || '0.00'
    payload.precio_venta_caja = payload.precio_venta_caja || '0.00'
    payload.precio_venta_blister = payload.precio_venta_blister || '0.00'
    payload.precio_venta_unidad = payload.precio_venta_unidad || '0.00'
    payload.stock_actual_unidades = payload.stock_actual_unidades !== '' ? payload.stock_actual_unidades : '0'
    payload.stock_minimo_alerta = payload.stock_minimo_alerta !== '' ? payload.stock_minimo_alerta : '5'

    if (payload.tipo_presentacion === 'SIMPLE') {
      payload.unidades_por_caja = '1'; payload.unidades_por_blister = '1'
      payload.precio_venta_caja = '0.00'; payload.precio_venta_blister = '0.00'
    } else if (payload.tipo_presentacion === 'CAJA_UNIDAD') {
      payload.unidades_por_blister = '1'; payload.precio_venta_blister = '0.00'
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
          const status = error.response?.status
          if (status === 500 || status === 400 || status === 403) {
            Swal.fire('Acción Denegada', 'No puedes eliminar un producto que ya tiene ventas registradas porque dañaría la contabilidad. Si ya no lo vendes, edítalo y pon su stock en 0.', 'error')
          } else {
            Swal.fire('Error', 'Problema de conexión al eliminar el producto.', 'error') 
          }
        }
      }
    })
  }

  const calcularValorInventario = () => { 
    const totalInvertido = productos.reduce((suma, prod) => {
      const precioCompra = parseFloat(prod.precio_compra_caja) || 0
      const unidadesPorCaja = parseInt(prod.unidades_por_caja) || 1
      const stockActual = parseInt(prod.stock_actual_unidades) || 0

      const costoPorUnidad = unidadesPorCaja > 0 ? (precioCompra / unidadesPorCaja) : 0 
      
      return suma + (costoPorUnidad * stockActual)
    }, 0)

    Swal.fire({
      title: 'Capital en Inventario',
      html: `
        <p class="text-gray-600 mb-2">El dinero total invertido en la mercancía física actual es de:</p>
        <h2 class="text-4xl font-bold text-[#2C46AF] mt-4 mb-2">$${totalInvertido.toLocaleString('es-CO')}</h2>
      `,
      icon: 'info',
      confirmButtonColor: '#2C46AF',
      confirmButtonText: 'Entendido'
    })
  }

  return {
    categorias,
    busqueda,
    setBusqueda,
    modalAbierto,
    setModalAbierto,
    editandoId,
    filtroBajoStock,
    setFiltroBajoStock,
    formData,
    productosFiltrados,
    handleChange,
    abrirModalCrear,
    abrirModalEditar,
    guardarProducto,
    eliminarProducto,
    calcularValorInventario
  }
}