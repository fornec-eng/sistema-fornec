const Equipamentos = require("../models/equipamentos")

class EquipamentosController {
  // Criar novo equipamento
  async create(req, res) {
    try {
      const equipamentoData = {
        ...req.body,
        criadoPor: req.userID,
      }

      const equipamento = await Equipamentos.create(equipamentoData)

      return res.status(201).json({
        error: false,
        message: "Equipamento criado com sucesso",
        equipamento,
      })
    } catch (error) {
      return res.status(400).json({
        error: true,
        message: "Erro ao criar equipamento",
        details: error.message,
      })
    }
  }

  // Listar todos os equipamentos
  async readAll(req, res) {
    try {
      const { page = 1, limit = 10, obraId, item, tipoContratacao, solicitante, statusPagamento } = req.query

      const filter = {}
      if (obraId) filter.obraId = obraId
      if (item) filter.item = new RegExp(item, "i")
      if (tipoContratacao) filter.tipoContratacao = tipoContratacao
      if (solicitante) filter.solicitante = new RegExp(solicitante, "i")
      if (statusPagamento) filter.statusPagamento = statusPagamento

      const skip = (page - 1) * limit

      const equipamentos = await Equipamentos.find(filter)
        .populate("criadoPor", "nome email")
        .populate("obraId", "nome cliente")
        .sort({ data: -1 })
        .limit(Number.parseInt(limit))
        .skip(skip)

      const total = await Equipamentos.countDocuments(filter)

      return res.json({
        error: false,
        equipamentos,
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
        message: "Erro ao listar equipamentos",
        details: error.message,
      })
    }
  }

  // Buscar equipamento por ID
  async readById(req, res) {
    try {
      const equipamento = await Equipamentos.findById(req.params.id)
        .populate("criadoPor", "nome email")
        .populate("obraId", "nome cliente")

      if (!equipamento) {
        return res.status(404).json({
          error: true,
          message: "Equipamento não encontrado",
        })
      }

      return res.json({
        error: false,
        equipamento,
      })
    } catch (error) {
      return res.status(500).json({
        error: true,
        message: "Erro ao buscar equipamento",
        details: error.message,
      })
    }
  }

  // Atualizar equipamento
  async update(req, res) {
    try {
      // Criar cópia dos dados para limpeza
      const updateData = { ...req.body }

      // Remover campos que não devem ser atualizados diretamente
      delete updateData._id
      delete updateData.createdAt
      delete updateData.updatedAt
      delete updateData.__v
      delete updateData.criadoPor

      // Se obraId for um objeto (populado), extrair apenas o _id
      if (updateData.obraId && typeof updateData.obraId === 'object') {
        updateData.obraId = updateData.obraId._id
      }

      const equipamento = await Equipamentos.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true,
      })
        .populate("criadoPor", "nome email")
        .populate("obraId", "nome cliente")

      if (!equipamento) {
        return res.status(404).json({
          error: true,
          message: "Equipamento não encontrado",
        })
      }

      return res.json({
        error: false,
        message: "Equipamento atualizado com sucesso",
        equipamento,
      })
    } catch (error) {
      return res.status(400).json({
        error: true,
        message: "Erro ao atualizar equipamento",
        details: error.message,
      })
    }
  }

  // Deletar equipamento
  async delete(req, res) {
    try {
      const equipamento = await Equipamentos.findByIdAndDelete(req.params.id)

      if (!equipamento) {
        return res.status(404).json({
          error: true,
          message: "Equipamento não encontrado",
        })
      }

      return res.json({
        error: false,
        message: "Equipamento deletado com sucesso",
      })
    } catch (error) {
      return res.status(500).json({
        error: true,
        message: "Erro ao deletar equipamento",
        details: error.message,
      })
    }
  }
}

module.exports = new EquipamentosController()
