"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Button, Modal, Alert, Badge } from "react-bootstrap"
import { Package, Users, Wrench, FileText, ClipboardList, Building, Plus, CheckCircle, AlertCircle } from "lucide-react"
import MaterialForm from "../components/forms/MaterialForm"
import MaoObraForm from "../components/forms/MaoObraForm"
import EquipamentoForm from "../components/forms/EquipamentoForm"
import ContratoForm from "../components/forms/ContratoForm"
import OutroGastoForm from "../components/forms/OutroGastoForm"
import apiService from "../services/apiService"

const AdicionarPagamentos = () => {
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState("")
  const [selectedObra, setSelectedObra] = useState(null)
  const [obras, setObras] = useState([])
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [alert, setAlert] = useState({ show: false, message: "", variant: "" })

  const showAlert = (message, variant = "success", duration = 5000) => {
    setAlert({ show: true, message, variant })
    setTimeout(() => setAlert({ show: false, message: "", variant: "" }), duration)
  }

  // Buscar obras disponíveis
  useEffect(() => {
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
    fetchObras()
  }, [])

  const gastoTypes = [
    {
      id: "material",
      title: "Material",
      icon: Package,
      color: "danger",
      description: "Compras de materiais e insumos",
    },
    {
      id: "maoObra",
      title: "Mão de Obra",
      icon: Users,
      color: "success",
      description: "Contratação de funcionários",
    },
    {
      id: "equipamento",
      title: "Equipamento",
      icon: Wrench,
      color: "primary",
      description: "Compra ou aluguel de equipamentos",
    },
    {
      id: "contrato",
      title: "Contrato",
      icon: FileText,
      color: "info",
      description: "Contratos de serviços",
    },
    {
      id: "outroGasto",
      title: "Outros Gastos",
      icon: ClipboardList,
      color: "secondary",
      description: "Despesas diversas",
    },
  ]

  const handleOpenModal = (type) => {
    setModalType(type)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setModalType("")
    setSelectedObra(null)
  }

  const handleSubmit = async (formData) => {
    setIsSubmitting(true)
    try {
      let response
      const dataWithObra = {
        ...formData,
        obraId: selectedObra?._id || null,
      }

      switch (modalType) {
        case "material":
          response = await apiService.materiais.create(dataWithObra)
          break
        case "maoObra":
          response = await apiService.maoObra.create(dataWithObra)
          break
        case "equipamento":
          response = await apiService.equipamentos.create(dataWithObra)
          break
        case "contrato":
          response = await apiService.contratos.create(dataWithObra)
          break
        case "outroGasto":
          response = await apiService.outrosGastos.create(dataWithObra)
          break
        default:
          throw new Error("Tipo de gasto inválido")
      }

      if (!response.error) {
        const tipoGasto = gastoTypes.find((t) => t.id === modalType)?.title || "Gasto"
        const obraInfo = selectedObra ? ` para a obra "${selectedObra.nome}"` : " como gasto geral da Fornec"
        showAlert(`${tipoGasto} adicionado com sucesso${obraInfo}!`, "success")
        handleCloseModal()
      } else {
        showAlert(response.message || "Erro ao adicionar gasto.", "danger")
      }
    } catch (error) {
      console.error("Erro ao adicionar gasto:", error)
      showAlert("Erro ao adicionar gasto. Tente novamente.", "danger")
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderForm = () => {
    const commonProps = {
      onSubmit: handleSubmit,
      onCancel: handleCloseModal,
      isLoading: isSubmitting,
    }

    switch (modalType) {
      case "material":
        return <MaterialForm {...commonProps} />
      case "maoObra":
        return <MaoObraForm {...commonProps} />
      case "equipamento":
        return <EquipamentoForm {...commonProps} />
      case "contrato":
        return <ContratoForm {...commonProps} />
      case "outroGasto":
        return <OutroGastoForm {...commonProps} />
      default:
        return null
    }
  }

  const getModalTitle = () => {
    const tipo = gastoTypes.find((t) => t.id === modalType)
    return tipo ? `Adicionar ${tipo.title}` : "Adicionar Gasto"
  }

  return (
    <Container className="mt-4 mb-5">
      <Row className="mb-4">
        <Col>
          <h1 className="mb-2">Adicionar Pagamentos</h1>
          <p className="text-muted">Registre gastos e despesas do seu projeto ou da empresa.</p>
        </Col>
      </Row>

      {alert.show && (
        <Alert variant={alert.variant} onClose={() => setAlert({ show: false })} dismissible className="mb-4">
          {alert.message}
        </Alert>
      )}

      {/* Seleção de Obra */}
      <Row className="mb-4">
        <Col>
          <Card className="border-2 border-dashed">
            <Card.Body className="text-center py-4">
              <Building size={32} className="text-muted mb-3" />
              <h5>Selecionar Obra (Opcional)</h5>
              <p className="text-muted mb-3">
                Escolha uma obra para associar o gasto ou deixe em branco para gastos gerais da Fornec.
              </p>

              {selectedObra ? (
                <div className="d-flex align-items-center justify-content-center gap-2">
                  <Badge bg="success" className="p-2">
                    <CheckCircle size={16} className="me-1" />
                    {selectedObra.nome}
                  </Badge>
                  <Button variant="outline-secondary" size="sm" onClick={() => setSelectedObra(null)}>
                    Remover
                  </Button>
                </div>
              ) : (
                <div className="d-flex flex-wrap gap-2 justify-content-center">
                  {obras.length > 0 ? (
                    obras.map((obra) => (
                      <Button key={obra._id} variant="outline-primary" size="sm" onClick={() => setSelectedObra(obra)}>
                        {obra.nome}
                      </Button>
                    ))
                  ) : (
                    <div className="text-muted">
                      <AlertCircle size={16} className="me-1" />
                      Nenhuma obra encontrada
                    </div>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Cards de Tipos de Gastos */}
      <Row className="g-4">
        {gastoTypes.map((tipo) => {
          const IconComponent = tipo.icon
          return (
            <Col key={tipo.id} md={6} lg={4}>
              <Card
                className="h-100 shadow-sm border-0 gasto-card"
                style={{
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-5px)"
                  e.currentTarget.style.boxShadow = "0 8px 25px rgba(0,0,0,0.15)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow = "0 2px 10px rgba(0,0,0,0.1)"
                }}
                onClick={() => handleOpenModal(tipo.id)}
              >
                <Card.Body className="text-center p-4">
                  <div
                    className={`rounded-circle d-inline-flex align-items-center justify-content-center mb-3 bg-${tipo.color}`}
                    style={{ width: "60px", height: "60px" }}
                  >
                    <IconComponent size={28} className="text-white" />
                  </div>
                  <h5 className="card-title mb-2">{tipo.title}</h5>
                  <p className="card-text text-muted small">{tipo.description}</p>
                  <Button variant={`outline-${tipo.color}`} size="sm" className="mt-2">
                    <Plus size={16} className="me-1" />
                    Adicionar
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          )
        })}
      </Row>

      {/* Modal para Formulários */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{getModalTitle()}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedObra && (
            <Alert variant="info" className="mb-3">
              <Building size={16} className="me-2" />
              Este gasto será associado à obra: <strong>{selectedObra.nome}</strong>
            </Alert>
          )}
          {renderForm()}
        </Modal.Body>
      </Modal>

      <style jsx>{`
        .gasto-card:hover {
          transform: translateY(-5px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </Container>
  )
}

export default AdicionarPagamentos
