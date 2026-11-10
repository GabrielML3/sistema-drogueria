import { useState } from 'react'
import {
  BookOpen,
  Users,
  DollarSign,
  Search,
  PlusCircle,
  Eye,
  Printer,
  CheckCircle2,
  Trash2,
  HandCoins
} from 'lucide-react'
import Input from '../../components/ui/Input'
import ModalDetalleDeuda from './components/ModalDetalleDeuda'
import { useDeudas } from './hooks/useDeudas'

export default function Deudas() {
  const {
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
  } = useDeudas()

  const [modalManualAbierto, setModalManualAbierto] = useState(false)
  const [modoCliente, setModoCliente] = useState('NUEVO')
  const [clienteId, setClienteId] = useState('')
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoTelefono, setNuevoTelefono] = useState('')
  const [montoManual, setMontoManual] = useState('')
  const [descripcionManual, setDescripcionManual] = useState('')

  const abrirModalManual = () => {
    setMontoManual('')
    setDescripcionManual('')
    setNuevoNombre('')
    setNuevoTelefono('')
    if (clientes.length > 0) {
      setClienteId(clientes[0].id)
      setModoCliente('EXISTENTE')
    } else {
      setModoCliente('NUEVO')
    }
    setModalManualAbierto(true)
  }

  const handleGuardarManual = async (e) => {
    e.preventDefault()
    const exito = await crearDeudaManual({
      cliente_id: modoCliente === 'EXISTENTE' ? clienteId : null,
      nuevo_cliente_nombre: modoCliente === 'NUEVO' ? nuevoNombre : '',
      nuevo_cliente_telefono: modoCliente === 'NUEVO' ? nuevoTelefono : '',
      monto: parseFloat(montoManual),
      descripcion: descripcionManual || 'Saldo pendiente de compra'
    })
    if (exito) {
      setModalManualAbierto(false)
    }
  }

  if (cargando) {
    return (
      <div className="flex h-full items-center justify-center font-bold text-gray-500">
        Cargando control de deudas y fiados...
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-gray-100 p-6 overflow-hidden">
      {/* Cabecera */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Deudas y Cuentas por Cobrar</h1>
          <p className="text-gray-500">
            Control de clientes fiados, abonos parciales y saldos pendientes
          </p>
        </div>

        <button
          onClick={abrirModalManual}
          className="bg-[#2C46AF] hover:bg-[#1E3185] text-white font-bold py-3 px-5 rounded-xl shadow-md flex items-center gap-2 transition-colors"
        >
          <PlusCircle className="w-5 h-5" />
          Registrar Saldo Manual
        </button>
      </div>

      {/* Tarjetas de Resumen */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 shrink-0">
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-amber-500 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-500 mb-1">SALDO TOTAL POR COBRAR</p>
            <h2 className="text-3xl font-bold text-amber-600">
              $ {totalPorCobrar.toLocaleString()}
            </h2>
          </div>
          <div className="bg-amber-100 p-4 rounded-full text-amber-600">
            <HandCoins className="w-8 h-8" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-600 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-500 mb-1">CUENTAS PENDIENTES</p>
            <h2 className="text-3xl font-bold text-gray-800">{totalDeudoresActivos}</h2>
          </div>
          <div className="bg-blue-100 p-4 rounded-full text-blue-600">
            <Users className="w-8 h-8" />
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-600 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-gray-500 mb-1">ABONOS RECIBIDOS (EN CURSO)</p>
            <h2 className="text-3xl font-bold text-green-600">
              $ {totalAbonadoActivo.toLocaleString()}
            </h2>
          </div>
          <div className="bg-green-100 p-4 rounded-full text-green-600">
            <DollarSign className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtro */}
      <div className="bg-white p-4 rounded-xl shadow-sm border mb-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="w-full md:w-1/2">
          <Input
            icon={Search}
            placeholder="Buscar por nombre del deudor o concepto..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          {['PENDIENTE', 'PAGADA', 'TODOS'].map((estado) => (
            <button
              key={estado}
              onClick={() => setFiltroEstado(estado)}
              className={`px-4 py-2 rounded-lg font-bold text-sm transition-colors ${
                filtroEstado === estado
                  ? 'bg-[#2C46AF] text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {estado === 'PENDIENTE'
                ? 'Pendientes'
                : estado === 'PAGADA'
                ? 'Pagadas (Historial)'
                : 'Todas'}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Deudores */}
      <div className="bg-white rounded-xl shadow-md flex flex-col flex-1 overflow-hidden">
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50 sticky top-0 shadow-sm z-10">
              <tr>
                <th className="p-4 border-b text-gray-600 font-semibold">Cliente / Deudor</th>
                <th className="p-4 border-b text-gray-600 font-semibold">Fecha</th>
                <th className="p-4 border-b text-gray-600 font-semibold">Detalle / Tipo</th>
                <th className="p-4 border-b text-gray-600 font-semibold text-right">Total</th>
                <th className="p-4 border-b text-gray-600 font-semibold text-right">Abonado</th>
                <th className="p-4 border-b text-gray-600 font-semibold text-right">Saldo Restante</th>
                <th className="p-4 border-b text-center text-gray-600 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {deudasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-gray-500 italic">
                    No hay registros de deudas para este filtro.
                  </td>
                </tr>
              ) : (
                deudasFiltradas.map((deuda) => {
                  const esPendiente = deuda.estado === 'PENDIENTE'
                  return (
                    <tr key={deuda.id} className="hover:bg-slate-50 border-b transition-colors">
                      <td className="p-4">
                        <div className="font-bold text-gray-800">{deuda.cliente_nombre}</div>
                        {deuda.cliente_telefono && (
                          <div className="text-xs text-gray-500">{deuda.cliente_telefono}</div>
                        )}
                      </td>
                      <td className="p-4 text-gray-600 text-sm font-medium">
                        {deuda.fecha_formateada}
                      </td>
                      <td className="p-4">
                        {deuda.tipo_deuda === 'POS' ? (
                          <span className="bg-blue-50 text-[#2C46AF] px-2.5 py-1 rounded-full text-xs font-bold border border-blue-200">
                            {deuda.detalles?.length || 0} Productos (POS)
                          </span>
                        ) : (
                          <span
                            className="bg-amber-50 text-amber-800 px-2.5 py-1 rounded-full text-xs font-bold border border-amber-200"
                            title={deuda.descripcion_manual}
                          >
                            Manual: {deuda.descripcion_manual || 'Saldo'}
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-right font-bold text-gray-700">
                        $ {parseFloat(deuda.total).toLocaleString()}
                      </td>
                      <td className="p-4 text-right font-bold text-green-600">
                        $ {parseFloat(deuda.monto_abonado).toLocaleString()}
                      </td>
                      <td className="p-4 text-right font-extrabold text-amber-700 text-base">
                        $ {parseFloat(deuda.saldo_pendiente).toLocaleString()}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setDeudaSeleccionada(deuda)}
                            className="text-[#2C46AF] hover:text-[#1E3185] bg-blue-50 hover:bg-blue-100 p-2 rounded-lg transition-colors shadow-sm"
                            title="Ver productos y abonos"
                          >
                            <Eye className="w-5 h-5" />
                          </button>

                          <button
                            onClick={() => imprimirEstadoDeuda(deuda)}
                            disabled={imprimiendo}
                            className="text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 p-2 rounded-lg transition-colors shadow-sm"
                            title="Imprimir Factura de lo que debe"
                          >
                            <Printer className="w-5 h-5" />
                          </button>

                          {esPendiente && (
                            <>
                              <button
                                onClick={() => abonarDeuda(deuda)}
                                className="bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-300 px-2.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors shadow-sm"
                                title="Registrar un abono parcial"
                              >
                                <DollarSign className="w-4 h-4" />
                                Abonar
                              </button>

                              <button
                                onClick={() => cobrarDeudaCompleta(deuda)}
                                className="bg-green-600 hover:bg-green-700 text-white px-2.5 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 transition-colors shadow-sm"
                                title="Cobrar todo y enviar a Contabilidad"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                Cobrar
                              </button>
                            </>
                          )}

                          <button
                            onClick={() => eliminarDeuda(deuda)}
                            className="text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 p-2 rounded-lg transition-colors shadow-sm"
                            title="Eliminar registro"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Detalle de Productos y Abonos */}
      <ModalDetalleDeuda
        deudaSeleccionada={deudaSeleccionada}
        setDeudaSeleccionada={setDeudaSeleccionada}
        imprimirEstadoDeuda={imprimirEstadoDeuda}
        abonarDeuda={abonarDeuda}
        cobrarDeudaCompleta={cobrarDeudaCompleta}
        imprimiendo={imprimiendo}
      />

      {/* Modal para Registrar Saldo Manual Representativo */}
      {modalManualAbierto && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="p-5 bg-slate-800 text-white flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-400" />
                Registrar Saldo Pendiente Manual
              </h3>
              <button
                onClick={() => setModalManualAbierto(false)}
                className="text-slate-300 hover:text-white text-2xl font-bold leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleGuardarManual} className="p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg text-xs text-blue-900">
                Usa esta opción cuando ya registraste la venta completa en Caja (ej. $20.000), pero el cliente quedó debiendo un excedente (ej. $2.000). <strong>No duplicará ingresos en Contabilidad.</strong>
              </div>

              <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setModoCliente('NUEVO')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    modoCliente === 'NUEVO'
                      ? 'bg-[#2C46AF] text-white shadow'
                      : 'text-gray-600'
                  }`}
                >
                  Nueva Persona
                </button>
                <button
                  type="button"
                  onClick={() => setModoCliente('EXISTENTE')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                    modoCliente === 'EXISTENTE'
                      ? 'bg-[#2C46AF] text-white shadow'
                      : 'text-gray-600'
                  }`}
                >
                  Cliente Existente
                </button>
              </div>

              {modoCliente === 'EXISTENTE' ? (
                <div>
                  <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                    Seleccionar Persona *
                  </label>
                  <select
                    required
                    value={clienteId}
                    onChange={(e) => setClienteId(e.target.value)}
                    className="w-full p-2.5 border border-gray-300 rounded-lg bg-white font-semibold"
                  >
                    {clientes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} {c.telefono ? `- (${c.telefono})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                      Nombre de la Persona *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ej: Señora María"
                      value={nuevoNombre}
                      onChange={(e) => setNuevoNombre(e.target.value)}
                      className="w-full p-2.5 border border-gray-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                      Teléfono (Opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: 310 000 0000"
                      value={nuevoTelefono}
                      onChange={(e) => setNuevoTelefono(e.target.value)}
                      className="w-full p-2.5 border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                  Valor que quedó debiendo ($) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="Ej: 2000"
                  value={montoManual}
                  onChange={(e) => setMontoManual(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg font-bold text-gray-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                  Nota / Concepto (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: Restante de compra de $20.000 (dio $18.000)"
                  value={descripcionManual}
                  onChange={(e) => setDescripcionManual(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalManualAbierto(false)}
                  className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-bold text-sm"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-lg bg-[#2C46AF] hover:bg-[#1E3185] text-white font-bold text-sm shadow-md"
                >
                  Guardar Deuda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}