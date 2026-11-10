import qz from 'qz-tray'

export const imprimirTicket = async (ventaData) => {
  try {
    if (!qz.websocket.isActive()) {
      await qz.websocket.connect()
    }

    const nombreImpresora = "EPSON TM-U220 Receipt"
    const config = qz.configs.create(nombreImpresora)

    const fechaObj = ventaData.fecha_hora ? new Date(ventaData.fecha_hora) : new Date()
    const fechaTxt = fechaObj.toLocaleDateString('es-CO')
    const horaTxt = fechaObj.toLocaleTimeString('es-CO')

    const numFactura = ventaData.id
      ? `#${ventaData.id.toString().padStart(5, '0')}`
      : 'POS'
 
    const formatearLinea = (cant, nombre, total) => {
      const c = cant.toString().padEnd(3, ' ')
      const n = nombre.substring(0, 18).padEnd(19, ' ')
      const t = `$${parseFloat(total).toLocaleString()}`.padStart(11, ' ')
      return `${c}${n}${t}\n`
    }

    const cabeceraTabla = 'CT '.padEnd(3, ' ') + 'ITEM'.padEnd(19, ' ') + 'VALOR'.padStart(11, ' ')

    const data = [
      '\x1B\x40',
      '\x1B\x61\x01',
      '\x1B\x45\x01',
      'DROGUERIA\n',
      'DON SIXTO GABRIEL\n',
      '\x1B\x45\x00',
      'NIT: 17.341.933-1\n',
      'K 19 4D 08, Macunaima\n',
      'Villavicencio, Meta\n',
      'Celular: 320 490 1142\n',
      '---------------------------------\n',
      '\x1B\x45\x01',
      `Factura de Venta ${numFactura}\n`,
      '\x1B\x45\x00',
      `Fecha: ${fechaTxt} ${horaTxt}\n`,
      'Cajero: Administrador\n',
      '---------------------------------\n',
      '\x1B\x45\x01',
      `${cabeceraTabla}\n`,
      '\x1B\x45\x00',
    ]

    const listaProductos = ventaData.detalles || ventaData.items || []

    listaProductos.forEach(item => {
      const cantidad = item.cantidad || 1
      const nombre = item.producto_nombre || item.nombre || 'Producto'
      const precioUnit = item.precio_unitario_aplicado || item.precio_unitario || item.precioVentaReal || 0
      const subtotal = item.subtotal || (precioUnit * cantidad)

      data.push(formatearLinea(cantidad, nombre, subtotal))
    })

    data.push('---------------------------------\n')

    const labelTotal = 'TOTAL:'.padEnd(22, ' ')
    const valTotal = `$${parseFloat(ventaData.total || 0).toLocaleString()}`.padStart(11, ' ')

    data.push('\x1B\x45\x01')
    data.push(`${labelTotal}${valTotal}\n`)
    data.push('\x1B\x45\x00')

    data.push('---------------------------------\n')
    data.push('¡Gracias por su compra!\n')
    data.push('Que tenga un excelente dia\n')

    data.push('\x1B\x70\x00\x19\xFA')
    data.push('\x1B\x70\x01\x19\xFA')

    data.push('\x0A\x0A\x0A\x0A')
    data.push('\x1D\x56\x41')

    await qz.print(config, data)
    return true

  } catch (error) {
    console.error("Error en printerService:", error)
    throw error
  }
}

export const imprimirTicketDeuda = async (deudaData, abrirCajonMonedero = false) => {
  try {
    if (!qz.websocket.isActive()) {
      await qz.websocket.connect()
    }

    const nombreImpresora = "EPSON TM-U220 Receipt"
    const config = qz.configs.create(nombreImpresora)

    const fechaActual = new Date()
    const fechaTxt = fechaActual.toLocaleDateString('es-CO')
    const horaTxt = fechaActual.toLocaleTimeString('es-CO')

    const numCuenta = deudaData.id
      ? `#${deudaData.id.toString().padStart(5, '0')}`
      : 'CUENTA'

    const formatearLinea = (cant, nombre, total) => {
      const c = cant.toString().padEnd(3, ' ')
      const n = nombre.substring(0, 18).padEnd(19, ' ')
      const t = `$${parseFloat(total).toLocaleString()}`.padStart(11, ' ')
      return `${c}${n}${t}\n`
    }

    const formatearFilaTotales = (etiqueta, valor) => {
      const lbl = etiqueta.padEnd(20, ' ')
      const val = `$${parseFloat(valor || 0).toLocaleString()}`.padStart(13, ' ')
      return `${lbl}${val}\n`
    }

    const cabeceraTabla = 'CT '.padEnd(3, ' ') + 'CONCEPTO'.padEnd(19, ' ') + 'VALOR'.padStart(11, ' ')

    const data = [
      '\x1B\x40',
      '\x1B\x61\x01',
      '\x1B\x45\x01',
      'DROGUERIA\n',
      'DON SIXTO GABRIEL\n',
      '\x1B\x45\x00',
      'NIT: 17.341.933-1\n',
      'K 19 4D 08, Macunaima\n',
      'Villavicencio, Meta\n',
      'Celular: 320 490 1142\n',
      '---------------------------------\n',
      '\x1B\x45\x01',
      `ESTADO DE CUENTA ${numCuenta}\n`,
      '\x1B\x45\x00',
      `Cliente: ${(deudaData.cliente_nombre || 'Cliente').substring(0, 24)}\n`,
      `Fecha Imp: ${fechaTxt} ${horaTxt}\n`,
      '---------------------------------\n',
      '\x1B\x45\x01',
      `${cabeceraTabla}\n`,
      '\x1B\x45\x00',
    ]

    const listaProductos = deudaData.detalles || []

    if (deudaData.tipo_deuda === 'MANUAL' || listaProductos.length === 0) {
      const concepto = deudaData.descripcion_manual || 'Saldo pendiente'
      data.push(formatearLinea(1, concepto, deudaData.total))
    } else {
      listaProductos.forEach(item => {
        const cantidad = item.cantidad || 1
        const nombre = item.producto_nombre || item.nombre || 'Producto'
        const subtotal = item.subtotal || 0
        data.push(formatearLinea(cantidad, nombre, subtotal))
      })
    }

    data.push('---------------------------------\n')
    data.push(formatearFilaTotales('TOTAL DEUDA:', deudaData.total))
    data.push(formatearFilaTotales('TOTAL ABONADO:', deudaData.monto_abonado))
    data.push('\x1B\x45\x01')
    data.push(formatearFilaTotales('SALDO PENDIENTE:', deudaData.saldo_pendiente))
    data.push('\x1B\x45\x00')
    data.push('---------------------------------\n')

    if (parseFloat(deudaData.saldo_pendiente) <= 0) {
      data.push('*** CUENTA PAZ Y SALVO ***\n')
    } else {
      data.push('Comprobante informativo de saldo\n')
    }

    if (abrirCajonMonedero) {
      data.push('\x1B\x70\x00\x19\xFA')
      data.push('\x1B\x70\x01\x19\xFA')
    }

    data.push('\x0A\x0A\x0A\x0A')
    data.push('\x1D\x56\x41')

    await qz.print(config, data)
    return true
  } catch (error) {
    console.error("Error al imprimir estado de deuda:", error)
    throw error
  }
}

export const abrirCajon = async () => {
  try {
    if (!qz.websocket.isActive()) {
      await qz.websocket.connect()
    }

    const config = qz.configs.create("EPSON TM-U220 Receipt")
 
    const data = [
      '\x1B\x40',
      '\x1B\x70\x00\x19\xFA',
      '\x1B\x70\x01\x19\xFA',
      '\x0A'
    ]

    await qz.print(config, data)
    return true
  } catch (error) {
    console.error("Error al abrir cajón:", error)
    return false
  }
}