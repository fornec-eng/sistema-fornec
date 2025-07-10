"use client"

import { useState } from "react"
import { Form, Button, Alert, Row, Col } from "react-bootstrap"
import { Save, DeleteIcon as Cancel } from "lucide-react"

function ObraForm({ onSubmit, initialData = null, isLoading = false, onCancel }) {
  const [formData, setFormData] = useState({
    nome: initialData?.nome || "",
    endereco: initialData?.endereco || "",
    cliente: initialData?.cliente || "",
    dataInicio: initialData?.dataInicio ? new Date(initialData.dataInicio).toISOString().split("T")[0] : "",
    dataPrevisaoTermino: initialData?.dataPrevisaoTermino
      ? new Date(initialData.dataPrevisaoTermino).toISOString().split("T")[0]
      : "",
    valorContrato: initialData?.valorContrato || "",
    status: initialData?.status || "planejamento",
    descricao: initialData?.descricao || "",
    observacoes: initialData?.observacoes || "",
  })

  const [error, setError] = useState("")

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError("")

    // Validações básicas
    if (!formData.nome.trim()) {
      setError("Nome da obra é obrigatório")
      return
    }

    if (!formData.cliente.trim()) {
      setError("Cliente é obrigatório")
      return
    }

    if (!formData.valorContrato || Number.parseFloat(formData.valorContrato) <= 0) {
      setError("Valor do contrato deve ser maior que zero")
      return
    }

    try {
      const dadosObra = {
        ...formData,
        valorContrato: Number.parseFloat(formData.valorContrato),
      }

      await onSubmit(dadosObra)
    } catch (error) {
      console.error("Erro ao salvar obra:", error)
      setError("Erro ao salvar obra. Tente novamente.")
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
              <Form.Label>Nome da Obra *</Form.Label>
              <Form.Control
                type="text"
                name="nome"
                value={formData.nome}
                onChange={handleChange}
                placeholder="Digite o nome da obra"
                required
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Cliente *</Form.Label>
              <Form.Control
                type="text"
                name="cliente"
                value={formData.cliente}
                onChange={handleChange}
                placeholder="Nome do cliente"
                required
              />
            </Form.Group>
          </Col>
        </Row>

        <Form.Group className="mb-3">
          <Form.Label>Endereço</Form.Label>
          <Form.Control
            type="text"
            name="endereco"
            value={formData.endereco}
            onChange={handleChange}
            placeholder="Endereço completo da obra"
          />
        </Form.Group>

        <Row>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Data de Início</Form.Label>
              <Form.Control type="date" name="dataInicio" value={formData.dataInicio} onChange={handleChange} />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Data Prevista de Término</Form.Label>
              <Form.Control
                type="date"
                name="dataPrevisaoTermino"
                value={formData.dataPrevisaoTermino}
                onChange={handleChange}
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Valor do Contrato *</Form.Label>
              <Form.Control
                type="number"
                name="valorContrato"
                value={formData.valorContrato}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </Form.Group>
          </Col>
        </Row>

        <Form.Group className="mb-3">
          <Form.Label>Status</Form.Label>
          <Form.Select name="status" value={formData.status} onChange={handleChange}>
            <option value="planejamento">Planejamento</option>
            <option value="em_andamento">Em Andamento</option>
            <option value="pausada">Pausada</option>
            <option value="concluida">Concluída</option>
            <option value="cancelada">Cancelada</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Descrição</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            name="descricao"
            value={formData.descricao}
            onChange={handleChange}
            placeholder="Descrição detalhada da obra"
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Observações</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            name="observacoes"
            value={formData.observacoes}
            onChange={handleChange}
            placeholder="Observações adicionais"
          />
        </Form.Group>

        <div className="d-flex gap-2 mt-4">
          <Button type="submit" variant="primary" disabled={isLoading} className="d-flex align-items-center">
            <Save size={16} className="me-2" />
            {isLoading ? "Salvando..." : initialData ? "Atualizar Obra" : "Criar Obra"}
          </Button>

          {onCancel && (
            <Button
              variant="outline-secondary"
              onClick={onCancel}
              disabled={isLoading}
              className="d-flex align-items-center"
            >
              <Cancel size={16} className="me-2" />
              Cancelar
            </Button>
          )}
        </div>
      </Form>
    </>
  )
}

export default ObraForm
