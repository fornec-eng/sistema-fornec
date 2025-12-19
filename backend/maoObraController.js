// maoObraController.js - Versão corrigida
const MaoObra = require("../models/maoObra")

class MaoObraController {
  // Criar novo registro de mão de obra
  async create(req, res) {
    try {
      console.log('Dados recebidos para criação:', req.body)
      console.log('User ID:', req.userID)

      // Validar campos obrigatórios
      const { nome, funcao, tipoContratacao, valor, inicioContrato, fimContrato, diaPagamento } = req.body

      if (!nome || !funcao || !tipoContratacao || !valor || !inicioContrato || !fimContrato || !diaPagamento) {
        return res.status(400).json({
          error: true,
          message: "Campos obrigatórios: nome, funcao, tipoContratacao, valor, inicioContrato, fimContrato, diaPagamento",
        })
      }

      // Validar datas
      const dataInicio = new Date(inicioContrato)
      const dataFim = new Date(fimContrato)
      
      if (dataFim <= dataInicio) {
        return res.status(400).json({
          error: true,
          message: "Data de fim deve ser posterior à data de início",
        })
      }

      // Validar dia do pagamento
      const dia = parseInt(diaPagamento)
      if (dia < 1 || dia > 31) {
        return res.status(400).json({
          error: true,
          message: "Dia do pagamento deve ser entre 1 e 31",
        })
      }

      const maoObraData = {
        ...req.body,
        criadoPor: req.userID,
        valor: parseFloat(valor),
        diaPagamento: dia,
        // Garantir que obraId seja null se não fornecido
        obraId: req.body.obraId || null,
      }

      console.log('Dados processados para salvamento:', maoObraData)

      const maoObra = await MaoObra.create(maoObraData)

      console.log('Mão de obra criada:', maoObra)

      return res.status(201).json({
        error: false,
        message: "Registro de mão de obra criado com sucesso",
        maoObra,
      })
    } catch (error) {
      console.error('Erro ao criar mão de obra:', error)
      
      // Tratar erros de validação do Mongoose
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => err.message)
        return res.status(400).json({
          error: true,
          message: "Erro de validação",
          details: validationErrors,
        })
      }

      return res.status(500).json({
        error: true,
        message: "Erro interno do servidor ao criar registro de mão de obra",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  // Listar todos os registros de mão de obra
  async readAll(req, res) {
    try {
      const { page = 1, limit = 1000, obraId, status, funcao, nome, statusPagamento } = req.query

      console.log('Parâmetros de busca:', { page, limit, obraId, status, funcao, nome, statusPagamento })

      const filter = {}
      if (obraId) {
        // Se obraId for 'null' ou 'undefined' como string, converter para null
        if (obraId === 'null' || obraId === 'undefined') {
          filter.obraId = null
        } else {
          filter.obraId = obraId
        }
      }
      if (status) filter.status = status
      if (funcao) filter.funcao = new RegExp(funcao, "i")
      if (nome) filter.nome = new RegExp(nome, "i")
      if (statusPagamento) filter.statusPagamento = statusPagamento

      const skip = (page - 1) * limit

      console.log('Filtro aplicado:', filter)

      const maoObra = await MaoObra.find(filter)
        .populate("criadoPor", "nome email")
        .populate("obraId", "nome cliente")
        .sort({ createdAt: -1 })
        .limit(parseInt(limit))
        .skip(skip)

      const total = await MaoObra.countDocuments(filter)

      console.log(`Encontrados ${maoObra.length} registros de ${total} total`)

      return res.json({
        error: false,
        maoObras: maoObra, // Corrigido: era 'maoObra', agora é 'maoObras' para consistência
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      })
    } catch (error) {
      console.error('Erro ao listar mão de obra:', error)
      return res.status(500).json({
        error: true,
        message: "Erro ao listar registros de mão de obra",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  // Buscar registro por ID
  async readById(req, res) {
    try {
      const { id } = req.params
      
      if (!id) {
        return res.status(400).json({
          error: true,
          message: "ID é obrigatório",
        })
      }

      const maoObra = await MaoObra.findById(id)
        .populate("criadoPor", "nome email")
        .populate("obraId", "nome cliente")

      if (!maoObra) {
        return res.status(404).json({
          error: true,
          message: "Registro de mão de obra não encontrado",
        })
      }

      return res.json({
        error: false,
        maoObra,
      })
    } catch (error) {
      console.error('Erro ao buscar mão de obra:', error)
      
      // Tratar erro de ID inválido
      if (error.name === 'CastError') {
        return res.status(400).json({
          error: true,
          message: "ID inválido",
        })
      }

      return res.status(500).json({
        error: true,
        message: "Erro ao buscar registro de mão de obra",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  // Atualizar registro
  async update(req, res) {
    try {
      const { id } = req.params
      
      if (!id) {
        return res.status(400).json({
          error: true,
          message: "ID é obrigatório",
        })
      }

      console.log('Atualizando mão de obra:', id, req.body)

      // Validar datas se fornecidas
      if (req.body.inicioContrato && req.body.fimContrato) {
        const dataInicio = new Date(req.body.inicioContrato)
        const dataFim = new Date(req.body.fimContrato)
        
        if (dataFim <= dataInicio) {
          return res.status(400).json({
            error: true,
            message: "Data de fim deve ser posterior à data de início",
          })
        }
      }

      // Processar dados
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

      if (updateData.valor) {
        updateData.valor = parseFloat(updateData.valor)
      }
      if (updateData.diaPagamento) {
        const dia = parseInt(updateData.diaPagamento)
        if (dia < 1 || dia > 31) {
          return res.status(400).json({
            error: true,
            message: "Dia do pagamento deve ser entre 1 e 31",
          })
        }
        updateData.diaPagamento = dia
      }

      const maoObra = await MaoObra.findByIdAndUpdate(id, updateData, { 
        new: true, 
        runValidators: true 
      })
        .populate("criadoPor", "nome email")
        .populate("obraId", "nome cliente")

      if (!maoObra) {
        return res.status(404).json({
          error: true,
          message: "Registro de mão de obra não encontrado",
        })
      }

      console.log('Mão de obra atualizada:', maoObra)

      return res.json({
        error: false,
        message: "Registro de mão de obra atualizado com sucesso",
        maoObra,
      })
    } catch (error) {
      console.error('Erro ao atualizar mão de obra:', error)
      
      if (error.name === 'ValidationError') {
        const validationErrors = Object.values(error.errors).map(err => err.message)
        return res.status(400).json({
          error: true,
          message: "Erro de validação",
          details: validationErrors,
        })
      }

      if (error.name === 'CastError') {
        return res.status(400).json({
          error: true,
          message: "ID inválido",
        })
      }

      return res.status(500).json({
        error: true,
        message: "Erro ao atualizar registro de mão de obra",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }

  // Deletar registro
  async delete(req, res) {
    try {
      const { id } = req.params
      
      if (!id) {
        return res.status(400).json({
          error: true,
          message: "ID é obrigatório",
        })
      }

      console.log('Deletando mão de obra:', id)

      const maoObra = await MaoObra.findByIdAndDelete(id)

      if (!maoObra) {
        return res.status(404).json({
          error: true,
          message: "Registro de mão de obra não encontrado",
        })
      }

      console.log('Mão de obra deletada:', maoObra._id)

      return res.json({
        error: false,
        message: "Registro de mão de obra deletado com sucesso",
      })
    } catch (error) {
      console.error('Erro ao deletar mão de obra:', error)
      
      if (error.name === 'CastError') {
        return res.status(400).json({
          error: true,
          message: "ID inválido",
        })
      }

      return res.status(500).json({
        error: true,
        message: "Erro ao deletar registro de mão de obra",
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      })
    }
  }
}

module.exports = new MaoObraController()