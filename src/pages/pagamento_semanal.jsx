"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Table, Button, Badge, Alert, Spinner, Form, Modal } from "react-bootstrap"
import { Calendar, DollarSign, CheckCircle, Clock, Building, Users, Edit, X, AlertCircle, Play } from "lucide-react"
import apiService from "../services/apiService"

// Importar formulários para edição
import MaterialForm from "../components/forms/MaterialForm"
import MaoObraForm from "../components/forms/MaoObraForm"
import EquipamentoForm from "../components/forms/EquipamentoForm"
import ContratoForm from "../components/forms/ContratoForm"
import OutroGastoForm from "../components/forms/OutroGastoForm"

const PagamentoSemanal = () => {
  const [pagamentos, setPagamentos] = useState([])
  const [obras, setObras] = useState([])
  const [loading, setLoading] = useState(true)
  const [filtroObra, setFiltroObra] = useState("")
  const [filtroStatus, setFiltroStatus] = useState("")
  const [alert, setAlert] = useState({ show: false, message: "", variant: "" })

  // State para modais
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedPagamento, setSelectedPagamento] = useState(null)
  const [newStatus, setNewStatus] = useState("")

  // Definir status disponíveis
  const statusOptions = [
    { value: "pendente", label: "Pendente", variant: "warning", icon: Clock },
    { value: "efetuado", label: "Efetuado", variant: "success", icon: CheckCircle },
    { value: "em_processamento", label: "Em Processamento", variant: "info", icon: Play },
    { value: "cancelado", label: "Cancelado", variant: "danger", icon: X },
    { value: "atrasado", label: "Atrasado", variant: "danger", icon: AlertCircle },
  ]

  const showAlert = (message, variant = "success", duration = 5000) => {
    setAlert({ show: true, message, variant })
    setTimeout(() => setAlert({ show: false, message: "", variant: "" }), duration)
  }

  // Buscar dados
  const fetchData = async () => {
    setLoading(true)
    try {
      // Buscar obras
      const obrasResponse = await apiService.obras.getAll()
      const obras = obrasResponse.obras || []
      setObras(obras)

      // Buscar todos os gastos do banco de dados
      const [materiaisRes, maoObraRes, equipamentosRes, contratosRes, outrosGastosRes] = await Promise.all([
        apiService.materiais.getAll(),
        apiService.maoObra.getAll(),
        apiService.equipamentos.getAll(),
        apiService.contratos.getAll(),
        apiService.outrosGastos.getAll(),
      ])

      // Combinar todos os gastos
      const todosGastos = [
        ...(materiaisRes.materiais || []).map((item) => ({ ...item, tipo: "Material" })),
        ...(maoObraRes.maoObras || []).map((item) => ({ ...item, tipo: "Mão de Obra" })),
        ...(equipamentosRes.equipamentos || []).map((item) => ({ ...item, tipo: "Equipamento" })),
        ...(contratosRes.contratos || []).map((item) => ({ ...item, tipo: "Contrato" })),
        ...(outrosGastosRes.gastos || []).map((item) => ({ ...item, tipo: "Outros" })),
      ]

      // Mapear gastos com informações da obra
      const gastosComObra = todosGastos.map((gasto) => {
        const obra = obras.find((o) => o._id === gasto.obraId)
        return {
          ...gasto,
          obraNome: obra ? obra.nome : null,
        }
      })

      console.log("Gastos carregados:", gastosComObra.length)
      console.log("Exemplo de gasto:", gastosComObra[0])
      setPagamentos(gastosComObra)
    } catch (error) {
      console.error("Erro ao buscar dados:", error)
      showAlert("Erro ao carregar dados. Verifique a conexão.", "danger")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleOpenEditModal = (item) => {
    setSelectedPagamento(item)
    setShowEditModal(true)
  }

  const handleCloseEditModal = () => {
    setSelectedPagamento(null)
    setShowEditModal(false)
  }

  const handleEditSubmit = async (formData) => {
    if (!selectedPagamento) return

    const serviceMap = {
      Material: apiService.materiais,
      "Mão de Obra": apiService.maoObra,
      Equipamento: apiService.equipamentos,
      Contrato: apiService.contratos,
      Outros: apiService.outrosGastos,
    }
    const service = serviceMap[selectedPagamento.tipo]

    if (service) {
      try {
        await service.update(selectedPagamento._id, formData)
        showAlert("Pagamento atualizado com sucesso!", "success")
        handleCloseEditModal()
        fetchData() // Recarrega todos os dados
      } catch (error) {
        console.error("Erro ao atualizar item:", error)
        showAlert("Erro ao atualizar pagamento.", "danger")
      }
    }
  }

  const getEditFormComponent = () => {
    if (!selectedPagamento) return null
    switch (selectedPagamento.tipo) {
      case "Material":
        return MaterialForm
      case "Mão de Obra":
        return MaoObraForm
      case "Equipamento":
        return EquipamentoForm
      case "Contrato":
        return ContratoForm
      case "Outros":
        return OutroGastoForm
      default:
        return null
    }
  }

  const EditForm = getEditFormComponent()

  // Filtrar pagamentos da semana atual
  const getDatasSemanaAtual = () => {
    const hoje = new Date()
    const inicioSemana = new Date(hoje)
    inicioSemana.setDate(hoje.getDate() - hoje.getDay()) // Domingo

    const fimSemana = new Date(inicioSemana)
    fimSemana.setDate(inicioSemana.getDate() + 6) // Sábado

    return { inicioSemana, fimSemana }
  }

  const { inicioSemana, fimSemana } = getDatasSemanaAtual()

  // Função para obter status do pagamento
  const getPagamentoStatus = (pagamento) => {
    // Usar o novo campo statusPagamento se existir
    if (pagamento.statusPagamento) return pagamento.statusPagamento

    // Fallback para campos antigos
    if (pagamento.status) return pagamento.status
    if (pagamento.efetuado) return "efetuado"

    // Verificar se está atrasado
    const dataPagamento = new Date(
      pagamento.dataPagamento ||
        pagamento.data ||
        pagamento.dataVencimento ||
        pagamento.fimContrato ||
        pagamento.inicioContrato,
    )
    const hoje = new Date()
    if (dataPagamento < hoje && !pagamento.efetuado && !pagamento.status && !pagamento.statusPagamento)
      return "atrasado"

    return "pendente"
  }

  // Filtrar pagamentos
  const pagamentosFiltrados = pagamentos.filter((pagamento) => {
    // Filtro por obra
    if (filtroObra && filtroObra !== "todos") {
      if (filtroObra === "fornec" && pagamento.obraId) return false
      if (filtroObra !== "fornec" && pagamento.obraId !== filtroObra) return false
    }

    // Filtro por status
    if (filtroStatus && filtroStatus !== "todos") {
      const status = getPagamentoStatus(pagamento)
      if (status !== filtroStatus) return false
    }

    // Filtro por semana atual
    const dataPagamento = new Date(
      pagamento.dataPagamento ||
        pagamento.data ||
        pagamento.dataVencimento ||
        pagamento.fimContrato ||
        pagamento.inicioContrato,
    )
    return dataPagamento >= inicioSemana && dataPagamento <= fimSemana
  })

  // Calcular totais por status
  const totaisPorStatus = statusOptions.reduce((acc, status) => {
    acc[status.value] = {
      count: pagamentosFiltrados.filter((p) => getPagamentoStatus(p) === status.value).length,
      total: pagamentosFiltrados
        .filter((p) => getPagamentoStatus(p) === status.value)
        .reduce((sum, p) => sum + (p.valor || p.valorAReceber || 0), 0),
    }
    return acc
  }, {})

  const totalPagamentos = pagamentosFiltrados.reduce((total, pagamento) => {
    return total + (pagamento.valor || pagamento.valorAReceber || 0)
  }, 0)

  // Abrir modal para alterar status
  const handleOpenStatusModal = (pagamento) => {
    setSelectedPagamento(pagamento)
    setNewStatus(getPagamentoStatus(pagamento))
    setShowStatusModal(true)
  }

  // Alterar status do pagamento
  const handleAlterarStatus = async () => {
    if (!selectedPagamento || !newStatus) return

    try {
      // Atualizar localmente primeiro
      setPagamentos((prev) =>
        prev.map((p) => (p._id === selectedPagamento._id ? { ...p, statusPagamento: newStatus } : p)),
      )

      showAlert("Status atualizado com sucesso!", "success")
      setShowStatusModal(false)
      setSelectedPagamento(null)
      setNewStatus("")

      // Tentar salvar no backend
      const serviceMap = {
        Material: apiService.materiais,
        "Mão de Obra": apiService.maoObra,
        Equipamento: apiService.equipamentos,
        Contrato: apiService.contratos,
        Outros: apiService.outrosGastos,
      }
      const service = serviceMap[selectedPagamento.tipo]

      if (service) {
        console.log("Tentando salvar:", selectedPagamento._id, { statusPagamento: newStatus })
        const result = await service.update(selectedPagamento._id, { statusPagamento: newStatus })
        console.log("Salvo com sucesso:", result)
      } else {
        console.error("Serviço não encontrado para tipo:", selectedPagamento.tipo)
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
      showAlert("Erro ao salvar status no servidor.", "warning")
    }
  }

  // Obter configuração do status
  const getStatusConfig = (status) => {
    return statusOptions.find((s) => s.value === status) || statusOptions[0]
  }

  const formatCurrency = (value) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0)

  const formatDate = (date) => {
    if (!date) return "Data não informada"
    const dateObj = new Date(date)
    return dateObj.toLocaleDateString("pt-BR", { timeZone: "UTC" })
  }

  const getTipoLabel = (pagamento) => {
    return pagamento.tipo || "Indefinido"
  }

  const getTipoBadgeVariant = (tipo) => {
    const variants = {
      "Mão de Obra": "success",
      Material: "danger",
      Equipamento: "primary",
      Contrato: "info",
      Outros: "secondary",
    }
    return variants[tipo] || "secondary"
  }

  return (
    <>
      <Container className="mt-4 mb-5">
        <Row className="mb-4">
          <Col>
            <h1 className="mb-2">Pagamentos Semanais</h1>
            <p className="text-muted">
              Semana de {inicioSemana.toLocaleDateString("pt-BR")} a {fimSemana.toLocaleDateString("pt-BR")}
            </p>
          </Col>
        </Row>

        {alert.show && (
          <Alert variant={alert.variant} onClose={() => setAlert({ show: false })} dismissible className="mb-4">
            {alert.message}
          </Alert>
        )}

        {/* Cards de Resumo por Status */}
        <Row className="mb-4">
          <Col md={2}>
            <Card className="text-center border-0 shadow-sm">
              <Card.Body>
                <DollarSign size={32} className="text-primary mb-2" />
                <h4 className="mb-1">{formatCurrency(totalPagamentos)}</h4>
                <small className="text-muted">Total da Semana</small>
              </Card.Body>
            </Card>
          </Col>
          {statusOptions.slice(0, 5).map((status) => {
            const StatusIcon = status.icon
            return (
              <Col md={2} key={status.value}>
                <Card className="text-center border-0 shadow-sm">
                  <Card.Body>
                    <StatusIcon size={32} className={`text-${status.variant} mb-2`} />
                    <h4 className="mb-1">{totaisPorStatus[status.value]?.count || 0}</h4>
                    <small className="text-muted">{status.label}</small>
                    <div className="mt-1">
                      <small className="text-success fw-bold">
                        {formatCurrency(totaisPorStatus[status.value]?.total || 0)}
                      </small>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            )
          })}
          {/* Total de Itens */}
          <Col md={2}>
            <Card className="text-center border-0 shadow-sm">
              <Card.Body>
                <Calendar size={32} className="text-info mb-2" />
                <h4 className="mb-1">{pagamentosFiltrados.length}</h4>
                <small className="text-muted">Total de Itens</small>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Filtros */}
        <Row className="mb-4">
          <Col md={4}>
            <Form.Group>
              <Form.Label>Filtrar por Obra</Form.Label>
              <Form.Select value={filtroObra} onChange={(e) => setFiltroObra(e.target.value)}>
                <option value="">Todas as obras</option>
                <option value="fornec">Gastos da Fornec</option>
                {obras.map((obra) => (
                  <option key={obra._id} value={obra._id}>
                    {obra.nome}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group>
              <Form.Label>Filtrar por Status</Form.Label>
              <Form.Select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
                <option value="">Todos os status</option>
                {statusOptions.map((status) => (
                  <option key={status.value} value={status.value}>
                    {status.label}
                  </option>
                ))}
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        {/* Tabela de Pagamentos */}
        <Card className="shadow-sm">
          <Card.Header>
            <h5 className="mb-0">
              <Users className="me-2" />
              Pagamentos da Semana ({pagamentosFiltrados.length} itens)
            </h5>
          </Card.Header>
          <Card.Body className="p-0">
            {loading ? (
              <div className="text-center p-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Carregando pagamentos...</p>
              </div>
            ) : pagamentosFiltrados.length > 0 ? (
              <Table responsive hover className="mb-0">
                <thead className="table-light">
                  <tr>
                    <th>Descrição</th>
                    <th>Tipo</th>
                    <th>Obra</th>
                    <th>Valor</th>
                    <th>Data</th>
                    <th>Status</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {pagamentosFiltrados.map((pagamento, index) => {
                    const status = getPagamentoStatus(pagamento)
                    const statusConfig = getStatusConfig(status)
                    const StatusIcon = statusConfig.icon
                    const obra = obras.find((o) => o._id === pagamento.obraId)

                    return (
                      <tr key={`${pagamento._id}-${index}`}>
                        <td>
                          <strong>{pagamento.nome || pagamento.descricao || pagamento.item || "Sem descrição"}</strong>
                        </td>
                        <td>
                          <Badge bg={getTipoBadgeVariant(getTipoLabel(pagamento))}>{getTipoLabel(pagamento)}</Badge>
                        </td>
                        <td>
                          {pagamento.obraId ? (
                            <div>
                              <Building size={14} className="me-1" />
                              {pagamento.obraNome || obra?.nome || "Obra não encontrada"}
                            </div>
                          ) : (
                            <Badge bg="secondary">Fornec</Badge>
                          )}
                        </td>
                        <td>
                          <strong>{formatCurrency(pagamento.valor)}</strong>
                        </td>
                        <td>{formatDate(pagamento.dataPagamento || pagamento.data || pagamento.dataVencimento)}</td>
                        <td>
                          <Badge
                            bg={statusConfig.variant}
                            onClick={() => handleOpenStatusModal(pagamento)}
                            style={{ cursor: "pointer" }}
                          >
                            <StatusIcon size={12} className="me-1" />
                            {statusConfig.label}
                          </Badge>
                        </td>
                        <td>
                          <Button variant="outline-primary" size="sm" onClick={() => handleOpenEditModal(pagamento)}>
                            <Edit size={14} />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </Table>
            ) : (
              <div className="text-center p-5">
                <Calendar size={48} className="text-muted mb-3" />
                <h5>Nenhum pagamento encontrado</h5>
                <p className="text-muted">
                  Não há pagamentos programados para esta semana com os filtros selecionados.
                </p>
              </div>
            )}
          </Card.Body>
        </Card>
      </Container>

      {/* Modal para Edição Completa */}
      <Modal show={showEditModal} onHide={handleCloseEditModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Editar {selectedPagamento?.tipo}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {EditForm && (
            <EditForm
              initialData={selectedPagamento}
              onSubmit={handleEditSubmit}
              onCancel={handleCloseEditModal}
              obraId={selectedPagamento?.obraId}
            />
          )}
        </Modal.Body>
      </Modal>

      {/* Modal para Alterar Status */}
      <Modal show={showStatusModal} onHide={() => setShowStatusModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Alterar Status do Pagamento</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedPagamento && (
            <>
              <div className="mb-3">
                <strong>Pagamento:</strong> {selectedPagamento.nome || selectedPagamento.descricao || "Sem descrição"}
              </div>
              <div className="mb-3">
                <strong>Valor:</strong>{" "}
                {formatCurrency(selectedPagamento.valor || selectedPagamento.valorAReceber || 0)}
              </div>
              <Form.Group>
                <Form.Label>Novo Status</Form.Label>
                <Form.Select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                  {statusOptions.map((status) => (
                    <option key={status.value} value={status.value}>
                      {status.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatusModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleAlterarStatus}>
            Alterar Status
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default PagamentoSemanal
