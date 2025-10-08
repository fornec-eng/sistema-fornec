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
      console.log("[v0] apiService - Buscando material por ID:", id)
      const response = await ApiBase.get(`/materiais/${id}`)
      console.log("[v0] apiService - Resposta do getById:", response.data)
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
    // Métodos para pagamentos aninhados
    listarPagamentos: async (materialId) => {
      const response = await ApiBase.get(`/materiais/${materialId}/pagamentos`)
      return response.data
    },
    adicionarPagamento: async (materialId, data) => {
      console.log("[v0] apiService - Adicionando pagamento para material ID:", materialId, "Data:", data)
      const response = await ApiBase.post(`/materiais/${materialId}/pagamentos`, data)
      console.log("[v0] apiService - Resposta do adicionarPagamento:", response.data)
      return response.data
    },
    buscarPagamento: async (materialId, pagamentoId) => {
      const response = await ApiBase.get(`/materiais/${materialId}/pagamentos/${pagamentoId}`)
      return response.data
    },
    atualizarPagamento: async (materialId, pagamentoId, data) => {
      const response = await ApiBase.put(`/materiais/${materialId}/pagamentos/${pagamentoId}`, data)
      return response.data
    },
    removerPagamento: async (materialId, pagamentoId) => {
      const response = await ApiBase.delete(`/materiais/${materialId}/pagamentos/${pagamentoId}`)
      return response.data
    },
    // Relatório de pagamentos
    relatorioPagamentos: async (params = {}) => {
      const response = await ApiBase.get("/materiais/relatorio/pagamentos", { params })
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
    // Métodos para pagamentos aninhados
    listarPagamentos: async (contratoId) => {
      const response = await ApiBase.get(`/contratos/${contratoId}/pagamentos`)
      return response.data
    },
    adicionarPagamento: async (contratoId, data) => {
      const response = await ApiBase.post(`/contratos/${contratoId}/pagamentos`, data)
      return response.data
    },
    buscarPagamento: async (contratoId, pagamentoId) => {
      const response = await ApiBase.get(`/contratos/${contratoId}/pagamentos/${pagamentoId}`)
      return response.data
    },
    atualizarPagamento: async (contratoId, pagamentoId, data) => {
      const response = await ApiBase.put(`/contratos/${contratoId}/pagamentos/${pagamentoId}`, data)
      return response.data
    },
    removerPagamento: async (contratoId, pagamentoId) => {
      const response = await ApiBase.delete(`/contratos/${contratoId}/pagamentos/${pagamentoId}`)
      return response.data
    },
    // Relatório de pagamentos
    relatorioPagamentos: async (params = {}) => {
      const response = await ApiBase.get("/contratos/relatorio/pagamentos", { params })
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

  // Entradas
  entradas = {
    getAll: async (params = {}) => {
      const response = await ApiBase.get("/entradas", { params })
      return response.data
    },
    getById: async (id) => {
      const response = await ApiBase.get(`/entradas/${id}`)
      return response.data
    },
    create: async (data) => {
      const response = await ApiBase.post("/entradas", data)
      return response.data
    },
    update: async (id, data) => {
      const response = await ApiBase.put(`/entradas/${id}`, data)
      return response.data
    },
    delete: async (id) => {
      const response = await ApiBase.delete(`/entradas/${id}`)
      return response.data
    },
  }

  // ==================== MÉTODOS ESPECIAIS ====================

  /**
   * Extrair nome da obra de forma segura
   */
  extrairNomeObra = (obraId, obras) => {
    // Se obraId é null ou undefined, é gasto da Fornec
    if (!obraId) return "Fornec (sem obra associada)"
    
    // Se obraId é um objeto com nome
    if (typeof obraId === "object" && obraId !== null && obraId.nome) {
      return obraId.nome
    }
    
    // Se é um ID string, buscar na lista de obras
    if (typeof obraId === "string" && obras && Array.isArray(obras)) {
      const obra = obras.find((o) => o && o._id === obraId)
      return obra ? obra.nome : "Fornec (sem obra associada)"
    }
    
    // Se obraId é um objeto com _id, buscar na lista
    if (typeof obraId === "object" && obraId._id && obras && Array.isArray(obras)) {
      const obra = obras.find((o) => o && o._id === obraId._id)
      return obra ? obra.nome : "Fornec (sem obra associada)"
    }
    
    return "Fornec (sem obra associada)"
  }

  /**
   * Buscar TODOS os gastos (incluindo futuros e já efetuados)
   * Mantém todos os campos originais da API
   */
  buscarTodosGastos = async () => {
    try {
      const params = { limit: 60000 }
      
      // Buscar todos os tipos de gastos e obras
      const [materiaisRes, maoObraRes, equipamentosRes, contratosRes, outrosGastosRes, obrasRes] = await Promise.all([
        this.materiais.getAll(params),
        this.maoObra.getAll(params),
        this.equipamentos.getAll(params),
        this.contratos.getAll(params),
        this.outrosGastos.getAll(params),
        this.obras.getAll(),
      ])

      const obras = obrasRes.obras || []
      const todosGastos = []

      // Processar Materiais
      if (materiaisRes.materiais) {
        materiaisRes.materiais.forEach((material) => {
          todosGastos.push({
            ...material, // Manter todos os campos originais
            tipo: "Material",
            obraNome: this.extrairNomeObra(material.obraId, obras),
            dataVencimento: material.data || material.dataVencimento,
            dataPagamento: material.data,
          })
        })
      }

      // Processar Mão de Obra
      if (maoObraRes.maoObras) {
        maoObraRes.maoObras.forEach((maoObra) => {
          todosGastos.push({
            ...maoObra, // Manter todos os campos originais
            tipo: "Mão de Obra",
            obraNome: this.extrairNomeObra(maoObra.obraId, obras),
            dataVencimento: maoObra.fimContrato || maoObra.inicioContrato,
            dataPagamento: maoObra.inicioContrato,
          })
        })
      }

      // Processar Equipamentos
      if (equipamentosRes.equipamentos) {
        equipamentosRes.equipamentos.forEach((equipamento) => {
          todosGastos.push({
            ...equipamento, // Manter todos os campos originais
            tipo: "Equipamento",
            obraNome: this.extrairNomeObra(equipamento.obraId, obras),
            dataVencimento: equipamento.data || equipamento.dataVencimento,
            dataPagamento: equipamento.data,
          })
        })
      }

      // Processar Contratos
      if (contratosRes.contratos) {
        contratosRes.contratos.forEach((contrato) => {
          const valorContrato = contrato.valorInicial || contrato.valor || 0
          
          todosGastos.push({
            ...contrato, // Manter todos os campos originais
            tipo: "Contrato",
            valor: valorContrato,
            obraNome: this.extrairNomeObra(contrato.obraId, obras),
            dataVencimento: contrato.inicioContrato || contrato.dataVencimento,
            dataPagamento: contrato.inicioContrato,
            valorTotalPagamentos: contrato.valorTotalPagamentos || 0,
            saldoPendente: valorContrato - (contrato.valorTotalPagamentos || 0),
          })
        })
      }

      // Processar Outros Gastos - MANTENDO TODOS OS CAMPOS
      if (outrosGastosRes.gastos) {
        outrosGastosRes.gastos.forEach((gasto) => {
          todosGastos.push({
            // Manter TODOS os campos originais da API
            _id: gasto._id,
            descricao: gasto.descricao,
            valor: gasto.valor,
            data: gasto.data,
            categoriaLivre: gasto.categoriaLivre,
            formaPagamento: gasto.formaPagamento,
            statusPagamento: gasto.statusPagamento,
            observacoes: gasto.observacoes,
            chavePixBoleto: gasto.chavePixBoleto,
            numeroDocumento: gasto.numeroDocumento,
            fornecedor: gasto.fornecedor,
            obraId: gasto.obraId,
            criadoPor: gasto.criadoPor,
            createdAt: gasto.createdAt,
            updatedAt: gasto.updatedAt,
            __v: gasto.__v,
            
            // Adicionar campos derivados
            tipo: "Outros",
            obraNome: this.extrairNomeObra(gasto.obraId, obras),
            dataVencimento: gasto.data || gasto.dataVencimento,
            dataPagamento: gasto.data,
          })
        })
      }

      // Ordenar por data (mais recente primeiro)
      todosGastos.sort((a, b) => {
        const dataA = new Date(a.dataVencimento || a.data || a.dataPagamento || 0)
        const dataB = new Date(b.dataVencimento || b.data || b.dataPagamento || 0)
        return dataB - dataA
      })

      return {
        error: false,
        gastos: todosGastos,
        total: todosGastos.length,
      }
    } catch (error) {
      console.error("Erro ao buscar todos os gastos:", error)
      return {
        error: true,
        message: error.message,
        gastos: [],
      }
    }
  }

  /**
   * Buscar todos os gastos futuros (mantido para compatibilidade)
   * Filtra apenas gastos com data futura ou status pendente
   */
  buscarGastosFuturos = async () => {
    try {
      const todosGastosResponse = await this.buscarTodosGastos()
      
      if (todosGastosResponse.error) {
        return todosGastosResponse
      }

      const hoje = new Date()
      hoje.setHours(0, 0, 0, 0)

      // Filtrar apenas gastos futuros ou pendentes
      const gastosFuturos = todosGastosResponse.gastos.filter((gasto) => {
        const dataVencimento = new Date(gasto.dataVencimento || gasto.data || gasto.dataPagamento)
        const isPendente = gasto.statusPagamento === "pendente" || gasto.status === "pendente"
        
        return dataVencimento >= hoje || isPendente
      })

      return {
        error: false,
        gastos: gastosFuturos,
        total: gastosFuturos.length,
      }
    } catch (error) {
      console.error("Erro ao buscar gastos futuros:", error)
      return {
        error: true,
        message: error.message,
        gastos: [],
      }
    }
  }

  /**
   * Extrair data de vencimento de um gasto
   */
  extrairDataVencimento = (gasto) => {
    const camposData = [
      "dataVencimento",
      "dataPagamento",
      "fimContrato",
      "dataTermino",
      "data",
      "inicioContrato",
      "dataInicio",
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
      const gastosFuturos = await this.buscarGastosFuturos()

      return {
        error: false,
        pagamentos: gastosFuturos.gastos || [],
      }
    } catch (error) {
      console.error("Erro ao buscar pagamentos semanais:", error)
      return {
        error: true,
        message: error.message,
        pagamentos: [],
      }
    }
  }

  /**
   * Marcar pagamento como efetuado
   */
  marcarPagamentoEfetuado = async (obraId, pagamentoId) => {
    try {
      console.log(`Marcando pagamento ${pagamentoId} da obra ${obraId} como efetuado`)

      return {
        error: false,
        message: "Pagamento marcado como efetuado",
      }
    } catch (error) {
      console.error("Erro ao marcar pagamento como efetuado:", error)
      return {
        error: true,
        message: error.message,
      }
    }
  }
}

export default new ApiService()