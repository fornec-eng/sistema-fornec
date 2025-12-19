import ApiBase from "./ApiBase"

class UserService {
  /**
   * Listar todas as obras ativas (para seleção do admin)
   */
  async listarObrasAtivas() {
    try {
      const response = await ApiBase.get("/obras-ativas")
      return response.data
    } catch (error) {
      console.error("Erro ao listar obras ativas:", error)
      throw error
    }
  }

  /**
   * Listar obras permitidas para um usuário específico
   */
  async listarObrasUsuario(userId) {
    try {
      // Usar o endpoint correto baseado nas suas rotas
      const response = await ApiBase.get(`/user/${userId}/obras-permitidas`)
      return response.data
    } catch (error) {
      console.error("Erro ao listar obras do usuário:", error)
      throw error
    }
  }

  /**
   * Gerenciar obras permitidas para um usuário (Admin only)
   */
  async gerenciarObrasPermitidas(userId, obrasPermitidas) {
    try {
      // Corrigir a rota: usar /user/ (singular) e o campo correto obrasIds
      const response = await ApiBase.put(`/user/${userId}/obras-permitidas`, {
        obrasIds: obrasPermitidas // Campo correto baseado no controller
      })
      return response.data
    } catch (error) {
      console.error("Erro ao gerenciar obras permitidas:", error)
      throw error
    }
  }

  /**
   * Buscar obras permitidas de um usuário
   */
  async buscarObrasPermitidas(userId) {
    try {
      // Usar a rota correta
      const response = await ApiBase.get(`/user/${userId}/obras-permitidas`)
      return response.data
    } catch (error) {
      console.error("Erro ao buscar obras permitidas:", error)
      throw error
    }
  }

  /**
   * Associar uma nova obra ao usuário (adiciona à lista existente)
   */
  async associarObra(userId, obraId) {
    try {
      // Primeiro, buscar as obras já permitidas
      const obrasAtuais = await this.buscarObrasPermitidas(userId)
      const obrasIds = obrasAtuais.obrasPermitidas || []

      // Adicionar a nova obra se ainda não estiver na lista
      if (!obrasIds.includes(obraId)) {
        obrasIds.push(obraId)

        // Atualizar a lista de obras permitidas
        const response = await ApiBase.put(`/user/${userId}/obras-permitidas`, {
          obrasIds: obrasIds
        })
        return response.data
      }

      // Se já estiver na lista, retornar sucesso sem fazer nada
      return { success: true, message: "Obra já associada ao usuário" }
    } catch (error) {
      console.error("Erro ao associar obra ao usuário:", error)
      throw error
    }
  }

  /**
   * Listar todos os usuários
   */
  async listarUsuarios(limit = 100) {
    try {
      const response = await ApiBase.get('/list', { params: { limit } })
      return response.data
    } catch (error) {
      console.error("Erro ao listar usuários:", error)
      throw error
    }
  }

  /**
   * Atualizar usuário
   */
  async atualizarUsuario(userId, dadosUsuario) {
    try {
      const token = this.getToken()
      const response = await ApiBase.put(`/user/${userId}`, dadosUsuario, {
        headers: { Authorization: `Bearer ${token}` }
      })
      return response.data
    } catch (error) {
      console.error("Erro ao atualizar usuário:", error)
      throw error
    }
  }

  /**
   * Excluir usuário
   */
  async excluirUsuario(userId) {
    try {
      const response = await ApiBase.delete(`/user/${userId}`)
      return response.data
    } catch (error) {
      console.error("Erro ao excluir usuário:", error)
      throw error
    }
  }

  /**
   * Obter token de autorização
   */
  getToken() {
    let token = localStorage.getItem('token')
    if (!token) {
      token = sessionStorage.getItem('token')
    }
    return token
  }

  /**
   * Verificar se o usuário atual é admin
   */
  isAdmin() {
    const role = localStorage.getItem('_role') || sessionStorage.getItem('_role')
    return role === 'Admin'
  }

  /**
   * Obter ID do usuário atual
   */
  getCurrentUserId() {
    return localStorage.getItem('_id') || sessionStorage.getItem('_id')
  }

  /**
   * Obter role do usuário atual
   */
  getCurrentUserRole() {
    return localStorage.getItem('_role') || sessionStorage.getItem('_role')
  }
}

export default new UserService()