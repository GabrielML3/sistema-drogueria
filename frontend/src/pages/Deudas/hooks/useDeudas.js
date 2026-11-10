import { useState, useEffect, useMemo, useCallback } from 'react'
import Swal from 'sweetalert2'
import clienteAxios from '../../../api/axios'
import { imprimirTicketDeuda } from '../../../services/printerService'

export function useDeudas() {
  const [deudas, setDeudas] = useState([])
  const [clientes, setClientes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('PENDIENTE')
  const [deudaSeleccionada, setDeudaSeleccionada] = useState(null)
  const [imprimiendo, setImprimiendo] = useState(false)

  const cargarDatos = useCallback(async () => {
    setCargando(true)
    try {
      const [resDeudas, resClientes] = await Promise.all([
        clienteAxios.get('deudas/'),
        clienteAxios.get('clientes-deudores/')
      ])
      setDeudas(Array.isArray(resDeudas.data) ? resDeudas.data : [])
      setClientes(Array.isArray(resClientes.data) ? resClientes.data : [])
    } catch (error) {
      console.error('Error al cargar deudas:', error)
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  const imprimirEstadoDeuda = useCallback(async (deuda) => {
    setImprimiendo(true)
    try {
      await imprimirTicketDeuda(deuda, false)
      Swal.fire({
        title: '¡Estado de Cuenta Impreso!',
        text: `Comprobante de ${deuda.cliente_nombre} enviado a la impresora.`,
        icon: 'success',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true
      })
    } catch (error) {
      Swal.fire({
        title: 'Error de Impresión',
        text: 'No se pudo conectar con QZ Tray. Verifica que esté abierto.',
        icon: 'error',
        confirmButtonColor: '#2C46AF'
      })
    } finally {
      setImprimiendo(false)
    }
  }, [])

  const abonarDeuda = useCallback(async (deuda) => {
    const saldoPendiente = parseFloat(deuda.saldo_pendiente)
    const { value: montoIngresado } = await Swal.fire({
      title: `Abonar a ${deuda.cliente_nombre}`,
      html: `
        <div class="text-left text-sm space-y-1 bg-slate-50 p-3 rounded-lg border mb-3">
          <p><strong>Total Deuda:</strong> $${parseFloat(deuda.total).toLocaleString()}</p>
          <p><strong>Abonado hasta hoy:</strong> $${parseFloat(deuda.monto_abonado).toLocaleString()}</p>
          <p class="text-base text-amber-700 font-bold"><strong>Saldo Restante:</strong> $${saldoPendiente.toLocaleString()}</p>
        </div>
      `,
      input: 'number',
      inputPlaceholder: 'Escribe el valor del abono ($)',
      inputAttributes: {
        min: 1,
        max: saldoPendiente,
        step: 'any'
      },
      showCancelButton: true,
      confirmButtonColor: '#2C46AF',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Registrar Abono',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        const num = parseFloat(value)
        if (!value || isNaN(num) || num <= 0) {
          return 'Ingresa un valor válido mayor a $0'
        }
        if (num > saldoPendiente) {
          return `El abono no puede superar el saldo pendiente ($${saldoPendiente.toLocaleString()})`
        }
      }
    })

    if (!montoIngresado) return

    try {
      const res = await clienteAxios.post(`deudas/${deuda.id}/abonar/`, {
        monto: parseFloat(montoIngresado)
      })

      const deudaActualizada = res.data.deuda
      setDeudas((prev) =>
        prev.map((d) => (d.id === deudaActualizada.id ? deudaActualizada : d))
      )
      setDeudaSeleccionada((prev) =>
        prev && prev.id === deudaActualizada.id ? deudaActualizada : prev
      )

      if (res.data.liquidada) {
        await Swal.fire({
          title: '¡Deuda Pagada por Completo!',
          text: res.data.enviada_a_contabilidad
            ? 'El saldo quedó en $0 y la venta se envió automáticamente a la Contabilidad de hoy.'
            : 'El saldo manual quedó en $0 (Paz y Salvo).',
          icon: 'success',
          confirmButtonColor: '#16a34a'
        })
      } else {
        await Swal.fire({
          title: 'Abono Registrado',
          text: `Nuevo saldo pendiente: $${parseFloat(deudaActualizada.saldo_pendiente).toLocaleString()}`,
          icon: 'success',
          confirmButtonColor: '#2C46AF'
        })
      }
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.error || 'No se pudo registrar el abono.',
        icon: 'error',
        confirmButtonColor: '#2C46AF'
      })
    }
  }, [])

  const cobrarDeudaCompleta = useCallback(async (deuda) => {
    const saldo = parseFloat(deuda.saldo_pendiente)
    const confirmacion = await Swal.fire({
      title: `¿Cobrar Saldo Total ($${saldo.toLocaleString()})?`,
      text:
        deuda.tipo_deuda === 'POS'
          ? `Al confirmar, la deuda de ${deuda.cliente_nombre} quedará pagada y el ingreso se registrará hoy en Contabilidad.`
          : `Al confirmar, el saldo pendiente de ${deuda.cliente_nombre} quedará en Paz y Salvo.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, cobrar todo',
      cancelButtonText: 'Cancelar'
    })

    if (!confirmacion.isConfirmed) return

    try {
      const res = await clienteAxios.post(`deudas/${deuda.id}/liquidar/`)
      const deudaActualizada = res.data.deuda

      setDeudas((prev) =>
        prev.map((d) => (d.id === deudaActualizada.id ? deudaActualizada : d))
      )
      setDeudaSeleccionada((prev) =>
        prev && prev.id === deudaActualizada.id ? deudaActualizada : prev
      )

      const resImprimir = await Swal.fire({
        title: '¡Cuenta Pagada con Éxito!',
        text: res.data.enviada_a_contabilidad
          ? 'La factura ya fue enviada a la Contabilidad del día de hoy. ¿Deseas imprimir el recibo de Paz y Salvo?'
          : 'El saldo manual fue liquidado. ¿Deseas imprimir el recibo de Paz y Salvo?',
        icon: 'success',
        showCancelButton: true,
        confirmButtonColor: '#2C46AF',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Imprimir Paz y Salvo',
        cancelButtonText: 'Cerrar'
      })

      if (resImprimir.isConfirmed) {
        await imprimirTicketDeuda(deudaActualizada, true)
      }
    } catch (error) {
      Swal.fire({
        title: 'Error al Cobrar',
        text: error.response?.data?.error || 'Ocurrió un inconveniente al liquidar la deuda.',
        icon: 'error',
        confirmButtonColor: '#2C46AF'
      })
    }
  }, [])

  const crearDeudaManual = useCallback(async (datosFormulario) => {
    try {
      const res = await clienteAxios.post('deudas/registrar-manual/', datosFormulario)
      setDeudas((prev) => [res.data.deuda, ...prev])
      cargarDatos()

      Swal.fire({
        title: '¡Saldo Registrado!',
        text: 'El saldo pendiente representativo se guardó correctamente (no alterará Contabilidad).',
        icon: 'success',
        confirmButtonColor: '#2C46AF'
      })
      return true
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: error.response?.data?.error || 'No se pudo registrar el saldo manual.',
        icon: 'error',
        confirmButtonColor: '#2C46AF'
      })
      return false
    }
  }, [cargarDatos])

  const eliminarDeuda = useCallback(async (deuda) => {
    const esPosPendiente = deuda.tipo_deuda === 'POS' && deuda.estado === 'PENDIENTE'

    const resultado = await Swal.fire({
      title: `¿Eliminar registro de ${deuda.cliente_nombre}?`,
      text: esPosPendiente
        ? 'Como esta deuda tiene productos pendientes de pago, los medicamentos regresarán automáticamente al stock.'
        : 'Este registro será eliminado del historial.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#dc2626',
      cancelButtonColor: '#6b7280',
      confirmButtonText: 'Sí, eliminar',
      cancelButtonText: 'Cancelar'
    })

    if (!resultado.isConfirmed) return

    try {
      await clienteAxios.delete(`deudas/${deuda.id}/?devolver_stock=true`)
      setDeudas((prev) => prev.filter((d) => d.id !== deuda.id))
      setDeudaSeleccionada((prev) => (prev && prev.id === deuda.id ? null : prev))

      Swal.fire({
        title: 'Eliminado',
        text: esPosPendiente
          ? 'La deuda fue eliminada y los productos regresaron al inventario.'
          : 'El registro fue eliminado.',
        icon: 'success',
        toast: true,
        position: 'top-end',
        showConfirmButton: false,
        timer: 3000
      })
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: 'No se pudo eliminar el registro.',
        icon: 'error',
        confirmButtonColor: '#2C46AF'
      })
    }
  }, [])

  const deudasFiltradas = useMemo(() => {
    const termino = busqueda.toLowerCase().trim()
    return deudas.filter((d) => {
      const coincideEstado = filtroEstado === 'TODOS' ? true : d.estado === filtroEstado
      const coincideTexto =
        !termino ||
        (d.cliente_nombre && d.cliente_nombre.toLowerCase().includes(termino)) ||
        (d.descripcion_manual && d.descripcion_manual.toLowerCase().includes(termino)) ||
        d.id.toString().includes(termino)
      return coincideEstado && coincideTexto
    })
  }, [deudas, busqueda, filtroEstado])

  const { totalPorCobrar, totalDeudoresActivos, totalAbonadoActivo } = useMemo(() => {
    let porCobrar = 0
    let abonado = 0
    let activos = 0

    for (let i = 0; i < deudas.length; i++) {
      if (deudas[i].estado === 'PENDIENTE') {
        porCobrar += parseFloat(deudas[i].saldo_pendiente || 0)
        abonado += parseFloat(deudas[i].monto_abonado || 0)
        activos += 1
      }
    }

    return {
      totalPorCobrar: porCobrar,
      totalDeudoresActivos: activos,
      totalAbonadoActivo: abonado
    }
  }, [deudas])

  return {
    deudasFiltradas,
    clientes,
    cargando,
    busqueda,
    setBusqueda,
    filtroEstado,
    setFiltroEstado,
    deudaSeleccionada,
    setDeudaSeleccionada,
    imprimiendo,
    totalPorCobrar,
    totalDeudoresActivos,
    totalAbonadoActivo,
    imprimirEstadoDeuda,
    abonarDeuda,
    cobrarDeudaCompleta,
    crearDeudaManual,
    eliminarDeuda
  }
}