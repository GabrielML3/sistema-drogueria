import { FileText, Package, Printer, Trash2 } from 'lucide-react'

export default function ModalDetalleVenta({
  ventaSeleccionada,
  setVentaSeleccionada,
  reimprimirFactura,
  eliminarItemFactura,
  anularVenta,
  imprimiendo
}) {
  if (!ventaSeleccionada) return null

  return (
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
                  const precio = detalle.precio_unitario_aplicado || detalle.precio_unitario || detalle.precio || detalle.precio_venta || 0
                  const subtotal = detalle.subtotal || (precio * (detalle.cantidad || 1)) || 0
                  const formato = detalle.tipo_unidad || detalle.formato || detalle.presentacion || 'UND'
                  const cantidad = detalle.cantidad || 1

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

        <div className="p-5 border-t bg-gray-50 flex flex-wrap justify-between items-center gap-4">
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
  )
}