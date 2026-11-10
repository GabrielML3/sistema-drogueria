import { FileText, Package, Printer, DollarSign, CheckCircle2, History } from 'lucide-react'

export default function ModalDetalleDeuda({
  deudaSeleccionada,
  setDeudaSeleccionada,
  imprimirEstadoDeuda,
  abonarDeuda,
  cobrarDeudaCompleta,
  imprimiendo
}) {
  if (!deudaSeleccionada) return null

  const esPendiente = deudaSeleccionada.estado === 'PENDIENTE'

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-[#2C46AF] flex items-center gap-2">
              <FileText className="w-6 h-6" />
              Cuenta de {deudaSeleccionada.cliente_nombre}
            </h2>
            <p className="text-sm text-gray-500 font-medium mt-1">
              Registrada el {deudaSeleccionada.fecha_formateada} •{' '}
              {deudaSeleccionada.tipo_deuda === 'POS'
                ? 'Productos de Inventario (Pasa a Contabilidad al liquidar)'
                : 'Saldo Manual Representativo (No afecta Contabilidad)'}
            </p>
          </div>
          <button
            onClick={() => setDeudaSeleccionada(null)}
            className="text-gray-400 hover:text-red-600 transition-colors"
          >
            <span className="text-2xl font-bold">&times;</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* Tabla de Productos o Concepto Manual */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 uppercase mb-3">
              Productos / Conceptos Adeudados
            </h3>
            {deudaSeleccionada.tipo_deuda === 'MANUAL' ? (
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex justify-between items-center">
                <div>
                  <p className="font-bold text-gray-800">
                    {deudaSeleccionada.descripcion_manual || 'Saldo pendiente de compra'}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Registro representativo (la venta principal ya fue ingresada en caja)
                  </p>
                </div>
                <span className="text-lg font-bold text-amber-800">
                  ${parseFloat(deudaSeleccionada.total).toLocaleString()}
                </span>
              </div>
            ) : (
              <div className="border rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="p-3 border-b text-gray-600 font-semibold text-xs">Producto</th>
                      <th className="p-3 border-b text-gray-600 font-semibold text-xs text-center">Formato</th>
                      <th className="p-3 border-b text-gray-600 font-semibold text-xs text-center">Cant.</th>
                      <th className="p-3 border-b text-gray-600 font-semibold text-xs text-right">Precio Und.</th>
                      <th className="p-3 border-b text-gray-600 font-semibold text-xs text-right">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deudaSeleccionada.detalles && deudaSeleccionada.detalles.length > 0 ? (
                      deudaSeleccionada.detalles.map((d, idx) => (
                        <tr key={d.id || idx} className="border-b last:border-b-0 hover:bg-slate-50">
                          <td className="p-3 font-bold text-gray-800 flex items-center text-sm">
                            <Package className="w-4 h-4 mr-2 text-[#2C46AF]" />
                            {d.producto_nombre}
                          </td>
                          <td className="p-3 text-center">
                            <span className="bg-blue-50 text-[#2C46AF] px-2 py-0.5 rounded text-xs font-bold border border-blue-100">
                              {d.tipo_unidad}
                            </span>
                          </td>
                          <td className="p-3 text-center font-bold text-gray-700 text-sm">{d.cantidad}</td>
                          <td className="p-3 text-right text-gray-600 text-sm">
                            ${parseFloat(d.precio_unitario_aplicado).toLocaleString()}
                          </td>
                          <td className="p-3 text-right font-bold text-gray-800 text-sm">
                            ${parseFloat(d.subtotal).toLocaleString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="p-4 text-center text-gray-500 text-sm">
                          Sin productos detallados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Historial de Abonos */}
          <div>
            <h3 className="text-sm font-bold text-gray-700 uppercase mb-3 flex items-center gap-1.5">
              <History className="w-4 h-4 text-[#2C46AF]" />
              Historial de Abonos Realizados
            </h3>
            {deudaSeleccionada.abonos && deudaSeleccionada.abonos.length > 0 ? (
              <div className="border rounded-xl divide-y">
                {deudaSeleccionada.abonos.map((abono) => (
                  <div key={abono.id} className="p-3 flex justify-between items-center text-sm">
                    <span className="text-gray-600 font-medium">{abono.fecha_formateada}</span>
                    <span className="font-bold text-green-600">
                      + ${parseFloat(abono.monto).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic bg-gray-50 p-3 rounded-lg border">
                Aún no se han registrado abonos para esta cuenta.
              </p>
            )}
          </div>
        </div>

        <div className="p-5 border-t bg-gray-50 flex flex-wrap justify-between items-center gap-4">
          <div className="flex flex-wrap gap-2 items-center">
            <button
              onClick={() => imprimirEstadoDeuda(deudaSeleccionada)}
              disabled={imprimiendo}
              className="bg-slate-700 hover:bg-slate-800 text-white font-bold py-2.5 px-4 rounded-lg flex items-center gap-1.5 text-sm transition-colors disabled:opacity-50 shadow-sm"
            >
              <Printer className="w-4 h-4" />
              Imprimir Factura de Deuda
            </button>

            {esPendiente && (
              <>
                <button
                  onClick={() => abonarDeuda(deudaSeleccionada)}
                  className="bg-[#2C46AF] hover:bg-[#1E3185] text-white font-bold py-2.5 px-4 rounded-lg flex items-center gap-1.5 text-sm transition-colors shadow-sm"
                >
                  <DollarSign className="w-4 h-4" />
                  Registrar Abono
                </button>
                <button
                  onClick={() => cobrarDeudaCompleta(deudaSeleccionada)}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-lg flex items-center gap-1.5 text-sm transition-colors shadow-sm"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Cobrar Todo
                </button>
              </>
            )}
          </div>

          <div className="text-right space-y-1 min-w-[220px]">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Total Inicial:</span>
              <span className="font-bold">${parseFloat(deudaSeleccionada.total).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-xs text-green-600">
              <span>Total Abonado:</span>
              <span className="font-bold">${parseFloat(deudaSeleccionada.monto_abonado).toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-amber-700 border-t pt-1">
              <span>Saldo Restante:</span>
              <span>${parseFloat(deudaSeleccionada.saldo_pendiente).toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}