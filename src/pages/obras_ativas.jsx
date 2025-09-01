"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, Button, Modal, Row, Col, Container, Spinner, Alert, Badge, Dropdown } from "react-bootstrap"
import { Link } from "react-router-dom"
import { Plus, Building, Eye, Database, ExternalLink, MoreVertical, Trash2, Home } from "lucide-react"
import apiService from "../services/apiService"
import ObraForm from "../components/forms/ObraForm"
import GastosResumo from "../components/GastosResumo"
import GoogleSheetsService from "../services/GoogleSheetsService"

const ObrasAtivas = () => {
  const [obras, setObras] = useState([])
  const [obrasComGastos, setObrasComGastos] = useState([])
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [obraToDelete, setObraToDelete] = useState(null)
  const [obraToEdit, setObraToEdit] = useState(null)
  const [alert, setAlert] = useState({ show: false, message: "", variant: "" })

  const showAlert = (message, variant = "success", duration = 5000) => {
    setAlert({ show: true, message, variant })
    setTimeout(() => setAlert({ show: false, message: "", variant: "" }), duration)
  }

  const fetchObras = useCallback(async () => {
    setLoading(true)
    try {
      const [obrasResponse, materiaisRes, maoObraRes, equipamentosRes, contratosRes, outrosGastosRes] =
        await Promise.all([
          apiService.obras.getAll(),
          apiService.materiais.getAll({ limit: 10000 }),
          apiService.maoObra.getAll({ limit: 10000 }),
          apiService.equipamentos.getAll({ limit: 10000 }),
          apiService.contratos.getAll({ limit: 10000 }),
          apiService.outrosGastos.getAll({ limit: 10000 }),
        ])

      if (obrasResponse.error) {
        showAlert(obrasResponse.message || "Erro ao carregar obras.", "danger")
        setLoading(false)
        return
      }

      const obras = obrasResponse.obras || []
      setObras(obras)

      const todosGastos = [
        ...(materiaisRes.materiais || []),
        ...(maoObraRes.maoObras || []),
        ...(equipamentosRes.equipamentos || []),
        ...(contratosRes.contratos || []),
        ...(outrosGastosRes.gastos || []),
      ]

      const filtrarGastosPorObra = (obraId) => {
        return todosGastos.filter((gasto) => {
          const gastoObraId = typeof gasto.obraId === "object" ? gasto.obraId?._id : gasto.obraId
          return gastoObraId === obraId
        })
      }

      const obrasComGastosCalculados = obras.map((obra) => {
        const gastosDaObra = filtrarGastosPorObra(obra._id)
        const totalGastos = gastosDaObra.reduce((acc, gasto) => acc + (gasto.valor || 0), 0)

        return {
          ...obra,
          totalGastos,
          saldo: (obra.valorContrato || 0) - totalGastos,
          percentualGasto: obra.valorContrato > 0 ? (totalGastos / obra.valorContrato) * 100 : 0,
        }
      })

      setObrasComGastos(obrasComGastosCalculados)
    } catch (error) {
      console.error("Erro ao buscar obras e gastos:", error)
      showAlert("Erro ao carregar dados. Verifique a conexão com a API.", "danger")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchObras()
  }, [fetchObras])

  const handleCreateObra = async (formData) => {
    setIsSubmitting(true)
    try {
      if (obraToEdit) {
        const response = await apiService.obras.update(obraToEdit._id, formData)

        if (!response.error) {
          showAlert(`Obra "${formData.nome}" atualizada com sucesso!`, "success")
          setShowModal(false)
          setObraToEdit(null)
          fetchObras()
        } else {
          showAlert(response.message || "Erro ao atualizar obra.", "danger")
        }
      } else {
        showAlert("Criando planilha no Google Sheets...", "info")

        const planilhaResponse = await GoogleSheetsService.criarPlanilhaObra(formData.nome, formData)

        if (!planilhaResponse || !planilhaResponse.spreadsheetId) {
          throw new Error("Erro ao criar planilha no Google Sheets")
        }

        showAlert("Planilha criada com sucesso! Criando obra...", "info")

        const dadosObraComPlanilha = {
          ...formData,
          spreadsheetId: planilhaResponse.spreadsheetId,
          spreadsheetUrl: planilhaResponse.url,
        }

        const response = await apiService.obras.create(dadosObraComPlanilha)

        if (!response.error) {
          showAlert(`Obra "${formData.nome}" criada com sucesso e planilha associada!`, "success")
          setShowModal(false)
          fetchObras()
        } else {
          showAlert(`Planilha criada, mas erro ao salvar obra: ${response.message || "Erro desconhecido"}`, "warning")
        }
      }
    } catch (error) {
      console.error("Erro no fluxo de criação/edição da obra:", error)

      if (error.message?.includes("planilha")) {
        showAlert("Erro ao criar planilha no Google Sheets. Tente novamente.", "danger")
      } else {
        showAlert(error.response?.data?.msg || error.message || "Erro ao salvar obra. Tente novamente.", "danger")
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteObra = async () => {
    if (!obraToDelete) return

    setIsDeleting(true)
    try {
      showAlert("Excluindo planilha e obra...", "info")

      const response = await apiService.obras.delete(obraToDelete._id)

      if (!response.error) {
        showAlert(`Obra "${obraToDelete.nome}" excluída com sucesso!`, "success")
        setShowDeleteModal(false)
        setObraToDelete(null)
        fetchObras()
      } else {
        showAlert(response.message || "Erro ao excluir obra.", "danger")
      }
    } catch (error) {
      console.error("Erro ao excluir obra:", error)
      showAlert(error.response?.data?.msg || error.message || "Erro ao excluir obra. Tente novamente.", "danger")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEditObra = (obra) => {
    setObraToEdit(obra)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setObraToEdit(null)
  }

  const confirmDeleteObra = (obra) => {
    setObraToDelete(obra)
    setShowDeleteModal(true)
  }

  const formatCurrency = (value) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0)

  const getStatusVariant = (status) => {
    const statusMap = {
      planejamento: "secondary",
      em_andamento: "primary",
      pausada: "warning",
      concluida: "success",
      cancelada: "danger",
    }
    return statusMap[status] || "secondary"
  }

  const getStatusLabel = (status) => {
    const statusMap = {
      planejamento: "Planejamento",
      em_andamento: "Em Andamento",
      pausada: "Pausada",
      concluida: "Concluída",
      cancelada: "Cancelada",
    }
    return statusMap[status] || status
  }

  const handleOpenSpreadsheet = (obra) => {
    if (obra.spreadsheetUrl) {
      window.open(obra.spreadsheetUrl, "_blank")
    } else if (obra.sheets_id) {
      window.open(`https://docs.google.com/spreadsheets/d/${obra.sheets_id}/edit`, "_blank")
    }
  }

  return (
    <Container className="mt-4 mb-5">
      
      <Row className="mb-4 align-items-center">

        <Col >
          <Link to="/home">
                  <Button variant="primary" size="sm">
                    <Home size={16} className="me-2" />
                    Início
                  </Button>
                </Link> 
        
        </Col>
        
        <Col >
          <h1 className="mb-0">Obras</h1>
          <p className="text-muted">Gerencie e acompanhe todos os seus projetos.</p>
        </Col>
        <Col>
          
          <Button variant="primary" onClick={() => setShowModal(true)}>
            <Plus size={16} className="me-2" />
            Nova Obra
          </Button>
        </Col>
      </Row>

      {alert.show && (
        <Alert variant={alert.variant} onClose={() => setAlert({ show: false })} dismissible>
          {alert.message}
        </Alert>
      )}

      {loading ? (
        <div className="text-center p-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Carregando obras...</p>
        </div>
      ) : (
        <Row className="g-4">
          {obrasComGastos.length > 0 ? (
            obrasComGastos.map((obra) => (
              <Col key={obra._id} md={6} lg={4}>
                <Card className="h-100 shadow-sm">
                  <Card.Header className="d-flex justify-content-between align-items-center">
                    <h5 className="mb-0">{obra.nome}</h5>
                    <div className="d-flex align-items-center gap-2">
                      <Badge bg="success" title="Dados do Banco de Dados">
                        <Database size={12} />
                      </Badge>
                      <Dropdown>
                        <Dropdown.Toggle variant="outline-secondary" size="sm" className="border-0">
                          <MoreVertical size={16} />
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                          <Dropdown.Item onClick={() => handleEditObra(obra)}>
                            <Eye size={16} className="me-2" />
                            Editar Obra
                          </Dropdown.Item>
                          <Dropdown.Item onClick={() => confirmDeleteObra(obra)} className="text-danger">
                            <Trash2 size={16} className="me-2" />
                            Excluir Obra
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    </div>
                  </Card.Header>
                  <Card.Body className="d-flex flex-column">
                    <p>
                      <strong>Cliente:</strong> {obra.cliente || "Não informado"}
                    </p>
                    {obra.endereco && (
                      <p>
                        <strong>Endereço:</strong> {obra.endereco}
                      </p>
                    )}
                    <p>
                      <strong>Valor do Contrato:</strong> {formatCurrency(obra.valorContrato)}
                    </p>
                    <p>
                      <strong>Status:</strong>{" "}
                      <Badge bg={getStatusVariant(obra.status)}>{getStatusLabel(obra.status)}</Badge>
                    </p>

                    <GastosResumo totalGastos={obra.totalGastos} valorContrato={obra.valorContrato} />
                    <div className="mt-auto d-flex flex-column gap-2">
                      <Link to={`/obras/${obra._id}`} className="w-100">
                        <Button variant="outline-primary" className="w-100">
                          <Eye size={16} className="me-2" />
                          Ver Dashboard
                        </Button>
                      </Link>

                      {(obra.sheets_id || obra.spreadsheetUrl) && (
                        <Button
                          variant="outline-success"
                          className="w-100"
                          onClick={() => handleOpenSpreadsheet(obra)}
                          title="Abrir planilha no Google Sheets"
                        >
                          <ExternalLink size={16} className="me-2" />
                          Abrir Planilha
                        </Button>
                      )}
                    </div>
                  </Card.Body>
                  <Card.Footer>
                    <small className="text-muted">
                      {obra.dataInicio && (
                        <>
                          Início: {new Date(obra.dataInicio).toLocaleDateString("pt-BR")}
                          {obra.dataPrevisaoTermino && (
                            <> | Término: {new Date(obra.dataPrevisaoTermino).toLocaleDateString("pt-BR")}</>
                          )}
                        </>
                      )}
                      {!obra.dataInicio && "Datas não informadas"}
                    </small>
                  </Card.Footer>
                </Card>
              </Col>
            ))
          ) : (
            <Col>
              <Card className="text-center p-5">
                <Building size={48} className="mx-auto text-muted mb-3" />
                <h4>Nenhuma obra encontrada</h4>
                <p>Clique em "Nova Obra" para começar a cadastrar seus projetos.</p>
              </Card>
            </Col>
          )}
        </Row>
      )}

      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>{obraToEdit ? "Editar Obra" : "Criar Nova Obra"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <ObraForm
            onSubmit={handleCreateObra}
            initialData={obraToEdit}
            isLoading={isSubmitting}
            onCancel={handleCloseModal}
          />
        </Modal.Body>
      </Modal>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger">Confirmar Exclusão</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <Trash2 size={48} className="text-danger mb-3" />
            <h5>Tem certeza que deseja excluir esta obra?</h5>
            {obraToDelete && (
              <div className="mt-3">
                <p>
                  <strong>Obra:</strong> {obraToDelete.nome}
                </p>
                <p>
                  <strong>Cliente:</strong> {obraToDelete.cliente}
                </p>
                <Alert variant="warning" className="mt-3">
                  <strong>Atenção:</strong> Esta ação irá excluir permanentemente:
                  <ul className="mt-2 mb-0 text-start">
                    <li>A planilha do Google Sheets associada</li>
                    <li>Todos os dados da obra no sistema</li>
                  </ul>
                  Esta ação não pode ser desfeita!
                </Alert>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDeleteObra} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 size={16} className="me-2" />
                Excluir Obra
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}

export default ObrasAtivas
