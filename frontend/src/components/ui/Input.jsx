export default function Input({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  icon: Icon,
  required = false,
  className = "",
  min,
  step
}) {
  return (
    <div className={className}>
      {/* Si le pasamos un label, lo dibuja automáticamente con el asterisco rojo si es requerido */}
      {label && (
        <label className="block text-sm font-semibold text-gray-600 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="relative">
        {/* Si le pasamos un ícono de Lucide, lo pone a la izquierda */}
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Icon className="h-5 w-5 text-gray-400" />
          </div>
        )}
        
        <input
          type={type}
          name={name}
          required={required}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          min={min}
          step={step}
          // El padding izquierdo (pl) cambia automáticamente si hay un ícono o no
          className={`w-full p-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-[#2C46AF] focus:ring-1 focus:ring-[#2C46AF] transition-colors bg-white ${Icon ? 'pl-10' : 'pl-3'}`}
        />
      </div>
    </div>
  );
}