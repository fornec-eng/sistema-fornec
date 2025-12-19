"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, Button, Modal, Row, Col, Container, Spinner, Alert, Badge, Dropdown } from "react-bootstrap"
import { Link } from "react-router-dom"
import { Plus, Building, Eye, Database, ExternalLink, MoreVertical, Trash2, Home, Lock } from "lucide-react"
import apiService from "../services/apiService"
import userService from "../services/userService"
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

  // Estados para controle de acesso
  const [currentUserRole, setCurrentUserRole] = useState(null)
  const [currentUserId, setCurrentUserId] = useState(null)
  const [accessDeniedObras, setAccessDeniedObras] = useState([])

  const showAlert = (message, variant = "success", duration = 5000) => {
    setAlert({ show: true, message, variant })
    setTimeout(() => setAlert({ show: false, message: "", variant: "" }), duration)
  }

  // Inicializar dados do usuário atual
  useEffect(() => {
    const role = userService.getCurrentUserRole()
    const userId = userService.getCurrentUserId()
    setCurrentUserRole(role)
    setCurrentUserId(userId)
  }, [])

  const fetchObras = useCallback(async () => {
    setLoading(true)
    try {
      let obrasResponse

      // Verificar se é admin ou usuário comum
      if (currentUserRole === 'Admin') {
        // Admin vê todas as obras
        obrasResponse = await apiService.obras.getAll()
        console.log('Admin - Carregando todas as obras:', obrasResponse)
      } else if (currentUserRole === 'User' && currentUserId) {
        // Usuário comum vê apenas obras permitidas
        try {
          const userObrasResponse = await userService.listarObrasUsuario(currentUserId)
          console.log('User - Resposta das obras do usuário:', userObrasResponse)
          
          if (userObrasResponse.error) {
            throw new Error(userObrasResponse.message || 'Erro ao buscar obras do usuário')
          }

          // A API retorna { usuario: { obrasPermitidas: [...] } }
          if (userObrasResponse.usuario && userObrasResponse.usuario.obrasPermitidas) {
            // As obras já vêm populadas do populate no backend
            const obrasPermitidas = userObrasResponse.usuario.obrasPermitidas
            
            // Transformar para o formato esperado
            obrasResponse = {
              error: false,
              obras: obrasPermitidas.map(obra => ({
                ...obra,
                // Garantir que tenha todos os campos necessários
                _id: obra._id,
                nome: obra.nome,
                cliente: obra.cliente,
                endereco: obra.endereco,
                valorContrato: obra.valorContrato,
                status: obra.status,
                dataInicio: obra.dataInicio,
                dataPrevisaoTermino: obra.dataPrevisaoTermino,
                spreadsheetId: obra.spreadsheetId || obra.sheets_id,
                spreadsheetUrl: obra.spreadsheetUrl
              }))
            }
            console.log('User - Obras permitidas transformadas:', obrasResponse)
          } else {
            // Usuário não tem obras permitidas
            obrasResponse = {
              error: false,
              obras: []
            }
          }
        } catch (error) {
          console.error('Erro ao buscar obras do usuário:', error)
          // Fallback: se não conseguir buscar obras específicas, mostrar mensagem
          setObras([])
          setObrasComGastos([])
          setAccessDeniedObras([])
          showAlert('Erro ao carregar suas obras. Contate o administrador.', 'warning')
          setLoading(false)
          return
        }
      } else {
        // Caso não tenha role definida ou userId, não mostrar obras
        setObras([])
        setObrasComGastos([])
        setLoading(false)
        return
      }

      if (obrasResponse.error) {
        showAlert(obrasResponse.message || "Erro ao carregar obras.", "danger")
        setLoading(false)
        return
      }

      const obras = obrasResponse.obras || []
      setObras(obras)

      // Se não há obras, não precisamos buscar gastos
      if (obras.length === 0) {
        setObrasComGastos([])
        setLoading(false)
        return
      }

      // Buscar gastos para calcular totais
      const [materiaisRes, maoObraRes, equipamentosRes, contratosRes, outrosGastosRes] =
        await Promise.all([
          apiService.materiais.getAll({ limit: 10000 }),
          apiService.maoObra.getAll({ limit: 10000 }),
          apiService.equipamentos.getAll({ limit: 10000 }),
          apiService.contratos.getAll({ limit: 10000 }),
          apiService.outrosGastos.getAll({ limit: 10000 }),
        ])

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
  }, [currentUserRole, currentUserId])

  useEffect(() => {
    if (currentUserRole && (currentUserRole === 'Admin' || currentUserId)) {
      fetchObras()
    }
  }, [fetchObras, currentUserRole, currentUserId])

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
        // PRIORIDADE: Criar a obra no banco de dados PRIMEIRO
        showAlert("Criando obra no banco de dados...", "info")

        const response = await apiService.obras.create(formData)

        if (!response.error) {
          const obraCriada = response.obra

          // Associar automaticamente a obra ao usuário que está criando
          if (currentUserId && obraCriada?._id) {
            try {
              console.log(`Associando obra ${obraCriada._id} ao usuário ${currentUserId}`)
              await userService.associarObra(currentUserId, obraCriada._id)
            } catch (associacaoError) {
              console.error("Erro ao associar obra ao usuário:", associacaoError)
            }
          }

          // OPCIONAL: Tentar criar planilha no Google Sheets
          try {
            showAlert("Obra criada! Criando planilha no Google Sheets...", "info")
            const planilhaResponse = await GoogleSheetsService.criarPlanilhaObra(formData.nome, formData)

            if (planilhaResponse?.spreadsheetId) {
              // Atualizar a obra com os dados da planilha
              await apiService.obras.update(obraCriada._id, {
                spreadsheetId: planilhaResponse.spreadsheetId,
                spreadsheetUrl: planilhaResponse.url,
              })
              showAlert(`Obra "${formData.nome}" criada com sucesso e planilha associada!`, "success")
            } else {
              showAlert(`Obra "${formData.nome}" criada com sucesso, mas não foi possível criar a planilha.`, "warning")
            }
          } catch (planilhaError) {
            console.warn("Erro ao criar planilha, mas obra foi criada com sucesso:", planilhaError)
            showAlert(`Obra "${formData.nome}" criada com sucesso, mas não foi possível criar a planilha.`, "warning")
          }

          setShowModal(false)
          fetchObras()
        } else {
          showAlert(response.message || "Erro ao criar obra.", "danger")
        }
      }
    } catch (error) {
      console.error("Erro no fluxo de criação/edição da obra:", error)
      showAlert(error.response?.data?.msg || error.message || "Erro ao salvar obra. Tente novamente.", "danger")
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

  // Verificar se pode criar obras (apenas Admin)
  const canCreateObra = currentUserRole === 'Admin'

  // Verificar se pode editar/excluir obras (apenas Admin)
  const canManageObra = currentUserRole === 'Admin'

  return (
    <Container className="mt-4 mb-5">
      
      <Row className="mb-4 align-items-center">
        <Col>
          <Link to="/home">
            <Button variant="primary" size="sm">
              <Home size={16} className="me-2" />
              Início
            </Button>
          </Link> 
        </Col>
        
        <Col>
          <h1 className="mb-0">
            Obras
            {currentUserRole === 'User' && (
              <Badge bg="info" className="ms-3">
                <Lock size={14} className="me-1" />
                Acesso Limitado
              </Badge>
            )}
          </h1>
          <p className="text-muted">
            {currentUserRole === 'Admin' 
              ? "Gerencie e acompanhe todos os seus projetos." 
              : "Acompanhe os projetos que você tem acesso."
            }
          </p>
        </Col>
        
        <Col>
          {canCreateObra && (
            <Button variant="primary" onClick={() => setShowModal(true)}>
              <Plus size={16} className="me-2" />
              Nova Obra
            </Button>
          )}
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
                      {canManageObra && (
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
                      )}
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
                <h4>
                  {currentUserRole === 'Admin' 
                    ? "Nenhuma obra encontrada" 
                    : "Nenhuma obra disponível"
                  }
                </h4>
                <p>
                  {currentUserRole === 'Admin' 
                    ? "Clique em \"Nova Obra\" para começar a cadastrar seus projetos."
                    : "Você não tem acesso a nenhuma obra no momento. Entre em contato com o administrador."
                  }
                </p>
                {currentUserRole === 'User' && (
                  <div className="mt-3">
                    <Badge bg="warning" className="p-2">
                      <Lock size={16} className="me-2" />
                      Acesso controlado pelo administrador
                    </Badge>
                  </div>
                )}
              </Card>
            </Col>
          )}
        </Row>
      )}

      {/* Modal para criação/edição - apenas para Admin */}
      {canCreateObra && (
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
      )}

      {/* Modal de confirmação de exclusão - apenas para Admin */}
      {canManageObra && (
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
      )}
    </Container>
  )
}

export default ObrasAtivas