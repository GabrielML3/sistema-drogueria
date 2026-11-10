import { useState, useEffect } from 'react'
import { UserPlus, Users, HandCoins } from 'lucide-react'
import clienteAxios from '../../../api/axios'

export default function ModalFiarVenta({
  abierto,
  onCerrar,
  onConfirmarFiado,
  totalPagar,
  cargando
}) {
  const [modoCliente, setModoCliente] = useState('EXISTENTE') // 'EXISTENTE' | 'NUEVO'
  const [clientes, setClientes] = useState([])
  const [clienteId, setClienteId] = useState('')
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoTelefono, setNuevoTelefono] = useState('')
  const [abonoInicial, setAbonoInicial] = useState('')

  useEffect(() => {
    if (abierto) {
      cargarClientes()
      setAbonoInicial('')
      setNuevoNombre('')
      setNuevoTelefono('')
    }
  }, [abierto])

  const cargarClientes = async () => {
    try {
      const res = await clienteAxios.get('clientes-deudores/')
      const lista = Array.isArray(res.data) ? res.data : []
      setClientes(lista)
      if (lista.length > 0) {
        setClienteId(lista[0].id)
        setModoCliente('EXISTENTE')
      } else {
        setModoCliente('NUEVO')
      }
    } catch (error) {
      console.error('Error al cargar clientes deudores:', error)
    }
  }

  if (!abierto) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    onConfirmarFiado({
      cliente_id: modoCliente === 'EXISTENTE' ? clienteId : null,
      nuevo_cliente_nombre: modoCliente === 'NUEVO' ? nuevoNombre : '',
      nuevo_cliente_telefono: modoCliente === 'NUEVO' ? nuevoTelefono : '',
      abono_inicial: abonoInicial ? parseFloat(abonoInicial) : 0
    })
  }

  const saldoRestante = Math.max(0, totalPagar - (parseFloat(abonoInicial) || 0))

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="p-5 bg-slate-800 text-white flex justify-between items-center">
          <h3 className="text-lg font-bold flex items-center">
            <HandCoins className="w-5 h-5 mr-2 text-amber-400" />
            Enviar Carrito a Deudas (Fiar)
          </h3>
          <button
            onClick={onCerrar}
            className="text-slate-300 hover:text-white text-2xl font-bold leading-none"
          >
            &times;
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setModoCliente('EXISTENTE')}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                modoCliente === 'EXISTENTE'
                  ? 'bg-[#2C46AF] text-white shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Users className="w-4 h-4" />
              Deudor Existente
            </button>
            <button
              type="button"
              onClick={() => setModoCliente('NUEVO')}
              className={`py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                modoCliente === 'NUEVO'
                  ? 'bg-[#2C46AF] text-white shadow'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <UserPlus className="w-4 h-4" />
              Nuevo Deudor
            </button>
          </div>

          {modoCliente === 'EXISTENTE' ? (
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                Seleccionar Cliente *
              </label>
              {clientes.length === 0 ? (
                <p className="text-sm text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200">
                  No hay deudores registrados. Usa la pestaña "Nuevo Deudor".
                </p>
              ) : (
                <select
                  required
                  value={clienteId}
                  onChange={(e) => setClienteId(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg bg-white font-semibold text-gray-800 focus:outline-none focus:border-[#2C46AF]"
                >
                  {clientes.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nombre} {c.telefono ? `- (${c.telefono})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                  Nombre Completo del Deudor *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Don Pedro Pérez"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#2C46AF]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
                  Teléfono / Celular (Opcional)
                </label>
                <input
                  type="text"
                  placeholder="Ej: 320 000 0000"
                  value={nuevoTelefono}
                  onChange={(e) => setNuevoTelefono(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#2C46AF]"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase mb-1">
              ¿Deja algún abono inicial hoy? (Opcional)
            </label>
            <input
              type="number"
              min="0"
              max={totalPagar - 1}
              placeholder="0"
              value={abonoInicial}
              onChange={(e) => setAbonoInicial(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-lg font-bold text-gray-800 focus:outline-none focus:border-[#2C46AF]"
            />
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1">
            <div className="flex justify-between text-sm text-gray-600">
              <span>Total Productos:</span>
              <span className="font-bold">${totalPagar.toLocaleString()}</span>
            </div>
            {abonoInicial > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Abono Hoy:</span>
                <span className="font-bold">- ${parseFloat(abonoInicial).toLocaleString()}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-bold text-amber-700 border-t pt-2 mt-1">
              <span>Saldo a Fiar:</span>
              <span>${saldoRestante.toLocaleString()}</span>
            </div>
          </div>

          <p className="text-xs text-gray-500">
            * El stock se descontará del inventario ahora, pero el dinero entrará a Contabilidad cuando el cliente termine de pagar.
          </p>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onCerrar}
              className="px-4 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-bold text-sm hover:bg-gray-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando || (modoCliente === 'EXISTENTE' && clientes.length === 0)}
              className="px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm shadow-md disabled:opacity-50"
            >
              {cargando ? 'Guardando...' : 'Confirmar Fiado'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}