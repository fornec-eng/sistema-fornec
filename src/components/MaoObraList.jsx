// MaoObraList.jsx - Componente para mão de obra com filtros
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
  Users, 
  DollarSign, 
  Search,
  Plus,
  Edit,
  Trash2,
  Filter,
  Calendar,
  User,
  Clock,
  Briefcase
} from "lucide-react"

function MaoObraList({ 
  obraId = null, 
  showAddButton = true, 
  onMaoObraAdded, 
  gastos, 
  onEditMaoObra, 
  onDeleteMaoObra 
}) {
  const [maoObras, setMaoObras] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [filterStatusPagamento, setFilterStatusPagamento] = useState("")
  const [filterTipoContratacao, setFilterTipoContratacao] = useState("")
  const [filterFuncao, setFilterFuncao] = useState("")
  const [alert, setAlert] = useState({ show: false, message: "", variant: "" })

  // Listas únicas para filtros
  const [funcoes, setFuncoes] = useState([])
  const [tiposContratacao, setTiposContratacao] = useState([])

  useEffect(() => {
    if (gastos && gastos.maoObra) {
      setMaoObras(gastos.maoObra)
      
      // Extrair funções únicas
      const funcoesUnicas = [...new Set(gastos.maoObra.map(m => m.funcao).filter(Boolean))]
      setFuncoes(funcoesUnicas)
      
      // Extrair tipos de contratação únicos
      const tiposUnicos = [...new Set(gastos.maoObra.map(m => m.tipoContratacao).filter(Boolean))]
      setTiposContratacao(tiposUnicos)
    }
  }, [gastos])

  const showAlert = (message, variant) => {
    setAlert({ show: true, message, variant })
    setTimeout(() => setAlert({ show: false, message: "", variant: "" }), 5000)
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      ativo: { variant: "success", label: "Ativo" },
      inativo: { variant: "secondary", label: "Inativo" },
      finalizado: { variant: "info", label: "Finalizado" }
    }
    return statusConfig[status] || statusConfig.ativo
  }

  const getStatusPagamentoBadge = (status) => {
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
      clt: { variant: "primary", label: "CLT" },
      pj: { variant: "info", label: "PJ" },
      diaria: { variant: "warning", label: "Diária" },
      empreitada: { variant: "success", label: "Empreitada" },
      temporario: { variant: "secondary", label: "Temporário" }
    }
    return tipoConfig[tipo] || { variant: "secondary", label: tipo }
  }

  const formatCurrency = (value) => 
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0)

  const formatDate = (date) => {
    if (!date) return "-"
    return new Date(date).toLocaleDateString("pt-BR", { timeZone: "UTC" })
  }

  const calcularDuracaoContrato = (inicio, fim) => {
    if (!inicio || !fim) return "-"
    const dataInicio = new Date(inicio)
    const dataFim = new Date(fim)
    const diffTime = Math.abs(dataFim - dataInicio)
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return `${diffDays} dias`
  }

  const verificarContratoAtivo = (inicio, fim, status) => {
    if (status !== 'ativo') return false
    const hoje = new Date()
    const dataInicio = new Date(inicio)
    const dataFim = new Date(fim)
    return dataInicio <= hoje && dataFim >= hoje
  }

  // Filtrar mão de obra
  const maoObrasFiltradas = maoObras.filter(maoObra => {
    const matchesSearch = searchTerm === "" || 
      (maoObra.nome && maoObra.nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (maoObra.funcao && maoObra.funcao.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = filterStatus === "" || maoObra.status === filterStatus
    
    const matchesStatusPagamento = filterStatusPagamento === "" || maoObra.statusPagamento === filterStatusPagamento
    
    const matchesTipoContratacao = filterTipoContratacao === "" || maoObra.tipoContratacao === filterTipoContratacao
    
    const matchesFuncao = filterFuncao === "" || maoObra.funcao === filterFuncao
    
    return matchesSearch && matchesStatus && matchesStatusPagamento && matchesTipoContratacao && matchesFuncao
  })

  // Calcular totais
  const calcularTotais = () => {
    const total = maoObrasFiltradas.reduce((acc, m) => acc + (m.valor || 0), 0)
    const pago = maoObrasFiltradas
      .filter((m) => m.statusPagamento === "efetuado")
      .reduce((acc, m) => acc + (m.valor || 0), 0)
    const pendente = maoObrasFiltradas
      .filter((m) => m.statusPagamento === "pendente")
      .reduce((acc, m) => acc + (m.valor || 0), 0)
    const emProcessamento = maoObrasFiltradas
      .filter((m) => m.statusPagamento === "em_processamento")
      .reduce((acc, m) => acc + (m.valor || 0), 0)
    const ativos = maoObrasFiltradas.filter(m => m.status === "ativo").length
    const inativos = maoObrasFiltradas.filter(m => m.status === "inativo").length
    const finalizados = maoObrasFiltradas.filter(m => m.status === "finalizado").length

    return { 
      total, 
      pago, 
      pendente, 
      emProcessamento,
      ativos,
      inativos,
      finalizados,
      quantidadePago: maoObrasFiltradas.filter(m => m.statusPagamento === "efetuado").length,
      quantidadePendente: maoObrasFiltradas.filter(m => m.statusPagamento === "pendente").length,
      quantidadeEmProcessamento: maoObrasFiltradas.filter(m => m.statusPagamento === "em_processamento").length
    }
  }

  // Calcular estatísticas por função
  const calcularEstatisticasPorFuncao = () => {
    const estatisticas = {}
    maoObrasFiltradas.forEach(maoObra => {
      const funcao = maoObra.funcao || "Não informado"
      if (!estatisticas[funcao]) {
        estatisticas[funcao] = {
          quantidade: 0,
          valor: 0,
          ativos: 0
        }
      }
      estatisticas[funcao].quantidade++
      estatisticas[funcao].valor += maoObra.valor || 0
      if (maoObra.status === 'ativo') {
        estatisticas[funcao].ativos++
      }
    })
    return estatisticas
  }

  const totais = calcularTotais()
  const estatisticasPorFuncao = calcularEstatisticasPorFuncao()
  const percentualPago = totais.total > 0 ? (totais.pago / totais.total) * 100 : 0

  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Carregando mão de obra...</p>
      </div>
    )
  }

  return (
    <>
      <Card className="shadow-sm">
        <Card.Header className="bg-white">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <Users className="text-primary me-2" size={20} />
              <h5 className="mb-0">Mão de Obra</h5>
              <Badge bg="primary" className="ms-2">{maoObrasFiltradas.length}</Badge>
            </div>
            {showAddButton && onMaoObraAdded && (
              <Button variant="primary" size="sm" onClick={onMaoObraAdded}>
                <Plus size={16} className="me-2" />
                Nova Mão de Obra
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

          {/* Cards de Resumo */}
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="border rounded p-3">
                <h6 className="text-muted mb-1">Valor Total da Mão de Obra</h6>
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
                  {percentualPago.toFixed(1)}% pago ({totais.quantidadePago} contratos)
                </small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="border rounded p-3">
                <h6 className="text-muted mb-1">Contratos Ativos</h6>
                <h4 className="text-success">{totais.ativos}</h4>
                <small className="text-muted">
                  {totais.inativos} inativos, {totais.finalizados} finalizados
                </small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="border rounded p-3">
                <h6 className="text-muted mb-1">Pendente</h6>
                <h4 className="text-warning">{formatCurrency(totais.pendente)}</h4>
                <small className="text-muted">
                  {totais.quantidadePendente} contratos pendentes
                </small>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <Row className="mb-3">
            <Col md={2}>
              <InputGroup>
                <InputGroup.Text>
                  <Search size={16} />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Buscar por nome ou função..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={2}>
              <Form.Select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Todos os status</option>
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
                <option value="finalizado">Finalizado</option>
              </Form.Select>
            </Col>
            <Col md={2}>
              <Form.Select 
                value={filterStatusPagamento} 
                onChange={(e) => setFilterStatusPagamento(e.target.value)}
              >
                <option value="">Status pagamento</option>
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
                  <Briefcase size={16} />
                </InputGroup.Text>
                <Form.Select 
                  value={filterTipoContratacao} 
                  onChange={(e) => setFilterTipoContratacao(e.target.value)}
                >
                  <option value="">Todos os tipos</option>
                  {tiposContratacao.map(tipo => (
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
                  value={filterFuncao} 
                  onChange={(e) => setFilterFuncao(e.target.value)}
                >
                  <option value="">Todas as funções</option>
                  {funcoes.map(funcao => (
                    <option key={funcao} value={funcao}>
                      {funcao}
                    </option>
                  ))}
                </Form.Select>
              </InputGroup>
            </Col>
          </Row>

          {/* Estatísticas por Função */}
          {Object.keys(estatisticasPorFuncao).length > 0 && (
            <Row className="mb-4">
              <Col>
                <h6>Distribuição por Função:</h6>
                <Row>
                  {Object.entries(estatisticasPorFuncao).slice(0, 4).map(([funcao, stats]) => (
                    <Col md={3} key={funcao} className="mb-2">
                      <Card className="h-100 border-0 shadow-sm">
                        <Card.Body className="py-2 px-3">
                          <h6 className="mb-1" style={{ fontSize: "0.85rem" }}>{funcao}</h6>
                          <div className="d-flex justify-content-between align-items-center">
                            <small className="text-muted">{stats.quantidade} contratos</small>
                            <small className="fw-bold text-success">{formatCurrency(stats.valor)}</small>
                          </div>
                          <div className="mt-1">
                            <small className="text-info">{stats.ativos} ativos</small>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))}
                </Row>
              </Col>
            </Row>
          )}

          {/* Tabela de Mão de Obra */}
          {maoObrasFiltradas.length === 0 ? (
            <div className="text-center p-4 text-muted">
              <Users size={48} className="mb-3" />
              <p>Nenhuma mão de obra encontrada.</p>
            </div>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Função</th>
                  <th>Tipo</th>
                  <th>Valor</th>
                  <th>Período</th>
                  <th>Duração</th>
                  <th>Status</th>
                  <th>Pagamento</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {maoObrasFiltradas.map((maoObra) => {
                  const statusBadge = getStatusBadge(maoObra.status)
                  const statusPagamentoBadge = getStatusPagamentoBadge(maoObra.statusPagamento)
                  const tipoBadge = getTipoContratacaoBadge(maoObra.tipoContratacao)
                  const contratoAtivo = verificarContratoAtivo(maoObra.dataInicio, maoObra.dataFim, maoObra.status)
                  
                  return (
                    <tr key={maoObra._id} className={contratoAtivo ? "table-success" : ""}>
                      <td>
                        <div className="d-flex align-items-center">
                          <User size={14} className="me-1 text-muted" />
                          <strong>{maoObra.nome || "-"}</strong>
                        </div>
                        {maoObra.observacoes && (
                          <small className="d-block text-muted">{maoObra.observacoes}</small>
                        )}
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <Briefcase size={14} className="me-1 text-muted" />
                          {maoObra.funcao || "-"}
                        </div>
                      </td>
                      <td>
                        <Badge bg={tipoBadge.variant}>
                          {tipoBadge.label}
                        </Badge>
                      </td>
                      <td>
                        <strong>{formatCurrency(maoObra.valor)}</strong>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <Calendar size={14} className="me-1 text-muted" />
                          <div>
                            <div>{formatDate(maoObra.dataInicio)}</div>
                            <small className="text-muted">até {formatDate(maoObra.dataFim)}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <Clock size={14} className="me-1 text-muted" />
                          {calcularDuracaoContrato(maoObra.dataInicio, maoObra.dataFim)}
                        </div>
                      </td>
                      <td>
                        <Badge bg={statusBadge.variant}>
                          {statusBadge.label}
                        </Badge>
                        {contratoAtivo && (
                          <div>
                            <small className="text-success">• Em vigor</small>
                          </div>
                        )}
                      </td>
                      <td>
                        <Badge bg={statusPagamentoBadge.variant}>
                          {statusPagamentoBadge.label}
                        </Badge>
                      </td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => onEditMaoObra && onEditMaoObra(maoObra)}
                          title="Editar Mão de Obra"
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => onDeleteMaoObra && onDeleteMaoObra(maoObra._id)}
                          title="Excluir Mão de Obra"
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

export default MaoObraList