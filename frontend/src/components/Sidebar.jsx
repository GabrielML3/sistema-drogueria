import { Link, useLocation } from 'react-router-dom'
import { Pill, ShoppingCart, Package, BarChart3 } from 'lucide-react'

export default function Sidebar() {
  const location = useLocation();

  const getButtonClass = (path) => {
    const baseClass = "w-full flex items-center p-3 rounded-lg transition-colors ";
    return location.pathname === path
      ? baseClass + "bg-blue-600 text-white font-semibold shadow"
      : baseClass + "hover:bg-slate-700 text-slate-300";
  };

  return (
    <div className="w-64 bg-slate-800 text-white flex flex-col h-screen shrink-0">
      <div className="p-6 text-2xl font-bold border-b border-slate-700 flex items-center">
        <Pill className="w-8 h-8 mr-3 text-blue-400" />
        DON SIXTO GABRIEL
      </div>
      <nav className="flex-1 p-4 space-y-2">
        <Link to="/" className={getButtonClass("/")}>
          <ShoppingCart className="w-5 h-5 mr-3" />
          Punto de Venta
        </Link>
        <Link to="/inventario" className={getButtonClass("/inventario")}>
          <Package className="w-5 h-5 mr-3" />
          Inventario
        </Link>
        <Link to="/contabilidad" className={getButtonClass("/contabilidad")}>
          <BarChart3 className="w-5 h-5 mr-3" />
          Contabilidad
        </Link>
      </nav>
      <div className="p-4 text-sm text-slate-400 border-t border-slate-700 text-center">
        v1.0.0
      </div>
    </div>
  )
}