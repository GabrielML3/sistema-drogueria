import { useState, useEffect } from 'react'
import Swal from 'sweetalert2'
import clienteAxios from '../../../api/axios'
import { imprimirTicket } from '../../../services/printerService'

export function useContabilidad() {
  const [ventas, setVentas] = useState([])
  const [cargando, setCargando] = useState(true)
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null)
  const [tipoFiltro, setTipoFiltro] = useState('HOY')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [imprimiendo, setImprimiendo] = useState(false)

  useEffect(() => {
    cargarVentas()
  }, [])

  const cargarVentas = async () => {
    try {
      const res = await clienteAxios.get('ventas/')
      setVentas(res.data)
    } catch (error) {
      console.error(error)
    } finally {
      setCargando(false)
    }
  }

  const reimprimirFactura = async (venta) => {
    setImprimiendo(true)
    try {
      await imprimirTicket(venta)
      Swal.fire({
        title: '¡Factura Impresa!',
        text: `Factura #${venta.id.toString().padStart(5, '0')} enviada a la impresora.`,
        icon: 'success',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      })
    } catch (error) {
      console.error(error)
      Swal.fire({
        title: 'Error de Impresión',
        text: 'No se pudo conectar con la impresora QZ Tray. Revisa que el programa esté abierto.',
        icon: 'error',
        confirmButtonColor: '#2C46AF'
      })
    } finally {
      setImprimiendo(false)
    }
  }

  const eliminarItemFactura = async (detalleId, productoNombre) => {
    const resSwal = await Swal.fire({
      title: `¿Devolver ${productoNombre}?`,
      text: "Este producto regresará al inventario y el total de la factura se recalculará automáticamente.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, devolver producto',
      cancelButtonText: 'Cancelar'
    })

    if (resSwal.isConfirmed) {
      try {
        const res = await clienteAxios.post(`ventas/${ventaSeleccionada.id}/eliminar-item/`, { detalle_id: detalleId })
        
        if (res.data.venta_eliminada) {
          await Swal.fire({
            title: 'Factura Anulada',
            text: 'Como devolviste todos los productos, la factura fue eliminada por completo.',
            icon: 'info',
            confirmButtonColor: '#2C46AF'
          })
          setVentaSeleccionada(null)
        } else {
          await Swal.fire({
            title: 'Producto Devuelto',
            text: 'El inventario y la contabilidad fueron recalculados correctamente.',
            icon: 'success',
            toast: true,
            position: 'top-end',
            showConfirmButton: false,
            timer: 3000,
            timerProgressBar: true
          })
          setVentaSeleccionada(res.data.venta)
        }
        cargarVentas()
      } catch (error) {
        console.error(error)
        Swal.fire({
          title: 'Error',
          text: 'No se pudo devolver el producto.',
          icon: 'error',
          confirmButtonColor: '#2C46AF'
        })
      }
    }
  }

  const anularVenta = async (ventaId) => {
    const numFactura = ventaId.toString().padStart(5, '0')

    const resultado = await Swal.fire({
      title: `¿Anular Factura #${numFactura}?`,
      text: "Esta acción eliminará la factura completa y devolverá todos sus productos al inventario.",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, anular todo',
      cancelButtonText: 'Cancelar'
    })

    if (resultado.isConfirmed) {
      try {
        await clienteAxios.delete(`ventas/${ventaId}/`)
        
        await Swal.fire({
          title: '¡Factura Anulada!',
          text: `La Factura #${numFactura} fue eliminada y todo el stock regresó al inventario.`,
          icon: 'success',
          confirmButtonColor: '#2C46AF'
        })
        
        if (ventaSeleccionada && ventaSeleccionada.id === ventaId) {
          setVentaSeleccionada(null)
        }
        
        cargarVentas()
      } catch (error) {
        console.error(error)
        Swal.fire({
          title: 'Error al Anular',
          text: 'Hubo un inconveniente al procesar la anulación.',
          icon: 'error',
          confirmButtonColor: '#2C46AF'
        })
      }
    }
  }

  const ventasFiltradas = ventas.filter(venta => { 
    if (tipoFiltro === 'TODO') return true

    const fechaVenta = new Date(venta.fecha_hora) 
    const hoy = new Date()

    if (tipoFiltro === 'HOY') {
      return fechaVenta.getDate() === hoy.getDate() &&
             fechaVenta.getMonth() === hoy.getMonth() &&
             fechaVenta.getFullYear() === hoy.getFullYear()
    }

    if (tipoFiltro === 'FECHA_EXACTA') {
      if (!fechaInicio) return true
      const [y, m, d] = fechaInicio.split('-') 
      return fechaVenta.getFullYear() === parseInt(y) &&
             fechaVenta.getMonth() === parseInt(m) - 1 &&
             fechaVenta.getDate() === parseInt(d)
    }

    if (tipoFiltro === 'RANGO') {
      if (!fechaInicio || !fechaFin) return true
      const inicio = new Date(fechaInicio)
      inicio.setHours(0, 0, 0, 0) 
      
      const fin = new Date(fechaFin)
      fin.setHours(23, 59, 59, 999) 

      return fechaVenta >= inicio && fechaVenta <= fin
    }

    return true
  })

  const totalIngresos = ventasFiltradas.reduce((sum, v) => sum + parseFloat(v.total || 0), 0) 
  const totalGanancia = ventasFiltradas.reduce((sum, v) => sum + parseFloat(v.ganancia_neta || 0), 0)
  const margenGanancia = totalIngresos > 0 ? ((totalGanancia / totalIngresos) * 100).toFixed(1) : 0

  return {
    cargando,
    ventasFiltradas,
    ventaSeleccionada,
    setVentaSeleccionada,
    tipoFiltro,
    setTipoFiltro,
    fechaInicio,
    setFechaInicio,
    fechaFin,
    setFechaFin,
    imprimiendo,
    totalIngresos,
    totalGanancia,
    margenGanancia,
    reimprimirFactura,
    eliminarItemFactura,
    anularVenta
  }
}