"use client"

import { useState, useEffect } from "react"
import { Form, Button, Alert, Row, Col } from "react-bootstrap"
import { Save, X } from "lucide-react"
import apiService from "../../services/apiService"

function EntradaForm({ onSubmit, onCancel, initialData = null, obraId = null }) {
  const [formData, setFormData] = useState({
    nome: "",
    data: "",
    valor: "",
    statusRecebimento: "recebido",
    observacoes: "",
    obraId: obraId || "",
  })

  const [obras, setObras] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchObras()
    if (initialData) {
      setFormData({
        ...initialData,
        data: initialData.data ? new Date(initialData.data).toISOString().split("T")[0] : "",
        obraId: initialData.obraId || obraId || "",
      })
    } else if (obraId) {
      setFormData((prev) => ({
        ...prev,
        obraId: obraId,
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

    if (!formData.nome.trim()) {
      setError("Nome da entrada é obrigatório")
      setLoading(false)
      return
    }

    if (!formData.data) {
      setError("Data é obrigatória")
      setLoading(false)
      return
    }

    if (!formData.valor || Number.parseFloat(formData.valor) <= 0) {
      setError("Valor deve ser maior que zero")
      setLoading(false)
      return
    }

    try {
      const dataToSubmit = {
        ...formData,
        valor: Number.parseFloat(formData.valor),
      }

      await onSubmit(dataToSubmit)
    } catch (error) {
      console.error("Erro ao salvar entrada:", error)
      setError("Erro ao salvar entrada. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      nome: "",
      data: "",
      valor: "",
      statusRecebimento: "recebido",
      observacoes: "",
      obraId: obraId || "",
    })
    setError("")

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
              <Form.Label>Nome da Entrada *</Form.Label>
              <Form.Control
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                placeholder="Ex: Pagamento Cliente ABC"
                required
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Data *</Form.Label>
              <Form.Control type="date" name="data" value={formData.data} onChange={handleChange} required />
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
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
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Status do Recebimento *</Form.Label>
              <Form.Select name="statusRecebimento" value={formData.statusRecebimento} onChange={handleChange} required>
                <option value="recebido">Recebido</option>
                <option value="pendente">Pendente</option>
                <option value="em_processamento">Em Processamento</option>
                <option value="cancelado">Cancelado</option>
                <option value="atrasado">Atrasado</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        <Form.Group className="mb-3">
          <Form.Label>Obra</Form.Label>
          <Form.Select name="obraId" value={formData.obraId} onChange={handleChange}>
            <option value="">Entrada geral da empresa (sem obra específica)</option>
            {obras.map((obra) => (
              <option key={obra._id} value={obra._id}>
                {obra.nome}
              </option>
            ))}
          </Form.Select>
          {obraId && <Form.Text className="text-muted">Obra pré-selecionada do dashboard atual</Form.Text>}
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Observações</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            name="observacoes"
            value={formData.observacoes}
            onChange={handleChange}
            placeholder="Observações sobre a entrada (cliente, forma de pagamento, etc.)"
          />
        </Form.Group>

        <div className="d-flex gap-2 mt-4">
          <Button type="submit" variant="success" disabled={loading} className="d-flex align-items-center">
            <Save size={16} className="me-2" />
            {loading ? "Salvando..." : initialData ? "Atualizar" : "Adicionar Entrada"}
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

export default EntradaForm
