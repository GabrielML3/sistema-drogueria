import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import PuntoVenta from './pages/PuntoVenta'
import Inventario from './pages/Inventario'
import Contabilidad from './pages/Contabilidad'
import Login from './pages/Login' // 
import Configuracion from './pages/Configuracion'

export default function App() {
  // Comprobamos si ya hay un token guardado en el navegador al abrir la página
  const [estaAutenticado, setEstaAutenticado] = useState(
    !!localStorage.getItem('access_token')
  )

  // Si NO está autenticado, solo le mostramos la pantalla de Login
  if (!estaAutenticado) {
    return <Login setEstaAutenticado={setEstaAutenticado} />
  }

  // Si SÍ está autenticado, le mostramos el sistema completo
  return (
    <BrowserRouter>
      <Layout setEstaAutenticado={setEstaAutenticado}>
        <Routes>
          <Route path="/" element={<PuntoVenta />} />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/contabilidad" element={<Contabilidad />} />
          <Route path="/configuracion" element={<Configuracion />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  )
}

