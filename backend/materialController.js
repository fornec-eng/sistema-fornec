const Material = require("../models/material")

class MaterialController {
  // Criar novo material
  async create(req, res) {
    try {
      const materialData = {
        ...req.body,
        criadoPor: req.userID,
      }

      const material = await Material.create(materialData)

      return res.status(201).json({
        error: false,
        message: "Material criado com sucesso",
        material,
      })
    } catch (error) {
      return res.status(400).json({
        error: true,
        message: "Erro ao criar material",
        details: error.message,
      })
    }
  }

  // Listar todos os materiais
  async readAll(req, res) {
    try {
      const { page = 1, limit = 10, obraId, solicitante, localCompra, formaPagamento, statusPagamento } = req.query

      const filter = {}
      if (obraId) filter.obraId = obraId
      if (solicitante) filter.solicitante = new RegExp(solicitante, "i")
      if (localCompra) filter.localCompra = new RegExp(localCompra, "i")
      if (formaPagamento) filter.formaPagamento = formaPagamento
      if (statusPagamento) filter["pagamentos.statusPagamento"] = statusPagamento

      const skip = (page - 1) * limit

      const materiais = await Material.find(filter)
        .populate("criadoPor", "nome email")
        .populate("obraId", "nome cliente")
        .sort({ data: -1 })
        .limit(Number.parseInt(limit))
        .skip(skip)

      const total = await Material.countDocuments(filter)

      return res.json({
        error: false,
        materiais,
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
        message: "Erro ao listar materiais",
        details: error.message,
      })
    }
  }

  // Buscar material por ID
  async readById(req, res) {
    try {
      const material = await Material.findById(req.params.id)
        .populate("criadoPor", "nome email")
        .populate("obraId", "nome cliente")

      if (!material) {
        return res.status(404).json({
          error: true,
          message: "Material não encontrado",
        })
      }

      return res.json({
        error: false,
        material,
      })
    } catch (error) {
      return res.status(500).json({
        error: true,
        message: "Erro ao buscar material",
        details: error.message,
      })
    }
  }

  // Atualizar material
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

      // Se obraId for um objeto (populado), extrair apenas o _id
      if (updateData.obraId && typeof updateData.obraId === 'object') {
        updateData.obraId = updateData.obraId._id
      }

      const material = await Material.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })
        .populate("criadoPor", "nome email")
        .populate("obraId", "nome cliente")

      if (!material) {
        return res.status(404).json({
          error: true,
          message: "Material não encontrado",
        })
      }

      return res.json({
        error: false,
        message: "Material atualizado com sucesso",
        material,
      })
    } catch (error) {
      return res.status(400).json({
        error: true,
        message: "Erro ao atualizar material",
        details: error.message,
      })
    }
  }

  // Deletar material
  async delete(req, res) {
    try {
      const material = await Material.findByIdAndDelete(req.params.id)

      if (!material) {
        return res.status(404).json({
          error: true,
          message: "Material não encontrado",
        })
      }

      return res.json({
        error: false,
        message: "Material deletado com sucesso",
      })
    } catch (error) {
      return res.status(500).json({
        error: true,
        message: "Erro ao deletar material",
        details: error.message,
      })
    }
  }

  // ==================== OPERAÇÕES DE PAGAMENTOS ====================

  // Adicionar pagamento ao material
  async adicionarPagamento(req, res) {
    try {
      const material = await Material.findById(req.params.id)

      if (!material) {
        return res.status(404).json({
          error: true,
          message: "Material não encontrado",
        })
      }

      await material.adicionarPagamento(req.body)

      const materialAtualizado = await Material.findById(req.params.id)
        .populate("criadoPor", "nome email")
        .populate("obraId", "nome cliente")

      return res.status(201).json({
        error: false,
        message: "Pagamento adicionado com sucesso",
        material: materialAtualizado,
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
      const material = await Material.findById(req.params.id)

      if (!material) {
        return res.status(404).json({
          error: true,
          message: "Material não encontrado",
        })
      }

      const pagamento = material.buscarPagamento(req.params.pagamentoId)

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
      const material = await Material.findById(req.params.id)

      if (!material) {
        return res.status(404).json({
          error: true,
          message: "Material não encontrado",
        })
      }

      await material.atualizarPagamento(req.params.pagamentoId, req.body)

      const materialAtualizado = await Material.findById(req.params.id)
        .populate("criadoPor", "nome email")
        .populate("obraId", "nome cliente")

      return res.json({
        error: false,
        message: "Pagamento atualizado com sucesso",
        material: materialAtualizado,
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
      const material = await Material.findById(req.params.id)

      if (!material) {
        return res.status(404).json({
          error: true,
          message: "Material não encontrado",
        })
      }

      await material.removerPagamento(req.params.pagamentoId)

      const materialAtualizado = await Material.findById(req.params.id)
        .populate("criadoPor", "nome email")
        .populate("obraId", "nome cliente")

      return res.json({
        error: false,
        message: "Pagamento removido com sucesso",
        material: materialAtualizado,
      })
    } catch (error) {
      return res.status(400).json({
        error: true,
        message: "Erro ao remover pagamento",
        details: error.message,
      })
    }
  }

  // Listar todos os pagamentos de um material
  async listarPagamentos(req, res) {
    try {
      const material = await Material.findById(req.params.id)

      if (!material) {
        return res.status(404).json({
          error: true,
          message: "Material não encontrado",
        })
      }

      return res.json({
        error: false,
        pagamentos: material.pagamentos,
        valorTotalPagamentos: material.valorTotalPagamentos,
        statusGeralPagamentos: material.statusGeralPagamentos,
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

      // Match inicial para filtrar materiais
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
          materiais: {
            $addToSet: {
              materialId: "$numeroNota",
              localCompra: "$localCompra",
              obraId: "$obraId",
            },
          },
          pagamentos: {
            $push: {
              _id: "$pagamentos._id",
              valor: "$pagamentos.valor",
              tipoPagamento: "$pagamentos.tipoPagamento",
              dataPagamento: "$pagamentos.dataPagamento",
              observacoes: "$pagamentos.observacoes",
              materialInfo: {
                _id: "$_id",
                numeroNota: "$numeroNota",
                localCompra: "$localCompra",
              },
            },
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
              materiais: "$materiais",
              pagamentos: "$pagamentos",
            },
          },
          totalGeral: { $sum: "$total" },
          valorTotalGeral: { $sum: "$valorTotal" },
        },
      })

      const resultado = await Material.aggregate(pipeline)

      return res.json({
        error: false,
        relatorio:
          resultado.length > 0
            ? resultado[0]
            : {
                porStatus: [],
                totalGeral: 0,
                valorTotalGeral: 0,
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

module.exports = new MaterialController()
