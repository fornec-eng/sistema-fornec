const Pagamento = require("../models/pagamento")

class PagamentoController {
  // ==================== OPERAÇÕES GERAIS ====================

  // Criar pagamento (qualquer tipo)
  async create(req, res) {
    try {
      const { tipo } = req.body

      if (!tipo || !["material", "mao_obra", "pagamento_semanal"].includes(tipo)) {
        return res.status(400).json({
          error: true,
          message: "Tipo de pagamento inválido. Use: material, mao_obra ou pagamento_semanal",
        })
      }

      const pagamentoData = {
        ...req.body,
        criadoPor: req.userID,
        status: "pendente_associacao",
      }

      const pagamento = await Pagamento.create(pagamentoData)

      const tipoNomes = {
        material: "Material",
        mao_obra: "Contrato de mão de obra",
        pagamento_semanal: "Pagamento semanal",
      }

      return res.status(201).json({
        error: false,
        message: `${tipoNomes[tipo]} criado com sucesso`,
        pagamento,
      })
    } catch (error) {
      return res.status(400).json({
        error: true,
        message: "Erro ao criar pagamento",
        details: error.message,
      })
    }
  }

  // Listar pagamentos com filtros
  async list(req, res) {
    try {
      const {
        tipo,
        status,
        statusPagamento,
        statusPagamentoSemanal,
        obraId,
        page = 1,
        limit = 10,
        dataInicio,
        dataFim,
        formaPagamento,
        semana,
        ano,
        funcao,
        nome,
      } = req.query

      const filter = {}

      if (tipo) filter.tipo = tipo
      if (status) filter.status = status
      if (statusPagamento) filter.statusPagamento = statusPagamento
      if (statusPagamentoSemanal) filter.statusPagamentoSemanal = statusPagamentoSemanal
      if (obraId) filter.obraId = obraId
      if (formaPagamento) filter.formaPagamento = formaPagamento
      if (semana) filter.semana = Number.parseInt(semana)
      if (ano) filter.ano = Number.parseInt(ano)
      if (funcao) filter.funcao = new RegExp(funcao, "i")
      if (nome) filter.nome = new RegExp(nome, "i")

      // Filtro de data (funciona para material.data e maoObra.dataInicio)
      if (dataInicio || dataFim) {
        const dateFilter = {}
        if (dataInicio) dateFilter.$gte = new Date(dataInicio)
        if (dataFim) dateFilter.$lte = new Date(dataFim)

        filter.$or = [{ data: dateFilter }, { dataInicio: dateFilter }]
      }

      const skip = (page - 1) * limit

      const pagamentos = await Pagamento.find(filter)
        .populate("criadoPor", "nome email")
        .sort({ createdAt: -1 })
        .limit(Number.parseInt(limit))
        .skip(skip)

      const total = await Pagamento.countDocuments(filter)

      return res.json({
        error: false,
        pagamentos,
        pagination: {
          page: Number.parseInt(page),
          limit: Number.parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      })
    } catch (error) {
      return res.status(500).json({
        error: true,
        message: "Erro ao listar pagamentos",
        details: error.message,
      })
    }
  }

  // Buscar pagamento por ID
  async findById(req, res) {
    try {
      const pagamento = await Pagamento.findById(req.params.id).populate("criadoPor", "nome email")

      if (!pagamento) {
        return res.status(404).json({
          error: true,
          message: "Pagamento não encontrado",
        })
      }

      return res.json({
        error: false,
        pagamento,
      })
    } catch (error) {
      return res.status(500).json({
        error: true,
        message: "Erro ao buscar pagamento",
        details: error.message,
      })
    }
  }

  // Atualizar pagamento
  async update(req, res) {
    try {
      const pagamento = await Pagamento.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      })

      if (!pagamento) {
        return res.status(404).json({
          error: true,
          message: "Pagamento não encontrado",
        })
      }

      return res.json({
        error: false,
        message: "Pagamento atualizado com sucesso",
        pagamento,
      })
    } catch (error) {
      return res.status(400).json({
        error: true,
        message: "Erro ao atualizar pagamento",
        details: error.message,
      })
    }
  }

  // Deletar pagamento
  async delete(req, res) {
    try {
      const pagamento = await Pagamento.findByIdAndDelete(req.params.id)

      if (!pagamento) {
        return res.status(404).json({
          error: true,
          message: "Pagamento não encontrado",
        })
      }

      return res.json({
        error: false,
        message: "Pagamento deletado com sucesso",
      })
    } catch (error) {
      return res.status(500).json({
        error: true,
        message: "Erro ao deletar pagamento",
        details: error.message,
      })
    }
  }

  // Associar pagamento a uma obra
  async associarObra(req, res) {
    try {
      const { obraId } = req.body

      const pagamento = await Pagamento.findByIdAndUpdate(
        req.params.id,
        {
          obraId,
          status: "associado",
        },
        { new: true },
      )

      if (!pagamento) {
        return res.status(404).json({
          error: true,
          message: "Pagamento não encontrado",
        })
      }

      return res.json({
        error: false,
        message: "Pagamento associado à obra com sucesso",
        pagamento,
      })
    } catch (error) {
      return res.status(400).json({
        error: true,
        message: "Erro ao associar pagamento à obra",
        details: error.message,
      })
    }
  }

  // ==================== OPERAÇÕES ESPECÍFICAS POR TIPO ====================

  // Listar materiais
  async listMateriais(req, res) {
    req.query.tipo = "material"
    return await this.list(req, res)
  }

  // Criar material
  async createMaterial(req, res) {
    req.body.tipo = "material"
    return await this.create(req, res)
  }

  // Listar mão de obra
  async listMaoObra(req, res) {
    req.query.tipo = "mao_obra"
    return await this.list(req, res)
  }

  // Criar mão de obra
  async createMaoObra(req, res) {
    req.body.tipo = "mao_obra"
    return await this.create(req, res)
  }

  // Listar pagamentos semanais
  async listPagamentosSemanais(req, res) {
    req.query.tipo = "pagamento_semanal"
    return await this.list(req, res)
  }

  // Criar pagamento semanal
  async createPagamentoSemanal(req, res) {
    req.body.tipo = "pagamento_semanal"
    return await this.create(req, res)
  }

  // ==================== OPERAÇÕES ESPECIALIZADAS ====================

  // Listar itens pendentes de associação
  async listPendentes(req, res) {
    try {
      const { tipo } = req.query

      const filter = { status: "pendente_associacao" }
      if (tipo) filter.tipo = tipo

      const pagamentos = await Pagamento.find(filter).populate("criadoPor", "nome email").sort({ createdAt: -1 })

      // Agrupar por tipo se não foi especificado um tipo
      if (!tipo) {
        const agrupados = {
          materiais: pagamentos.filter((p) => p.tipo === "material"),
          maoObra: pagamentos.filter((p) => p.tipo === "mao_obra"),
          pagamentosSemanais: pagamentos.filter((p) => p.tipo === "pagamento_semanal"),
        }

        return res.json({
          error: false,
          itensPendentes: agrupados,
          total: pagamentos.length,
        })
      }

      return res.json({
        error: false,
        pagamentos,
      })
    } catch (error) {
      return res.status(500).json({
        error: true,
        message: "Erro ao listar itens pendentes",
        details: error.message,
      })
    }
  }

  // Marcar pagamento semanal como efetuado
  async marcarPagamentoEfetuado(req, res) {
    try {
      const pagamento = await Pagamento.findById(req.params.id)

      if (!pagamento) {
        return res.status(404).json({
          error: true,
          message: "Pagamento não encontrado",
        })
      }

      if (pagamento.tipo !== "pagamento_semanal") {
        return res.status(400).json({
          error: true,
          message: "Esta operação só é válida para pagamentos semanais",
        })
      }

      pagamento.statusPagamentoSemanal = "pagamento efetuado"
      pagamento.dataPagamentoEfetuado = new Date()
      await pagamento.save()

      return res.json({
        error: false,
        message: "Pagamento marcado como efetuado",
        pagamento,
      })
    } catch (error) {
      return res.status(400).json({
        error: true,
        message: "Erro ao marcar pagamento como efetuado",
        details: error.message,
      })
    }
  }

  // Atualizar status de pagamento (mão de obra)
  async atualizarStatusPagamento(req, res) {
    try {
      const { statusPagamento } = req.body
      const pagamento = await Pagamento.findById(req.params.id)

      if (!pagamento) {
        return res.status(404).json({
          error: true,
          message: "Pagamento não encontrado",
        })
      }

      if (pagamento.tipo !== "mao_obra") {
        return res.status(400).json({
          error: true,
          message: "Esta operação só é válida para contratos de mão de obra",
        })
      }

      pagamento.statusPagamento = statusPagamento
      await pagamento.save()

      return res.json({
        error: false,
        message: "Status de pagamento atualizado com sucesso",
        pagamento,
      })
    } catch (error) {
      return res.status(400).json({
        error: true,
        message: "Erro ao atualizar status de pagamento",
        details: error.message,
      })
    }
  }

  // Listar pagamentos em atraso (mão de obra)
  async listEmAtraso(req, res) {
    try {
      const hoje = new Date()

      const pagamentos = await Pagamento.find({
        tipo: "mao_obra",
        statusPagamento: "em atraso",
        dataPagamento: { $lt: hoje },
      })
        .populate("criadoPor", "nome email")
        .sort({ dataPagamento: 1 })

      return res.json({
        error: false,
        pagamentos,
      })
    } catch (error) {
      return res.status(500).json({
        error: true,
        message: "Erro ao listar pagamentos em atraso",
        details: error.message,
      })
    }
  }

  // Listar pagamentos semanais a pagar
  async listAPagar(req, res) {
    try {
      const pagamentos = await Pagamento.find({
        tipo: "pagamento_semanal",
        statusPagamentoSemanal: "pagar",
      })
        .populate("criadoPor", "nome email")
        .sort({ ano: 1, semana: 1 })

      return res.json({
        error: false,
        pagamentos,
      })
    } catch (error) {
      return res.status(500).json({
        error: true,
        message: "Erro ao listar pagamentos a pagar",
        details: error.message,
      })
    }
  }

  // Buscar pagamentos por funcionário
  async listPorFuncionario(req, res) {
    try {
      const { nome, funcao, ano } = req.query

      const filter = {
        tipo: "pagamento_semanal",
      }

      if (nome) filter.nome = new RegExp(nome, "i")
      if (funcao) filter.funcao = new RegExp(funcao, "i")
      if (ano) filter.ano = Number.parseInt(ano)

      const pagamentos = await Pagamento.find(filter).sort({ ano: -1, semana: -1 })

      // Agrupar por funcionário
      const funcionarios = {}

      pagamentos.forEach((pagamento) => {
        const chave = `${pagamento.nome}_${pagamento.funcao}`

        if (!funcionarios[chave]) {
          funcionarios[chave] = {
            nome: pagamento.nome,
            funcao: pagamento.funcao,
            pagamentos: [],
            totalRecebido: 0,
            totalSemanas: 0,
          }
        }

        funcionarios[chave].pagamentos.push(pagamento)
        funcionarios[chave].totalRecebido += pagamento.totalReceber
        funcionarios[chave].totalSemanas += 1
      })

      return res.json({
        error: false,
        funcionarios: Object.values(funcionarios),
      })
    } catch (error) {
      return res.status(500).json({
        error: true,
        message: "Erro ao buscar pagamentos por funcionário",
        details: error.message,
      })
    }
  }

  // ==================== RELATÓRIOS ====================

  // Relatório geral de pagamentos
  async relatorioGeral(req, res) {
    try {
      const { dataInicio, dataFim, obraId, tipo } = req.query

      const filter = {}

      if (tipo) filter.tipo = tipo
      if (obraId) filter.obraId = obraId

      // Filtro de data
      if (dataInicio || dataFim) {
        const dateFilter = {}
        if (dataInicio) dateFilter.$gte = new Date(dataInicio)
        if (dataFim) dateFilter.$lte = new Date(dataFim)

        filter.$or = [{ data: dateFilter }, { dataInicio: dateFilter }]
      }

      const pagamentos = await Pagamento.find(filter)

      const relatorio = {
        totalPagamentos: pagamentos.length,
        porTipo: {},
        porStatus: {},
        valoresTotais: {},
      }

      // Agrupar dados
      pagamentos.forEach((pagamento) => {
        // Por tipo
        relatorio.porTipo[pagamento.tipo] = (relatorio.porTipo[pagamento.tipo] || 0) + 1

        // Por status
        relatorio.porStatus[pagamento.status] = (relatorio.porStatus[pagamento.status] || 0) + 1

        // Valores totais por tipo
        if (!relatorio.valoresTotais[pagamento.tipo]) {
          relatorio.valoresTotais[pagamento.tipo] = 0
        }

        switch (pagamento.tipo) {
          case "material":
            relatorio.valoresTotais[pagamento.tipo] += pagamento.valor || 0
            break
          case "mao_obra":
            relatorio.valoresTotais[pagamento.tipo] += pagamento.valorTotal || 0
            break
          case "pagamento_semanal":
            relatorio.valoresTotais[pagamento.tipo] += pagamento.totalReceber || 0
            break
        }
      })

      return res.json({
        error: false,
        relatorio,
        pagamentos,
      })
    } catch (error) {
      return res.status(500).json({
        error: true,
        message: "Erro ao gerar relatório",
        details: error.message,
      })
    }
  }

  // Relatório específico por tipo
  async relatorioTipo(req, res) {
    try {
      const { tipo } = req.params
      req.query.tipo = tipo
      return this.relatorioGeral(req, res)
    } catch (error) {
      return res.status(500).json({
        error: true,
        message: "Erro ao gerar relatório por tipo",
        details: error.message,
      })
    }
  }

  // ==================== OPERAÇÕES EM LOTE ====================

  // Associar múltiplos pagamentos a uma obra
  async associarMultiplos(req, res) {
    try {
      const { obraId, pagamentoIds } = req.body

      if (!obraId || !Array.isArray(pagamentoIds) || pagamentoIds.length === 0) {
        return res.status(400).json({
          error: true,
          message: "obraId e array de pagamentoIds são obrigatórios",
        })
      }

      const resultado = await Pagamento.updateMany(
        { _id: { $in: pagamentoIds } },
        {
          obraId,
          status: "associado",
        },
      )

      return res.json({
        error: false,
        message: `${resultado.modifiedCount} pagamento(s) associado(s) à obra com sucesso`,
        modificados: resultado.modifiedCount,
      })
    } catch (error) {
      return res.status(400).json({
        error: true,
        message: "Erro ao associar múltiplos pagamentos",
        details: error.message,
      })
    }
  }
}

module.exports = new PagamentoController()
