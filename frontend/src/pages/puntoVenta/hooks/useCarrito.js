import { useState, useEffect, useMemo, useRef } from 'react'
import Swal from 'sweetalert2'
import clienteAxios from '../../../api/axios'
import { imprimirTicket, abrirCajon } from '../../../services/printerService'

export function useCarrito() {
  const [busqueda, setBusqueda] = useState('')
  const [carrito, setCarrito] = useState([])
  const [cargando, setCargando] = useState(false)
  const [todosLosProductos, setTodosLosProductos] = useState([])

  const buscadorRef = useRef(null)

  const enfocarBuscador = () => {
    if (buscadorRef.current) {
      buscadorRef.current.focus()
      buscadorRef.current.select?.()
    } else {
      const input = document.querySelector('input[name="busqueda"]')
      input?.focus()
      input?.select()
    }
  }

  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const res = await clienteAxios.get('productos/')
        setTodosLosProductos(res.data)
      } catch (error) {
        console.error(error)
      }
    }

    cargarProductos()

    setTimeout(() => {
      enfocarBuscador()
    }, 100)
  }, [])

  const resultados = useMemo(() => {
    if (!busqueda.trim()) return []
    const termino = busqueda.toLowerCase().trim()
    return todosLosProductos.filter(
      producto =>
        producto.nombre.toLowerCase().includes(termino) ||
        producto.codigo_barras?.toLowerCase().includes(termino)
    )
  }, [busqueda, todosLosProductos])

  const agregarAlCarrito = (producto, tipoUnidad, precio, cantidad = 1) => {
    const idUnico = `${producto.id}-${tipoUnidad}`
    setCarrito(prev => {
      const existe = prev.find(item => item.idUnico === idUnico)
      if (existe) {
        return prev.map(item =>
          item.idUnico === idUnico
            ? { ...item, cantidad: item.cantidad + cantidad }
            : item
        )
      }
      return [...prev, { ...producto, idUnico, tipo_unidad: tipoUnidad, precioVentaReal: precio, cantidad }]
    })
    setBusqueda('')
    setTimeout(enfocarBuscador, 50)
  }

  const actualizarCantidad = (idUnico, delta) => {
    setCarrito(prev =>
      prev.map(item =>
        item.idUnico === idUnico
          ? { ...item, cantidad: Math.max(1, item.cantidad + delta) }
          : item
      )
    )
  }

  const fijarCantidadDirecta = (idUnico, valorTexto) => {
    setCarrito(prev =>
      prev.map(item => {
        if (item.idUnico === idUnico) {
          const num = parseInt(valorTexto, 10)
          const nuevaCantidad = isNaN(num) || num < 1 ? 1 : num
          return { ...item, cantidad: nuevaCantidad }
        }
        return item
      })
    )
  }

  const eliminarDelCarrito = idUnico => {
    setCarrito(prev => prev.filter(item => item.idUnico !== idUnico))
    enfocarBuscador()
  }

  const limpiarCarrito = () => {
    setCarrito([])
    enfocarBuscador()
  }

  const totalPagar = useMemo(() => {
    return carrito.reduce((sum, item) => sum + parseFloat(item.precioVentaReal) * item.cantidad, 0)
  }, [carrito])

  const finalizarVenta = totalRegistrado => {
    Swal.fire({
      title: 'Facturación Exitosa',
      text: `El total cobrado es de $${Number(totalRegistrado).toLocaleString()}`,
      icon: 'success',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#16a34a',
      didClose: () => {
        setTimeout(enfocarBuscador, 50)
      }
    })
    setCarrito([])
    setBusqueda('')
    setCargando(false)
  }

  const facturarVenta = async (imprimir = false) => {
    if (carrito.length === 0) return

    const confirmacion = await Swal.fire({
      title: imprimir ? '¿Imprimir y Facturar?' : '¿Cobrar Venta?',
      text: `Estás a punto de registrar una venta por $${totalPagar.toLocaleString()}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, registrar',
      cancelButtonText: 'Cancelar',
      didClose: () => {
        enfocarBuscador()
      }
    })

    if (!confirmacion.isConfirmed) return

    setCargando(true)

    const payload = {
      items: carrito.map(item => ({
        id: item.id,
        tipo_unidad: item.tipo_unidad,
        cantidad: item.cantidad
      }))
    }

    try {
      const res = await clienteAxios.post('ventas/procesar/', payload)

      if (imprimir) {
        await imprimirTicket({
          id: res.data.venta_id,
          total: totalPagar,
          items: carrito
        })
      } else {
        await abrirCajon()
      }

      finalizarVenta(res.data.total)
    } catch (error) {
      const mensajeError = error.response?.data?.error || 'Asegúrate de tener la app QZ Tray abierta en tu PC.'
      Swal.fire({
        title: 'Error en la venta',
        text: mensajeError,
        icon: 'warning',
        confirmButtonColor: '#eab308',
        didClose: () => {
          enfocarBuscador()
        }
      })
      setCargando(false)
    }
  }

  return {
    busqueda,
    setBusqueda,
    carrito,
    cargando,
    resultados,
    totalPagar,
    buscadorRef,
    enfocarBuscador,
    agregarAlCarrito,
    actualizarCantidad,
    fijarCantidadDirecta,
    eliminarDelCarrito,
    limpiarCarrito,
    facturarVenta
  }
}