import { useState, useEffect } from 'react'
import { Plus, Minus, Trash2 } from 'lucide-react'

export default function ItemCarrito({ item, onEliminar, onActualizarCantidad, onFijarCantidad }) {
  const subtotal = parseFloat(item.precioVentaReal) * (item.cantidad || 0)
  
  // Estado local para permitir borrar sin que fuerce el '1' instantáneamente
  const [valorLocal, setValorLocal] = useState(item.cantidad)

  // Sincronizamos si la cantidad cambia desde los botones + o -
  useEffect(() => {
    setValorLocal(item.cantidad)
  }, [item.cantidad])

  const handleChange = (e) => {
    const texto = e.target.value
    setValorLocal(texto)
    
    const num = parseInt(texto, 10)
    // Solo actualizamos el carrito si el usuario escribió un número válido >= 1
    if (!isNaN(num) && num >= 1) {
      onFijarCantidad(item.idUnico, num)
    }
  }

  const handleBlur = () => {
    // Si el usuario dejó el campo vacío o puso 0 y se salió, lo corregimos a 1
    const num = parseInt(valorLocal, 10)
    if (isNaN(num) || num < 1) {
      setValorLocal(1)
      onFijarCantidad(item.idUnico, 1)
    }
  }

  return (
    <div className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between gap-3 hover:border-gray-200 transition-colors">
      
      {/* INFORMACIÓN DEL PRODUCTO */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className="font-bold text-gray-800 text-sm truncate">{item.nombre}</p>
          <button 
            onClick={() => onEliminar(item.idUnico)}
            className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition-colors shrink-0"
            title="Quitar producto"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2 mt-1">
          <span className="text-[11px] bg-blue-50 text-[#2C46AF] px-2 py-0.5 rounded font-bold border border-blue-100">
            Formato: {item.tipo_unidad}
          </span>
        </div>

        <div className="flex justify-between items-center mt-3">
          {/* CONTROLES DE CANTIDAD EDITABLE */}
          <div className="flex items-center bg-gray-100 rounded-lg p-1 border border-gray-200 shrink-0">
            <button 
              onClick={() => onActualizarCantidad(item.idUnico, -1)}
              className="p-1 hover:bg-white rounded text-gray-600 transition-colors focus:outline-none"
              title="Restar 1"
            >
              <Minus className="w-3.5 h-3.5" />
            </button>
            
            {/* CAMPO DE ENTRADA INTELIGENTE */}
            <input
              type="number"
              min="1"
              value={valorLocal}
              onChange={handleChange}
              onBlur={handleBlur}
              onFocus={(e) => e.target.select()} // Selecciona todo al hacer clic para sobreescribir de una
              className="w-10 text-center font-bold text-gray-800 bg-transparent focus:outline-none focus:bg-white focus:ring-1 focus:ring-[#2C46AF] rounded text-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />

            <button 
              onClick={() => onActualizarCantidad(item.idUnico, 1)}
              className="p-1 hover:bg-white rounded text-gray-600 transition-colors focus:outline-none"
              title="Sumar 1"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* SUBTOTAL */}
          <span className="text-base font-bold text-gray-800">
            ${subtotal.toLocaleString()}
          </span>
        </div>
      </div>

    </div>
  )
}