"use client"

import { useState, useEffect } from "react"
import { Form, Button, Alert, Row, Col } from "react-bootstrap"
import { Save, X } from "lucide-react"
import apiService from "../../services/apiService"

const MaoObraForm = ({ onSubmit, onCancel, initialData = null, obraId = null }) => {
  const [formData, setFormData] = useState({
    nome: "",
    funcao: "",
    tipoContratacao: "",
    valor: "",
    inicioContrato: "",
    fimContrato: "",
    diaPagamento: "",
    statusPagamento: "pendente",
    obraId: obraId || "", // Usar obraId passado como prop
    observacoes: "",
  })

  const [obras, setObras] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchObras()
    if (initialData) {
      setFormData({
        ...initialData,
        inicioContrato: initialData.inicioContrato
          ? new Date(initialData.inicioContrato).toISOString().split("T")[0]
          : "",
        fimContrato: initialData.fimContrato 
          ? new Date(initialData.fimContrato).toISOString().split("T")[0] 
          : "",
        obraId: initialData.obraId || obraId || "", // Priorizar obraId do initialData
      })
    } else if (obraId) {
      // Se não tem initialData mas tem obraId, definir no form
      setFormData(prev => ({
        ...prev,
        obraId: obraId
      }))
    }
  }, [initialData, obraId])

  const fetchObras = async () => {
    try {
      const response = await apiService.obras.getAll()
      if (!response.error) {
        setObras(response.obras || [])
      }
    } catch (error) {
      console.error("Erro ao buscar obras:", error)
    }
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError("")

    console.log('Dados do formulário antes da validação:', formData)

    // Validações básicas
    if (!formData.nome.trim()) {
      setError("Nome do funcionário é obrigatório")
      setLoading(false)
      return
    }

    if (!formData.funcao.trim()) {
      setError("Função é obrigatória")
      setLoading(false)
      return
    }

    if (!formData.tipoContratacao) {
      setError("Tipo de contratação é obrigatório")
      setLoading(false)
      return
    }

    if (!formData.valor || parseFloat(formData.valor) <= 0) {
      setError("Valor deve ser maior que zero")
      setLoading(false)
      return
    }

    if (!formData.inicioContrato) {
      setError("Data de início do contrato é obrigatória")
      setLoading(false)
      return
    }

    if (!formData.fimContrato) {
      setError("Data de fim do contrato é obrigatória")
      setLoading(false)
      return
    }

    if (!formData.diaPagamento || 
        parseInt(formData.diaPagamento) < 1 || 
        parseInt(formData.diaPagamento) > 31) {
      setError("Dia do pagamento deve ser entre 1 e 31")
      setLoading(false)
      return
    }

    if (new Date(formData.fimContrato) <= new Date(formData.inicioContrato)) {
      setError("Data de fim deve ser posterior à data de início")
      setLoading(false)
      return
    }

    try {
      const dataToSubmit = {
        ...formData,
        valor: parseFloat(formData.valor),
        diaPagamento: parseInt(formData.diaPagamento),
        // Garantir que obraId seja incluído corretamente
        obraId: formData.obraId || obraId || null,
      }

      console.log('Dados para envio:', dataToSubmit)

      // Chamar onSubmit passado como prop
      await onSubmit(dataToSubmit)
      
      // Resetar formulário após sucesso
      if (!initialData) {
        setFormData({
          nome: "",
          funcao: "",
          tipoContratacao: "",
          valor: "",
          inicioContrato: "",
          fimContrato: "",
          diaPagamento: "",
          statusPagamento: "pendente",
          obraId: obraId || "",
          observacoes: "",
        })
      }
    } catch (error) {
      console.error("Erro ao salvar mão de obra:", error)
      setError("Erro ao salvar mão de obra. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    // Resetar formulário
    setFormData({
      nome: "",
      funcao: "",
      tipoContratacao: "",
      valor: "",
      inicioContrato: "",
      fimContrato: "",
      diaPagamento: "",
      statusPagamento: "pendente",
      obraId: obraId || "",
      observacoes: "",
    })
    setError("")

    // Chamar callback de cancelamento se fornecido
    if (onCancel) {
      onCancel()
    }
  }

  return (
    <>
      {error && (
        <Alert variant="danger" className="mb-3">
          {error}
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Nome do Funcionário *</Form.Label>
              <Form.Control
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                placeholder="Nome completo"
                required
                disabled={loading}
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Função *</Form.Label>
              <Form.Control
                type="text"
                name="funcao"
                value={formData.funcao}
                onChange={handleChange}
                placeholder="Ex: Pedreiro, Eletricista, Encanador"
                required
                disabled={loading}
              />
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Tipo de Contratação *</Form.Label>
              <Form.Select 
                name="tipoContratacao" 
                value={formData.tipoContratacao} 
                onChange={handleChange} 
                required
                disabled={loading}
              >
                <option value="">Selecione...</option>
                <option value="clt">CLT</option>
                <option value="pj">PJ</option>
                <option value="diaria">Diária</option>
                <option value="empreitada">Empreitada</option>
                <option value="temporario">Temporário</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Valor *</Form.Label>
              <Form.Control
                type="number"
                name="valor"
                value={formData.valor}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                required
                disabled={loading}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Status do Pagamento *</Form.Label>
              <Form.Select 
                name="statusPagamento" 
                value={formData.statusPagamento} 
                onChange={handleChange} 
                required
                disabled={loading}
              >
                <option value="pendente">Pendente</option>
                <option value="efetuado">Efetuado</option>
                <option value="em_processamento">Em Processamento</option>
                <option value="cancelado">Cancelado</option>
                <option value="atrasado">Atrasado</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Início do Contrato *</Form.Label>
              <Form.Control
                type="date"
                name="inicioContrato"
                value={formData.inicioContrato}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Fim do Contrato *</Form.Label>
              <Form.Control
                type="date"
                name="fimContrato"
                value={formData.fimContrato}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Dia do Pagamento *</Form.Label>
              <Form.Control
                type="number"
                name="diaPagamento"
                value={formData.diaPagamento}
                onChange={handleChange}
                placeholder="1-31"
                min="1"
                max="31"
                required
                disabled={loading}
              />
            </Form.Group>
          </Col>
        </Row>

        <Form.Group className="mb-3">
          <Form.Label>Obra</Form.Label>
          <Form.Select 
            name="obraId" 
            value={formData.obraId} 
            onChange={handleChange}
            disabled={loading}
          >
            <option value="">Selecione uma obra (opcional)</option>
            {obras.map((obra) => (
              <option key={obra._id} value={obra._id}>
                {obra.nome}
              </option>
            ))}
          </Form.Select>
          {obraId && (
            <Form.Text className="text-muted">
              Obra pré-selecionada do dashboard atual
            </Form.Text>
          )}
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Observações</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            name="observacoes"
            value={formData.observacoes}
            onChange={handleChange}
            placeholder="Observações sobre o contrato"
            disabled={loading}
          />
        </Form.Group>

        <div className="d-flex gap-2 mt-4">
          <Button 
            type="submit" 
            variant="primary" 
            disabled={loading} 
            className="d-flex align-items-center"
          >
            <Save size={16} className="me-2" />
            {loading ? "Salvando..." : initialData ? "Atualizar" : "Adicionar Mão de Obra"}
          </Button>

          <Button
            type="button"
            variant="outline-secondary"
            onClick={handleCancel}
            disabled={loading}
            className="d-flex align-items-center"
          >
            <X size={16} className="me-2" />
            Cancelar
          </Button>
        </div>
      </Form>
    </>
  )
}

export default MaoObraForm
