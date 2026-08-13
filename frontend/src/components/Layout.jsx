import Sidebar from './Sidebar'
import Navbar from './Navbar'

// Recibe "children", que será la página (Ventas, Inventario, etc.)
export default function Layout({ children }) {
  return (
    <div className="flex h-screen bg-gray-100 font-sans overflow-hidden">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        
        {/* Aquí adentro se inyectará dinámicamente el contenido de cada página */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 flex flex-col">
          {children}
        </main>
      </div>
    </div>
  )
}