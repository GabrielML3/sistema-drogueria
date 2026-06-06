import { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, ShoppingCart, Calendar, Filter, Eye, FileText, Package } from 'lucide-react'
import clienteAxios from '../api/axios'

// Componentes UI
import Input from '../components/ui/Input'

export default function Contabilidad() {
  const [ventas, setVentas] = useState([])
  const [cargando, setCargando] = useState(true)
  
  const [ventaSeleccionada, setVentaSeleccionada] = useState(null)
  const [tipoFiltro, setTipoFiltro] = useState('HOY') 
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')

  useEffect(() => {
    cargarVentas()
  }, [])

  const cargarVentas = async () => {
    try {
      const res = await clienteAxios.get('ventas/')
      setVentas(res.data)
    } catch (error) {
      console.error("Error cargando ventas. Verifica que el servidor de Django no tenga errores:", error)
    } finally {
      setCargando(false)
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
                      {/* BOTÓN PARA ABRIR EL DETALLE */}
                      <button 
                        onClick={() => setVentaSeleccionada(venta)} 
                        className="text-[#2C46AF] hover:text-[#1E3185] bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors shadow-sm"
                        title="Ver detalles de la venta"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL DE DETALLE DE VENTA CON MAPEO INTELIGENTE */}
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
                  </tr>
                </thead>
                <tbody>
                  {ventaSeleccionada.detalles && ventaSeleccionada.detalles.length > 0 ? (
                    ventaSeleccionada.detalles.map((detalle, index) => {
                      
                      // MAGIA DEFENSIVA: Si no encuentra 'precio_unitario', busca 'precio' o 'precio_venta'
                      const precio = detalle.precio_unitario || detalle.precio || detalle.precio_venta || 0;
                      // Si no encuentra subtotal, multiplica el precio por la cantidad
                      const subtotal = detalle.subtotal || detalle.total || (precio * (detalle.cantidad || 1)) || 0;
                      const formato = detalle.tipo_unidad || detalle.formato || detalle.presentacion || 'UND';
                      const cantidad = detalle.cantidad || 1;

                      return (
                        <tr key={index} className="border-b hover:bg-slate-50">
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
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-gray-500 italic">
                        Los detalles de esta factura no están disponibles en la base de datos.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-6 border-t bg-gray-50 flex justify-end">
              <div className="w-1/2 space-y-2">
                <div className="flex justify-between text-gray-600 font-medium">
                  <span>Ganancia Neta:</span>
                  <span className="text-green-600 font-bold">${parseFloat(ventaSeleccionada.ganancia_neta).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xl font-bold text-gray-800 border-t pt-2 border-gray-200">
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