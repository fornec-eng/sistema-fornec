// EquipamentosList.jsx - Componente para equipamentos com filtros
"use client"

import { useState, useEffect } from "react"
import { 
  Card, 
  Table, 
  Button, 
  Badge, 
  ProgressBar,
  Spinner,
  Alert,
  InputGroup,
  Form,
  Row,
  Col
} from "react-bootstrap"
import { 
  Wrench, 
  DollarSign, 
  Search,
  Plus,
  Edit,
  Trash2,
  Filter,
  Calendar,
  MapPin,
  User,
  Building
} from "lucide-react"

function EquipamentosList({ 
  obraId = null, 
  showAddButton = true, 
  onEquipamentoAdded, 
  gastos, 
  onEditEquipamento, 
  onDeleteEquipamento 
}) {
  const [equipamentos, setEquipamentos] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [filterTipo, setFilterTipo] = useState("")
  const [filterSolicitante, setFilterSolicitante] = useState("")
  const [alert, setAlert] = useState({ show: false, message: "", variant: "" })

  // Listas únicas para filtros
  const [tipos, setTipos] = useState([])
  const [solicitantes, setSolicitantes] = useState([])

  useEffect(() => {
    if (gastos && gastos.equipamentos) {
      setEquipamentos(gastos.equipamentos)
      
      // Extrair tipos únicos
      const tiposUnicos = [...new Set(gastos.equipamentos.map(e => e.tipoContratacao).filter(Boolean))]
      setTipos(tiposUnicos)
      
      // Extrair solicitantes únicos
      const solicitantesUnicos = [...new Set(gastos.equipamentos.map(e => e.solicitante).filter(Boolean))]
      setSolicitantes(solicitantesUnicos)
    }
  }, [gastos])

  const showAlert = (message, variant) => {
    setAlert({ show: true, message, variant })
    setTimeout(() => setAlert({ show: false, message: "", variant: "" }), 5000)
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pendente: { variant: "warning", label: "Pendente" },
      efetuado: { variant: "success", label: "Efetuado" },
      em_processamento: { variant: "info", label: "Em Processamento" },
      cancelado: { variant: "danger", label: "Cancelado" },
      atrasado: { variant: "danger", label: "Atrasado" }
    }
    return statusConfig[status] || statusConfig.pendente
  }

  const getTipoContratacaoBadge = (tipo) => {
    const tipoConfig = {
      compra: { variant: "success", label: "Compra" },
      aluguel: { variant: "primary", label: "Aluguel" },
      leasing: { variant: "info", label: "Leasing" },
      comodato: { variant: "secondary", label: "Comodato" }
    }
    return tipoConfig[tipo] || { variant: "secondary", label: tipo }
  }

  const formatCurrency = (value) => 
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0)

  const formatDate = (date) => {
    if (!date) return "-"
    return new Date(date).toLocaleDateString("pt-BR", { timeZone: "UTC" })
  }

  // Filtrar equipamentos
  const equipamentosFiltrados = equipamentos.filter(equipamento => {
    const matchesSearch = searchTerm === "" || 
      (equipamento.numeroNota && equipamento.numeroNota.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (equipamento.item && equipamento.item.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (equipamento.descricao && equipamento.descricao.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (equipamento.localCompra && equipamento.localCompra.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = filterStatus === "" || equipamento.statusPagamento === filterStatus
    
    const matchesTipo = filterTipo === "" || equipamento.tipoContratacao === filterTipo
    
    const matchesSolicitante = filterSolicitante === "" || equipamento.solicitante === filterSolicitante
    
    return matchesSearch && matchesStatus && matchesTipo && matchesSolicitante
  })

  // Calcular totais
  const calcularTotais = () => {
    const total = equipamentosFiltrados.reduce((acc, e) => acc + (e.valor || 0), 0)
    const pago = equipamentosFiltrados
      .filter((e) => e.statusPagamento === "efetuado")
      .reduce((acc, e) => acc + (e.valor || 0), 0)
    const pendente = equipamentosFiltrados
      .filter((e) => e.statusPagamento === "pendente")
      .reduce((acc, e) => acc + (e.valor || 0), 0)
    const emProcessamento = equipamentosFiltrados
      .filter((e) => e.statusPagamento === "em_processamento")
      .reduce((acc, e) => acc + (e.valor || 0), 0)
    const atrasado = equipamentosFiltrados
      .filter((e) => e.statusPagamento === "atrasado")
      .reduce((acc, e) => acc + (e.valor || 0), 0)

    return { 
      total, 
      pago, 
      pendente, 
      emProcessamento, 
      atrasado,
      quantidadePago: equipamentosFiltrados.filter(e => e.statusPagamento === "efetuado").length,
      quantidadePendente: equipamentosFiltrados.filter(e => e.statusPagamento === "pendente").length,
      quantidadeEmProcessamento: equipamentosFiltrados.filter(e => e.statusPagamento === "em_processamento").length,
      quantidadeAtrasado: equipamentosFiltrados.filter(e => e.statusPagamento === "atrasado").length
    }
  }

  // Calcular estatísticas por tipo de contratação
  const calcularEstatisticasPorTipo = () => {
    const estatisticas = {}
    equipamentosFiltrados.forEach(equipamento => {
      const tipo = equipamento.tipoContratacao || "Não informado"
      if (!estatisticas[tipo]) {
        estatisticas[tipo] = {
          quantidade: 0,
          valor: 0
        }
      }
      estatisticas[tipo].quantidade++
      estatisticas[tipo].valor += equipamento.valor || 0
    })
    return estatisticas
  }

  const totais = calcularTotais()
  const estatisticasPorTipo = calcularEstatisticasPorTipo()
  const percentualPago = totais.total > 0 ? (totais.pago / totais.total) * 100 : 0

  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Carregando equipamentos...</p>
      </div>
    )
  }

  return (
    <>
      <Card className="shadow-sm">
        <Card.Header className="bg-white">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <Wrench className="text-primary me-2" size={20} />
              <h5 className="mb-0">Equipamentos</h5>
              <Badge bg="primary" className="ms-2">{equipamentosFiltrados.length}</Badge>
            </div>
            {showAddButton && onEquipamentoAdded && (
              <Button variant="primary" size="sm" onClick={onEquipamentoAdded}>
                <Plus size={16} className="me-2" />
                Novo Equipamento
              </Button>
            )}
          </div>
        </Card.Header>

        <Card.Body>
          {alert.show && (
            <Alert variant={alert.variant} dismissible onClose={() => setAlert({ show: false })}>
              {alert.message}
            </Alert>
          )}

          {/* Cards de Resumo Financeiro */}
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="border rounded p-3">
                <h6 className="text-muted mb-1">Valor Total dos Equipamentos</h6>
                <h4>{formatCurrency(totais.total)}</h4>
              </div>
            </div>
            <div className="col-md-3">
              <div className="border rounded p-3">
                <h6 className="text-muted mb-1">Total Pago</h6>
                <h4>{formatCurrency(totais.pago)}</h4>
                <ProgressBar
                  now={percentualPago > 100 ? 100 : percentualPago}
                  variant="success"
                  className="mt-2"
                  style={{ height: "8px" }}
                />
                <small className="text-muted">
                  {percentualPago.toFixed(1)}% pago ({totais.quantidadePago} itens)
                </small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="border rounded p-3">
                <h6 className="text-muted mb-1">Pendente</h6>
                <h4 className="text-warning">{formatCurrency(totais.pendente)}</h4>
                <small className="text-muted">
                  {totais.quantidadePendente} equipamentos pendentes
                </small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="border rounded p-3">
                <h6 className="text-muted mb-1">Em Processamento</h6>
                <h4 className="text-info">{formatCurrency(totais.emProcessamento)}</h4>
                <small className="text-muted">
                  {totais.quantidadeEmProcessamento} em processamento
                </small>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <Row className="mb-3">
            <Col md={3}>
              <InputGroup>
                <InputGroup.Text>
                  <Search size={16} />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Buscar por item, nota ou descrição..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Todos os status</option>
                <option value="pendente">Pendente</option>
                <option value="efetuado">Efetuado</option>
                <option value="em_processamento">Em Processamento</option>
                <option value="cancelado">Cancelado</option>
                <option value="atrasado">Atrasado</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <InputGroup>
                <InputGroup.Text>
                  <Filter size={16} />
                </InputGroup.Text>
                <Form.Select 
                  value={filterTipo} 
                  onChange={(e) => setFilterTipo(e.target.value)}
                >
                  <option value="">Todos os tipos</option>
                  {tipos.map(tipo => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </Form.Select>
              </InputGroup>
            </Col>
            <Col md={3}>
              <InputGroup>
                <InputGroup.Text>
                  <User size={16} />
                </InputGroup.Text>
                <Form.Select 
                  value={filterSolicitante} 
                  onChange={(e) => setFilterSolicitante(e.target.value)}
                >
                  <option value="">Todos os solicitantes</option>
                  {solicitantes.map(solicitante => (
                    <option key={solicitante} value={solicitante}>
                      {solicitante}
                    </option>
                  ))}
                </Form.Select>
              </InputGroup>
            </Col>
          </Row>

          {/* Estatísticas por Tipo de Contratação */}
          {Object.keys(estatisticasPorTipo).length > 0 && (
            <Row className="mb-4">
              <Col>
                <h6>Distribuição por Tipo de Contratação:</h6>
                <Row>
                  {Object.entries(estatisticasPorTipo).slice(0, 4).map(([tipo, stats]) => (
                    <Col md={3} key={tipo} className="mb-2">
                      <Card className="h-100 border-0 shadow-sm">
                        <Card.Body className="py-2 px-3">
                          <h6 className="mb-1" style={{ fontSize: "0.85rem" }}>{tipo}</h6>
                          <div className="d-flex justify-content-between">
                            <small className="text-muted">{stats.quantidade} itens</small>
                            <small className="fw-bold text-success">{formatCurrency(stats.valor)}</small>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Col>
            </Row>
          )}

          {/* Tabela de Equipamentos */}
          {equipamentosFiltrados.length === 0 ? (
            <div className="text-center p-4 text-muted">
              <Wrench size={48} className="mb-3" />
              <p>Nenhum equipamento encontrado.</p>
            </div>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Nota/Item</th>
                  <th>Descrição</th>
                  <th>Tipo</th>
                  <th>Solicitante</th>
                  <th>Local de Compra</th>
                  <th>Valor</th>
                  <th>Data</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {equipamentosFiltrados.map((equipamento) => {
                  const statusBadge = getStatusBadge(equipamento.statusPagamento)
                  const tipoBadge = getTipoContratacaoBadge(equipamento.tipoContratacao)
                  
                  return (
                    <tr key={equipamento._id}>
                      <td>
                        <strong>{equipamento.numeroNota || equipamento.item || "-"}</strong>
                        {equipamento.numeroNota && equipamento.item && (
                          <small className="d-block text-muted">{equipamento.item}</small>
                        )}
                      </td>
                      <td>
                        {equipamento.descricao || "-"}
                        {equipamento.observacoes && (
                          <small className="d-block text-muted">{equipamento.observacoes}</small>
                        )}
                      </td>
                      <td>
                        <Badge bg={tipoBadge.variant}>
                          {tipoBadge.label}
                        </Badge>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <User size={14} className="me-1 text-muted" />
                          {equipamento.solicitante || "-"}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <MapPin size={14} className="me-1 text-muted" />
                          {equipamento.localCompra || "-"}
                        </div>
                      </td>
                      <td>
                        <strong>{formatCurrency(equipamento.valor)}</strong>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <Calendar size={14} className="me-1 text-muted" />
                          {formatDate(equipamento.data)}
                        </div>
                      </td>
                      <td>
                        <Badge bg={statusBadge.variant}>
                          {statusBadge.label}
                        </Badge>
                      </td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => onEditEquipamento && onEditEquipamento(equipamento)}
                          title="Editar Equipamento"
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => onDeleteEquipamento && onDeleteEquipamento(equipamento._id)}
                          title="Excluir Equipamento"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </>
  )
}

export default EquipamentosList