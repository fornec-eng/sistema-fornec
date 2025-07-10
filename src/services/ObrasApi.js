import ApiBase from "./ApiBase"

class ObrasApi {
  // ==================== OPERAÇÕES GERAIS ====================

  /**
   * Listar todas as obras com paginação
   */
  async listarObras(page = 1, limit = 10) {
    try {
      const response = await ApiBase.get(`/pagamentos?page=${page}&limit=${limit}`)
      return response.data
    } catch (error) {
      console.error("Erro ao listar obras:", error)
      throw error
    }
  }

  /**
   * Buscar uma obra específica pelo ID
   */
  async buscarObra(id) {
    try {
      const response = await ApiBase.get(`/obras/${id}`)
      return response.data
    } catch (error) {
      console.error("Erro ao buscar obra:", error)
      throw error
    }
  }

  /**
   * Criar uma nova obra
   */
  async criarObra(dadosObra) {
    try {
      const response = await ApiBase.post("/pagamentos", dadosObra)
      return response.data
    } catch (error) {
      console.error("Erro ao criar obra:", error)
      throw error
    }
  }

  /**
   * Atualizar informações da obra
   */
  async atualizarObra(id, dadosObra) {
    try {
      const response = await ApiBase.put(`/obras/${id}`, dadosObra)
      return response.data
    } catch (error) {
      console.error("Erro ao atualizar obra:", error)
      throw error
    }
  }

  /**
   * Deletar uma obra
   */
  async deletarObra(id) {
    try {
      const response = await ApiBase.delete(`/pagamentos/${id}`)
      return response.data
    } catch (error) {
      console.error("Erro ao deletar obra:", error)
      throw error
    }
  }

  // ==================== GASTOS ====================

  /**
   * Buscar gastos por tipo
   */
  async buscarGastosPorTipo(obraId, tipo) {
    try {
      const response = await ApiBase.get(`/pagamentos/${obraId}/gastos?tipo=${tipo}`)
      return response.data
    } catch (error) {
      console.error(`Erro ao buscar gastos do tipo ${tipo}:`, error)
      throw error
    }
  }

  /**
   * Buscar todos os gastos de uma obra
   */
  async buscarGastos(obraId) {
    try {
      const response = await ApiBase.get(`/pagamentos/${obraId}/gastos`)
      return response.data
    } catch (error) {
      console.error("Erro ao buscar gastos:", error)
      throw error
    }
  }

  /**
   * Adicionar gasto a uma obra
   */
  async adicionarGasto(obraId, dadosGasto) {
    try {
      const response = await ApiBase.post(`/pagamentos/${obraId}/gastos`, dadosGasto)
      return response.data
    } catch (error) {
      console.error("Erro ao adicionar gasto:", error)
      throw error
    }
  }

  /**
   * Atualizar um gasto específico
   */
  async atualizarGasto(obraId, gastoId, dadosGasto) {
    try {
      const response = await ApiBase.put(`/pagamentos/${obraId}/gastos/${gastoId}`, dadosGasto)
      return response.data
    } catch (error) {
      console.error("Erro ao atualizar gasto:", error)
      throw error
    }
  }

  /**
   * Remover um gasto
   */
  async removerGasto(obraId, gastoId) {
    try {
      const response = await ApiBase.delete(`/pagamentos/${obraId}/gastos/${gastoId}`)
      return response.data
    } catch (error) {
      console.error("Erro ao remover gasto:", error)
      throw error
    }
  }

  // ==================== CONTRATOS ====================

  /**
   * Buscar contratos de uma obra
   */
  async buscarContratos(obraId) {
    try {
      const response = await ApiBase.get(`/pagamentos/${obraId}/contratos`)
      return response.data
    } catch (error) {
      console.error("Erro ao buscar contratos:", error)
      throw error
    }
  }

  /**
   * Adicionar contrato a uma obra
   */
  async adicionarContrato(obraId, dadosContrato) {
    try {
      const response = await ApiBase.post(`/pagamentos/${obraId}/contratos`, dadosContrato)
      return response.data
    } catch (error) {
      console.error("Erro ao adicionar contrato:", error)
      throw error
    }
  }

  /**
   * Atualizar um contrato específico
   */
  async atualizarContrato(obraId, contratoId, dadosContrato) {
    try {
      const response = await ApiBase.put(`/pagamentos/${obraId}/contratos/${contratoId}`, dadosContrato)
      return response.data
    } catch (error) {
      console.error("Erro ao atualizar contrato:", error)
      throw error
    }
  }

  /**
   * Remover um contrato
   */
  async removerContrato(obraId, contratoId) {
    try {
      const response = await ApiBase.delete(`/pagamentos/${obraId}/contratos/${contratoId}`)
      return response.data
    } catch (error) {
      console.error("Erro ao remover contrato:", error)
      throw error
    }
  }

  // ==================== CRONOGRAMA ====================

  /**
   * Adicionar etapa ao cronograma
   */
  async adicionarEtapaCronograma(obraId, dadosEtapa) {
    try {
      const response = await ApiBase.post(`/pagamentos/${obraId}/cronograma`, dadosEtapa)
      return response.data
    } catch (error) {
      console.error("Erro ao adicionar etapa ao cronograma:", error)
      throw error
    }
  }

  /**
   * Atualizar uma etapa do cronograma
   */
  async atualizarEtapaCronograma(obraId, etapaId, dadosEtapa) {
    try {
      const response = await ApiBase.put(`/pagamentos/${obraId}/cronograma/${etapaId}`, dadosEtapa)
      return response.data
    } catch (error) {
      console.error("Erro ao atualizar etapa do cronograma:", error)
      throw error
    }
  }

  /**
   * Remover uma etapa do cronograma
   */
  async removerEtapaCronograma(obraId, etapaId) {
    try {
      const response = await ApiBase.delete(`/pagamentos/${obraId}/cronograma/${etapaId}`)
      return response.data
    } catch (error) {
      console.error("Erro ao remover etapa do cronograma:", error)
      throw error
    }
  }

  // ==================== PAGAMENTOS SEMANAIS ====================

  /**
   * Adicionar pagamento semanal
   */
  async adicionarPagamentoSemanal(obraId, dadosPagamento) {
    try {
      const response = await ApiBase.post(`/pagamentos/${obraId}/pagamentos-semanais`, dadosPagamento)
      return response.data
    } catch (error) {
      console.error("Erro ao adicionar pagamento semanal:", error)
      throw error
    }
  }

  /**
   * Atualizar um pagamento semanal específico
   */
  async atualizarPagamentoSemanal(obraId, pagamentoId, dadosPagamento) {
    try {
      const response = await ApiBase.put(`/pagamentos/${obraId}/pagamentos-semanais/${pagamentoId}`, dadosPagamento)
      return response.data
    } catch (error) {
      console.error("Erro ao atualizar pagamento semanal:", error)
      throw error
    }
  }

  /**
   * Remover um pagamento semanal
   */
  async removerPagamentoSemanal(obraId, pagamentoId) {
    try {
      const response = await ApiBase.delete(`/pagamentos/${obraId}/pagamentos-semanais/${pagamentoId}`)
      return response.data
    } catch (error) {
      console.error("Erro ao remover pagamento semanal:", error)
      throw error
    }
  }

  /**
   * Marcar pagamento semanal como efetuado
   */
  async marcarPagamentoEfetuado(obraId, pagamentoId) {
    try {
      const response = await ApiBase.patch(`/pagamentos/${obraId}/pagamentos-semanais/${pagamentoId}/efetuado`)
      return response.data
    } catch (error) {
      console.error("Erro ao marcar pagamento como efetuado:", error)
      throw error
    }
  }

  /**
   * Listar pagamentos semanais pendentes
   */
  async listarPagamentosPendentes() {
    try {
      const response = await ApiBase.get("/pagamentos/semanais/pendentes")
      return response.data
    } catch (error) {
      console.error("Erro ao listar pagamentos pendentes:", error)
      throw error
    }
  }

  // ==================== RELATÓRIOS ====================

  /**
   * Gerar relatório financeiro de uma obra
   */
  async relatorioFinanceiro(obraId) {
    try {
      const response = await ApiBase.get(`/obras/${obraId}/relatorio-gastos`)
      return response.data
    } catch (error) {
      console.error("Erro ao gerar relatório financeiro:", error)
      throw error
    }
  }

  /**
   * Relatório de pagamentos semanais por período
   */
  async relatorioPagamentosSemanais(filtros = {}) {
    try {
      const params = new URLSearchParams(filtros).toString()
      const response = await ApiBase.get(`/pagamentos/relatorio-semanais?${params}`)
      return response.data
    } catch (error) {
      console.error("Erro ao gerar relatório de pagamentos semanais:", error)
      throw error
    }
  }
}

export default new ObrasApi()
