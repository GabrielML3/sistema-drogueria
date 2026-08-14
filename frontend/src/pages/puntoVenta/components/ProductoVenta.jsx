import {
  Package,
  ShoppingCart,
  Plus
} from 'lucide-react'

export default function ProductoVenta({
  producto,
  onAgregar
}) {
  const formatearPrecio = valor =>
    `$${parseFloat(valor).toLocaleString()}`

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:shadow-md transition-shadow">

      <div>
        <h3 className="font-bold text-gray-800 text-lg">
          {producto.nombre}
        </h3>

        <p className="text-sm text-gray-500 font-mono">
          {producto.codigo_barras || 'Sin código'}
        </p>

        <p className="text-xs font-semibold text-blue-600 mt-1 bg-blue-50 inline-block px-2 py-1 rounded">
          Stock Físico:{' '}
          {producto.stock_actual_unidades} und.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">

        {producto.tipo_presentacion !== 'SIMPLE' &&
          parseFloat(
            producto.precio_venta_caja
          ) > 0 && (
            <button
              onClick={() =>
                onAgregar(
                  producto,
                  'CAJA',
                  producto.precio_venta_caja
                )
              }
              className="flex items-center bg-indigo-50 text-indigo-700 hover:bg-indigo-100 px-3 py-2 rounded-lg font-bold text-sm transition-colors border border-indigo-100"
            >
              <Package className="w-4 h-4 mr-1" />

              Caja:{' '}
              {formatearPrecio(
                producto.precio_venta_caja
              )}
            </button>
          )}

        {producto.tipo_presentacion ===
          'COMPLETO' &&
          parseFloat(
            producto.precio_venta_blister
          ) > 0 && (
            <button
              onClick={() =>
                onAgregar(
                  producto,
                  'BLISTER',
                  producto.precio_venta_blister
                )
              }
              className="flex items-center bg-blue-50 text-blue-700 hover:bg-blue-100 px-3 py-2 rounded-lg font-bold text-sm transition-colors border border-blue-100"
            >
              <ShoppingCart className="w-4 h-4 mr-1" />

              Blíster:{' '}
              {formatearPrecio(
                producto.precio_venta_blister
              )}
            </button>
          )}

        <button
          onClick={() =>
            onAgregar(
              producto,
              'UNIDAD',
              producto.precio_venta_unidad
            )
          }
          className="flex items-center bg-green-50 text-green-700 hover:bg-green-100 px-3 py-2 rounded-lg font-bold text-sm transition-colors border border-green-100"
        >
          <Plus className="w-4 h-4 mr-1" />

          Und:{' '}
          {formatearPrecio(
            producto.precio_venta_unidad
          )}
        </button>

      </div>
    </div>
  )
}
