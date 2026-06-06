import axios from 'axios'

// 1. Creamos una instancia base. 
// A futuro, esta URL vendrá de una variable de entorno (.env)
const clienteAxios = axios.create({
    baseURL: 'http://127.0.0.1:8000/api/'
})

// 2. EL INTERCEPTOR: Este código se ejecuta AUTOMÁTICAMENTE antes de cada petición
clienteAxios.interceptors.request.use(
    (config) => {
        // Buscamos si el usuario tiene su llave VIP guardada
        const token = localStorage.getItem('access_token')
        
        // Si la tiene, se la inyectamos silenciosamente a la petición
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

export default clienteAxios