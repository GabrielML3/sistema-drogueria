import {
  Plus,
  Minus,
  Trash2
} from 'lucide-react'

export default function ItemCarrito({
  item,
  onEliminar,
  onActualizarCantidad
}) {
  const subtotal =
    parseFloat(item.precioVentaReal) * item.cantidad

  return (
    <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-100">

      <div className="flex justify-between items-start mb-2">
        <div>
          <p className="font-bold text-gray-800 leading-tight">
            {item.nombre}
          </p>

          <p className="text-xs font-semibold text-[#2C46AF] bg-blue-50 inline-block px-1.5 rounded mt-1">
            Formato: {item.tipo_unidad}
          </p>
        </div>

        <button
          onClick={() => onEliminar(item.idUnico)}
          className="text-red-400 hover:text-red-600 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      <div className="flex justify-between items-center mt-3 border-t pt-2 border-gray-50">

        <div className="flex items-center bg-gray-100 rounded-lg">
          <button
            onClick={() =>
              onActualizarCantidad(
                item.idUnico,
                -1
              )
            }
            className="p-1 text-gray-600 hover:bg-gray-200 rounded-l-lg"
          >
            <Minus className="w-4 h-4" />
          </button>

          <span className="w-8 text-center font-bold text-sm">
            {item.cantidad}
          </span>

          <button
            onClick={() =>
              onActualizarCantidad(
                item.idUnico,
                1
              )
            }
            className="p-1 text-gray-600 hover:bg-gray-200 rounded-r-lg"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>

        <p className="font-bold text-gray-800">
          ${subtotal.toLocaleString()}
        </p>

      </div>
    </div>
  )
}