"use client"

import { useState, useEffect } from "react"
import { Form, Button, Alert, Row, Col } from "react-bootstrap"
import { Save, X } from "lucide-react"
import apiService from "../../services/apiService"

function EquipamentoForm({ onSubmit, onCancel, initialData = null, obraId = null }) {
  const [formData, setFormData] = useState({
    numeroNota: "",
    item: "",
    data: "",
    localCompra: "",
    valor: "",
    solicitante: "",
    descricao: "",
    tipoContratacao: "compra",
    formaPagamento: "pix",
    statusPagamento: "pendente",
    parcelas: "",
    diaPagamento: "",
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

    // Validações básicas
    if (!formData.numeroNota.trim()) {
      setError("Número da nota é obrigatório")
      setLoading(false)
      return
    }

    if (!formData.item.trim()) {
      setError("Item é obrigatório")
      setLoading(false)
      return
    }

    if (!formData.data) {
      setError("Data é obrigatória")
      setLoading(false)
      return
    }

    if (!formData.localCompra.trim()) {
      setError("Local da compra é obrigatório")
      setLoading(false)
      return
    }

    if (!formData.valor || Number.parseFloat(formData.valor) <= 0) {
      setError("Valor deve ser maior que zero")
      setLoading(false)
      return
    }

    if (!formData.solicitante.trim()) {
      setError("Solicitante é obrigatório")
      setLoading(false)
      return
    }

    if (!formData.descricao.trim()) {
      setError("Descrição é obrigatória")
      setLoading(false)
      return
    }

    if (
      !formData.diaPagamento ||
      Number.parseInt(formData.diaPagamento) < 1 ||
      Number.parseInt(formData.diaPagamento) > 31
    ) {
      setError("Dia do pagamento deve ser entre 1 e 31")
      setLoading(false)
      return
    }

    try {
      const dataToSubmit = {
        ...formData,
        valor: Number.parseFloat(formData.valor),
        parcelas: formData.parcelas ? Number.parseInt(formData.parcelas) : null,
        diaPagamento: Number.parseInt(formData.diaPagamento),
      }

      // Apenas chama o onSubmit passado como prop, não salva diretamente
      await onSubmit(dataToSubmit)
    } catch (error) {
      console.error("Erro ao salvar equipamento:", error)
      setError("Erro ao salvar equipamento. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    // Resetar formulário
    setFormData({
      numeroNota: "",
      item: "",
      data: "",
      localCompra: "",
      valor: "",
      solicitante: "",
      descricao: "",
      tipoContratacao: "compra",
      formaPagamento: "pix",
      statusPagamento: "pendente",
      parcelas: "",
      diaPagamento: "",
      observacoes: "",
      obraId: obraId || "",
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
              <Form.Label>Número da Nota *</Form.Label>
              <Form.Control
                type="text"
                name="numeroNota"
                value={formData.numeroNota}
                onChange={handleChange}
                placeholder="Ex: NF-001234"
                required
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Item *</Form.Label>
              <Form.Control
                type="text"
                name="item"
                value={formData.item}
                onChange={handleChange}
                placeholder="Ex: Betoneira 400L"
                required
              />
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Data *</Form.Label>
              <Form.Control type="date" name="data" value={formData.data} onChange={handleChange} required />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Local da Compra *</Form.Label>
              <Form.Control
                type="text"
                name="localCompra"
                value={formData.localCompra}
                onChange={handleChange}
                placeholder="Nome da loja"
                required
              />
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
              />
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Solicitante *</Form.Label>
              <Form.Control
                type="text"
                name="solicitante"
                value={formData.solicitante}
                onChange={handleChange}
                placeholder="Nome do solicitante"
                required
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Tipo de Contratação *</Form.Label>
              <Form.Select name="tipoContratacao" value={formData.tipoContratacao} onChange={handleChange} required>
                <option value="compra">Compra</option>
                <option value="aluguel">Aluguel</option>
                <option value="leasing">Leasing</option>
                <option value="comodato">Comodato</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        <Form.Group className="mb-3">
          <Form.Label>Descrição *</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            name="descricao"
            value={formData.descricao}
            onChange={handleChange}
            placeholder="Descrição detalhada do equipamento"
            required
          />
        </Form.Group>

        <Row>
          <Col md={3}>
            <Form.Group className="mb-3">
              <Form.Label>Forma de Pagamento *</Form.Label>
              <Form.Select name="formaPagamento" value={formData.formaPagamento} onChange={handleChange} required>
                <option value="pix">PIX</option>
                <option value="transferencia">Transferência</option>
                <option value="avista">À Vista</option>
                <option value="cartao">Cartão</option>
                <option value="boleto">Boleto</option>
                <option value="cheque">Cheque</option>
                <option value="outro">Outro</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={3}>
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
          <Col md={3}>
            <Form.Group className="mb-3">
              <Form.Label>Parcelas</Form.Label>
              <Form.Control
                type="number"
                name="parcelas"
                value={formData.parcelas}
                onChange={handleChange}
                placeholder="Número de parcelas"
                min="1"
              />
            </Form.Group>
          </Col>
          <Col md={3}>
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
          {obraId && <Form.Text className="text-muted">Obra pré-selecionada do dashboard atual</Form.Text>}
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
          <Button type="submit" variant="primary" disabled={loading} className="d-flex align-items-center">
            <Save size={16} className="me-2" />
            {loading ? "Salvando..." : initialData ? "Atualizar" : "Adicionar Equipamento"}
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

export default EquipamentoForm
