import { Plus, Edit, Trash2, Search, AlertTriangle, Calculator } from 'lucide-react'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import ModalProducto from './components/ModalProducto'
import { useInventario } from './hooks/useInventario'

export default function Inventario() {
  const {
    categorias,
    busqueda,
    setBusqueda,
    modalAbierto,
    setModalAbierto,
    editandoId,
    filtroBajoStock,
    setFiltroBajoStock,
    formData,
    productosFiltrados,
    handleChange,
    abrirModalCrear,
    abrirModalEditar,
    guardarProducto,
    eliminarProducto,
    calcularValorInventario
  } = useInventario()

  return (
    <div className="flex flex-col h-full bg-gray-100 p-6 overflow-hidden">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Inventario</h1>
          <p className="text-gray-500">Gestiona tus medicamentos y existencias</p>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={calcularValorInventario} icon={Calculator}>
            Calcular Inversión
          </Button>
          <Button onClick={abrirModalCrear} icon={Plus}>
            Nuevo Producto
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md flex flex-col flex-1 overflow-hidden">
        <div className="p-4 border-b flex gap-4 items-center bg-gray-50">
          <Input 
            placeholder="Buscar producto por nombre o código..." 
            value={busqueda} 
            onChange={(e) => setBusqueda(e.target.value)}
            icon={Search}
            className="flex-1 max-w-md"
          />
          
          <button  
            onClick={() => setFiltroBajoStock(!filtroBajoStock)}
            className={`flex items-center px-4 py-2.5 rounded-lg font-semibold transition-all duration-300 ${
              filtroBajoStock 
                ? 'bg-red-100 text-red-700 border border-red-300 shadow-sm' 
                : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-100'
            }`}
          >
            <AlertTriangle className={`w-5 h-5 mr-2 ${filtroBajoStock ? 'text-red-600 animate-pulse' : 'text-gray-400'}`} />
            {filtroBajoStock ? 'Mostrando Recompras' : 'Ver Bajo Stock'}
          </button>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-white sticky top-0 shadow-sm z-10">
              <tr>
                <th className="p-4 border-b text-gray-600 font-semibold">Cód. Barras</th>
                <th className="p-4 border-b text-gray-600 font-semibold">Nombre</th>
                <th className="p-4 border-b text-gray-600 font-semibold text-center">Tipo</th>
                <th className="p-4 border-b text-gray-600 font-semibold text-center">Stock Físico</th>
                <th className="p-4 border-b text-center text-gray-600 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productosFiltrados.map(prod => (
                <tr key={prod.id} className="hover:bg-blue-50 border-b transition-colors">
                  <td className="p-4 text-gray-600 font-mono text-sm">{prod.codigo_barras || <span className="text-gray-400 italic">-</span>}</td>
                  <td className="p-4 font-bold text-gray-800">{prod.nombre}</td>
                  <td className="p-4 text-center">
                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs font-bold border">
                      {prod.tipo_presentacion === 'SIMPLE' ? 'UNIDAD' : prod.tipo_presentacion === 'CAJA_UNIDAD' ? 'CAJA/UND' : 'COMPLETO'}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold ${prod.stock_actual_unidades <= prod.stock_minimo_alerta ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {prod.stock_actual_unidades} und.
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex justify-center gap-3">
                      <button onClick={() => abrirModalEditar(prod)} className="text-blue-500 hover:text-blue-700 transition-colors"><Edit className="w-5 h-5" /></button>
                      <button onClick={() => eliminarProducto(prod.id, prod.nombre)} className="text-red-500 hover:text-red-700 transition-colors"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {productosFiltrados.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-gray-500 italic">
                    {filtroBajoStock 
                      ? "El inventario se encuentra estable. No hay alertas." 
                      : "No se encontraron productos."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ModalProducto
        modalAbierto={modalAbierto}
        setModalAbierto={setModalAbierto}
        editandoId={editandoId}
        formData={formData}
        handleChange={handleChange}
        guardarProducto={guardarProducto}
        categorias={categorias}
      />

    </div>
  )
}