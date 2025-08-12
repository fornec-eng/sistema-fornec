"use client"

import { useState, useEffect } from "react"
import { Form, Button, Alert, Row, Col, Modal } from "react-bootstrap"
import { Save, X } from "lucide-react"
import apiService from "../../services/apiService"

function ContratoForm({ onSubmit, onCancel, initialData = null, obraId = null, show, onHide }) {
  const [formData, setFormData] = useState({
    loja: "", // Substituindo 'nome' por 'loja'
    valorInicial: "", // Novo campo
    inicioContrato: "",
    status: "ativo", // Removido statusPagamento, usando apenas status
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
        obraId: initialData.obraId || obraId || "", // Usar obraId do initialData ou prop
      })
    } else if (obraId) {
      // Se não tem initialData mas tem obraId, pré-carregar a obra
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

    // Validações básicas - loja é obrigatório
    if (!formData.loja || formData.loja.trim().length < 3) {
      setError("Loja deve ter pelo menos 3 caracteres")
      setLoading(false)
      return
    }

    // Valor inicial é opcional mas deve ser >= 0
    if (formData.valorInicial !== "" && Number.parseFloat(formData.valorInicial) < 0) {
      setError("Valor inicial deve ser maior ou igual a zero")
      setLoading(false)
      return
    }

    try {
      const dataToSubmit = {
        ...formData,
        valorInicial: formData.valorInicial ? Number.parseFloat(formData.valorInicial) : 0,
        valor: formData.valorInicial ? Number.parseFloat(formData.valorInicial) : 0, // Mantendo compatibilidade
      }

      // Apenas chama o onSubmit passado como prop
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
      loja: "",
      valorInicial: "",
      inicioContrato: "",
      status: "ativo",
      observacoes: "",
      obraId: obraId || "", // Manter obraId se foi passado como prop
    })
    setError("")

    // Chamar callback de cancelamento se fornecido
    if (onCancel) {
      onCancel()
    }
    if (onHide) {
      onHide()
    }
  }

  const renderForm = () => (
    <>
      {error && (
        <Alert variant="danger" className="mb-3">
          {error}
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <Row>
          <Col md={12}>
            <Form.Group className="mb-3">
              <Form.Label>Loja *</Form.Label>
              <Form.Control
                type="text"
                name="loja"
                value={formData.loja}
                onChange={handleChange}
                placeholder="Nome da loja/fornecedor"
                required
              />
              <Form.Text className="text-muted">
                Mínimo 3 caracteres
              </Form.Text>
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Valor Inicial</Form.Label>
              <Form.Control
                type="number"
                name="valorInicial"
                value={formData.valorInicial}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
              />
              <Form.Text className="text-muted">
                Opcional - valor inicial do contrato
              </Form.Text>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Data de Início do Contrato</Form.Label>
              <Form.Control
                type="date"
                name="inicioContrato"
                value={formData.inicioContrato}
                onChange={handleChange}
              />
              <Form.Text className="text-muted">
                Opcional - pode ser definido depois
              </Form.Text>
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Status</Form.Label>
              <Form.Select name="status" value={formData.status} onChange={handleChange}>
                <option value="ativo">Ativo</option>
                <option value="concluido">Concluído</option>
                <option value="cancelado">Cancelado</option>
                <option value="suspenso">Suspenso</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Obra</Form.Label>
              <Form.Select name="obraId" value={formData.obraId} onChange={handleChange}>
                <option value="">Gastos gerais da Fornec</option>
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
          </Col>
        </Row>

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

  // Se show é fornecido, renderizar como Modal
  if (show !== undefined) {
    return (
      <Modal show={show} onHide={onHide} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {initialData ? "Editar Contrato" : "Novo Contrato"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {renderForm()}
        </Modal.Body>
      </Modal>
    )
  }

  // Caso contrário, renderizar apenas o formulário
  return renderForm()
}

export default ContratoForm