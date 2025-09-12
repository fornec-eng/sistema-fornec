"use client"

import { useState, useEffect } from "react"
import { Modal, Form, Button, Table, Badge, Alert, Row, Col, Card } from "react-bootstrap"
import { Plus, Edit, Trash2, DollarSign } from "lucide-react"
import apiService from "../../services/apiService"

function MaterialPagamentos({ materialId, show, onHide, onUpdate }) {
  const [pagamentos, setPagamentos] = useState([])
  const [material, setMaterial] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showPagamentoModal, setShowPagamentoModal] = useState(false)
  const [editingPagamento, setEditingPagamento] = useState(null)
  const [alert, setAlert] = useState({ show: false, message: "", variant: "" })

  const [formData, setFormData] = useState({
    valor: "",
    tipoPagamento: "pix",
    dataPagamento: "",
    statusPagamento: "pendente",
    observacoes: "",
  })

  useEffect(() => {
    if (show && materialId) {
      console.log("[v0] MaterialPagamentos - materialId recebido:", materialId)
      fetchMaterial()
      fetchPagamentos()
    }
  }, [show, materialId])

  const fetchMaterial = async () => {
    try {
      console.log("[v0] Buscando material com ID:", materialId)
      const response = await apiService.materiais.getById(materialId)
      console.log("[v0] Resposta do material:", response)
      if (!response.error) {
        setMaterial(response.material)
      } else {
        console.log("[v0] Erro na resposta do material:", response)
        showAlert("Material não encontrado", "danger")
      }
    } catch (error) {
      console.error("[v0] Erro ao buscar material:", error)
      showAlert("Erro ao carregar dados do material", "danger")
    }
  }

  const fetchPagamentos = async () => {
    setLoading(true)
    try {
      console.log("[v0] Buscando pagamentos para material ID:", materialId)
      const response = await apiService.materiais.listarPagamentos(materialId)
      console.log("[v0] Resposta dos pagamentos:", response)
      if (!response.error) {
        setPagamentos(response.pagamentos || [])
      } else {
        console.log("[v0] Erro na resposta dos pagamentos:", response)
        showAlert("Erro ao carregar pagamentos", "danger")
      }
    } catch (error) {
      console.error("[v0] Erro ao buscar pagamentos:", error)
      showAlert("Erro ao carregar pagamentos", "danger")
    } finally {
      setLoading(false)
    }
  }

  const showAlert = (message, variant) => {
    setAlert({ show: true, message, variant })
    setTimeout(() => setAlert({ show: false, message: "", variant: "" }), 5000)
  }

  const handleOpenPagamentoModal = (pagamento = null) => {
    if (pagamento) {
      setEditingPagamento(pagamento)
      setFormData({
        valor: pagamento.valor || "",
        tipoPagamento: pagamento.tipoPagamento || "pix",
        dataPagamento: pagamento.dataPagamento ? new Date(pagamento.dataPagamento).toISOString().split("T")[0] : "",
        statusPagamento: pagamento.statusPagamento || "pendente",
        observacoes: pagamento.observacoes || "",
      })
    } else {
      setEditingPagamento(null)
      setFormData({
        valor: "",
        tipoPagamento: "pix",
        dataPagamento: "",
        statusPagamento: "pendente",
        observacoes: "",
      })
    }
    setShowPagamentoModal(true)
  }

  const handleClosePagamentoModal = () => {
    setShowPagamentoModal(false)
    setEditingPagamento(null)
    setFormData({
      valor: "",
      tipoPagamento: "pix",
      dataPagamento: "",
      statusPagamento: "pendente",
      observacoes: "",
    })
  }

  const handleSubmitPagamento = async (e) => {
    e.preventDefault()

    if (!formData.valor || Number.parseFloat(formData.valor) <= 0) {
      showAlert("Valor deve ser maior que zero", "warning")
      return
    }

    if (!formData.dataPagamento) {
      showAlert("Data de pagamento é obrigatória", "warning")
      return
    }

    try {
      const payload = {
        ...formData,
        valor: Number.parseFloat(formData.valor),
      }

      if (editingPagamento) {
        await apiService.materiais.atualizarPagamento(materialId, editingPagamento._id, payload)
        showAlert("Pagamento atualizado com sucesso!", "success")
      } else {
        await apiService.materiais.adicionarPagamento(materialId, payload)
        showAlert("Pagamento adicionado com sucesso!", "success")
      }

      handleClosePagamentoModal()
      fetchPagamentos()
      fetchMaterial()
      if (onUpdate) onUpdate()
    } catch (error) {
      console.error("Erro ao salvar pagamento:", error)
      showAlert("Erro ao salvar pagamento", "danger")
    }
  }

  const handleDeletePagamento = async (pagamentoId) => {
    if (window.confirm("Tem certeza que deseja excluir este pagamento?")) {
      try {
        await apiService.materiais.removerPagamento(materialId, pagamentoId)
        showAlert("Pagamento removido com sucesso!", "success")
        fetchPagamentos()
        fetchMaterial()
        if (onUpdate) onUpdate()
      } catch (error) {
        console.error("Erro ao remover pagamento:", error)
        showAlert("Erro ao remover pagamento", "danger")
      }
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pendente: { variant: "warning", label: "Pendente" },
      efetuado: { variant: "success", label: "Efetuado" },
      em_processamento: { variant: "info", label: "Em Processamento" },
      cancelado: { variant: "danger", label: "Cancelado" },
      atrasado: { variant: "danger", label: "Atrasado" },
    }
    return statusConfig[status] || statusConfig.pendente
  }

  const formatCurrency = (value) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0)

  const formatDate = (date) => {
    if (!date) return ""

    const dateObj = new Date(date)

    if (isNaN(dateObj.getTime())) return ""

    const day = String(dateObj.getUTCDate()).padStart(2, "0")
    const month = String(dateObj.getUTCMonth() + 1).padStart(2, "0")
    const year = dateObj.getUTCFullYear()

    return `${day}/${month}/${year}`
  }

  return (
    <>
      <Modal show={show} onHide={onHide} size="xl" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            <DollarSign size={24} className="me-2" />
            Gerenciar Pagamentos - {material?.numeroNota || "Material"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {alert.show && (
            <Alert variant={alert.variant} dismissible onClose={() => setAlert({ show: false })}>
              {alert.message}
            </Alert>
          )}

          {/* Resumo do Material */}
          {material && (
            <Card className="mb-4">
              <Card.Body>
                <Row>
                  <Col md={3}>
                    <strong>Valor Total:</strong>
                    <p className="h5 text-primary">{formatCurrency(material.valor)}</p>
                  </Col>
                  <Col md={3}>
                    <strong>Total de Pagamentos:</strong>
                    <p className="h5 text-success">{formatCurrency(material.valorTotalPagamentos)}</p>
                  </Col>
                  <Col md={3}>
                    <strong>Saldo:</strong>
                    <p
                      className={`h5 ${(material.valor - material.valorTotalPagamentos) >= 0 ? "text-info" : "text-danger"}`}
                    >
                      {formatCurrency(material.valor - material.valorTotalPagamentos)}
                    </p>
                  </Col>
                  <Col md={3}>
                    <strong>Status Geral:</strong>
                    <p>
                      <Badge bg={getStatusBadge(material.statusGeralPagamentos).variant}>
                        {getStatusBadge(material.statusGeralPagamentos).label}
                      </Badge>
                    </p>
                  </Col>
                </Row>
                <Row className="mt-2">
                  <Col md={6}>
                    <small>
                      <strong>Local de Compra:</strong> {material.localCompra}
                    </small>
                  </Col>
                  <Col md={6}>
                    <small>
                      <strong>Solicitante:</strong> {material.solicitante}
                    </small>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}

          {/* Botão para adicionar pagamento */}
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Pagamentos Registrados</h5>
            <Button variant="primary" onClick={() => handleOpenPagamentoModal()}>
              <Plus size={16} className="me-2" />
              Adicionar Pagamento
            </Button>
          </div>

          {/* Tabela de pagamentos */}
          {loading ? (
            <div className="text-center p-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Carregando...</span>
              </div>
            </div>
          ) : pagamentos.length === 0 ? (
            <div className="text-center p-4 text-muted">
              <p>Nenhum pagamento registrado para este material.</p>
            </div>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Valor</th>
                  <th>Tipo</th>
                  <th>Status</th>
                  <th>Observações</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {pagamentos.map((pagamento) => {
                  const statusBadge = getStatusBadge(pagamento.statusPagamento)
                  return (
                    <tr key={pagamento._id}>
                      <td>{formatDate(pagamento.dataPagamento)}</td>
                      <td>{formatCurrency(pagamento.valor)}</td>
                      <td>
                        <Badge bg="secondary">{pagamento.tipoPagamento}</Badge>
                      </td>
                      <td>
                        <Badge bg={statusBadge.variant}>{statusBadge.label}</Badge>
                      </td>
                      <td>{pagamento.observacoes || "-"}</td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => handleOpenPagamentoModal(pagamento)}
                        >
                          <Edit size={14} />
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => handleDeletePagamento(pagamento._id)}>
                          <Trash2 size={14} />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para adicionar/editar pagamento */}
      <Modal show={showPagamentoModal} onHide={handleClosePagamentoModal} centered>
        <Modal.Header closeButton>
          <Modal.Title>{editingPagamento ? "Editar Pagamento" : "Adicionar Pagamento"}</Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmitPagamento}>
          <Modal.Body>
            <Form.Group className="mb-3">
              <Form.Label>Valor *</Form.Label>
              <Form.Control
                type="number"
                value={formData.valor}
                onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tipo de Pagamento *</Form.Label>
                  <Form.Select
                    value={formData.tipoPagamento}
                    onChange={(e) => setFormData({ ...formData, tipoPagamento: e.target.value })}
                    required
                  >
                    <option value="avista">À Vista</option>
                    <option value="parcelado">Parcelado</option>
                    <option value="mensal">Mensal</option>
                    <option value="por_etapa">Por Etapa</option>
                    <option value="pix">PIX</option>
                    <option value="transferencia">Transferência</option>
                    <option value="cartao">Cartão</option>
                    <option value="boleto">Boleto</option>
                    <option value="cheque">Cheque</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Data do Pagamento *</Form.Label>
                  <Form.Control
                    type="date"
                    value={formData.dataPagamento}
                    onChange={(e) => setFormData({ ...formData, dataPagamento: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Status do Pagamento *</Form.Label>
              <Form.Select
                value={formData.statusPagamento}
                onChange={(e) => setFormData({ ...formData, statusPagamento: e.target.value })}
                required
              >
                <option value="pendente">Pendente</option>
                <option value="efetuado">Efetuado</option>
                <option value="em_processamento">Em Processamento</option>
                <option value="cancelado">Cancelado</option>
                <option value="atrasado">Atrasado</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Observações</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
                placeholder="Observações sobre o pagamento"
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleClosePagamentoModal}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              {editingPagamento ? "Atualizar" : "Adicionar"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </>
  )
}

export default MaterialPagamentos
