// MaterialsList.jsx - Novo componente para materiais com filtros
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
  Package, 
  DollarSign, 
  Search,
  Plus,
  Edit,
  Trash2,
  Filter,
  Calendar,
  MapPin,
  User
} from "lucide-react"
import apiService from "../../src/services/apiService"

function MaterialsList({ obraId = null, showAddButton = true, onMaterialAdded, gastos, onEditMaterial, onDeleteMaterial }) {
  const [materiais, setMateriais] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [filterLocal, setFilterLocal] = useState("")
  const [filterSolicitante, setFilterSolicitante] = useState("")
  const [alert, setAlert] = useState({ show: false, message: "", variant: "" })

  // Listas únicas para filtros
  const [locais, setLocais] = useState([])
  const [solicitantes, setSolicitantes] = useState([])

  useEffect(() => {
    if (gastos && gastos.materiais) {
      setMateriais(gastos.materiais)
      
      // Extrair locais únicos
      const locaisUnicos = [...new Set(gastos.materiais.map(m => m.localCompra).filter(Boolean))]
      setLocais(locaisUnicos)
      
      // Extrair solicitantes únicos
      const solicitantesUnicos = [...new Set(gastos.materiais.map(m => m.solicitante).filter(Boolean))]
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

  const formatCurrency = (value) => 
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0)

  const formatDate = (date) => {
    if (!date) return "-"
    return new Date(date).toLocaleDateString("pt-BR", { timeZone: "UTC" })
  }

  // Filtrar materiais
  const materiaisFiltrados = materiais.filter(material => {
    const matchesSearch = searchTerm === "" || 
      (material.numeroNota && material.numeroNota.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (material.descricao && material.descricao.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (material.localCompra && material.localCompra.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = filterStatus === "" || material.statusPagamento === filterStatus
    
    const matchesLocal = filterLocal === "" || material.localCompra === filterLocal
    
    const matchesSolicitante = filterSolicitante === "" || material.solicitante === filterSolicitante
    
    return matchesSearch && matchesStatus && matchesLocal && matchesSolicitante
  })

  // Calcular totais
  const calcularTotais = () => {
    const total = materiaisFiltrados.reduce((acc, m) => acc + (m.valor || 0), 0)
    const pago = materiaisFiltrados
      .filter((m) => m.statusPagamento === "efetuado")
      .reduce((acc, m) => acc + (m.valor || 0), 0)
    const pendente = materiaisFiltrados
      .filter((m) => m.statusPagamento === "pendente")
      .reduce((acc, m) => acc + (m.valor || 0), 0)
    const emProcessamento = materiaisFiltrados
      .filter((m) => m.statusPagamento === "em_processamento")
      .reduce((acc, m) => acc + (m.valor || 0), 0)
    const atrasado = materiaisFiltrados
      .filter((m) => m.statusPagamento === "atrasado")
      .reduce((acc, m) => acc + (m.valor || 0), 0)

    return { 
      total, 
      pago, 
      pendente, 
      emProcessamento, 
      atrasado,
      quantidadePago: materiaisFiltrados.filter(m => m.statusPagamento === "efetuado").length,
      quantidadePendente: materiaisFiltrados.filter(m => m.statusPagamento === "pendente").length,
      quantidadeEmProcessamento: materiaisFiltrados.filter(m => m.statusPagamento === "em_processamento").length,
      quantidadeAtrasado: materiaisFiltrados.filter(m => m.statusPagamento === "atrasado").length
    }
  }

  // Calcular estatísticas por local
  const calcularEstatisticasPorLocal = () => {
    const estatisticas = {}
    materiaisFiltrados.forEach(material => {
      const local = material.localCompra || "Não informado"
      if (!estatisticas[local]) {
        estatisticas[local] = {
          quantidade: 0,
          valor: 0
        }
      }
      estatisticas[local].quantidade++
      estatisticas[local].valor += material.valor || 0
    })
    return estatisticas
  }

  const totais = calcularTotais()
  const estatisticasPorLocal = calcularEstatisticasPorLocal()
  const percentualPago = totais.total > 0 ? (totais.pago / totais.total) * 100 : 0

  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Carregando materiais...</p>
      </div>
    )
  }

  return (
    <>
      <Card className="shadow-sm">
        <Card.Header className="bg-white">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <Package className="text-primary me-2" size={20} />
              <h5 className="mb-0">Materiais</h5>
              <Badge bg="primary" className="ms-2">{materiaisFiltrados.length}</Badge>
            </div>
            {showAddButton && onMaterialAdded && (
              <Button variant="primary" size="sm" onClick={onMaterialAdded}>
                <Plus size={16} className="me-2" />
                Novo Material
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
                <h6 className="text-muted mb-1">Valor Total dos Materiais</h6>
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
                  {totais.quantidadePendente} materiais pendentes
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
                  placeholder="Buscar por nota, descrição ou local..."
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
                  <MapPin size={16} />
                </InputGroup.Text>
                <Form.Select 
                  value={filterLocal} 
                  onChange={(e) => setFilterLocal(e.target.value)}
                >
                  <option value="">Todos os locais</option>
                  {locais.map(local => (
                    <option key={local} value={local}>
                      {local}
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

          {/* Estatísticas por Local de Compra */}
          {Object.keys(estatisticasPorLocal).length > 0 && (
            <Row className="mb-4">
              <Col>
                <h6>Distribuição por Local de Compra:</h6>
                <Row>
                  {Object.entries(estatisticasPorLocal).slice(0, 4).map(([local, stats]) => (
                    <Col md={3} key={local} className="mb-2">
                      <Card className="h-100 border-0 shadow-sm">
                        <Card.Body className="py-2 px-3">
                          <h6 className="mb-1" style={{ fontSize: "0.85rem" }}>{local}</h6>
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

          {/* Tabela de Materiais */}
          {materiaisFiltrados.length === 0 ? (
            <div className="text-center p-4 text-muted">
              <Package size={48} className="mb-3" />
              <p>Nenhum material encontrado.</p>
            </div>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Nota Fiscal</th>
                  <th>Descrição</th>
                  <th>Local de Compra</th>
                  <th>Solicitante</th>
                  <th>Valor</th>
                  <th>Data</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {materiaisFiltrados.map((material) => {
                  const statusBadge = getStatusBadge(material.statusPagamento)
                  
                  return (
                    <tr key={material._id}>
                      <td>
                        <strong>{material.numeroNota || "-"}</strong>
                      </td>
                      <td>
                        {material.descricao || "-"}
                        {material.observacoes && (
                          <small className="d-block text-muted">{material.observacoes}</small>
                        )}
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <MapPin size={14} className="me-1 text-muted" />
                          {material.localCompra || "-"}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <User size={14} className="me-1 text-muted" />
                          {material.solicitante || "-"}
                        </div>
                      </td>
                      <td>
                        <strong>{formatCurrency(material.valor)}</strong>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <Calendar size={14} className="me-1 text-muted" />
                          {formatDate(material.data)}
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
                          onClick={() => onEditMaterial && onEditMaterial(material)}
                          title="Editar Material"
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => onDeleteMaterial && onDeleteMaterial(material._id)}
                          title="Excluir Material"
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

export default MaterialsList