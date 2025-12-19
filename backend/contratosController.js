const Contratos = require("../models/contratos")

class ContratosController {
  // Criar novo contrato
  async create(req, res) {
    try {
      const contratoData = {
        ...req.body,
        criadoPor: req.userID,
      }

      const contrato = await Contratos.create(contratoData)

      return res.status(201).json({
        error: false,
        message: "Contrato criado com sucesso",
        contrato,
      })
    } catch (error) {
      return res.status(400).json({
        error: true,
        message: "Erro ao criar contrato",
        details: error.message,
      })
    }
  }

  // Listar todos os contratos
  async readAll(req, res) {
    try {
      const { page = 1, limit = 10, obraId, status, loja } = req.query

      const filter = {}
      if (obraId) filter.obraId = obraId
      if (status) filter.status = status
      if (loja) filter.loja = new RegExp(loja, "i")

      const skip = (page - 1) * limit

      const contratos = await Contratos.find(filter)
        .populate("criadoPor", "nome email")
        .populate("obraId", "nome cliente")
        .sort({ createdAt: -1 })
        .limit(Number.parseInt(limit))
        .skip(skip)

      const total = await Contratos.countDocuments(filter)

      return res.json({
        error: false,
        contratos,
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
        message: "Erro ao listar contratos",
        details: error.message,
      })
    }
  }

  // Buscar contrato por ID
  async readById(req, res) {
    try {
      const contrato = await Contratos.findById(req.params.id)
        .populate("criadoPor", "nome email")
        .populate("obraId", "nome cliente")

      if (!contrato) {
        return res.status(404).json({
          error: true,
          message: "Contrato não encontrado",
        })
      }

      return res.json({
        error: false,
        contrato,
      })
    } catch (error) {
      return res.status(500).json({
        error: true,
        message: "Erro ao buscar contrato",
        details: error.message,
      })
    }
  }

  // Atualizar contrato
  async update(req, res) {
    try {
      // Criar cópia dos dados para limpeza
      const updateData = { ...req.body }

      // Remover campos que não devem ser atualizados diretamente
      delete updateData.pagamentos // Pagamentos devem ser atualizados via endpoints específicos
      delete updateData._id
      delete updateData.createdAt
      delete updateData.updatedAt
      delete updateData.__v
      delete updateData.criadoPor
      delete updateData.valorTotalPagamentos
      delete updateData.statusGeralPagamentos

      // Se obraId for um objeto (populado), extrair apenas o _id
      if (updateData.obraId && typeof updateData.obraId === 'object') {
        updateData.obraId = updateData.obraId._id
      }

      const contrato = await Contratos.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })
        .populate("criadoPor", "nome email")
        .populate("obraId", "nome cliente")

      if (!contrato) {
        return res.status(404).json({
          error: true,
          message: "Contrato não encontrado",
        })
      }

      return res.json({
        error: false,
        message: "Contrato atualizado com sucesso",
        contrato,
      })
    } catch (error) {
      return res.status(400).json({
        error: true,
        message: "Erro ao atualizar contrato",
        details: error.message,
      })
    }
  }

  // Deletar contrato
  async delete(req, res) {
    try {
      const contrato = await Contratos.findByIdAndDelete(req.params.id)

      if (!contrato) {
        return res.status(404).json({
          error: true,
          message: "Contrato não encontrado",
        })
      }

      return res.json({
        error: false,
        message: "Contrato deletado com sucesso",
      })
    } catch (error) {
      return res.status(500).json({
        error: true,
        message: "Erro ao deletar contrato",
        details: error.message,
      })
    }
  }

  // ==================== OPERAÇÕES DE PAGAMENTOS ====================

  // Adicionar pagamento ao contrato
  async adicionarPagamento(req, res) {
    try {
      const contrato = await Contratos.findById(req.params.id)

      if (!contrato) {
        return res.status(404).json({
          error: true,
          message: "Contrato não encontrado",
        })
      }

      await contrato.adicionarPagamento(req.body)

      const contratoAtualizado = await Contratos.findById(req.params.id)
        .populate("criadoPor", "nome email")
        .populate("obraId", "nome cliente")

      return res.status(201).json({
        error: false,
        message: "Pagamento adicionado com sucesso",
        contrato: contratoAtualizado,
      })
    } catch (error) {
      return res.status(400).json({
        error: true,
        message: "Erro ao adicionar pagamento",
        details: error.message,
      })
    }
  }

  // Buscar pagamento específico
  async buscarPagamento(req, res) {
    try {
      const contrato = await Contratos.findById(req.params.id)

      if (!contrato) {
        return res.status(404).json({
          error: true,
          message: "Contrato não encontrado",
        })
      }

      const pagamento = contrato.buscarPagamento(req.params.pagamentoId)

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
  async atualizarPagamento(req, res) {
    try {
      const contrato = await Contratos.findById(req.params.id)

      if (!contrato) {
        return res.status(404).json({
          error: true,
          message: "Contrato não encontrado",
        })
      }

      await contrato.atualizarPagamento(req.params.pagamentoId, req.body)

      const contratoAtualizado = await Contratos.findById(req.params.id)
        .populate("criadoPor", "nome email")
        .populate("obraId", "nome cliente")

      return res.json({
        error: false,
        message: "Pagamento atualizado com sucesso",
        contrato: contratoAtualizado,
      })
    } catch (error) {
      return res.status(400).json({
        error: true,
        message: "Erro ao atualizar pagamento",
        details: error.message,
      })
    }
  }

  // Remover pagamento
  async removerPagamento(req, res) {
    try {
      const contrato = await Contratos.findById(req.params.id)

      if (!contrato) {
        return res.status(404).json({
          error: true,
          message: "Contrato não encontrado",
        })
      }

      await contrato.removerPagamento(req.params.pagamentoId)

      const contratoAtualizado = await Contratos.findById(req.params.id)
        .populate("criadoPor", "nome email")
        .populate("obraId", "nome cliente")

      return res.json({
        error: false,
        message: "Pagamento removido com sucesso",
        contrato: contratoAtualizado,
      })
    } catch (error) {
      return res.status(400).json({
        error: true,
        message: "Erro ao remover pagamento",
        details: error.message,
      })
    }
  }

  // Listar todos os pagamentos de um contrato
  async listarPagamentos(req, res) {
    try {
      const contrato = await Contratos.findById(req.params.id)

      if (!contrato) {
        return res.status(404).json({
          error: true,
          message: "Contrato não encontrado",
        })
      }

      return res.json({
        error: false,
        pagamentos: contrato.pagamentos,
        valorTotalPagamentos: contrato.valorTotalPagamentos,
        statusGeralPagamentos: contrato.statusGeralPagamentos,
      })
    } catch (error) {
      return res.status(500).json({
        error: true,
        message: "Erro ao listar pagamentos",
        details: error.message,
      })
    }
  }

  // Relatório de pagamentos por status
  async relatorioPagamentos(req, res) {
    try {
      const { status, dataInicio, dataFim, obraId } = req.query
      const mongoose = require("mongoose")

      const pipeline = []

      // Match inicial para filtrar contratos
      const matchStage = {}
      if (obraId) matchStage.obraId = new mongoose.Types.ObjectId(obraId)
      if (Object.keys(matchStage).length > 0) {
        pipeline.push({ $match: matchStage })
      }

      // Unwind para separar pagamentos
      pipeline.push({ $unwind: "$pagamentos" })

      // Match para filtrar pagamentos
      const pagamentoMatchStage = {}
      if (status) pagamentoMatchStage["pagamentos.statusPagamento"] = status
      if (dataInicio || dataFim) {
        pagamentoMatchStage["pagamentos.dataPagamento"] = {}
        if (dataInicio) pagamentoMatchStage["pagamentos.dataPagamento"].$gte = new Date(dataInicio)
        if (dataFim) pagamentoMatchStage["pagamentos.dataPagamento"].$lte = new Date(dataFim)
      }

      if (Object.keys(pagamentoMatchStage).length > 0) {
        pipeline.push({ $match: pagamentoMatchStage })
      }

      // Group por status
      pipeline.push({
        $group: {
          _id: "$pagamentos.statusPagamento",
          total: { $sum: 1 },
          valorTotal: { $sum: "$pagamentos.valor" },
          contratos: { 
            $addToSet: {
              contratoId: "$contratoId",
              loja: "$loja",
              obraId: "$obraId"
            }
          },
          pagamentos: { 
            $push: {
              _id: "$pagamentos._id",
              valor: "$pagamentos.valor",
              tipoPagamento: "$pagamentos.tipoPagamento",
              dataPagamento: "$pagamentos.dataPagamento",
              observacoes: "$pagamentos.observacoes",
              contratoInfo: {
                _id: "$_id",
                contratoId: "$contratoId", 
                loja: "$loja"
              }
            }
          },
        },
      })

      // Adicionar resumo geral
      pipeline.push({
        $group: {
          _id: null,
          porStatus: {
            $push: {
              status: "$_id",
              total: "$total",
              valorTotal: "$valorTotal",
              contratos: "$contratos",
              pagamentos: "$pagamentos"
            }
          },
          totalGeral: { $sum: "$total" },
          valorTotalGeral: { $sum: "$valorTotal" }
        }
      })

      const resultado = await Contratos.aggregate(pipeline)

      return res.json({
        error: false,
        relatorio: resultado.length > 0 ? resultado[0] : {
          porStatus: [],
          totalGeral: 0,
          valorTotalGeral: 0
        },
      })
    } catch (error) {
      console.error("Erro no relatório:", error)
      return res.status(500).json({
        error: true,
        message: "Erro ao gerar relatório",
        details: error.message,
      })
    }
  }
}

module.exports = new ContratosController()