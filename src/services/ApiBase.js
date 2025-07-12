import axios from "axios"

const ApiBase = axios.create({
  baseURL: "https://api-fornec.vercel.app",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
})

// Função para buscar token nos dois storages
function getToken() {
  let token = localStorage.getItem('token');
  if (!token) {
    token = sessionStorage.getItem('token');
  }
  return token;
}

// Interceptor para adicionar token de autenticação
ApiBase.interceptors.request.use(
  (config) => {
    const token = getToken(); // ✅ Agora busca nos dois storages
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
      // Token expirado ou inválido - limpar ambos os storages
      localStorage.removeItem("token")
      localStorage.removeItem("_id")
      localStorage.removeItem("_role")
      localStorage.removeItem("email")
      sessionStorage.removeItem("token")
      sessionStorage.removeItem("_id")
      sessionStorage.removeItem("_role")
      sessionStorage.removeItem("email")
      
      window.location.href = "/login"
    }
    return Promise.reject(error)
  },
)

export default ApiBase