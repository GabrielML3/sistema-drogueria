import { Loader2 } from "lucide-react";

export default function Button({ 
  children, 
  onClick, 
  type = "button", 
  variant = "primary", 
  className = "", 
  disabled = false,
  cargando = false,
  icon: Icon,
  ...props // <-- 1. CAPTURAMOS CUALQUIER OTRA PROPIEDAD EXTRA (COMO EL FORM)
}) {
  
  const baseStyles = "flex items-center justify-center px-6 py-2.5 rounded-lg font-bold shadow-md transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none";
  
  const variants = {
    primary: "bg-[#2C46AF] hover:bg-[#1E3185] text-white border border-transparent shadow-md",
    secondary: "bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 shadow-sm",
    danger: "bg-red-500 hover:bg-red-600 text-white border border-transparent",
    success: "bg-green-600 hover:bg-green-700 text-white border border-transparent"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || cargando}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props} // <-- 2. INYECTAMOS LAS PROPIEDADES AL BOTÓN REAL DE HTML5
    >
      {cargando ? (
        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
      ) : Icon ? (
        <Icon className="w-5 h-5 mr-2" />
      ) : null}
      
      {children}
    </button>
  );
}