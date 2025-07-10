import axios from "axios"

const ApiBase = axios.create({
  baseURL: "http://localhost:4000",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
})

// Interceptor para adicionar token de autenticação
ApiBase.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Interceptor para tratar respostas e erros
ApiBase.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem("token")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  },
)

export default ApiBase
