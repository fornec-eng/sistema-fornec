import ApiBase from "./ApiBase"

class ApiService {
  // Obras
  obras = {
    getAll: async (params = {}) => {
      const response = await ApiBase.get("/obras", { params })
      return response.data
    },
    getById: async (id) => {
      const response = await ApiBase.get(`/obras/${id}`)
      return response.data
    },
    create: async (data) => {
      const response = await ApiBase.post("/obras", data)
      return response.data
    },
    update: async (id, data) => {
      const response = await ApiBase.put(`/obras/${id}`, data)
      return response.data
    },
    delete: async (id) => {
      const response = await ApiBase.delete(`/obras/${id}`)
      return response.data
    },
  }

  // Materiais
  materiais = {
    getAll: async (params = {}) => {
      const response = await ApiBase.get("/materiais", { params })
      return response.data
    },
    getById: async (id) => {
      const response = await ApiBase.get(`/materiais/${id}`)
      return response.data
    },
    create: async (data) => {
      const response = await ApiBase.post("/materiais", data)
      return response.data
    },
    update: async (id, data) => {
      const response = await ApiBase.put(`/materiais/${id}`, data)
      return response.data
    },
    delete: async (id) => {
      const response = await ApiBase.delete(`/materiais/${id}`)
      return response.data
    },
  }

  // Mão de Obra
  maoObra = {
    getAll: async (params = {}) => {
      const response = await ApiBase.get("/mao-obra", { params })
      return response.data
    },
    getById: async (id) => {
      const response = await ApiBase.get(`/mao-obra/${id}`)
      return response.data
    },
    create: async (data) => {
      const response = await ApiBase.post("/mao-obra", data)
      return response.data
    },
    update: async (id, data) => {
      const response = await ApiBase.put(`/mao-obra/${id}`, data)
      return response.data
    },
    delete: async (id) => {
      const response = await ApiBase.delete(`/mao-obra/${id}`)
      return response.data
    },
  }

  // Equipamentos
  equipamentos = {
    getAll: async (params = {}) => {
      const response = await ApiBase.get("/equipamentos", { params })
      return response.data
    },
    getById: async (id) => {
      const response = await ApiBase.get(`/equipamentos/${id}`)
      return response.data
    },
    create: async (data) => {
      const response = await ApiBase.post("/equipamentos", data)
      return response.data
    },
    update: async (id, data) => {
      const response = await ApiBase.put(`/equipamentos/${id}`, data)
      return response.data
    },
    delete: async (id) => {
      const response = await ApiBase.delete(`/equipamentos/${id}`)
      return response.data
    },
  }

  // Contratos
  contratos = {
    getAll: async (params = {}) => {
      const response = await ApiBase.get("/contratos", { params })
      return response.data
    },
    getById: async (id) => {
      const response = await ApiBase.get(`/contratos/${id}`)
      return response.data
    },
    create: async (data) => {
      const response = await ApiBase.post("/contratos", data)
      return response.data
    },
    update: async (id, data) => {
      const response = await ApiBase.put(`/contratos/${id}`, data)
      return response.data
    },
    delete: async (id) => {
      const response = await ApiBase.delete(`/contratos/${id}`)
      return response.data
    },
  }

  // Outros Gastos
  outrosGastos = {
    getAll: async (params = {}) => {
      const response = await ApiBase.get("/outros-gastos", { params })
      return response.data
    },
    getById: async (id) => {
      const response = await ApiBase.get(`/outros-gastos/${id}`)
      return response.data
    },
    create: async (data) => {
      const response = await ApiBase.post("/outros-gastos", data)
      return response.data
    },
    update: async (id, data) => {
      const response = await ApiBase.put(`/outros-gastos/${id}`, data)
      return response.data
    },
    delete: async (id) => {
      const response = await ApiBase.delete(`/outros-gastos/${id}`)
      return response.data
    },
  }
}

export default new ApiService()
