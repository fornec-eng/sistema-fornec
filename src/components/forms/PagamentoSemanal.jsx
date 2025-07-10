"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Table, Button, Form, Spinner, Alert, Badge } from "react-bootstrap"
import { ArrowLeft, CheckCircle, Clock, DollarSign, Filter, Calendar } from "lucide-react"
import { useNavigate } from "react-router-dom"
import apiService from "../services/apiService"

const PagamentoSemanal = () => {
  const navigate = useNavigate()
  const [todosPagamentos, setTodosPagamentos] = useState([])
  const [pagamentosFiltrados, setPagamentosFiltrados] = useState([])
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState({ show: false, message: "", variant: "" })

  // Filtros
  const [filtroObra, setFiltroObra] = useState("todos")
  const [filtroStatus, setFiltroStatus] = useState("todos")
  const [obras, setObras] = useState([])

  const showAlert = (message, variant = "success", duration = 5000) => {
    setAlert({ show: true, message, variant })
    setTimeout(() => setAlert({ show: false, message: "", variant: "" }), duration)
  }

  // Função para obter o início da semana (segunda-feira)
  const getInicioSemana = (data = new Date()) => {
    const d = new Date(data)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Ajusta para segunda-feira
    const inicioSemana = new Date(d.setDate(diff))
    inicioSemana.setHours(0, 0, 0, 0)
    return inicioSemana
  }

  // Função para obter o fim da semana (domingo)
  const getFimSemana = (data = new Date()) => {
    const inicioSemana = getInicioSemana(data)
    const fimSemana = new Date(inicioSemana)
    fimSemana.setDate(inicioSemana.getDate() + 6)
    fimSemana.setHours(23, 59, 59, 999)
    return fimSemana
  }

  useEffect(() => {
    fetchTodosPagamentos()
  }, [])

  useEffect(() => {
    aplicarFiltros()
  }, [todosPagamentos, filtroObra, filtroStatus])

  const fetchTodosPagamentos = async () => {
    setLoading(true)

    try {
      const response = await apiService.buscarTodosPagamentosSemanais()

      if (!response.error) {
        const pagamentos = response.pagamentos || []

        // Filtrar apenas pagamentos da semana atual
        const inicioSemana = getInicioSemana()
        const fimSemana = getFimSemana()

        const pagamentosSemanaAtual = pagamentos.filter((pagamento) => {
          // Verificar se tem data de pagamento definida
          if (!pagamento.dataPagamento && !pagamento.dataVencimento) {
            return true // Incluir pagamentos sem data específica
          }

          const dataPagamento = new Date(pagamento.dataPagamento || pagamento.dataVencimento)
          return dataPagamento >= inicioSemana && dataPagamento <= fimSemana
        })

        setTodosPagamentos(pagamentosSemanaAtual)

        // Extrair obras únicas para o filtro
        const obrasUnicas = [...new Set(pagamentosSemanaAtual.map((p) => p.obraNome))]
          .filter(Boolean)
          .map((nome) => ({ nome }))
        setObras(obrasUnicas)
      } else {
        showAlert("Erro ao carregar pagamentos", "danger")
      }
    } catch (error) {
      console.error("Erro ao buscar pagamentos semanais:", error)
      showAlert("Erro ao carregar pagamentos", "danger")
    } finally {
      setLoading(false)
    }
  }

  const aplicarFiltros = () => {
    let pagamentosFiltrados = [...todosPagamentos]

    // Filtro por obra
    if (filtroObra !== "todos") {
      if (filtroObra === "fornec") {
        pagamentosFiltrados = pagamentosFiltrados.filter((p) => p.tipoGasto === "fornec" || !p.obraNome)
      } else {
        pagamentosFiltrados = pagamentosFiltrados.filter((p) => p.obraNome === filtroObra)
      }
    }

    // Filtro por status
    if (filtroStatus !== "todos") {
      if (filtroStatus === "pago") {
        pagamentosFiltrados = pagamentosFiltrados.filter((p) => p.pago || p.status === "pago")
      } else if (filtroStatus === "pendente") {
        pagamentosFiltrados = pagamentosFiltrados.filter((p) => !p.pago && p.status !== "pago")
      }
    }

    setPagamentosFiltrados(pagamentosFiltrados)
  }

  const marcarComoEfetuado = async (obraId, pagamentoId) => {
    try {
      await apiService.marcarPagamentoEfetuado(obraId, pagamentoId)
      showAlert("Pagamento marcado como efetuado!", "success")
      // Recarregar dados
      fetchTodosPagamentos()
    } catch (error) {
      console.error("Erro ao marcar pagamento como efetuado:", error)
      showAlert("Erro ao marcar pagamento como efetuado", "danger")
    }
  }

  const formatCurrency = (value) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0)

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    return new Date(dateString).toLocaleDateString("pt-BR")
  }

  const calcularTotais = () => {
    const total = pagamentosFiltrados.reduce((acc, p) => acc + (p.valorAReceber || p.totalReceber || p.valor || 0), 0)
    const pago = pagamentosFiltrados
      .filter((p) => p.pago || p.status === "pago")
      .reduce((acc, p) => acc + (p.valorAReceber || p.totalReceber || p.valor || 0), 0)
    const pendente = total - pago

    return { total, pago, pendente }
  }

  const totais = calcularTotais()
  const inicioSemana = getInicioSemana()
  const fimSemana = getFimSemana()

  return (
    <Container className="mt-4 mb-5">
      {/* Header */}
      <Row className="mb-4">
        <Col>
          <div className="d-flex align-items-center">
            <Button variant="outline-secondary" className="me-3" onClick={() => navigate(-1)}>
              <ArrowLeft size={16} />
            </Button>
            <div>
              <h1 className="mb-0">Pagamentos Semanais</h1>
              <small className="text-muted">
                <Calendar size={14} className="me-1" />
                Semana de {formatDate(inicioSemana)} a {formatDate(fimSemana)}
              </small>
            </div>
          </div>
        </Col>
      </Row>

      {alert.show && (
        <Alert variant={alert.variant} onClose={() => setAlert({ show: false })} dismissible>
          {alert.message}
        </Alert>
      )}

      {/* Filtros */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0 d-flex align-items-center">
            <Filter size={16} className="me-2" />
            Filtros
          </h5>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Filtrar por Obra/Empresa</Form.Label>
                <Form.Select value={filtroObra} onChange={(e) => setFiltroObra(e.target.value)}>
                  <option value="todos">Todos os gastos</option>
                  <option value="fornec">Gastos da Fornec</option>
                  {obras.map((obra, index) => (
                    <option key={index} value={obra.nome}>
                      {obra.nome}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Label>Filtrar por Status</Form.Label>
                <Form.Select value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
                  <option value="todos">Todos os status</option>
                  <option value="pago">Pagos</option>
                  <option value="pendente">Pendentes</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Resumo Financeiro */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="text-center border-primary">
            <Card.Body>
              <DollarSign size={24} className="text-primary mb-2" />
              <h5 className="text-primary">{formatCurrency(totais.total)}</h5>
              <small className="text-muted">Total da Semana</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center border-success">
            <Card.Body>
              <CheckCircle size={24} className="text-success mb-2" />
              <h5 className="text-success">{formatCurrency(totais.pago)}</h5>
              <small className="text-muted">Já Pago</small>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4}>
          <Card className="text-center border-warning">
            <Card.Body>
              <Clock size={24} className="text-warning mb-2" />
              <h5 className="text-warning">{formatCurrency(totais.pendente)}</h5>
              <small className="text-muted">Pendente</small>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Tabela de Pagamentos */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">
            Lista de Pagamentos
            <Badge bg="secondary" className="ms-2">
              {pagamentosFiltrados.length} {pagamentosFiltrados.length === 1 ? "item" : "itens"}
            </Badge>
          </h5>
        </Card.Header>
        <Card.Body className="p-0">
          {loading ? (
            <div className="text-center p-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">Carregando pagamentos...</p>
            </div>
          ) : (
            <Table responsive hover className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>Nome/Descrição</th>
                  <th>Obra/Empresa</th>
                  <th>Tipo</th>
                  <th className="text-end">Valor</th>
                  <th>Data Pagamento</th>
                  <th className="text-center">Status</th>
                  <th className="text-center">Ações</th>
                </tr>
              </thead>
              <tbody>
                {pagamentosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-5 text-muted">
                      Nenhum pagamento encontrado para os filtros selecionados
                    </td>
                  </tr>
                ) : (
                  pagamentosFiltrados.map((pagamento, index) => (
                    <tr key={`${pagamento.obraId || "fornec"}-${pagamento._id || index}`}>
                      <td>
                        <strong>{pagamento.nome || pagamento.descricao || "N/A"}</strong>
                        {pagamento.funcao && <small className="d-block text-muted">{pagamento.funcao}</small>}
                      </td>
                      <td>
                        <Badge bg={pagamento.obraNome ? "primary" : "success"}>{pagamento.obraNome || "Fornec"}</Badge>
                      </td>
                      <td>
                        <small className="text-muted">
                          {pagamento.tipoContratacao || pagamento.tipo || "Pagamento"}
                        </small>
                      </td>
                      <td className="text-end">
                        <strong>
                          {formatCurrency(pagamento.valorAReceber || pagamento.totalReceber || pagamento.valor || 0)}
                        </strong>
                      </td>
                      <td>{formatDate(pagamento.dataPagamento || pagamento.dataVencimento)}</td>
                      <td className="text-center">
                        <Badge bg={pagamento.pago || pagamento.status === "pago" ? "success" : "warning"}>
                          {pagamento.pago || pagamento.status === "pago" ? "Pago" : "Pendente"}
                        </Badge>
                      </td>
                      <td className="text-center">
                        {!(pagamento.pago || pagamento.status === "pago") && pagamento.obraId ? (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => marcarComoEfetuado(pagamento.obraId, pagamento._id)}
                          >
                            <CheckCircle size={14} className="me-1" />
                            Marcar Pago
                          </Button>
                        ) : (
                          <Badge bg="success">
                            <CheckCircle size={14} className="me-1" />
                            Efetuado
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          )}
        </Card.Body>
      </Card>
    </Container>
  )
}

export default PagamentoSemanal
