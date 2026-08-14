import { Search, ShoppingCart, Trash2, DollarSign, Printer } from 'lucide-react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import ProductoVenta from './components/ProductoVenta'
import ItemCarrito from './components/ItemCarrito'
import { useCarrito } from './hooks/useCarrito'

export default function PuntoVenta() {
  const {
    busqueda,
    setBusqueda,
    carrito,
    cargando,
    resultados,
    totalPagar,
    buscadorRef,
    enfocarBuscador,
    agregarAlCarrito,
    actualizarCantidad,
    fijarCantidadDirecta,
    eliminarDelCarrito,
    limpiarCarrito,
    facturarVenta
  } = useCarrito()

  const manejarEscaneo = e => {
    e.preventDefault()
    enfocarBuscador()
  }

  return (
    <div className="flex flex-col md:flex-row h-full bg-gray-100 overflow-hidden">
      <div className="flex-1 flex flex-col p-6 border-r border-gray-200">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Punto de Venta</h1>
          <p className="text-gray-500">Busca productos y agrégalos a la factura</p>
        </div>

        <form onSubmit={manejarEscaneo} className="mb-6">
          <Input
            ref={buscadorRef}
            name="busqueda"
            icon={Search}
            placeholder="Escribe el nombre o escanea un código..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
          <button type="submit" className="hidden">Buscar</button>
        </form>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {resultados.length === 0 && busqueda !== '' && (
            <div className="text-center p-8 text-gray-500 bg-white rounded-xl border border-dashed">
              No se encontraron productos para "{busqueda}"
            </div>
          )}
          {resultados.map(producto => (
            <ProductoVenta key={producto.id} producto={producto} onAgregar={agregarAlCarrito} />
          ))}
        </div>
      </div>

      <div 
        className="w-full md:w-1/3 bg-white flex flex-col shadow-xl z-10 shrink-0"
        onMouseLeave={enfocarBuscador}
      >
        <div className="p-6 bg-slate-800 text-white flex justify-between items-center">
          <h2 className="text-xl font-bold flex items-center">
            <ShoppingCart className="mr-2" />
            Factura Actual
          </h2>
          <span className="bg-slate-700 px-3 py-1 rounded-full text-sm font-bold">
            {carrito.length} Items
          </span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
          {carrito.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400 opacity-50">
              <ShoppingCart className="w-16 h-16 mb-4" />
              <p className="font-bold">El carrito está vacío</p>
            </div>
          ) : (
            carrito.map(item => (
              <ItemCarrito
                key={item.idUnico}
                item={item}
                onEliminar={eliminarDelCarrito}
                onActualizarCantidad={actualizarCantidad}
                onFijarCantidad={fijarCantidadDirecta}
              />
            ))
          )}
        </div>

        <div className="p-4 bg-white border-t border-gray-200 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-center mb-3">
            <span className="text-gray-500 font-bold text-sm">Total a pagar:</span>
            <span className="text-3xl font-bold text-[#2C46AF]">${totalPagar.toLocaleString()}</span>
          </div>

          <div className="flex flex-col gap-2"> 
            <div className="flex gap-2">
              {carrito.length > 0 && (
                <Button 
                  variant="danger" 
                  onClick={limpiarCarrito} 
                  title="Vaciar carrito" 
                  className="px-3 py-2 shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
              
              <Button
                variant="secondary"
                onClick={() => facturarVenta(true)}
                cargando={cargando}
                icon={Printer}
                className="flex-1 py-2 text-sm font-bold border-blue-200 text-[#2C46AF] hover:bg-blue-50 shadow-sm"
              >
                Imprimir y Cobrar
              </Button>
            </div>

            <Button 
              variant="success"
              onClick={() => facturarVenta(false)}
              cargando={cargando}
              icon={DollarSign}
              className="w-full py-2.5 text-base font-bold uppercase tracking-widest shadow-md"
            >
              Cobrar Venta
            </Button>
          </div> 
        </div>
      </div>
    </div>
  )
}