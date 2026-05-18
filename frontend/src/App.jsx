import { useState, useEffect } from 'react'
import axios from 'axios'

function App() {
  // Aquí guardaremos las categorías que lleguen de Django
  const [categorias, setCategorias] = useState([])

  // useEffect hace que esta petición se ejecute apenas cargue la página
  useEffect(() => {
    // Apuntamos a la URL de tu API local
    axios.get('http://127.0.0.1:8000/api/categorias/')
      .then(respuesta => {
        // Si sale bien, guardamos los datos en el estado
        setCategorias(respuesta.data)
      })
      .catch(error => {
        console.error("Error conectando con Django:", error)
      })
  }, [])

  return (
    <div style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Panel de Control - Droguería</h1>
      <p>Verificando conexión con el Backend...</p>
      
      <div style={{ marginTop: '20px', padding: '15px', border: '1px solid #ccc', borderRadius: '8px' }}>
        <h3>Categorías en la Base de Datos:</h3>
        {categorias.length === 0 ? (
          <p>No hay categorías o el servidor de Django está apagado.</p>
        ) : (
          <ul>
            {categorias.map(categoria => (
              <li key={categoria.id}>{categoria.nombre}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default App