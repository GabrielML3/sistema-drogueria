import { useState, useEffect, useRef } from 'react'
import { User, Bell, LogOut, Settings, AlertTriangle, PackageSearch } from 'lucide-react'

export default function Navbar() {
  const [alertasStock, setAlertasStock] = useState([])
  const [menuPerfilAbierto, setMenuPerfilAbierto] = useState(false)
  const [menuAlertasAbierto, setMenuAlertasAbierto] = useState(false)
  
  // Referencias para cerrar los menús al hacer clic afuera
  const perfilRef = useRef(null)
  const alertasRef = useRef(null)

  useEffect(() => {
    cargarAlertas()
    
    // Cierra los menús si se hace clic fuera de ellos
    const handleClickFuera = (event) => {
      if (perfilRef.current && !perfilRef.current.contains(event.target)) setMenuPerfilAbierto(false)
      if (alertasRef.current && !alertasRef.current.contains(event.target)) setMenuAlertasAbierto(false)
    }
    document.addEventListener("mousedown", handleClickFuera)
    return () => document.removeEventListener("mousedown", handleClickFuera)
  }, [])

  const cargarAlertas = async () => {
    try {
      const res = await fetch('http://127.0.0.1:8000/api/productos/')
      const data = await res.json()
      // Filtramos solo los que necesitan recompra
      const bajoStock = data.filter(p => p.stock_actual_unidades <= p.stock_minimo_alerta)
      setAlertasStock(bajoStock)
    } catch (error) {
      console.error("Error cargando alertas:", error)
    }
  }

  return (
    <header className="bg-white h-16 shadow-sm z-20 flex justify-between items-center px-6 shrink-0 border-b relative">
      
      {/* SECCIÓN IZQUIERDA: Info de la Caja */}
      <div className="flex items-center gap-3">
        <div className="bg-green-100 border border-green-200 text-green-700 px-3 py-1 rounded-md text-sm font-bold flex items-center">
          <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
          Caja #1 Operativa
        </div>
      </div>

      {/* SECCIÓN DERECHA: Interacciones */}
      <div className="flex items-center gap-4">
        
        {/* CAMPANA DE NOTIFICACIONES */}
        <div className="relative" ref={alertasRef}>
          <button 
            onClick={() => { setMenuAlertasAbierto(!menuAlertasAbierto); setMenuPerfilAbierto(false); }}
            className={`p-2 rounded-lg transition-colors relative ${menuAlertasAbierto ? 'bg-blue-50 text-blue-600' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <Bell className="w-5 h-5" />
            {alertasStock.length > 0 && (
              <span className="absolute top-1 right-1.5 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span>
            )}
          </button>

          {/* DESPLEGABLE DE ALERTAS */}
          {menuAlertasAbierto && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-2 border-b border-gray-50">
                <h4 className="font-bold text-gray-800">Centro de Notificaciones</h4>
              </div>
              
              <div className="max-h-64 overflow-y-auto">
                {alertasStock.length === 0 ? (
                  <div className="px-4 py-6 text-center text-gray-500 flex flex-col items-center">
                    <PackageSearch className="w-8 h-8 text-gray-300 mb-2" />
                    <span className="text-sm">Todo el inventario está en orden.</span>
                  </div>
                ) : (
                  alertasStock.map(prod => (
                    <div key={prod.id} className="px-4 py-3 hover:bg-red-50 border-b border-gray-50 transition-colors cursor-pointer flex gap-3 items-start">
                      <div className="bg-red-100 p-2 rounded-full text-red-600 shrink-0">
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-800">{prod.nombre}</p>
                        <p className="text-xs text-red-600 font-semibold mt-0.5">Quedan {prod.stock_actual_unidades} unidades (Mín: {prod.stock_minimo_alerta})</p>
                      </div>
                    </div>
                  ))
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
              <p className="text-xs text-blue-600 font-semibold">Gerencia</p>
            </div>
            <div className="w-9 h-9 bg-slate-800 text-white rounded-lg flex items-center justify-center font-bold shadow-sm">
              <User className="w-5 h-5" />
            </div>
          </button>

          {/* DESPLEGABLE DE PERFIL */}
          {menuPerfilAbierto && (
            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="px-4 py-3 border-b border-gray-50 mb-1">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider">Cuenta Activa</p>
              </div>
              
              <button className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 flex items-center transition-colors">
                <Settings className="w-4 h-4 mr-3" /> Configuración
              </button>
              
              <button className="w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center transition-colors mt-1 border-t border-gray-50 pt-3">
                <LogOut className="w-4 h-4 mr-3" /> Cerrar Sesión
              </button>
            </div>
          )}
        </div>

      </div>
    </header>
  )
}