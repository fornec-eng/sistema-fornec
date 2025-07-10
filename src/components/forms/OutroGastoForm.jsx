"use client"

import { useState, useEffect } from "react"
import { Form, Button, Alert, Row, Col } from "react-bootstrap"
import { Save, X } from "lucide-react"
import apiService from "../../services/apiService"

function OutroGastoForm({ onSubmit, onCancel, initialData = null }) {
  const [formData, setFormData] = useState({
    descricao: "",
    valor: "",
    data: "",
    categoriaLivre: "",
    formaPagamento: "pix",
    statusPagamento: "pendente",
    numeroDocumento: "",
    fornecedor: "",
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
        data: initialData.data ? new Date(initialData.data).toISOString().split("T")[0] : "",
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
    if (!formData.descricao.trim()) {
      setError("Descrição é obrigatória")
      setLoading(false)
      return
    }

    if (!formData.valor || Number.parseFloat(formData.valor) <= 0) {
      setError("Valor deve ser maior que zero")
      setLoading(false)
      return
    }

    if (!formData.data) {
      setError("Data é obrigatória")
      setLoading(false)
      return
    }

    if (!formData.categoriaLivre.trim()) {
      setError("Categoria é obrigatória")
      setLoading(false)
      return
    }

    try {
      const dataToSubmit = {
        ...formData,
        valor: Number.parseFloat(formData.valor),
      }

      // Apenas chama o onSubmit passado como prop, não salva diretamente
      await onSubmit(dataToSubmit)
    } catch (error) {
      console.error("Erro ao salvar gasto:", error)
      setError("Erro ao salvar gasto. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    // Resetar formulário
    setFormData({
      descricao: "",
      valor: "",
      data: "",
      categoriaLivre: "",
      formaPagamento: "pix",
      statusPagamento: "pendente",
      numeroDocumento: "",
      fornecedor: "",
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
        <Form.Group className="mb-3">
          <Form.Label>Descrição *</Form.Label>
          <Form.Control
            type="text"
            name="descricao"
            value={formData.descricao}
            onChange={handleChange}
            placeholder="Ex: Taxa de licenciamento, Alimentação da equipe"
            required
          />
        </Form.Group>

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
              <Form.Label>Data *</Form.Label>
              <Form.Control type="date" name="data" value={formData.data} onChange={handleChange} required />
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Categoria *</Form.Label>
              <Form.Control
                type="text"
                name="categoriaLivre"
                value={formData.categoriaLivre}
                onChange={handleChange}
                placeholder="Ex: Alimentação, Transporte, Taxas"
                required
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Forma de Pagamento *</Form.Label>
              <Form.Select name="formaPagamento" value={formData.formaPagamento} onChange={handleChange} required>
                <option value="pix">PIX</option>
                <option value="transferencia">Transferência</option>
                <option value="avista">À Vista</option>
                <option value="cartao">Cartão</option>
                <option value="boleto">Boleto</option>
                <option value="cheque">Cheque</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="outro">Outro</option>
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

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Número do Documento</Form.Label>
              <Form.Control
                type="text"
                name="numeroDocumento"
                value={formData.numeroDocumento}
                onChange={handleChange}
                placeholder="Número da nota, recibo, etc."
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Fornecedor</Form.Label>
              <Form.Control
                type="text"
                name="fornecedor"
                value={formData.fornecedor}
                onChange={handleChange}
                placeholder="Nome do fornecedor"
              />
            </Form.Group>
          </Col>
        </Row>

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
            placeholder="Observações adicionais sobre o gasto"
          />
        </Form.Group>

        <div className="d-flex gap-2 mt-4">
          <Button type="submit" variant="primary" disabled={loading} className="d-flex align-items-center">
            <Save size={16} className="me-2" />
            {loading ? "Salvando..." : initialData ? "Atualizar" : "Adicionar Gasto"}
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

export default OutroGastoForm
