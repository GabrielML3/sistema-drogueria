import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import PuntoVenta from './pages/PuntoVenta'
import Inventario from './pages/Inventario'
import Contabilidad from './pages/Contabilidad'

export default function App() {
  return (
    <BrowserRouter>
      {/* El Layout envuelve todas las rutas */}
      <Layout>
        <Routes>
          <Route path="/" element={<PuntoVenta />} />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/contabilidad" element={<Contabilidad />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
} 