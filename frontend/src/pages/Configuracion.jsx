import { User, Lock, Store } from 'lucide-react'
import Button from '../components/ui/Button'
import Input from '../components/ui/Input'
import Swal from 'sweetalert2'

export default function Configuracion() {
  const guardarCambios = (e) => {
    e.preventDefault()
    // Como es una versión de prueba, solo mostraremos la alerta de éxito
    Swal.fire('Actualizado', 'Las configuraciones se han guardado correctamente.', 'success')
  }

  return (
    <div className="flex flex-col h-full bg-gray-100 p-6 overflow-hidden">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Configuración del Sistema</h1>
        <p className="text-gray-500">Administra los datos de la farmacia y tu cuenta</p>
      </div>

      <div className="bg-white rounded-xl shadow-md p-8 max-w-3xl flex-1 overflow-auto">
        <form onSubmit={guardarCambios} className="space-y-8">
          
          {/* SECCIÓN 1: Datos del Negocio */}
          <section>
            <h3 className="text-lg font-bold text-[#2C46AF] border-b pb-2 mb-4 flex items-center">
              <Store className="w-5 h-5 mr-2" /> Información de la Droguería
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Nombre Comercial" defaultValue="Droguería Don Sixto Gabriel" />
              <Input label="NIT / RUT" defaultValue="900.123.456-7" />
              <Input label="Dirección" defaultValue="Villavicencio, Meta" />
              <Input label="Teléfono de Contacto" defaultValue="320 123 4567" />
            </div>
          </section>

          {/* SECCIÓN 2: Perfil de Usuario */}
          <section>
            <h3 className="text-lg font-bold text-[#2C46AF] border-b pb-2 mb-4 flex items-center mt-8">
              <User className="w-5 h-5 mr-2" /> Mi Perfil (Administrador)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Nombre Completo" defaultValue="Admin" />
              <Input label="Correo Electrónico" defaultValue="gerencia@donsixto.com" type="email" />
            </div>
          </section>

          {/* SECCIÓN 3: Seguridad */}
          <section>
            <h3 className="text-lg font-bold text-gray-700 border-b pb-2 mb-4 flex items-center mt-8">
              <Lock className="w-5 h-5 mr-2" /> Cambiar Contraseña
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input label="Nueva Contraseña" type="password" placeholder="••••••••" />
              <Input label="Confirmar Contraseña" type="password" placeholder="••••••••" />
            </div>
          </section>

          <div className="pt-4 flex justify-end">
            <Button type="submit" variant="primary">
              Guardar Cambios
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}