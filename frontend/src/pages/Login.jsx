import { useState } from 'react'
import { Lock, User, AlertCircle } from 'lucide-react'
import clienteAxios from '../api/axios'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'

export default function Login({ setEstaAutenticado }) {
  const [credenciales, setCredenciales] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  const handleChange = (e) => {
    setCredenciales({ ...credenciales, [e.target.name]: e.target.value })
  }

  const iniciarSesion = async (e) => {
    e.preventDefault()
    setError('')
    setCargando(true)

    try {
      const res = await clienteAxios.post('token/', credenciales)
      localStorage.setItem('access_token', res.data.access)
      localStorage.setItem('refresh_token', res.data.refresh)
      setEstaAutenticado(true)
    } catch (err) {
      setError('Credenciales incorrectas. Verifica que el servidor de Django esté encendido.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 font-sans">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
        
        {/* ENCABEZADO CORPORATIVO CON EL COLOR Y LOGO REALES */}
        <div className="bg-[#2C46AF] p-10 text-center flex flex-col items-center border-b border-[#1E3185] shadow-inner">
          {/* Tu logo.png grande y prominente */}
          <img 
            src="/logo (1).png" 
            alt="Logo Don Sixto" 
            className="w-20 h-20 object-contain mb-5"
          />
          {/* El nombre de la droguería con el estilo de la marca */}
          <div className="text-white leading-none">
            <h1 className="text-2xl font-extrabold tracking-tight">DON SIXTO</h1>
            <h1 className="text-2xl font-extrabold tracking-tight mt-1">GABRIEL</h1>
          </div>
          <p className="text-blue-100 text-sm mt-3.5 font-medium">Sistema Integral de Gestión de Droguerías</p>
        </div>

        <div className="p-10 bg-white">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-8 rounded-r flex items-center text-sm text-red-700 shadow-sm">
              <AlertCircle className="w-5 h-5 mr-2 shrink-0 text-red-600" />
              {error}
            </div>
          )}

          <form onSubmit={iniciarSesion} className="space-y-6">
            {/* Los inputs ya usan automáticamente el Azul Logo [#2C46AF] gracias al paso anterior */}
            <Input 
              label="Nombre de Usuario"
              name="username"
              icon={User}
              required
              value={credenciales.username}
              onChange={handleChange}
              placeholder="admin"
              className="text-sm"
            />

            <Input 
              label="Contraseña"
              name="password"
              type="password"
              icon={Lock}
              required
              value={credenciales.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="text-sm"
            />

            {/* El botón ya usa automáticamente el color primary [#2C46AF] */}
            <Button 
              type="submit" 
              className="w-full mt-6 py-3 text-base shadow-md" 
              cargando={cargando}
            >
              Entrar al Sistema
            </Button>
            
          </form>
        </div>
      </div>
      
      <p className="text-gray-400 text-xs mt-10 font-mono tracking-wider">© 2026 DON SIXTO GABRIEL. VILLAVICENCIO, COLOMBIA.</p>
    </div>
  )
} 