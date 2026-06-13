import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
// Agregamos los íconos nuevos: CheckSquare, Square, Plus, Minus, Printer
import { User, Bell, LogOut, Settings, AlertTriangle, PackageSearch, TrendingUp, CheckSquare, Square, Plus, Minus, Printer } from 'lucide-react'
import clienteAxios from '../api/axios'
import qz from 'qz-tray' // <-- Importamos QZ Tray para imprimir los pedidos

export default function Navbar() {
  const [alertasStock, setAlertasStock] = useState([])
  const [alertaVentas, setAlertaVentas] = useState(null)
  const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false)
  const [menuAlertasAbierto, setMenuAlertasAbierto] = useState(false)
  
  // NUEVOS ESTADOS PARA LOS PEDIDOS A PROVEEDORES
  const [pedidosProveedor, setPedidosProveedor] = useState({}) // Guarda { id_producto: cantidad }
  const [alertasOcultas, setAlertasOcultas] = useState([]) // Guarda los IDs de los productos ya impresos
  const [imprimiendo, setImprimiendo] = useState(false)
   
  const perfilRef = useRef(null)
  const alertasRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    cargarNotificacionesInteligentes()
    
    const handleClickFuera = (event) => { 
      if (perfilRef.current && !perfilRef.current.contains(event.target)) setMenuPerfilAbierto(false)
      // Evitamos cerrar las alertas si hacemos clic dentro del menú (para poder darle a los botones + y -)
      if (alertasRef.current && !alertasRef.current.contains(event.target)) setMenuAlertasAbierto(false)
    }
    document.addEventListener("mousedown", handleClickFuera)
    return () => document.removeEventListener("mousedown", handleClickFuera)
  }, [])

  const cargarNotificacionesInteligentes = async () => {  
    try {  
      const resProd = await clienteAxios.get('productos/')
      const bajoStock = resProd.data.filter(p => p.stock_actual_unidades <= p.stock_minimo_alerta)
      setAlertasStock(bajoStock)
 
      const resVentas = await clienteAxios.get('ventas/')
      const ventas = resVentas.data
      const ventasPorDia = {} 
      
      ventas.forEach(v => {
        const fecha = new Date(v.fecha_hora) 
        const llaveDia = `${fecha.getFullYear()}-${fecha.getMonth()}-${fecha.getDate()}`
        if (!ventasPorDia[llaveDia]) ventasPorDia[llaveDia] = 0
        ventasPorDia[llaveDia] += parseFloat(v.total)
      })

      const hoy = new Date() 
      const llaveHoy = `${hoy.getFullYear()}-${hoy.getMonth()}-${hoy.getDate()}`
      const totalHoy = ventasPorDia[llaveHoy] || 0

      let recordAnterior = 0 
      for (const dia in ventasPorDia) {
        if (dia !== llaveHoy && ventasPorDia[dia] > recordAnterior) {
          recordAnterior = ventasPorDia[dia]
        }
      }
 
      if (totalHoy > recordAnterior && recordAnterior > 0) {
        setAlertaVentas({ mensaje: `¡Récord histórico! Has vendido $${totalHoy.toLocaleString()}, superando el mejor día que estaba en $${recordAnterior.toLocaleString()}.` })
      } else {
        setAlertaVentas(null)
      }
    } catch (error) { 
      console.error("Error cargando notificaciones:", error)
    }
  }

  // LÓGICA DE SELECCIÓN DE PRODUCTOS PARA PEDIDO
  const toggleSeleccionPedido = (id) => {
    setPedidosProveedor(prev => {
      const nuevo = { ...prev }
      if (nuevo[id]) {
        delete nuevo[id] // Si ya estaba, lo quitamos
      } else {
        nuevo[id] = 1 // Si no estaba, lo agregamos con cantidad 1 por defecto
      }
      return nuevo
    })
  }

  const cambiarCantidadPedido = (id, incremento) => {
    setPedidosProveedor(prev => {
      const cantidadActual = prev[id] || 1
      const nuevaCantidad = cantidadActual + incremento
      if (nuevaCantidad < 1) return prev // No permitimos bajar de 1
      return { ...prev, [id]: nuevaCantidad }
    })
  }

  // LÓGICA DE IMPRESIÓN CON QZ TRAY
  const imprimirListaPedido = async () => {
    setImprimiendo(true)
    try {
      if (!qz.websocket.isActive()) {
        await qz.websocket.connect()
      }

      // ⚠️ CAMBIA ESTO POR EL NOMBRE DE LA IMPRESORA QUE USASTE EN PUNTO DE VENTA
      const config = qz.configs.create("EPSON TM-U220 Receipt") 

      const data = [
        '\x1B\x40', // Reset
        '\x1B\x61\x01', // Centrar
        '\x1B\x45\x01', // Negrita On
        'PEDIDO A PROVEEDOR\n',
        'DROGUERIA DON SIXTO\n',
        '\x1B\x45\x00', // Negrita Off
        '\x1B\x61\x00', // Izquierda
        '--------------------------------\n',
        'PRODUCTO                  CANT\n',
        '--------------------------------\n',
      ]

      // Filtrar solo los productos seleccionados
      const productosAImprimir = alertasStock.filter(p => pedidosProveedor[p.id])

      productosAImprimir.forEach(prod => {
        // Cortamos el nombre si es muy largo y lo rellenamos de espacios para alinear la cantidad
        let nombre = prod.nombre.substring(0, 24).padEnd(25, ' ')
        let cantidad = pedidosProveedor[prod.id].toString().padStart(5, ' ')
        data.push(`${nombre} ${cantidad}\n`)
      })

      data.push('--------------------------------\n')
      data.push('\n\n\n\n\n\x1B\x69') // Cortar papel

      await qz.print(config, data)

      // Una vez impreso, agregamos los IDs a la lista de ocultos para que desaparezcan de la campanita temporalmente
      const idsImpresos = productosAImprimir.map(p => p.id)
      setAlertasOcultas(prev => [...prev, ...idsImpresos])
      
      // Limpiamos la selección
      setPedidosProveedor({})
      
    } catch (error) {
      console.error("Error al imprimir el pedido:", error)
      alert("Hubo un error al imprimir la lista de pedido.")
    } finally {
      setImprimiendo(false)
    }
  }

  // Filtramos las alertas para NO mostrar las que ya se imprimieron (ocultas)
  const alertasVisibles = alertasStock.filter(p => !alertasOcultas.includes(p.id))
  
  // Recalculamos el total de notificaciones visibles
  const totalNotificaciones = alertasVisibles.length + (alertaVentas ? 1 : 0)

  return (
    <header className="bg-white h-16 shadow-sm z-20 flex justify-between items-center px-6 shrink-0 border-b relative font-sans">
      
      {/* SECCIÓN IZQUIERDA */}
      <div className="flex items-center gap-3">
        <div className="bg-green-100 border border-green-200 text-green-700 px-3 py-1 rounded-md text-sm font-bold flex items-center shadow-sm">
          <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
          Caja #1 Operativa
        </div>
      </div>

      {/* SECCIÓN DERECHA */}
      <div className="flex items-center gap-4">
        
        {/* CAMPANA DE NOTIFICACIONES */}
        <div className="relative" ref={alertasRef}>
          <button 
            onClick={() => { setMenuAlertasAbierto(!menuAlertasAbierto); setMenuPerfilAbierto(false); }}
            className={`p-2 rounded-lg transition-colors relative ${menuAlertasAbierto ? 'bg-blue-50 text-[#2C46AF]' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <Bell className="w-5 h-5" />
            {totalNotificaciones > 0 && (
              <span className="absolute top-1 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
            )}
          </button>

          {/* MENÚ DESPLEGABLE DE ALERTAS */}
          {menuAlertasAbierto && (
            <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200 flex flex-col max-h-[85vh]">
              <div className="px-4 py-3 border-b border-gray-50 flex justify-between items-center bg-white sticky top-0 z-10 rounded-t-xl">
                <h4 className="font-bold text-gray-800">Centro de Notificaciones</h4>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-bold">{totalNotificaciones}</span>
              </div>
              
              <div className="overflow-y-auto flex-1 pb-2">
                {totalNotificaciones === 0 ? (
                  <div className="px-4 py-10 text-center text-gray-500 flex flex-col items-center">
                    <PackageSearch className="w-10 h-10 text-gray-300 mb-3" />
                    <span className="text-sm font-medium">Todo está al día.</span>
                  </div>
                ) : (
                  <>
                    {/* ALERTA DE VENTAS */}
                    {alertaVentas && (
                      <div className="px-4 py-3 bg-green-50/50 hover:bg-green-50 border-b border-green-100 transition-colors flex gap-3 items-start">
                        <div className="bg-green-100 p-2 rounded-full text-green-600 shrink-0 shadow-sm">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-green-800">¡Récord de Ventas!</p>
                          <p className="text-xs text-green-700 font-medium mt-0.5 leading-relaxed">{alertaVentas.mensaje}</p>
                        </div>
                      </div>
                    )}

                    {/* ALERTAS DE STOCK CON SELECCIÓN */}
                    {alertasVisibles.map(prod => (
                      <div key={prod.id} className="px-4 py-3 hover:bg-gray-50 border-b border-gray-50 transition-colors flex gap-3 items-center">
                        
                        {/* Checkbox de Selección */}
                        <button 
                          onClick={() => toggleSeleccionPedido(prod.id)}
                          className="text-gray-400 hover:text-[#2C46AF] transition-colors focus:outline-none"
                        >
                          {pedidosProveedor[prod.id] ? (
                            <CheckSquare className="w-5 h-5 text-[#2C46AF]" />
                          ) : (
                            <Square className="w-5 h-5" />
                          )}
                        </button>

                        {/* Info del Producto */}
                        <div className="flex-1 cursor-default">
                          <p className={`text-sm font-bold transition-colors ${pedidosProveedor[prod.id] ? 'text-[#2C46AF]' : 'text-gray-800'}`}>
                            {prod.nombre}
                          </p>
                          <p className="text-xs text-red-600 font-semibold mt-0.5">
                            Quedan {prod.stock_actual_unidades} (Mín: {prod.stock_minimo_alerta})
                          </p>
                        </div>

                        {/* Controles de Cantidad (Solo aparece si está seleccionado) */}
                        {pedidosProveedor[prod.id] && (
                          <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1 shadow-sm shrink-0">
                            <button 
                              onClick={() => cambiarCantidadPedido(prod.id, -1)}
                              className="p-1 hover:bg-gray-100 text-gray-600 rounded transition-colors"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="text-sm font-bold w-6 text-center text-gray-800">
                              {pedidosProveedor[prod.id]}
                            </span>
                            <button 
                              onClick={() => cambiarCantidadPedido(prod.id, 1)}
                              className="p-1 hover:bg-gray-100 text-gray-600 rounded transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </>
                )}
              </div>

              {/* BOTÓN DE IMPRESIÓN (Sticky abajo, solo aparece si hay seleccionados) */}
              {Object.keys(pedidosProveedor).length > 0 && (
                <div className="p-3 bg-gray-50 border-t border-gray-200 sticky bottom-0 rounded-b-xl">
                  <button
                    onClick={imprimirListaPedido}
                    disabled={imprimiendo}
                    className="w-full bg-[#2C46AF] hover:bg-blue-800 disabled:bg-gray-400 text-white font-bold py-2.5 px-4 rounded-lg flex justify-center items-center gap-2 transition-colors shadow-sm"
                  >
                    <Printer className="w-4 h-4" />
                    {imprimiendo ? 'Enviando a impresora...' : `Imprimir Pedido (${Object.keys(pedidosProveedor).length})`}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-gray-200 mx-1"></div>

        {/* PERFIL DE USUARIO */}
        <div className="relative" ref={perfilRef}>
          {/* ... (El código de tu perfil se mantiene exactamente igual) ... */}
          <button 
            onClick={() => { setMenuPerfilAbierto(!menuPerfilAbierto); setMenuAlertasAbierto(false); }}
            className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="text-right hidden md:block">
              <p className="text-sm font-bold text-gray-800 leading-tight">Administrador</p>
              <p className="text-xs text-[#2C46AF] font-semibold">Gerencia</p>
            </div>
            <div className="w-9 h-9 bg-slate-800 text-white rounded-lg flex items-center justify-center font-bold shadow-sm">
              <User className="w-5 h-5" />
            </div>
          </button>
 
          {menuPerfilAbierto && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-gray-50 mb-1">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Cuenta Activa</p>
              </div>
              
              <button  
                onClick={() => { 
                  navigate('/configuracion')
                  setMenuPerfilAbierto(false)
                }}
                className="w-full px-4 py-2 text-left text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-[#2C46AF] flex items-center transition-colors"
              >
                <Settings className="w-4 h-4 mr-3" /> Configuración
              </button>
              
              <button 
                onClick={() => {
                  localStorage.removeItem('access_token');
                  localStorage.removeItem('refresh_token');
                  window.location.reload();
                }}
                className="w-full px-4 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50 flex items-center transition-colors mt-1 border-t border-gray-50 pt-3"
              >
                <LogOut className="w-4 h-4 mr-3" /> Cerrar Sesión
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  )
}