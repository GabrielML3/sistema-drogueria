import { useState, useEffect } from 'react'
import { Search, Plus, Minus, Trash2 } from 'lucide-react'
import Swal from 'sweetalert2' // <-- Importamos SweetAlert2

export default function PuntoVenta() {
  const [busqueda, setBusqueda] = useState('')
  const [resultados, setResultados] = useState([])
  const [carrito, setCarrito] = useState([])
  const [cargando, setCargando] = useState(false)
  
  useEffect(() => {
    if (busqueda.trim() === '') {
      setResultados([])
      return
    }
    const temporizador = setTimeout(async () => {
      try {
        const respuesta = await fetch(`http://127.0.0.1:8000/api/productos/buscar/?q=${busqueda}`)
        const data = await respuesta.json()
        setResultados(data)
      } catch (error) {
        console.error("Error conectando con Django:", error)
      }
    }, 300)
    return () => clearTimeout(temporizador)
  }, [busqueda])

  const manejarEnter = (e) => {
    if (e.key === 'Enter' && resultados.length === 1) {
      agregarAlCarrito(resultados[0])
      setBusqueda('')
    }
  }

  const agregarAlCarrito = (producto) => {
    setCarrito(carritoActual => {
      const existe = carritoActual.find(item => item.id === producto.id)
      if (existe) {
        return carritoActual.map(item => 
          item.id === producto.id ? { ...item, cantidad: item.cantidad + 1 } : item
        )
      }
      return [...carritoActual, { ...producto, cantidad: 1, tipo_unidad: 'UNIDAD' }]
    })
  }

  const modificarCantidad = (id, cambio) => {
    setCarrito(carritoActual => carritoActual.map(item => {
      if (item.id === id) {
        const nuevaCantidad = item.cantidad + cambio
        return nuevaCantidad > 0 ? { ...item, cantidad: nuevaCantidad } : item
      }
      return item
    }))
  }

  const cambiarTipoUnidad = (id, nuevoTipo) => {
    setCarrito(carritoActual => carritoActual.map(item => 
      item.id === id ? { ...item, tipo_unidad: nuevoTipo } : item
    ))
  }

  const eliminarDelCarrito = (id) => {
    setCarrito(carritoActual => carritoActual.filter(item => item.id !== id))
  }

  const obtenerPrecio = (item) => {
    if (item.tipo_unidad === 'CAJA') return parseFloat(item.precio_venta_caja || 0);
    if (item.tipo_unidad === 'BLISTER') return parseFloat(item.precio_venta_blister || 0);
    return parseFloat(item.precio_venta_unidad || 0);
  }

  const total = carrito.reduce((suma, item) => suma + (obtenerPrecio(item) * item.cantidad), 0)

  // AQUÍ ESTÁN LOS CAMBIOS CON SWEETALERT
  const facturarVenta = async () => {
    if (carrito.length === 0) return;
    setCargando(true);
    
    const payload = {
      items: carrito.map(item => ({
        id: item.id,
        tipo_unidad: item.tipo_unidad,
        cantidad: item.cantidad
      }))
    };
    
    try {
      const respuesta = await fetch('http://127.0.0.1:8000/api/ventas/procesar/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await respuesta.json();
      
      if (respuesta.ok) {
        // Alerta de Éxito
        Swal.fire({
          title: 'Facturación Exitosa',
          text: `El total cobrado es de $${data.total}`,
          icon: 'success',
          confirmButtonText: 'Aceptar',
          confirmButtonColor: '#16a34a' // Verde que hace juego con tu botón
        });
        setCarrito([]);
        setBusqueda('');
      } else {
        // Alerta de Error (ej. falta de stock)
        Swal.fire({
          title: 'No se pudo procesar la venta',
          text: data.error,
          icon: 'warning',
          confirmButtonText: 'Revisar',
          confirmButtonColor: '#eab308' // Amarillo de advertencia
        });
      }
    } catch (error) {
      console.error("Error al cobrar:", error);
      // Alerta de Error de Servidor
      Swal.fire({
        title: 'Error de Conexión',
        text: 'No se pudo conectar con el servidor de facturación.',
        icon: 'error',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#dc2626' // Rojo de error
      });
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden h-full">
      <header className="bg-white p-4 shadow-sm z-10 flex justify-between items-center">
        <h1 className="text-xl font-bold text-gray-800">Caja Registradora</h1>
      </header>

      <div className="flex-1 flex p-4 gap-4 overflow-hidden">
        {/* PANEL IZQUIERDO */}
        <div className="flex-1 bg-white rounded-xl shadow-md flex flex-col p-4">
          <div className="mb-4 relative">
            <label className="block text-sm font-semibold text-gray-700 mb-1">Buscar producto</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input 
                type="text" autoFocus 
                className="w-full pl-10 p-3 border-2 border-blue-200 rounded-lg focus:outline-none focus:border-blue-500 text-lg transition-colors"
                placeholder="Buscar" value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)} onKeyDown={manejarEnter}
              />
            </div>
          </div>

          <div className="flex-1 border rounded-lg overflow-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 sticky top-0 shadow-sm z-10">
                <tr>
                  <th className="p-3 border-b text-gray-600 font-semibold">Producto</th>
                  <th className="p-3 border-b text-gray-600 font-semibold text-center">Stock</th>
                  <th className="p-3 border-b text-gray-600 font-semibold text-right">Precio Unidad</th>
                  <th className="p-3 border-b text-center">Acción</th>
                </tr>
              </thead>
              <tbody>
                {resultados.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="p-8 text-center text-gray-400 italic">
                      {busqueda === '' ? "Escribe para buscar productos" : "No se encontraron productos."}
                    </td>
                  </tr>
                ) : (
                  resultados.map(prod => (
                    <tr key={prod.id} className="hover:bg-blue-50 border-b">
                      <td className="p-3 font-bold text-gray-800">{prod.nombre}</td>
                      <td className="p-3 text-center font-medium text-green-600">{prod.stock_actual_unidades}</td>
                      <td className="p-3 text-right font-bold">$ {prod.precio_venta_unidad}</td>
                      <td className="p-3 text-center">
                        <button onClick={() => agregarAlCarrito(prod)} className="bg-blue-100 text-blue-700 p-2 rounded-md hover:bg-blue-200 transition-colors">
                          <Plus className="w-5 h-5 mx-auto" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* PANEL DERECHO */}
        <div className="w-96 bg-white rounded-xl shadow-md flex flex-col border-l-4 border-blue-600">
          <div className="p-4 bg-gray-50 border-b flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-800">Resumen Venta</h2>
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-sm font-semibold">{carrito.length} items</span>
          </div>

          <div className="flex-1 p-4 overflow-auto bg-gray-50/50 space-y-3">
            {carrito.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 italic text-center">El carrito está vacío.</div>
            ) : (
              carrito.map(item => (
                <div key={item.id} className="bg-white p-3 rounded-lg shadow-sm border flex flex-col gap-2">
                  <div className="flex justify-between items-start">
                    <div className="font-bold text-gray-800 text-sm">{item.nombre}</div>
                    <button onClick={() => eliminarDelCarrito(item.id)} className="text-red-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex gap-2 mt-1">
                    <select 
                      value={item.tipo_unidad} onChange={(e) => cambiarTipoUnidad(item.id, e.target.value)}
                      className="text-xs border rounded p-1 text-gray-700 bg-gray-50 outline-none focus:border-blue-500 flex-1"
                    >
                      <option value="UNIDAD">Unidad ($ {item.precio_venta_unidad})</option>
                      {item.precio_venta_blister > 0 && <option value="BLISTER">Blíster ($ {item.precio_venta_blister})</option>}
                      {item.precio_venta_caja > 0 && <option value="CAJA">Caja ($ {item.precio_venta_caja})</option>}
                    </select>
                  </div>

                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                    <div className="flex items-center gap-2 bg-gray-100 rounded-md p-1">
                      <button onClick={() => modificarCantidad(item.id, -1)} className="bg-white p-1 rounded shadow-sm hover:bg-gray-50 text-gray-600"><Minus className="w-3 h-3" /></button>
                      <span className="font-bold w-6 text-center text-sm">{item.cantidad}</span>
                      <button onClick={() => modificarCantidad(item.id, 1)} className="bg-white p-1 rounded shadow-sm hover:bg-gray-50 text-gray-600"><Plus className="w-3 h-3" /></button>
                    </div>
                    <div className="font-bold text-blue-700 text-lg">$ {obtenerPrecio(item) * item.cantidad}</div>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="p-4 bg-white border-t space-y-4 z-10 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between text-2xl font-bold text-gray-800">
              <span>TOTAL:</span><span className="text-blue-700">$ {total}</span>
            </div>
            <button 
              onClick={facturarVenta} disabled={carrito.length === 0 || cargando}
              className={`w-full text-white text-xl font-bold py-4 rounded-xl shadow-lg transition-transform transform active:scale-95 flex justify-center items-center ${carrito.length > 0 && !cargando ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`}
            >
              {cargando ? 'Procesando...' : 'Cobrar / Facturar'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}