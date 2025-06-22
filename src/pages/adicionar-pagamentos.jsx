"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Button, Modal, Alert, Form } from "react-bootstrap"
import { Plus, ArrowLeft, Package, Users, Calendar, DollarSign } from "lucide-react"
import { useNavigate } from "react-router-dom"
import ApiBase from "../services/ApiBase"

import MaterialForm from "../components/forms/MaterialForm"
import MaoObraForm from "../components/forms/MaoObraForm"
import CronogramaForm from "../components/forms/CronogramaForm"
import PagamentoSemanalForm from "../components/forms/PagamentoSemanal"

const AdicionarPagamentos = () => {
  const navigate = useNavigate()
  const [obras, setObras] = useState([])
  const [obraSelecionada, setObraSelecionada] = useState("")
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState("")
  const [alert, setAlert] = useState({ show: false, message: "", variant: "" })

  const showAlert = (message, variant = "success") => {
    setAlert({ show: true, message, variant })
    setTimeout(() => setAlert({ show: false, message: "", variant: "" }), 5000)
  }

  // Buscar obras da API
  useEffect(() => {
    const fetchObras = async () => {
      try {
        const response = await ApiBase.get("/pagamentos")
        const obrasAPI = response.data.pagamentos || []

        const obrasFormatadas = obrasAPI.map((obra) => ({
          id: obra._id,
          name: obra.obra.nome,
          orcamento: obra.obra.orcamento,
          valorGasto: obra.valorTotalGasto,
        }))

        setObras(obrasFormatadas)
      } catch (error) {
        console.error("Erro ao buscar obras:", error)
        showAlert("Erro ao carregar obras", "danger")
      } finally {
        setLoading(false)
      }
    }

    fetchObras()
  }, [])

  const handleOpenModal = (type) => {
    if (!obraSelecionada) {
      showAlert("Selecione uma obra primeiro!", "warning")
      return
    }
    setModalType(type)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setModalType("")
  }

  const handleItemAdded = () => {
    showAlert("Item adicionado com sucesso!", "success")
    handleCloseModal()
    // Aqui você pode atualizar os dados se necessário
  }

  const getModalTitle = () => {
    switch (modalType) {
      case "material":
        return "Adicionar Material/Equipamento"
      case "maoobra":
        return "Adicionar Mão de Obra"
      case "cronograma":
        return "Adicionar Etapa do Cronograma"
      case "pagamento-semanal":
        return "Adicionar Pagamento Semanal"
      default:
        return "Adicionar Item"
    }
  }

  const getModalIcon = () => {
    switch (modalType) {
      case "material":
        return <Package size={24} />
      case "maoobra":
        return <Users size={24} />
      case "cronograma":
        return <Calendar size={24} />
      case "pagamento-semanal":
        return <DollarSign size={24} />
      default:
        return <Plus size={24} />
    }
  }

  const renderModalContent = () => {
    switch (modalType) {
      case "material":
        return <MaterialForm obraSelecionada={obraSelecionada} onItemAdded={handleItemAdded} />
      case "maoobra":
        return <MaoObraForm obraSelecionada={obraSelecionada} onItemAdded={handleItemAdded} />
      case "cronograma":
        return <CronogramaForm obraSelecionada={obraSelecionada} onItemAdded={handleItemAdded} />
      case "pagamento-semanal":
        return <PagamentoSemanalForm obraSelecionada={obraSelecionada} onItemAdded={handleItemAdded} />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "300px" }}>
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Carregando...</span>
          </div>
        </div>
      </Container>
    )
  }

  return (
    <Container fluid className="mt-4 mb-5">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center">
              <Button variant="outline-secondary" className="me-3" onClick={() => navigate("/financeiro")}>
                <ArrowLeft size={16} className="me-2" />
                Voltar
              </Button>
              <h1 className="mb-0">Adicionar Pagamentos</h1>
            </div>
          </div>
        </Col>
      </Row>

      {/* Alert */}
      {alert.show && (
        <Row className="mb-3">
          <Col>
            <Alert
              variant={alert.variant}
              dismissible
              onClose={() => setAlert({ show: false, message: "", variant: "" })}
            >
              {alert.message}
            </Alert>
          </Col>
        </Row>
      )}

      {/* Seletor de Obra */}
      <Row className="mb-4">
        <Col md={6}>
          <Card style={{ borderRadius: "10px", boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}>
            <Card.Body>
              <Card.Title className="mb-3">Selecionar Obra</Card.Title>
              <Form.Group>
                <Form.Label>Obra *</Form.Label>
                <Form.Select value={obraSelecionada} onChange={(e) => setObraSelecionada(e.target.value)} size="lg">
                  <option value="">Selecione uma obra...</option>
                  {obras.map((obra) => (
                    <option key={obra.id} value={obra.id}>
                      {obra.name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              {obraSelecionada && (
                <div className="mt-3 p-3 bg-light rounded">
                  <small className="text-muted">Obra selecionada:</small>
                  <div className="fw-bold">{obras.find((o) => o.id === obraSelecionada)?.name}</div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Cards de Tipos de Pagamento */}
      <Row className="mb-4">
        <Col>
          <h3 className="mb-3">Tipos de Pagamento</h3>
        </Col>
      </Row>

      <Row className="g-4">
        {/* Material/Equipamento */}
        <Col md={6} lg={3}>
          <Card
            className="h-100 shadow-sm border-0"
            style={{
              cursor: "pointer",
              transition: "all 0.3s ease",
              borderLeft: "4px solid #dc3545",
            }}
            onClick={() => handleOpenModal("material")}
          >
            <Card.Body className="text-center p-4">
              <div className="mb-3">
                <Package size={48} className="text-danger" />
              </div>
              <Card.Title className="h5 mb-2">Material/Equipamento</Card.Title>
              <Card.Text className="text-muted small">
                Adicionar gastos com materiais, ferramentas e equipamentos
              </Card.Text>
              <Button variant="outline-danger" size="sm" className="mt-2">
                <Plus size={16} className="me-1" />
                Adicionar
              </Button>
            </Card.Body>
          </Card>
        </Col>

        {/* Mão de Obra */}
        <Col md={6} lg={3}>
          <Card
            className="h-100 shadow-sm border-0"
            style={{
              cursor: "pointer",
              transition: "all 0.3s ease",
              borderLeft: "4px solid #198754",
            }}
            onClick={() => handleOpenModal("maoobra")}
          >
            <Card.Body className="text-center p-4">
              <div className="mb-3">
                <Users size={48} className="text-success" />
              </div>
              <Card.Title className="h5 mb-2">Mão de Obra</Card.Title>
              <Card.Text className="text-muted small">Registrar contratos e pagamentos de funcionários</Card.Text>
              <Button variant="outline-success" size="sm" className="mt-2">
                <Plus size={16} className="me-1" />
                Adicionar
              </Button>
            </Card.Body>
          </Card>
        </Col>

        {/* Cronograma */}
        <Col md={6} lg={3}>
          <Card
            className="h-100 shadow-sm border-0"
            style={{
              cursor: "pointer",
              transition: "all 0.3s ease",
              borderLeft: "4px solid #0d6efd",
            }}
            onClick={() => handleOpenModal("cronograma")}
          >
            <Card.Body className="text-center p-4">
              <div className="mb-3">
                <Calendar size={48} className="text-primary" />
              </div>
              <Card.Title className="h5 mb-2">Cronograma</Card.Title>
              <Card.Text className="text-muted small">Adicionar etapas e marcos do projeto</Card.Text>
              <Button variant="outline-primary" size="sm" className="mt-2">
                <Plus size={16} className="me-1" />
                Adicionar
              </Button>
            </Card.Body>
          </Card>
        </Col>

        {/* Pagamento Semanal */}
        <Col md={6} lg={3}>
          <Card
            className="h-100 shadow-sm border-0"
            style={{
              cursor: "pointer",
              transition: "all 0.3s ease",
              borderLeft: "4px solid #ffc107",
            }}
            onClick={() => handleOpenModal("pagamento-semanal")}
          >
            <Card.Body className="text-center p-4">
              <div className="mb-3">
                <DollarSign size={48} className="text-warning" />
              </div>
              <Card.Title className="h5 mb-2">Pagamento Semanal</Card.Title>
              <Card.Text className="text-muted small">Registrar pagamentos semanais de funcionários</Card.Text>
              <Button variant="outline-warning" size="sm" className="mt-2">
                <Plus size={16} className="me-1" />
                Adicionar
              </Button>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Resumo da Obra Selecionada */}
      {obraSelecionada && (
        <Row className="mt-5">
          <Col>
            <Card style={{ borderRadius: "10px", boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}>
              <Card.Body>
                <Card.Title className="mb-3">Resumo da Obra</Card.Title>
                <Row>
                  <Col md={4}>
                    <div className="text-center p-3 bg-light rounded">
                      <h5 className="text-primary mb-1">Orçamento Total</h5>
                      <h4 className="mb-0">
                        {obras
                          .find((o) => o.id === obraSelecionada)
                          ?.orcamento?.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }) || "R$ 0,00"}
                      </h4>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="text-center p-3 bg-light rounded">
                      <h5 className="text-danger mb-1">Valor Gasto</h5>
                      <h4 className="mb-0">
                        {obras
                          .find((o) => o.id === obraSelecionada)
                          ?.valorGasto?.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          }) || "R$ 0,00"}
                      </h4>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="text-center p-3 bg-light rounded">
                      <h5 className="text-success mb-1">Saldo Restante</h5>
                      <h4 className="mb-0">
                        {(() => {
                          const obra = obras.find((o) => o.id === obraSelecionada)
                          const restante = (obra?.orcamento || 0) - (obra?.valorGasto || 0)
                          return restante.toLocaleString("pt-BR", {
                            style: "currency",
                            currency: "BRL",
                          })
                        })()}
                      </h4>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Modal para Formulários */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center">
            {getModalIcon()}
            <span className="ms-2">{getModalTitle()}</span>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>{renderModalContent()}</Modal.Body>
      </Modal>
    </Container>
  )
}

export default AdicionarPagamentos
