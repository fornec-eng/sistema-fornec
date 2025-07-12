"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Table, Button, Badge, Alert, Spinner, Form, Modal } from "react-bootstrap"
import { Calendar, DollarSign, CheckCircle, Clock, Building, Users, Edit, X, AlertTriangle, Play } from "lucide-react"
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
    { value: "atrasado", label: "Atrasado", variant: "danger", icon: AlertTriangle },
  ]

  const showAlert = (message, variant = "success", duration = 5000) => {
    setAlert({ show: true, message, variant })
    setTimeout(() => setAlert({ show: false, message: "", variant: "" }), duration)
  }

  // Função para obter datas da semana atual
  const getDatasSemanaAtual = () => {
    const hoje = new Date()
    const inicioSemana = new Date(hoje)
    const fimSemana = new Date(hoje)

    // Calcular início da semana (domingo)
    inicioSemana.setDate(hoje.getDate() - hoje.getDay())
    inicioSemana.setHours(0, 0, 0, 0)

    // Calcular fim da semana (sábado)
    fimSemana.setDate(hoje.getDate() + (6 - hoje.getDay()))
    fimSemana.setHours(23, 59, 59, 999)

    return { inicioSemana, fimSemana }
  }

  // Função para extrair data de pagamento de um item
  const extrairDataPagamento = (item) => {
    const campos = [
      'dataPagamento',
      'dataVencimento', 
      'data',
      'fimContrato',
      'dataTermino',
      'inicioContrato',
      'dataInicio'
    ]

    for (const campo of campos) {
      if (item[campo]) {
        const data = new Date(item[campo])
        if (!isNaN(data.getTime())) {
          return data
        }
      }
    }
    return null
  }

  // Função para verificar se um item está na semana atual
  const estaNoIntervaloSemana = (item, inicioSemana, fimSemana) => {
    const dataPagamento = extrairDataPagamento(item)
    if (!dataPagamento) return false
    
    return dataPagamento >= inicioSemana && dataPagamento <= fimSemana
  }

  // Buscar dados
  const fetchData = async () => {
    setLoading(true)
    try {
      console.log("Iniciando busca de dados...")

      // Buscar obras
      const obrasResponse = await apiService.obras.getAll()
      const obras = obrasResponse.obras || []
      setObras(obras)
      console.log("Obras carregadas:", obras.length)

      // Buscar todos os gastos
      const [materiaisRes, maoObraRes, equipamentosRes, contratosRes, outrosGastosRes] = await Promise.allSettled([
        apiService.materiais.getAll(),
        apiService.maoObra.getAll(),
        apiService.equipamentos.getAll(),
        apiService.contratos.getAll(),
        apiService.outrosGastos.getAll(),
      ])

      // Processar resultados das promises
      const materiais = materiaisRes.status === 'fulfilled' ? (materiaisRes.value?.materiais || []) : []
      const maoObras = maoObraRes.status === 'fulfilled' ? (maoObraRes.value?.maoObras || []) : []
      const equipamentos = equipamentosRes.status === 'fulfilled' ? (equipamentosRes.value?.equipamentos || []) : []
      const contratos = contratosRes.status === 'fulfilled' ? (contratosRes.value?.contratos || []) : []
      const outrosGastos = outrosGastosRes.status === 'fulfilled' ? (outrosGastosRes.value?.gastos || []) : []

      // Combinar todos os gastos com tipo
      const todosGastos = [
        ...materiais.map(item => ({ ...item, tipo: "Material" })),
        ...maoObras.map(item => ({ ...item, tipo: "Mão de Obra" })),
        ...equipamentos.map(item => ({ ...item, tipo: "Equipamento" })),
        ...contratos.map(item => ({ ...item, tipo: "Contrato" })),
        ...outrosGastos.map(item => ({ ...item, tipo: "Outros" })),
      ]

      console.log("Total de gastos carregados:", todosGastos.length)

      // Filtrar apenas itens da semana atual
      const { inicioSemana, fimSemana } = getDatasSemanaAtual()
      const gastosSemanaAtual = todosGastos.filter(gasto => 
        estaNoIntervaloSemana(gasto, inicioSemana, fimSemana)
      )

      console.log("Gastos da semana atual:", gastosSemanaAtual.length)

      // Mapear gastos com informações da obra
      const gastosComObra = gastosSemanaAtual.map(gasto => {
        const obra = obras.find(o => o._id === gasto.obraId)
        return {
          ...gasto,
          obraNome: obra ? obra.nome : null,
        }
      })

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

  // Função para obter status do pagamento
  const getPagamentoStatus = (pagamento) => {
    // Usar o campo statusPagamento se existir
    if (pagamento.statusPagamento) return pagamento.statusPagamento
    
    // Fallback para campos antigos
    if (pagamento.status) return pagamento.status
    if (pagamento.efetuado) return "efetuado"
    
    // Verificar se está atrasado baseado na data
    const dataPagamento = extrairDataPagamento(pagamento)
    const hoje = new Date()
    
    if (dataPagamento && dataPagamento < hoje && 
        !pagamento.efetuado && 
        !pagamento.status && 
        !pagamento.statusPagamento) {
      return "atrasado"
    }
    
    return "pendente"
  }

  // Filtrar pagamentos
  const pagamentosFiltrados = pagamentos.filter(pagamento => {
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

    return true
  })

  // Calcular totais por status
  const totaisPorStatus = statusOptions.reduce((acc, status) => {
    const itensFiltrados = pagamentosFiltrados.filter(p => getPagamentoStatus(p) === status.value)
    acc[status.value] = {
      count: itensFiltrados.length,
      total: itensFiltrados.reduce((sum, p) => sum + (p.valor || 0), 0)
    }
    return acc
  }, {})

  const totalPagamentos = pagamentosFiltrados.reduce((total, pagamento) => {
    return total + (pagamento.valor || 0)
  }, 0)

  // Handlers para modais
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
    if (!service) {
      showAlert("Tipo de pagamento não reconhecido", "danger")
      return
    }

    try {
      await service.update(selectedPagamento._id, formData)
      showAlert("Pagamento atualizado com sucesso!", "success")
      handleCloseEditModal()
      fetchData()
    } catch (error) {
      console.error("Erro ao atualizar item:", error)
      showAlert("Erro ao atualizar pagamento.", "danger")
    }
  }

  const handleOpenStatusModal = (pagamento) => {
    setSelectedPagamento(pagamento)
    setNewStatus(getPagamentoStatus(pagamento))
    setShowStatusModal(true)
  }

  const handleAlterarStatus = async () => {
    if (!selectedPagamento || !newStatus) return

    try {
      // Atualizar localmente primeiro
      setPagamentos(prev =>
        prev.map(p => 
          p._id === selectedPagamento._id 
            ? { ...p, statusPagamento: newStatus } 
            : p
        )
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
        await service.update(selectedPagamento._id, { statusPagamento: newStatus })
      }
    } catch (error) {
      console.error("Erro ao atualizar status:", error)
      showAlert("Erro ao salvar status no servidor.", "warning")
    }
  }

  // Função para obter formulário de edição
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

  // Obter configuração do status
  const getStatusConfig = (status) => {
    return statusOptions.find(s => s.value === status) || statusOptions[0]
  }

  // Utilitários de formatação
  const formatCurrency = (value) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0)

  const formatDate = (date) => {
    if (!date) return "Data não informada"
    const dateObj = new Date(date)
    if (isNaN(dateObj.getTime())) return "Data inválida"
    return dateObj.toLocaleDateString("pt-BR")
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

  const { inicioSemana, fimSemana } = getDatasSemanaAtual()

  return (
    <>
      <Container className="mt-4 mb-5">
        <Row className="mb-4">
          <Col>
            <h1 className="mb-2">Pagamentos Semanais</h1>
            <p className="text-muted">
              <Calendar size={16} className="me-1" />
              Semana de {formatDate(inicioSemana)} a {formatDate(fimSemana)}
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
          
          {statusOptions.slice(0, 5).map(status => {
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
        </Row>

        {/* Filtros */}
        <Row className="mb-4">
          <Col md={4}>
            <Form.Group>
              <Form.Label>Filtrar por Obra</Form.Label>
              <Form.Select value={filtroObra} onChange={(e) => setFiltroObra(e.target.value)}>
                <option value="">Todas as obras</option>
                <option value="fornec">Gastos da Fornec</option>
                {obras.map(obra => (
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
                {statusOptions.map(status => (
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
                    const obra = obras.find(o => o._id === pagamento.obraId)

                    return (
                      <tr key={`${pagamento._id}-${index}`}>
                        <td>
                          <strong>
                            {pagamento.nome || 
                             pagamento.descricao || 
                             pagamento.item || 
                             "Sem descrição"}
                          </strong>
                        </td>
                        <td>
                          <Badge bg={getTipoBadgeVariant(pagamento.tipo)}>
                            {pagamento.tipo}
                          </Badge>
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
                        <td>
                          {formatDate(extrairDataPagamento(pagamento))}
                        </td>
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
                          <Button 
                            variant="outline-primary" 
                            size="sm" 
                            onClick={() => handleOpenEditModal(pagamento)}
                          >
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
                <strong>Pagamento:</strong>{" "}
                {selectedPagamento.nome || selectedPagamento.descricao || "Sem descrição"}
              </div>
              <div className="mb-3">
                <strong>Valor:</strong> {formatCurrency(selectedPagamento.valor)}
              </div>
              <Form.Group>
                <Form.Label>Novo Status</Form.Label>
                <Form.Select value={newStatus} onChange={(e) => setNewStatus(e.target.value)}>
                  {statusOptions.map(status => (
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