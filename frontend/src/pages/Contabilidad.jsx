import { useState, useEffect } from 'react'
import { DollarSign, TrendingUp, ShoppingCart, Calendar, Filter } from 'lucide-react'

export default function Contabilidad() {
  const [ventas, setVentas] = useState([])
  const [cargando, setCargando] = useState(true)

  // NUEVOS ESTADOS PARA LOS FILTROS
  const [tipoFiltro, setTipoFiltro] = useState('HOY') // HOY, FECHA_EXACTA, RANGO, TODO
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')

  useEffect(() => {
    cargarVentas()
  }, [])

  const cargarVentas = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/ventas/')
      const data = await res.json()
      setVentas(data)
    } catch (error) {
      console.error("Error cargando ventas:", error)
    } finally {
      setCargando(false)
    }
  }

  // EL CEREBRO DEL FILTRADO
  const ventasFiltradas = ventas.filter(venta => {
    if (tipoFiltro === 'TODO') return true;

    // Django envía 'fecha_hora' en formato ISO real (ej. 2026-05-23T02:58:00Z)
    const fechaVenta = new Date(venta.fecha_hora);
    const hoy = new Date();

    if (tipoFiltro === 'HOY') {
      return fechaVenta.getDate() === hoy.getDate() &&
             fechaVenta.getMonth() === hoy.getMonth() &&
             fechaVenta.getFullYear() === hoy.getFullYear();
    }

    if (tipoFiltro === 'FECHA_EXACTA') {
      if (!fechaInicio) return true;
      // Convertimos el string 'YYYY-MM-DD' del input al formato de JavaScript
      const [y, m, d] = fechaInicio.split('-');
      return fechaVenta.getFullYear() === parseInt(y) &&
             fechaVenta.getMonth() === parseInt(m) - 1 &&
             fechaVenta.getDate() === parseInt(d);
    }

    if (tipoFiltro === 'RANGO') {
      if (!fechaInicio || !fechaFin) return true;
      const inicio = new Date(fechaInicio);
      inicio.setHours(0, 0, 0, 0); // Desde las 00:00:00
      
      const fin = new Date(fechaFin);
      fin.setHours(23, 59, 59, 999); // Hasta las 23:59:59

      return fechaVenta >= inicio && fechaVenta <= fin;
    }

    return true;
  });

  // Los cálculos matemáticos AHORA USAN LA LISTA FILTRADA
  const totalIngresos = ventasFiltradas.reduce((sum, v) => sum + parseFloat(v.total), 0)
  const totalGanancia = ventasFiltradas.reduce((sum, v) => sum + parseFloat(v.ganancia_neta), 0)
  const margenGanancia = totalIngresos > 0 ? ((totalGanancia / totalIngresos) * 100).toFixed(1) : 0

  if (cargando) {
    return <div className="flex h-full items-center justify-center font-bold text-gray-500">Cargando métricas financieras...</div>
  }

  return (
    <div className="flex flex-col h-full bg-gray-100 p-6 overflow-hidden">
      
      {/* ENCABEZADO Y PANEL DE FILTROS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Contabilidad y Finanzas</h1>
          <p className="text-gray-500">Resumen interactivo de cuadre de caja</p>
        </div>

        {/* CONTROLES INTERACTIVOS */}
        <div className="bg-white p-2 rounded-lg shadow-sm border flex flex-wrap items-center gap-3">
          <div className="flex items-center text-gray-500 pl-2">
            <Filter className="w-5 h-5 mr-2" />
            <span className="font-semibold text-sm">Filtrar por:</span>
          </div>
          
          <select 
            value={tipoFiltro} 
            onChange={(e) => setTipoFiltro(e.target.value)}
            className="p-2 border rounded-md bg-gray-50 focus:border-blue-500 outline-none font-medium text-gray-700"
          >
            <option value="HOY">Ventas de Hoy</option>
            <option value="FECHA_EXACTA">Un Día Específico</option>
            <option value="RANGO">Rango de Fechas</option>
            <option value="TODO">Histórico Completo</option>
          </select>

          {/* Muestra 1 Input si es Fecha Exacta */}
          {tipoFiltro === 'FECHA_EXACTA' && (
            <input 
              type="date" 
              value={fechaInicio} 
              onChange={(e) => setFechaInicio(e.target.value)}
              className="p-2 border rounded-md outline-none focus:border-blue-500 text-gray-700"
            />
          )}

          {/* Muestra 2 Inputs si es Rango */}
          {tipoFiltro === 'RANGO' && (
            <div className="flex items-center gap-2">
              <input type="date" value={fechaInicio} onChange={(e) => setFechaInicio(e.target.value)} className="p-2 border rounded-md outline-none text-gray-700" />
              <span className="text-gray-400 font-bold">a</span>
              <input type="date" value={fechaFin} onChange={(e) => setFechaFin(e.target.value)} className="p-2 border rounded-md outline-none text-gray-700" />
            </div>
          )}
        </div>
      </div>

      {/* TARJETAS DE MÉTRICAS (DASHBOARD) */}
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

      {/* TABLA DE HISTORIAL DE VENTAS */}
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
              </tr>
            </thead>
            <tbody>
              {ventasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500 italic">
                    No hay transacciones para el filtro de fechas seleccionado.
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
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}