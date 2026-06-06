import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom' // <-- Para navegar a Configuración
import { User, Bell, LogOut, Settings, AlertTriangle, PackageSearch, TrendingUp } from 'lucide-react'
import clienteAxios from '../api/axios' // <-- Para peticiones seguras

export default function Navbar() {
  const [alertasStock, setAlertasStock] = useState([])
  const [alertaVentas, setAlertaVentas] = useState(null) // <-- Nuevo estado para el récord
  const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false)
  const [menuAlertasAbierto, setMenuAlertasAbierto] = useState(false)
   
  const perfilRef = useRef(null)
  const alertasRef = useRef(null)
  const navigate = useNavigate() // <-- Hook de React Router

  useEffect(() => {
    cargarNotificacionesInteligentes()
    
    const handleClickFuera = (event) => { 
      if (perfilRef.current && !perfilRef.current.contains(event.target)) setMenuPerfilAbierto(false)
      if (alertasRef.current && !alertasRef.current.contains(event.target)) setMenuAlertasAbierto(false)
    }
    document.addEventListener("mousedown", handleClickFuera)
    return () => document.removeEventListener("mousedown", handleClickFuera)
  }, [])

const cargarNotificacionesInteligentes = async () => {
    try {
      // 1. CARGAR ALERTAS DE INVENTARIO
      const resProd = await clienteAxios.get('productos/')
      const bajoStock = resProd.data.filter(p => p.stock_actual_unidades <= p.stock_minimo_alerta)
      setAlertasStock(bajoStock)

      // 2. CALCULAR RÉCORD HISTÓRICO DE VENTAS
      const resVentas = await clienteAxios.get('ventas/')
      const ventas = resVentas.data

      // Agrupamos el dinero de las ventas por cada día
      const ventasPorDia = {}
      ventas.forEach(v => {
        const fecha = new Date(v.fecha_hora)
        // Creamos una llave única para cada día (Ej: "2026-4-28")
        const llaveDia = `${fecha.getFullYear()}-${fecha.getMonth()}-${fecha.getDate()}`
        
        if (!ventasPorDia[llaveDia]) {
          ventasPorDia[llaveDia] = 0
        }
        ventasPorDia[llaveDia] += parseFloat(v.total)
      })

      // Identificamos cuánto llevamos vendido HOY
      const hoy = new Date()
      const llaveHoy = `${hoy.getFullYear()}-${hoy.getMonth()}-${hoy.getDate()}`
      const totalHoy = ventasPorDia[llaveHoy] || 0

      // Buscamos cuál era el Récord Histórico ANTES de hoy
      let recordAnterior = 0
      for (const dia in ventasPorDia) {
        if (dia !== llaveHoy) { // Excluimos hoy de la búsqueda del récord pasado
          if (ventasPorDia[dia] > recordAnterior) {
            recordAnterior = ventasPorDia[dia]
          }
        }
      }

      // Evaluamos: Si hoy superamos el récord histórico (y el récord anterior no era 0)
      if (totalHoy > recordAnterior && recordAnterior > 0) {
        setAlertaVentas({
          mensaje: `¡Récord histórico! Has vendido $${totalHoy.toLocaleString()}, superando el mejor día que estaba en $${recordAnterior.toLocaleString()}.`,
        })
      } else {
        setAlertaVentas(null)
      }

    } catch (error) {
      console.error("Error cargando notificaciones:", error)
    }
  }
  // Calculamos el número total de notificaciones que hay en la campana
  const totalNotificaciones = alertasStock.length + (alertaVentas ? 1 : 0)

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
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-2 border-b border-gray-50 flex justify-between items-center">
                <h4 className="font-bold text-gray-800">Centro de Notificaciones</h4>
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-bold">{totalNotificaciones}</span>
              </div>
              
              <div className="max-h-80 overflow-y-auto">
                {totalNotificaciones === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500 flex flex-col items-center">
                    <PackageSearch className="w-8 h-8 text-gray-300 mb-2" />
                    <span className="text-sm font-medium">Todo está al día.</span>
                  </div>
                ) : (
                  <>
                    {/* ALERTA DE VENTAS (Aparece primero si existe) */}
                    {alertaVentas && (
                      <div className="px-4 py-3 bg-green-50/50 hover:bg-green-50 border-b border-green-100 transition-colors cursor-pointer flex gap-3 items-start">
                        <div className="bg-green-100 p-2 rounded-full text-green-600 shrink-0 shadow-sm">
                          <TrendingUp className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-green-800">¡Récord de Ventas!</p>
                          <p className="text-xs text-green-700 font-medium mt-0.5 leading-relaxed">{alertaVentas.mensaje}</p>
                        </div>
                      </div>
                    )}

                    {/* ALERTAS DE STOCK */}
                    {alertasStock.map(prod => (
                      <div key={prod.id} className="px-4 py-3 hover:bg-red-50/50 border-b border-gray-50 transition-colors cursor-pointer flex gap-3 items-start">
                        <div className="bg-red-100 p-2 rounded-full text-red-600 shrink-0 shadow-sm">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-800">{prod.nombre}</p>
                          <p className="text-xs text-red-600 font-semibold mt-0.5">Quedan {prod.stock_actual_unidades} unidades (Mín: {prod.stock_minimo_alerta})</p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-gray-200 mx-1"></div>

        {/* PERFIL DE USUARIO */}
        <div className="relative" ref={perfilRef}>
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

          {/* MENÚ DESPLEGABLE DE PERFIL */}
          {menuPerfilAbierto && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-gray-50 mb-1">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Cuenta Activa</p>
              </div>
              
              {/* BOTÓN DE CONFIGURACIÓN FUNCIONAL */}
              <button 
                onClick={() => { 
                  navigate('/configuracion') // <-- Nos lleva a la nueva página
                  setMenuPerfilAbierto(false) // <-- Cierra el menú
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