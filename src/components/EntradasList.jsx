"use client"

import { useState, useEffect } from "react"
import { Card, Table, Button, Badge, ProgressBar, Spinner, Alert, InputGroup, Form, Row, Col } from "react-bootstrap"
import { ArrowDownCircle, Search, Plus, Edit, Trash2, Calendar, Building } from "lucide-react"
import apiService from "../services/apiService"

function EntradasList({ obraId = null, showAddButton = true, onEntradaAdded, gastos, onEditEntrada, onDeleteEntrada }) {
  const [entradas, setEntradas] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [filterObra, setFilterObra] = useState("")
  const [alert, setAlert] = useState({ show: false, message: "", variant: "" })

  // Listas únicas para filtros
  const [obras, setObras] = useState([])

  useEffect(() => {
    if (gastos && gastos.entradas) {
      setEntradas(gastos.entradas)

      // Extrair obras únicas
      const obrasUnicas = [
        ...new Set(
          gastos.entradas.map((e) => (e.obraId && typeof e.obraId === "object" ? e.obraId.nome : null)).filter(Boolean),
        ),
      ]
      setObras(obrasUnicas)
    } else {
      fetchEntradas()
    }
  }, [gastos, obraId])

  const fetchEntradas = async () => {
    setLoading(true)
    try {
      const params = obraId ? { obraId, limit: 1000 } : { limit: 1000 }
      const response = await apiService.entradas.getAll(params)

      if (!response.error) {
        setEntradas(response.entradas || [])

        // Extrair obras únicas
        const obrasUnicas = [
          ...new Set(
            response.entradas
              .map((e) => (e.obraId && typeof e.obraId === "object" ? e.obraId.nome : null))
              .filter(Boolean),
          ),
        ]
        setObras(obrasUnicas)
      }
    } catch (error) {
      console.error("Erro ao buscar entradas:", error)
      showAlert("Erro ao carregar entradas", "danger")
    } finally {
      setLoading(false)
    }
  }

  const showAlert = (message, variant) => {
    setAlert({ show: true, message, variant })
    setTimeout(() => setAlert({ show: false, message: "", variant: "" }), 5000)
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      recebido: { variant: "success", label: "Recebido" },
      pendente: { variant: "warning", label: "Pendente" },
      em_processamento: { variant: "info", label: "Em Processamento" },
      cancelado: { variant: "danger", label: "Cancelado" },
      atrasado: { variant: "danger", label: "Atrasado" },
    }
    return statusConfig[status] || statusConfig.recebido
  }

  const formatCurrency = (value) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0)

  const formatDate = (date) => {
    if (!date) return "-"
    return new Date(date).toLocaleDateString("pt-BR", { timeZone: "UTC" })
  }

  const getObraNome = (entrada) => {
    if (!entrada.obraId) return "Entrada Geral"
    if (typeof entrada.obraId === "object" && entrada.obraId.nome) {
      return entrada.obraId.nome
    }
    return "Obra não identificada"
  }

  // Filtrar entradas
  const entradasFiltradas = entradas.filter((entrada) => {
    const matchesSearch =
      searchTerm === "" ||
      (entrada.nome && entrada.nome.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (entrada.observacoes && entrada.observacoes.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = filterStatus === "" || entrada.statusRecebimento === filterStatus

    const obraNome = getObraNome(entrada)
    const matchesObra = filterObra === "" || obraNome === filterObra

    return matchesSearch && matchesStatus && matchesObra
  })

  // Calcular totais
  const calcularTotais = () => {
    const total = entradasFiltradas.reduce((acc, e) => acc + (e.valor || 0), 0)
    const recebido = entradasFiltradas
      .filter((e) => e.statusRecebimento === "recebido")
      .reduce((acc, e) => acc + (e.valor || 0), 0)
    const pendente = entradasFiltradas
      .filter((e) => e.statusRecebimento === "pendente")
      .reduce((acc, e) => acc + (e.valor || 0), 0)
    const emProcessamento = entradasFiltradas
      .filter((e) => e.statusRecebimento === "em_processamento")
      .reduce((acc, e) => acc + (e.valor || 0), 0)
    const atrasado = entradasFiltradas
      .filter((e) => e.statusRecebimento === "atrasado")
      .reduce((acc, e) => acc + (e.valor || 0), 0)

    return {
      total,
      recebido,
      pendente,
      emProcessamento,
      atrasado,
      quantidadeRecebido: entradasFiltradas.filter((e) => e.statusRecebimento === "recebido").length,
      quantidadePendente: entradasFiltradas.filter((e) => e.statusRecebimento === "pendente").length,
      quantidadeEmProcessamento: entradasFiltradas.filter((e) => e.statusRecebimento === "em_processamento").length,
      quantidadeAtrasado: entradasFiltradas.filter((e) => e.statusRecebimento === "atrasado").length,
    }
  }

  // Calcular estatísticas por obra
  const calcularEstatisticasPorObra = () => {
    const estatisticas = {}
    entradasFiltradas.forEach((entrada) => {
      const obra = getObraNome(entrada)
      if (!estatisticas[obra]) {
        estatisticas[obra] = {
          quantidade: 0,
          valor: 0,
        }
      }
      estatisticas[obra].quantidade++
      estatisticas[obra].valor += entrada.valor || 0
    })
    return estatisticas
  }

  const totais = calcularTotais()
  const estatisticasPorObra = calcularEstatisticasPorObra()
  const percentualRecebido = totais.total > 0 ? (totais.recebido / totais.total) * 100 : 0

  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" variant="success" />
        <p className="mt-3">Carregando entradas...</p>
      </div>
    )
  }

  return (
    <>
      <Card className="shadow-sm">
        <Card.Header className="bg-white">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <ArrowDownCircle className="text-success me-2" size={20} />
              <h5 className="mb-0">Entradas</h5>
              <Badge bg="success" className="ms-2">
                {entradasFiltradas.length}
              </Badge>
            </div>
            {showAddButton && onEntradaAdded && (
              <Button variant="success" size="sm" onClick={onEntradaAdded}>
                <Plus size={16} className="me-2" />
                Nova Entrada
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
                <h6 className="text-muted mb-1">Valor Total das Entradas</h6>
                <h4>{formatCurrency(totais.total)}</h4>
              </div>
            </div>
            <div className="col-md-3">
              <div className="border rounded p-3">
                <h6 className="text-muted mb-1">Total Recebido</h6>
                <h4>{formatCurrency(totais.recebido)}</h4>
                <ProgressBar
                  now={percentualRecebido > 100 ? 100 : percentualRecebido}
                  variant="success"
                  className="mt-2"
                  style={{ height: "8px" }}
                />
                <small className="text-muted">
                  {percentualRecebido.toFixed(1)}% recebido ({totais.quantidadeRecebido} itens)
                </small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="border rounded p-3">
                <h6 className="text-muted mb-1">Pendente</h6>
                <h4 className="text-warning">{formatCurrency(totais.pendente)}</h4>
                <small className="text-muted">{totais.quantidadePendente} entradas pendentes</small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="border rounded p-3">
                <h6 className="text-muted mb-1">Em Processamento</h6>
                <h4 className="text-info">{formatCurrency(totais.emProcessamento)}</h4>
                <small className="text-muted">{totais.quantidadeEmProcessamento} em processamento</small>
              </div>
            </div>
          </div>

          {/* Filtros */}
          <Row className="mb-3">
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text>
                  <Search size={16} />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Buscar por nome ou observações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={4}>
              <Form.Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">Todos os status</option>
                <option value="recebido">Recebido</option>
                <option value="pendente">Pendente</option>
                <option value="em_processamento">Em Processamento</option>
                <option value="cancelado">Cancelado</option>
                <option value="atrasado">Atrasado</option>
              </Form.Select>
            </Col>
            <Col md={4}>
              <InputGroup>
                <InputGroup.Text>
                  <Building size={16} />
                </InputGroup.Text>
                <Form.Select value={filterObra} onChange={(e) => setFilterObra(e.target.value)}>
                  <option value="">Todas as obras</option>
                  <option value="Entrada Geral">Entrada Geral</option>
                  {obras.map((obra) => (
                    <option key={obra} value={obra}>
                      {obra}
                    </option>
                  ))}
                </Form.Select>
              </InputGroup>
            </Col>
          </Row>

          {/* Estatísticas por Obra */}
          {Object.keys(estatisticasPorObra).length > 0 && (
            <Row className="mb-4">
              <Col>
                <h6>Distribuição por Obra:</h6>
                <Row>
                  {Object.entries(estatisticasPorObra)
                    .slice(0, 4)
                    .map(([obra, stats]) => (
                      <Col md={3} key={obra} className="mb-2">
                        <Card className="h-100 border-0 shadow-sm">
                          <Card.Body className="py-2 px-3">
                            <h6 className="mb-1" style={{ fontSize: "0.85rem" }}>
                              {obra}
                            </h6>
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

          {/* Tabela de Entradas */}
          {entradasFiltradas.length === 0 ? (
            <div className="text-center p-4 text-muted">
              <ArrowDownCircle size={48} className="mb-3" />
              <p>Nenhuma entrada encontrada.</p>
            </div>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Obra</th>
                  <th>Valor</th>
                  <th>Data</th>
                  <th>Status</th>
                  <th>Observações</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {entradasFiltradas.map((entrada) => {
                  const statusBadge = getStatusBadge(entrada.statusRecebimento)

                  return (
                    <tr key={entrada._id}>
                      <td>
                        <strong>{entrada.nome || "-"}</strong>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <Building size={14} className="me-1 text-muted" />
                          {getObraNome(entrada)}
                        </div>
                      </td>
                      <td>
                        <strong className="text-success">{formatCurrency(entrada.valor)}</strong>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <Calendar size={14} className="me-1 text-muted" />
                          {formatDate(entrada.data)}
                        </div>
                      </td>
                      <td>
                        <Badge bg={statusBadge.variant}>{statusBadge.label}</Badge>
                      </td>
                      <td>
                        <small className="text-muted">{entrada.observacoes || "-"}</small>
                      </td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => onEditEntrada && onEditEntrada(entrada)}
                          title="Editar Entrada"
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => onDeleteEntrada && onDeleteEntrada(entrada._id)}
                          title="Excluir Entrada"
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

export default EntradasList
