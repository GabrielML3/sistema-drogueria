import { useState, useEffect, useMemo, useCallback } from 'react'
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

  const cargarVentas = useCallback(async () => {
    setCargando(true)
    try {
      const res = await clienteAxios.get('ventas/')
      setVentas(Array.isArray(res.data) ? res.data : [])
    } catch (error) {
      console.error('Error al cargar ventas:', error)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargarVentas()
  }, [cargarVentas])

  const reimprimirFactura = useCallback(async (venta) => {
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
  }, [])

  const eliminarItemFactura = useCallback(async (detalleId, productoNombre) => {
    if (!ventaSeleccionada) return
 
    const resSwal = await Swal.fire({
      title: `¿Devolver ${productoNombre}?`,
      text: 'Este producto regresará al inventario y el total de la factura se recalculará automáticamente.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, devolver producto',
      cancelButtonText: 'Cancelar'
    })

    if (resSwal.isConfirmed) {
      try {
        const res = await clienteAxios.post(
          `ventas/${ventaSeleccionada.id}/eliminar-item/`,
          { detalle_id: detalleId }
        )

        if (res.data.venta_eliminada) {
          await Swal.fire({
            title: 'Factura Anulada',
            text: 'Como devolviste todos los productos, la factura fue eliminada por completo.',
            icon: 'info',
            confirmButtonColor: '#2C46AF'
          })
          // Actualización O(N) en memoria sin recargar toda la red
          setVentas((prev) => prev.filter((v) => v.id !== ventaSeleccionada.id))
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
          const ventaActualizada = res.data.venta
          setVentaSeleccionada(ventaActualizada)
          setVentas((prev) =>
            prev.map((v) => (v.id === ventaActualizada.id ? ventaActualizada : v))
          )
        }
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
  }, [ventaSeleccionada])
  
  const anularVenta = useCallback(async (ventaId) => {
    const numFactura = ventaId.toString().padStart(5, '0') 
    const resultado = await Swal.fire({
      title: `¿Anular Factura #${numFactura}?`,
      text: 'Esta acción eliminará la factura completa y devolverá todos sus productos al inventario.',
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

        // Actualización inmediata en memoria sin descargar todo el historial de nuevo
        setVentas((prev) => prev.filter((v) => v.id !== ventaId))
        setVentaSeleccionada((prev) => (prev && prev.id === ventaId ? null : prev))
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
  }, [])

  // Pre-cálculo fuera del ciclo para reducir el costo por elemento a O(1)
  const ventasFiltradas = useMemo(() => {
    if (tipoFiltro === 'TODO') return ventas
 
    const hoy = new Date()
    const hoyDia = hoy.getDate()
    const hoyMes = hoy.getMonth()
    const hoyAnio = hoy.getFullYear()

    let exactAnio = 0, exactMes = 0, exactDia = 0
    if (tipoFiltro === 'FECHA_EXACTA' && fechaInicio) {
      const [y, m, d] = fechaInicio.split('-')
      exactAnio = parseInt(y, 10)
      exactMes = parseInt(m, 10) - 1
      exactDia = parseInt(d, 10)
    }

    let tsInicio = 0, tsFin = 0
    if (tipoFiltro === 'RANGO' && fechaInicio && fechaFin) {
      const [y1, m1, d1] = fechaInicio.split('-')
      const [y2, m2, d2] = fechaFin.split('-')
      tsInicio = new Date(parseInt(y1, 10), parseInt(m1, 10) - 1, parseInt(d1, 10), 0, 0, 0, 0).getTime()
      tsFin = new Date(parseInt(y2, 10), parseInt(m2, 10) - 1, parseInt(d2, 10), 23, 59, 59, 999).getTime()
    }

    return ventas.filter((venta) => {
      const fechaVenta = new Date(venta.fecha_hora)

      if (tipoFiltro === 'HOY') {
        return (
          fechaVenta.getDate() === hoyDia &&
          fechaVenta.getMonth() === hoyMes &&
          fechaVenta.getFullYear() === hoyAnio
        )
      }

      if (tipoFiltro === 'FECHA_EXACTA') {
        if (!fechaInicio) return true
        return (
          fechaVenta.getFullYear() === exactAnio &&
          fechaVenta.getMonth() === exactMes &&
          fechaVenta.getDate() === exactDia
        )
      }

      if (tipoFiltro === 'RANGO') {
        if (!fechaInicio || !fechaFin) return true
        const tsVenta = fechaVenta.getTime()
        return tsVenta >= tsInicio && tsVenta <= tsFin
      }

      return true
    })
  }, [ventas, tipoFiltro, fechaInicio, fechaFin])

  // Cálculo de totales en una sola pasada O(N) memorizada
  const { totalIngresos, totalGanancia, margenGanancia } = useMemo(() => {
    let ingresos = 0
    let ganancia = 0

    for (let i = 0; i < ventasFiltradas.length; i++) {
      ingresos += parseFloat(ventasFiltradas[i].total || 0)
      ganancia += parseFloat(ventasFiltradas[i].ganancia_neta || 0)
    }

    const margen = ingresos > 0 ? ((ganancia / ingresos) * 100).toFixed(1) : 0

    return {
      totalIngresos: ingresos,
      totalGanancia: ganancia,
      margenGanancia: margen
    }
  }, [ventasFiltradas])

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