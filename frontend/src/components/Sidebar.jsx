import { Link, useLocation } from 'react-router-dom'
import { ShoppingCart, Package, BarChart3 } from 'lucide-react'

export default function Sidebar() {
  const location = useLocation();
  const colorBotonActivo = "bg-[#2C46AF] text-white shadow-md";
  const colorBotonInactivo = "hover:bg-slate-700 text-slate-300";

  const getButtonClass = (path) => {
    const baseClass = "w-full flex items-center p-3.5 rounded-xl transition-all duration-200 font-semibold text-sm ";
    return location.pathname === path
      ? baseClass + colorBotonActivo
      : baseClass + colorBotonInactivo;
  };

  return (
    <div className="w-64 bg-slate-800 text-white flex flex-col h-screen shrink-0 font-sans border-r border-slate-700">
      
      {/* ENCABEZADO ALINEADO Y CLICABLE */}
      <Link 
        to="/" 
        className="h-16 px-5 border-b border-slate-700 flex items-center hover:bg-slate-700 transition-colors cursor-pointer"
        title="Ir al Punto de Venta"
      >
        {/* LOGO MÁS GRANDE (w-12 h-12) */}
        <img 
          src="/logo (1).png" 
          alt="Logo Don Sixto" 
          className="w-12 h-12 mr-3 object-contain" // Aumentado considerablemente
        />
        
        {/* TEXTO ACOMODADO (Ligeramente más pequeño para el logo grande) */}
        <div className="flex flex-col justify-center leading-tight">
          <span className="text-sm font-extrabold tracking-tight">DON SIXTO</span>
          <span className="text-sm font-extrabold tracking-tight mt-0.5">GABRIEL</span>
        </div>
      </Link>
      
      {/* MENÚ DE NAVEGACIÓN (Diseño más 'Senior' con padding extra) */}
      <nav className="flex-1 p-4 space-y-2.5">
        <Link to="/" className={getButtonClass("/")}>
          <ShoppingCart className="w-5 h-5 mr-3.5" />
          Punto de Venta
        </Link>
        <Link to="/inventario" className={getButtonClass("/inventario")}>
          <Package className="w-5 h-5 mr-3.5" />
          Inventario
        </Link>
        <Link to="/contabilidad" className={getButtonClass("/contabilidad")}>
          <BarChart3 className="w-5 h-5 mr-3.5" />
          Contabilidad
        </Link>
      </nav>
      
      {/* VERSIÓN DEL SISTEMA */}
      <div className="p-4 text-xs text-slate-500 border-t border-slate-700 text-center font-mono">
        v1.0.0
      </div>
    </div>
  )
}