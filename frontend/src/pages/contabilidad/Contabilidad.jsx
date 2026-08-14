import { DollarSign, TrendingUp, ShoppingCart, Calendar, Filter, Eye, Printer, Trash2 } from 'lucide-react'
import Input from '../../components/ui/Input'
import ModalDetalleVenta from './components/ModalDetalleVenta'
import { useContabilidad } from './hooks/useContabilidad'

export default function Contabilidad() {
  const {
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
  } = useContabilidad()

  if (cargando) {
    return <div className="flex h-full items-center justify-center font-bold text-gray-500">Cargando métricas financieras...</div>
  }

  return (
    <div className="flex flex-col h-full bg-gray-100 p-6 overflow-hidden">
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

      <ModalDetalleVenta
        ventaSeleccionada={ventaSeleccionada}
        setVentaSeleccionada={setVentaSeleccionada}
        reimprimirFactura={reimprimirFactura}
        eliminarItemFactura={eliminarItemFactura}
        anularVenta={anularVenta}
        imprimiendo={imprimiendo}
      />
    </div>
  )
}