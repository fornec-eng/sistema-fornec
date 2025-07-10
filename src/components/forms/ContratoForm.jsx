"use client"

import { useState, useEffect } from "react"
import { Form, Button, Alert, Row, Col } from "react-bootstrap"
import { Save, X } from "lucide-react"
import apiService from "../../services/apiService"

function ContratoForm({ onSubmit, onCancel, initialData = null }) {
  const [formData, setFormData] = useState({
    contratoId: "",
    nome: "",
    valor: "",
    tipoPagamento: "",
    parcelas: "",
    datasProximasParcelas: "",
    inicioContrato: "",
    statusPagamento: "pendente",
    observacoes: "",
    obraId: "",
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
        datasProximasParcelas: Array.isArray(initialData.datasProximasParcelas)
          ? initialData.datasProximasParcelas.join(", ")
          : initialData.datasProximasParcelas || "",
      })
    }
  }, [initialData])

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

    // Validações básicas
    if (!formData.contratoId.trim()) {
      setError("ID do contrato é obrigatório")
      setLoading(false)
      return
    }

    if (!formData.nome.trim()) {
      setError("Nome do contrato é obrigatório")
      setLoading(false)
      return
    }

    if (!formData.valor || Number.parseFloat(formData.valor) <= 0) {
      setError("Valor deve ser maior que zero")
      setLoading(false)
      return
    }

    if (!formData.tipoPagamento) {
      setError("Tipo de pagamento é obrigatório")
      setLoading(false)
      return
    }

    if (!formData.inicioContrato) {
      setError("Data de início do contrato é obrigatória")
      setLoading(false)
      return
    }

    // Validações específicas para pagamento parcelado
    if (formData.tipoPagamento === "parcelado") {
      if (!formData.parcelas || Number.parseInt(formData.parcelas) <= 0) {
        setError("Número de parcelas é obrigatório para pagamento parcelado")
        setLoading(false)
        return
      }
      if (!formData.datasProximasParcelas) {
        setError("Datas das parcelas são obrigatórias para pagamento parcelado")
        setLoading(false)
        return
      }
    }

    try {
      const dataToSubmit = {
        ...formData,
        valor: Number.parseFloat(formData.valor),
        parcelas: formData.parcelas ? Number.parseInt(formData.parcelas) : null,
        datasProximasParcelas: formData.datasProximasParcelas
          ? formData.datasProximasParcelas.split(",").map((date) => date.trim())
          : [],
      }

      // Apenas chama o onSubmit passado como prop, não salva diretamente
      await onSubmit(dataToSubmit)
    } catch (error) {
      console.error("Erro ao salvar contrato:", error)
      setError("Erro ao salvar contrato. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    // Resetar formulário
    setFormData({
      contratoId: "",
      nome: "",
      valor: "",
      tipoPagamento: "",
      parcelas: "",
      datasProximasParcelas: "",
      inicioContrato: "",
      statusPagamento: "pendente",
      observacoes: "",
      obraId: "",
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
              <Form.Label>ID do Contrato *</Form.Label>
              <Form.Control
                type="text"
                name="contratoId"
                value={formData.contratoId}
                onChange={handleChange}
                placeholder="Ex: CONT-2024-001"
                required
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Nome do Contrato *</Form.Label>
              <Form.Control
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                placeholder="Nome do contrato"
                required
              />
            </Form.Group>
          </Col>
        </Row>

        <Row>
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
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Tipo de Pagamento *</Form.Label>
              <Form.Select name="tipoPagamento" value={formData.tipoPagamento} onChange={handleChange} required>
                <option value="">Selecione...</option>
                <option value="avista">À Vista</option>
                <option value="parcelado">Parcelado</option>
                <option value="mensal">Mensal</option>
                <option value="por_etapa">Por Etapa</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Status do Pagamento *</Form.Label>
              <Form.Select name="statusPagamento" value={formData.statusPagamento} onChange={handleChange} required>
                <option value="pendente">Pendente</option>
                <option value="efetuado">Efetuado</option>
                <option value="em_processamento">Em Processamento</option>
                <option value="cancelado">Cancelado</option>
                <option value="atrasado">Atrasado</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        {formData.tipoPagamento === "parcelado" && (
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Número de Parcelas *</Form.Label>
                <Form.Control
                  type="number"
                  name="parcelas"
                  value={formData.parcelas}
                  onChange={handleChange}
                  placeholder="Número de parcelas"
                  min="1"
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Datas das Parcelas *</Form.Label>
                <Form.Control
                  type="text"
                  name="datasProximasParcelas"
                  value={formData.datasProximasParcelas}
                  onChange={handleChange}
                  placeholder="2024-01-15, 2024-02-15, 2024-03-15"
                  required
                />
                <Form.Text className="text-muted">Separe as datas por vírgula (formato: YYYY-MM-DD)</Form.Text>
              </Form.Group>
            </Col>
          </Row>
        )}

        <Form.Group className="mb-3">
          <Form.Label>Data de Início do Contrato *</Form.Label>
          <Form.Control
            type="date"
            name="inicioContrato"
            value={formData.inicioContrato}
            onChange={handleChange}
            required
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Obra</Form.Label>
          <Form.Select name="obraId" value={formData.obraId} onChange={handleChange}>
            <option value="">Selecione uma obra (opcional)</option>
            {obras.map((obra) => (
              <option key={obra._id} value={obra._id}>
                {obra.nome}
              </option>
            ))}
          </Form.Select>
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
          />
        </Form.Group>

        <div className="d-flex gap-2 mt-4">
          <Button type="submit" variant="primary" disabled={loading} className="d-flex align-items-center">
            <Save size={16} className="me-2" />
            {loading ? "Salvando..." : initialData ? "Atualizar" : "Adicionar Contrato"}
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

export default ContratoForm
