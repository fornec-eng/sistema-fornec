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

  // ==================== MÉTODOS ESPECIAIS ====================

  /**
   * Buscar todos os gastos futuros (com datas de vencimento/pagamento futuras)
   */
  buscarGastosFuturos = async () => {
    try {
      // Buscar todos os tipos de gastos
      const [materiaisRes, maoObraRes, equipamentosRes, contratosRes, outrosGastosRes] = await Promise.all([
        this.materiais.getAll(),
        this.maoObra.getAll(),
        this.equipamentos.getAll(),
        this.contratos.getAll(),
        this.outrosGastos.getAll(),
      ])

      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)

      const gastosFuturos = []

      // Processar materiais
      if (materiaisRes.materiais) {
        materiaisRes.materiais.forEach(material => {
          const dataVencimento = this.extrairDataVencimento(material)
          if (dataVencimento && dataVencimento >= hoje) {
            gastosFuturos.push({
              ...material,
              tipo: 'Material',
              dataVencimento: dataVencimento.toISOString(),
              dataPagamento: material.data,
            })
          }
        })
      }

      // Processar mão de obra
      if (maoObraRes.maoObras) {
        maoObraRes.maoObras.forEach(maoObra => {
          const dataVencimento = this.extrairDataVencimento(maoObra)
          if (dataVencimento && dataVencimento >= hoje) {
            gastosFuturos.push({
              ...maoObra,
              tipo: 'Mão de Obra',
              dataVencimento: dataVencimento.toISOString(),
              dataPagamento: maoObra.fimContrato || maoObra.inicioContrato,
            })
          }
        })
      }

      // Processar equipamentos
      if (equipamentosRes.equipamentos) {
        equipamentosRes.equipamentos.forEach(equipamento => {
          const dataVencimento = this.extrairDataVencimento(equipamento)
          if (dataVencimento && dataVencimento >= hoje) {
            gastosFuturos.push({
              ...equipamento,
              tipo: 'Equipamento',
              dataVencimento: dataVencimento.toISOString(),
              dataPagamento: equipamento.data,
            })
          }
        })
      }

      // Processar contratos
      if (contratosRes.contratos) {
        contratosRes.contratos.forEach(contrato => {
          const dataVencimento = this.extrairDataVencimento(contrato)
          if (dataVencimento && dataVencimento >= hoje) {
            gastosFuturos.push({
              ...contrato,
              tipo: 'Contrato',
              dataVencimento: dataVencimento.toISOString(),
              dataPagamento: contrato.inicioContrato,
            })
          }
        })
      }

      // Processar outros gastos
      if (outrosGastosRes.gastos) {
        outrosGastosRes.gastos.forEach(gasto => {
          const dataVencimento = this.extrairDataVencimento(gasto)
          if (dataVencimento && dataVencimento >= hoje) {
            gastosFuturos.push({
              ...gasto,
              tipo: 'Outros',
              dataVencimento: dataVencimento.toISOString(),
              dataPagamento: gasto.data,
            })
          }
        })
      }

      // Ordenar por data de vencimento
      gastosFuturos.sort((a, b) => new Date(a.dataVencimento) - new Date(b.dataVencimento))

      return {
        error: false,
        gastos: gastosFuturos,
        total: gastosFuturos.length
      }

    } catch (error) {
      console.error('Erro ao buscar gastos futuros:', error)
      return {
        error: true,
        message: error.message,
        gastos: []
      }
    }
  }

  /**
   * Extrair data de vencimento de um gasto
   */
  extrairDataVencimento = (gasto) => {
    // Lista de possíveis campos de data (em ordem de prioridade)
    const camposData = [
      'dataVencimento',
      'dataPagamento', 
      'fimContrato',
      'dataTermino',
      'data',
      'inicioContrato',
      'dataInicio'
    ]

    for (const campo of camposData) {
      if (gasto[campo]) {
        const data = new Date(gasto[campo])
        if (!isNaN(data.getTime())) {
          return data
        }
      }
    }

    return null
  }

  /**
   * Buscar todos os pagamentos semanais de todas as obras
   */
  buscarTodosPagamentosSemanais = async () => {
    try {
      // Este método deveria buscar pagamentos semanais
      // Como não vejo um endpoint específico, vou retornar os dados dos gastos
      // Você pode ajustar conforme sua API
      
      const gastosFuturos = await this.buscarGastosFuturos()
      
      return {
        error: false,
        pagamentos: gastosFuturos.gastos || []
      }
    } catch (error) {
      console.error('Erro ao buscar pagamentos semanais:', error)
      return {
        error: true,
        message: error.message,
        pagamentos: []
      }
    }
  }

  /**
   * Marcar pagamento como efetuado
   */
  marcarPagamentoEfetuado = async (obraId, pagamentoId) => {
    try {
      // Implementar conforme sua API
      // Por enquanto, vou simular uma atualização de status
      
      console.log(`Marcando pagamento ${pagamentoId} da obra ${obraId} como efetuado`)
      
      return {
        error: false,
        message: 'Pagamento marcado como efetuado'
      }
    } catch (error) {
      console.error('Erro ao marcar pagamento como efetuado:', error)
      return {
        error: true,
        message: error.message
      }
    }
  }
}

export default new ApiService()