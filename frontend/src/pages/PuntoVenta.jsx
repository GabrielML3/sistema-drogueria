import { useState, useEffect, useMemo } from 'react'
import {
  Search,
  ShoppingCart,
  Trash2,
  DollarSign,
  Printer
} from 'lucide-react'
import Swal from 'sweetalert2'
import clienteAxios from '../api/axios'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import ProductoVenta from '../components/ProductoVenta'
import ItemCarrito from '../components/ItemCarrito'

// IMPORTAMOS LA LIBRERÍA DE QZ TRAY
import qz from 'qz-tray'

export default function PuntoVenta() {
  const [busqueda, setBusqueda] = useState('') 
  const [carrito, setCarrito] = useState([])
  const [cargando, setCargando] = useState(false)
  const [todosLosProductos, setTodosLosProductos] = useState([])

  // CONECTAR A QZ TRAY AL ABRIR LA PÁGINA
  useEffect(() => {
    const conectarImpresora = async () => {
      try {
        if (!qz.websocket.isActive()) {
          await qz.websocket.connect()
          console.log("QZ Tray conectado exitosamente")
        }
      } catch (error) {
        console.error("No se pudo conectar con QZ Tray. Asegúrate de que el programa esté abierto en Windows.", error)
      }
    }

    const cargarProductos = async () => {
      try {
        const res = await clienteAxios.get('productos/')
        setTodosLosProductos(res.data)
      } catch (error) {
        console.error(error)
      }
    }

    conectarImpresora()
    cargarProductos()
  }, [])

  const resultados = useMemo(() => {
    if (!busqueda.trim()) return []
    const termino = busqueda.toLowerCase().trim()
    return todosLosProductos.filter(
      producto =>
        producto.nombre.toLowerCase().includes(termino) ||
        producto.codigo_barras?.toLowerCase().includes(termino)
    )
  }, [busqueda, todosLosProductos])

  const agregarAlCarrito = (producto, tipoUnidad, precio, cantidad = 1) => {
    const idUnico = `${producto.id}-${tipoUnidad}`
    setCarrito(prev => {
      const existe = prev.find(item => item.idUnico === idUnico)
      if (existe) {
        return prev.map(item =>
          item.idUnico === idUnico
            ? { ...item, cantidad: item.cantidad + cantidad }
            : item
        )
      }
      return [...prev, { ...producto, idUnico, tipo_unidad: tipoUnidad, precioVentaReal: precio, cantidad }]
    })
    setBusqueda('')
  }

  const actualizarCantidad = (idUnico, delta) => {
    setCarrito(prev =>
      prev.map(item =>
        item.idUnico === idUnico
          ? { ...item, cantidad: Math.max(1, item.cantidad + delta) }
          : item
      )
    )
  }

  const eliminarDelCarrito = idUnico => setCarrito(prev => prev.filter(item => item.idUnico !== idUnico))
  const limpiarCarrito = () => setCarrito([])

  const totalPagar = useMemo(() => {
    return carrito.reduce((sum, item) => sum + parseFloat(item.precioVentaReal) * item.cantidad, 0)
  }, [carrito])

  const finalizarVenta = totalRegistrado => {
    Swal.fire({
      title: 'Facturación Exitosa',
      text: `El total cobrado es de $${Number(totalRegistrado).toLocaleString()}`,
      icon: 'success',
      confirmButtonText: 'Aceptar',
      confirmButtonColor: '#16a34a'
    })
    setCarrito([])
    setBusqueda('')
    setCargando(false)
  }

  // =======================================================================
  // LA MAGIA DE QZ TRAY: IMPRESIÓN DIRECTA EN LENGUAJE DE MÁQUINA (ESC/POS)
  // =======================================================================
  const imprimirConQZ = async () => {
    try {
      if (!qz.websocket.isActive()) {
        await qz.websocket.connect()
      }

      // IMPORTANTE: Pon aquí el nombre EXACTO de la impresora como aparece en Windows
      const nombreImpresora = "EPSON TM-U220 Receipt" 
      
      const config = qz.configs.create(nombreImpresora)

      // Función matemática para alinear las columnas a 33 caracteres (estándar TM-U220)
      const formatearLineaTicket = (cant, nombre, total) => {
        const c = cant.toString().padEnd(3, ' ')
        const t = `$${total.toLocaleString()}`.padStart(9, ' ')
        const n = nombre.substring(0, 19).padEnd(19, ' ')
        return `${c} ${n} ${t}\n`
      }

      // Arreglo de comandos (Hexadecimal para la máquina + Texto plano)
      const data = [
        '\x1B\x40',          // Reset / Inicializar impresora
        '\x1B\x61\x01',      // Alinear al centro
        '\x1B\x45\x01',      // Activar Negrita
        'DROGUERIA\n',
        'DON SIXTO GABRIEL\n',
        '\x1B\x45\x00',      // Desactivar Negrita
        'NIT: 17.341.933-1\n',
        'K 19 4D 08, Macunaima\n',
        'Villavicencio, Meta\n',
        'Celular: 320 490 1142\n',
        '---------------------------------\n',
        '\x1B\x45\x01',
        'Factura de Venta POS\n',
        '\x1B\x45\x00',
        `Fecha: ${new Date().toLocaleDateString('es-CO')} ${new Date().toLocaleTimeString('es-CO')}\n`,
        'Cajero: Administrador\n',
        '---------------------------------\n',
        '\x1B\x61\x00',      // Alinear a la izquierda
        '\x1B\x45\x01',
        'CT  ITEM                  VALOR  \n',
        '\x1B\x45\x00',
      ]

      // Agregamos los productos calculados perfectamente
      carrito.forEach(item => {
        const subtotal = parseFloat(item.precioVentaReal) * item.cantidad
        data.push(formatearLineaTicket(item.cantidad, item.nombre, subtotal))
      })

      // Pie de factura y comandos finales
      data.push('---------------------------------\n')
      data.push('\x1B\x61\x02') // Alinear a la derecha
      data.push('\x1B\x45\x01') // Negrita
      data.push(`TOTAL: $${totalPagar.toLocaleString()}\n`)
      data.push('\x1B\x45\x00')
      data.push('\x1B\x61\x01') // Centro
      data.push('\n!Gracias por su compra!\n')
      data.push('Software by DON SIXTO GABRIEL v1.0\n')
      
      // Comandos de hardware
      data.push('\x0A\x0A\x0A\x0A\x0A') // Avanzar papel (5 líneas) para no cortar el texto
      data.push('\x1D\x56\x41')         // Guillotina: Cortar papel (si el modelo lo soporta)
      data.push('\x1B\x70\x00\x19\xFA') // ¡Magia!: Patear cajón monedero para que se abra

      // Enviamos el paquete crudo directo a la impresora sin abrir el cuadro de Chrome
      await qz.print(config, data)

    } catch (error) {
      console.error("Error en QZ Tray:", error)
      throw error // Lanzamos el error para que SweetAlert lo atrape
    }
  }

  const facturarVenta = async (imprimir = false) => {
    if (carrito.length === 0) return

    const confirmacion = await Swal.fire({
      title: imprimir ? '¿Imprimir y Facturar?' : '¿Cobrar Venta?',
      text: `Estás a punto de registrar una venta por $${totalPagar.toLocaleString()}`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Sí, registrar',
      cancelButtonText: 'Cancelar'
    })

    if (!confirmacion.isConfirmed) return

    setCargando(true)

    const payload = {
      items: carrito.map(item => ({
        id: item.id,
        tipo_unidad: item.tipo_unidad,
        cantidad: item.cantidad
      }))
    }

    try {
      const res = await clienteAxios.post('ventas/procesar/', payload)

      if (imprimir) {
        // Ejecutamos la impresión por QZ Tray (sin ventana de Windows)
        await imprimirConQZ()
      }
      
      finalizarVenta(res.data.total)
    } catch (error) {
      const mensajeError = error.response?.data?.error || 'Asegúrate de tener la app QZ Tray abierta en tu PC.'
      Swal.fire({
        title: 'Error en la venta',
        text: mensajeError,
        icon: 'warning',
        confirmButtonColor: '#eab308'
      })
      setCargando(false)
    }
  }

  const manejarEscaneo = e => {
    e.preventDefault()
    const inputBuscador = document.querySelector('input[name="busqueda"]')
    inputBuscador?.select()
  }

  return (
    <>
      <div className="flex flex-col md:flex-row h-full bg-gray-100 overflow-hidden">
        {/* PANEL IZQUIERDO */}
        <div className="flex-1 flex flex-col p-6 border-r border-gray-200">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Punto de Venta</h1>
            <p className="text-gray-500">Busca productos y agrégalos a la factura</p>
          </div>

          <form onSubmit={manejarEscaneo} className="mb-6">
            <Input
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

        {/* PANEL DERECHO */}
        <div className="w-full md:w-1/3 bg-white flex flex-col shadow-xl z-10 shrink-0">
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
                />
              ))
            )}
          </div>

          <div className="p-4 bg-white border-t border-gray-200 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-500 font-bold text-sm">Total a pagar:</span>
              <span className="text-3xl font-bold text-[#2C46AF]">${totalPagar.toLocaleString()}</span>
            </div>

            {/* DISTRIBUCIÓN POS COMPACTA */}
            <div className="flex flex-col gap-2">
              
              {/* Fila 1: Opciones secundarias (Más delgadas) */}
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

              {/* Fila 2: Acción Principal (Altura equilibrada) */}
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
    </>
  )
}