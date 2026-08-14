import { Package, Layers, Barcode, AlertTriangle } from 'lucide-react'
import Button from '../../../components/ui/Button'
import Input from '../../../components/ui/Input'

export default function ModalProducto({
  modalAbierto,
  setModalAbierto,
  editandoId,
  formData,
  handleChange,
  guardarProducto,
  categorias
}) {
  if (!modalAbierto) return null

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        <div className="p-6 border-b bg-slate-50 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <Package className="mr-2 text-[#2C46AF]" /> 
            {editandoId ? 'Modificar Producto' : 'Registrar Nuevo Producto'}
          </h2>
          <button onClick={() => setModalAbierto(false)} className="text-gray-500 hover:text-red-600 font-bold text-xl transition-colors">&times;</button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="formProducto" onSubmit={guardarProducto} className="grid grid-cols-2 gap-6">
            
            <div className="space-y-4">
              <h3 className="font-bold text-gray-700 border-b pb-2">Información Principal</h3>
              
              <Input required name="nombre" value={formData.nombre} onChange={handleChange} label="Nombre del Producto" placeholder="Ej. Acetaminofén 500mg" />

              <div className="grid grid-cols-2 gap-4"> 
                <div>
                  <label className="block text-sm font-semibold text-gray-600 mb-1">Categoría <span className="text-red-500">*</span></label>
                  <select required name="categoria" value={formData.categoria} onChange={handleChange} className="w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#2C46AF] focus:ring-1 focus:ring-[#2C46AF] bg-white">
                    <option value="">- Seleccione -</option>
                    {categorias.map(c => (<option key={c.id} value={c.id}>{c.nombre}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-blue-700 flex items-center mb-1"><Layers className="w-4 h-4 mr-1"/> Comportamiento <span className="text-red-500">*</span></label>
                  <select required name="tipo_presentacion" value={formData.tipo_presentacion} onChange={handleChange} className="w-full p-2.5 border border-[#2C46AF] rounded-lg bg-blue-50 focus:outline-none focus:border-[#1E3185] focus:ring-1 focus:ring-[#1E3185] font-semibold text-[#1E3185]">
                    <option value="SIMPLE">Unidad Simple</option>
                    <option value="CAJA_UNIDAD">Caja y Unidad</option>
                    <option value="COMPLETO">Pastillas (Caja, Blíster, Und)</option>
                  </select>
                </div>
              </div>

              <Input name="codigo_barras" value={formData.codigo_barras} onChange={handleChange} label="Código de Barras" icon={Barcode} placeholder="Escanea aquí..." />

              {formData.tipo_presentacion !== 'SIMPLE' && (
                <div className="grid grid-cols-2 gap-4 bg-gray-50 p-3 rounded border">
                  {formData.tipo_presentacion === 'COMPLETO' && (
                    <Input required type="number" min="1" name="unidades_por_blister" value={formData.unidades_por_blister} onChange={handleChange} label="Unidades x Blíster" />
                  )}
                  <Input required type="number" min="1" name="unidades_por_caja" value={formData.unidades_por_caja} onChange={handleChange} label="Unidades x Caja" />
                </div>
              )}
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-gray-700 border-b pb-2">Finanzas y Stock</h3>
              
              <Input required type="number" step="0.01" name="precio_compra_caja" value={formData.precio_compra_caja} onChange={handleChange} label={`Costo Compra ${formData.tipo_presentacion === 'SIMPLE' ? '(Unidad)' : '(Caja)'}`} />

              <div className={`grid ${formData.tipo_presentacion === 'COMPLETO' ? 'grid-cols-3' : formData.tipo_presentacion === 'CAJA_UNIDAD' ? 'grid-cols-2' : 'grid-cols-1'} gap-2`}> 
                {formData.tipo_presentacion !== 'SIMPLE' && (
                  <Input required type="number" step="0.01" name="precio_venta_caja" value={formData.precio_venta_caja} onChange={handleChange} label="P. Venta Caja" />
                )} 
                {formData.tipo_presentacion === 'COMPLETO' && (
                  <Input type="number" step="0.01" name="precio_venta_blister" value={formData.precio_venta_blister} onChange={handleChange} label="P. Venta Blíster" />
                )}
                <Input type="number" step="0.01" name="precio_venta_unidad" value={formData.precio_venta_unidad} onChange={handleChange} label="P. Venta Unidad" />
              </div>

              <div className="bg-amber-50 p-4 rounded-lg border border-amber-200 mt-4">
                <h4 className="text-sm font-bold text-amber-800 flex items-center mb-3">
                  <AlertTriangle className="w-4 h-4 mr-1" /> Control Físico (En unidades min.)
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <Input required type="number" name="stock_actual_unidades" value={formData.stock_actual_unidades} onChange={handleChange} label="Stock Actual" />
                  <Input required type="number" name="stock_minimo_alerta" value={formData.stock_minimo_alerta} onChange={handleChange} label="Stock Mínimo" />
                </div>
              </div>
            </div>

          </form>
        </div>

        <div className="p-4 border-t bg-gray-50 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setModalAbierto(false)}>
            Cancelar
          </Button>
          <Button type="submit" form="formProducto" variant="primary">
            {editandoId ? 'Actualizar Cambios' : 'Guardar Producto'}
          </Button>
        </div>

      </div>
    </div>
  )
}