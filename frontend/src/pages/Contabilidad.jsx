import { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, ShoppingCart, Calendar, Filter, Eye, FileText, Package, Printer, Trash2 } from 'lucide-react'
import clienteAxios from '../api/axios'
import qz from 'qz-tray'
import Swal from 'sweetalert2'

// Componentes UI
import Input from '../components/ui/Input'

export default function Contabilidad() {
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
      console.error("Error cargando ventas:", error)
    } finally {
      setCargando(false)
    }
  }

  // IMPRESIÓN CON EL DISEÑO EXACTO DE FACTURA DE VENTA POS
const reimprimirFactura = async (venta) => {
  setImprimiendo(true)
  try {
    if (!qz.websocket.isActive()) {
      await qz.websocket.connect()
    }

    const config = qz.configs.create("EPSON")
    
    const fechaVentaObj = venta.fecha_hora ? new Date(venta.fecha_hora) : new Date()
    const fechaTxt = fechaVentaObj.toLocaleDateString('es-CO')
    const horaTxt = fechaVentaObj.toLocaleTimeString('es-CO')

    // Estructuramos la cabecera exacta de 33 caracteres (3 + 19 + 11)
    const cabeceraTabla = 'CT '.padEnd(3, ' ') + 'ITEM'.padEnd(19, ' ') + 'VALOR'.padStart(11, ' ')

    const data = [
      '\x1B\x40',          // Reset / Inicializar impresora
      '\x1B\x61\x01',      // ALINEACIÓN AL CENTRO (Se mantiene para todo el ticket)
      '\x1B\x45\x01',      // Activar Negrita
      'DROGUERIA\n',
      'DON SIXTO GABRIEL\n',
      '\x1B\x45\x00',      // Desactivar Negrita
      'NIT: 17.341.933-1\n',
      'K 19 4D 08, Macunaima\n',
      'Villavicencio, Meta\n',
      'Celular: 320 490 1142\n',
      '---------------------------------\n', // 33 guiones centrados
      '\x1B\x45\x01',
      `Factura de Venta POS #${venta.id.toString().padStart(5, '0')}\n`,
      '\x1B\x45\x00',
      `Fecha: ${fechaTxt} ${horaTxt}\n`,
      'Cajero: Administrador\n',
      '---------------------------------\n', // 33 guiones centrados
      '\x1B\x45\x01',
      `${cabeceraTabla}\n`,                  // 33 caracteres centrados
      '\x1B\x45\x00',
    ]

    const detalles = venta.detalles || []
    detalles.forEach(item => {
      const cant = (item.cantidad || 1).toString().padEnd(3, ' ')
      const nombreProd = (item.producto_nombre || 'Producto').substring(0, 18).padEnd(19, ' ')
      const precioUnit = item.precio_unitario_aplicado || item.precio_unitario || item.precio || 0
      const subtotalVal = item.subtotal || (precioUnit * item.cantidad)
      const subtotalStr = `$${parseFloat(subtotalVal).toLocaleString()}`.padStart(11, ' ')
      
      // Cada fila mide exactamente 33 caracteres centrados
      data.push(`${cant}${nombreProd}${subtotalStr}\n`)
    })

    data.push('---------------------------------\n') // 33 guiones centrados
    
    // Fila del TOTAL de 33 caracteres (22 + 11)
    const labelTotal = 'TOTAL:'.padEnd(22, ' ')
    const valTotal = `$${parseFloat(venta.total).toLocaleString()}`.padStart(11, ' ')
    
    data.push('\x1B\x45\x01') // Negrita On
    data.push(`${labelTotal}${valTotal}\n`)
    data.push('\x1B\x45\x00') // Negrita Off
    
    data.push('---------------------------------\n') // 33 guiones centrados
    
    data.push('¡Gracias por su compra!\n')
    data.push('Que tenga un excelente día\n')

    // AVANCE DE PAPEL Y CORTE
    data.push('\x0A\x0A\x0A\x0A') // 8 saltos de línea para la cuchilla
    data.push('\x1D\x56\x41')         // Guillotina ESC/POS
    data.push('\x1B\x70\x00\x19\xFA') // Apertura de cajón monedero

    await qz.print(config, data)

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
    console.error("Error al imprimir:", error)
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

  // DEVOLVER UN SOLO PRODUCTO Y RECALCULAR FACTURA
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
        console.error("Error devolviendo ítem:", error)
        Swal.fire({
          title: 'Error',
          text: 'No se pudo devolver el producto.',
          icon: 'error',
          confirmButtonColor: '#2C46AF'
        })
      }
    }
  }

  // ANULAR FACTURA COMPLETA
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
        console.error("Error al anular la venta:", error)
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
    if (tipoFiltro === 'TODO') return true;

    const fechaVenta = new Date(venta.fecha_hora); 
    const hoy = new Date();

    if (tipoFiltro === 'HOY') {
      return fechaVenta.getDate() === hoy.getDate() &&
             fechaVenta.getMonth() === hoy.getMonth() &&
             fechaVenta.getFullYear() === hoy.getFullYear();
    }

    if (tipoFiltro === 'FECHA_EXACTA') {
      if (!fechaInicio) return true;
      const [y, m, d] = fechaInicio.split('-'); 
      return fechaVenta.getFullYear() === parseInt(y) &&
             fechaVenta.getMonth() === parseInt(m) - 1 &&
             fechaVenta.getDate() === parseInt(d);
    }

    if (tipoFiltro === 'RANGO') {
      if (!fechaInicio || !fechaFin) return true;
      const inicio = new Date(fechaInicio);
      inicio.setHours(0, 0, 0, 0); 
      
      const fin = new Date(fechaFin);
      fin.setHours(23, 59, 59, 999); 

      return fechaVenta >= inicio && fechaVenta <= fin;
    }

    return true;
  });

  const totalIngresos = ventasFiltradas.reduce((sum, v) => sum + parseFloat(v.total || 0), 0) 
  const totalGanancia = ventasFiltradas.reduce((sum, v) => sum + parseFloat(v.ganancia_neta || 0), 0)
  const margenGanancia = totalIngresos > 0 ? ((totalGanancia / totalIngresos) * 100).toFixed(1) : 0

  if (cargando) {
    return <div className="flex h-full items-center justify-center font-bold text-gray-500">Cargando métricas financieras...</div>
  }

  return (
    <div className="flex flex-col h-full bg-gray-100 p-6 overflow-hidden">
      
      {/* ENCABEZADO Y FILTROS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4"> 
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Contabilidad y Finanzas</h1>
          <p className="text-gray-500">Resumen interactivo de cuadre de caja y auditoría</p>
        </div>

        <div className="bg-white p-3 rounded-xl shadow-sm border flex flex-wrap items-center gap-3">
          <div className="flex items-center text-gray-500 pl-2">
            <Filter className="w-5 h-5 mr-2" />
            <span className="font-semibold text-sm">Filtrar por:</span>
          </div>
          
          <select 
            value={tipoFiltro} 
            onChange={(e) => setTipoFiltro(e.target.value)}
            className="p-2.5 border border-gray-300 rounded-lg bg-white focus:outline-none focus:border-[#2C46AF] focus:ring-1 focus:ring-[#2C46AF] font-medium text-gray-700"
          >
            <option value="HOY">Ventas de Hoy</option>
            <option value="FECHA_EXACTA">Un Día Específico</option>
            <option value="RANGO">Rango de Fechas</option>
            <option value="TODO">Histórico Completo</option>
          </select>

          {tipoFiltro === 'FECHA_EXACTA' && ( 
            <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} /> 
          )}

          {tipoFiltro === 'RANGO' && ( 
            <div className="flex items-center gap-2">
              <Input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} />
              <span className="text-gray-400 font-bold">a</span>
              <Input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} />
            </div>
          )}
        </div>
      </div>

      {/* MÉTRICAS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 shrink-0"> 
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-600 flex items-center justify-between transition-all">
          <div>
            <p className="text-sm font-bold text-gray-500 mb-1">INGRESOS TOTALES</p>
            <h2 className="text-3xl font-bold text-gray-800">$ {totalIngresos.toLocaleString()}</h2>
          </div>
          <div className="bg-blue-100 p-4 rounded-full text-blue-600"><DollarSign className="w-8 h-8" /></div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-600 flex items-center justify-between transition-all">
          <div>
            <p className="text-sm font-bold text-gray-500 mb-1">GANANCIA NETA REAL</p>
            <h2 className="text-3xl font-bold text-green-600">$ {totalGanancia.toLocaleString()}</h2>
            <p className="text-xs text-green-700 mt-1 font-semibold">Margen: {margenGanancia}%</p>
          </div>
          <div className="bg-green-100 p-4 rounded-full text-green-600"><TrendingUp className="w-8 h-8" /></div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-purple-600 flex items-center justify-between transition-all">
          <div>
            <p className="text-sm font-bold text-gray-500 mb-1">VENTAS REALIZADAS</p>
            <h2 className="text-3xl font-bold text-gray-800">{ventasFiltradas.length}</h2>
          </div>
          <div className="bg-purple-100 p-4 rounded-full text-purple-600"><ShoppingCart className="w-8 h-8" /></div>
        </div>
      </div>

      {/* TABLA PRINCIPAL */}
      <div className="bg-white rounded-xl shadow-md flex flex-col flex-1 overflow-hidden"> 
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <div className="flex items-center">
            <Calendar className="w-5 h-5 mr-2 text-gray-500" />
            <h3 className="font-bold text-gray-700">
              {tipoFiltro === 'HOY' ? 'Transacciones del Día' : 'Resultados de la Búsqueda'}
            </h3>
          </div>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white sticky top-0 shadow-sm z-10">
              <tr>
                <th className="p-4 border-b text-gray-600 font-semibold">ID Factura</th>
                <th className="p-4 border-b text-gray-600 font-semibold">Fecha y Hora</th>
                <th className="p-4 border-b text-gray-600 font-semibold text-right">Monto Cobrado</th>
                <th className="p-4 border-b text-gray-600 font-semibold text-right">Ganancia</th>
                <th className="p-4 border-b text-center text-gray-600 font-semibold">Estado</th>
                <th className="p-4 border-b text-center text-gray-600 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {ventasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-500 italic">
                    No hay transacciones para el filtro seleccionado.
                  </td>
                </tr>
              ) : (
                ventasFiltradas.map(venta => (
                  <tr key={venta.id} className="hover:bg-slate-50 border-b transition-colors">
                    <td className="p-4 font-bold text-gray-700"># {venta.id.toString().padStart(5, '0')}</td>
                    <td className="p-4 text-gray-600 text-sm font-medium">{venta.fecha_formateada}</td>
                    <td className="p-4 text-right font-bold text-gray-800">$ {parseFloat(venta.total).toLocaleString()}</td>
                    <td className="p-4 text-right font-bold text-green-600">$ {parseFloat(venta.ganancia_neta).toLocaleString()}</td>
                    <td className="p-4 text-center">
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">Completada</span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button 
                          onClick={() => setVentaSeleccionada(venta)} 
                          className="text-[#2C46AF] hover:text-[#1E3185] bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors shadow-sm"
                          title="Ver detalles de la venta"
                        >
                          <Eye className="w-5 h-5" />
                        </button>

                        <button 
                          onClick={() => reimprimirFactura(venta)}
                          disabled={imprimiendo}
                          className="text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 p-2 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                          title="Imprimir Factura POS"
                        >
                          <Printer className="w-5 h-5" />
                        </button>

                        <button 
                          onClick={() => anularVenta(venta.id)}
                          className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors shadow-sm"
                          title="Anular Factura Completa"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE DETALLE DE VENTA */}
      {ventaSeleccionada && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            
            <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold text-[#2C46AF] flex items-center">
                  <FileText className="mr-2" /> 
                  Detalle de Factura #{ventaSeleccionada.id.toString().padStart(5, '0')}
                </h2>
                <p className="text-sm text-gray-500 font-medium mt-1">{ventaSeleccionada.fecha_formateada}</p>
              </div>
              <button onClick={() => setVentaSeleccionada(null)} className="text-gray-400 hover:text-red-600 transition-colors">
                <span className="text-2xl font-bold">&times;</span>
              </button>
            </div>

            <div className="p-0 overflow-y-auto flex-1">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-100 sticky top-0 shadow-sm">
                  <tr>
                    <th className="p-4 border-b text-gray-600 font-semibold text-sm">Producto</th>
                    <th className="p-4 border-b text-gray-600 font-semibold text-sm text-center">Formato</th>
                    <th className="p-4 border-b text-gray-600 font-semibold text-sm text-center">Cant.</th>
                    <th className="p-4 border-b text-gray-600 font-semibold text-sm text-right">Precio Und.</th>
                    <th className="p-4 border-b text-gray-600 font-semibold text-sm text-right">Subtotal</th>
                    <th className="p-4 border-b text-gray-600 font-semibold text-sm text-center">Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {ventaSeleccionada.detalles && ventaSeleccionada.detalles.length > 0 ? (
                    ventaSeleccionada.detalles.map((detalle, index) => {
                      const precio = detalle.precio_unitario_aplicado || detalle.precio_unitario || detalle.precio || detalle.precio_venta || 0;
                      const subtotal = detalle.subtotal || (precio * (detalle.cantidad || 1)) || 0;
                      const formato = detalle.tipo_unidad || detalle.formato || detalle.presentacion || 'UND';
                      const cantidad = detalle.cantidad || 1;

                      return (
                        <tr key={index} className="border-b hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-bold text-gray-800 flex items-center">
                            <Package className="w-4 h-4 mr-2 text-[#2C46AF]" />
                            {detalle.producto_nombre}
                          </td>
                          <td className="p-4 text-center">
                            <span className="bg-blue-50 text-[#2C46AF] px-2 py-1 rounded text-xs font-bold border border-blue-100">
                              {formato}
                            </span>
                          </td>
                          <td className="p-4 text-center font-bold text-gray-700">{cantidad}</td>
                          <td className="p-4 text-right text-gray-600 font-medium">${parseFloat(precio).toLocaleString()}</td>
                          <td className="p-4 text-right font-bold text-gray-800">${parseFloat(subtotal).toLocaleString()}</td>
                          <td className="p-4 text-center">
                            {/* BOTÓN PARA DEVOLVER SOLO ESTE PRODUCTO */}
                            <button
                              onClick={() => eliminarItemFactura(detalle.id, detalle.producto_nombre)}
                              className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                              title="Devolver este producto al inventario"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan="6" className="p-8 text-center text-gray-500 italic">
                        Los detalles de esta factura no están disponibles en la base de datos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* PIE DE PÁGINA REDISEÑADO SIN TRASLAPES */}
            <div className="p-5 border-t bg-gray-50 flex flex-wrap justify-between items-center gap-4">
              {/* ACCIONES DEL MODAL */}
              <div className="flex flex-wrap gap-2 items-center">
                <button
                  onClick={() => reimprimirFactura(ventaSeleccionada)}
                  disabled={imprimiendo}
                  className="bg-slate-700 hover:bg-slate-800 text-white font-bold py-2 px-3.5 rounded-lg flex items-center gap-1.5 text-xs sm:text-sm transition-colors disabled:opacity-50 shadow-sm whitespace-nowrap"
                >
                  <Printer className="w-4 h-4" /> Imprimir Factura
                </button>
                <button
                  onClick={() => anularVenta(ventaSeleccionada.id)}
                  className="bg-red-50 hover:bg-red-100 text-red-600 font-bold py-2 px-3.5 rounded-lg flex items-center gap-1.5 text-xs sm:text-sm transition-colors shadow-sm whitespace-nowrap border border-red-200"
                >
                  <Trash2 className="w-4 h-4" /> Anular Factura Completa
                </button>
              </div>

              {/* TOTALES FINANCIEROS */}
              <div className="text-right space-y-1 min-w-[200px]">
                <div className="flex justify-between items-center gap-4 text-gray-600 font-medium text-sm">
                  <span>Ganancia Neta:</span>
                  <span className="text-green-600 font-bold">${parseFloat(ventaSeleccionada.ganancia_neta).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center gap-4 text-lg font-bold text-gray-800 border-t pt-1 border-gray-200">
                  <span>Total Pagado:</span>
                  <span className="text-[#2C46AF]">${parseFloat(ventaSeleccionada.total).toLocaleString()}</span>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}