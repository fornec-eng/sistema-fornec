"use client"

import { useState, useEffect } from "react"
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Spinner,
  Modal,
  Button,
  FormSelect,
  InputGroup,
  FormControl,
  Tooltip,
  OverlayTrigger,
  Badge,
  ProgressBar,
  Alert,
} from "react-bootstrap"
import { DollarSign, CheckCircle, AlertCircle, Download, FileText, Briefcase, Copy } from "lucide-react"
import PagamentosApi from "../services/PagamentosApi"

const PagamentoCard = () => {
  // Estados para armazenar dados
  const [projetos, setProjetos] = useState([])
  const [projetoSelecionado, setProjetoSelecionado] = useState("")
  const [pagamentos, setPagamentos] = useState([])

  // Controle de loading
  const [loadingProjetos, setLoadingProjetos] = useState(false)
  const [loadingPagamentos, setLoadingPagamentos] = useState(false)

  // Modal de detalhes
  const [showModal, setShowModal] = useState(false)
  const [pagamentoSelecionado, setPagamentoSelecionado] = useState(null)

  // Controle de cópia de PIX
  const [copied, setCopied] = useState(false)

  // Estados para alertas
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Estatísticas de pagamento
  const [estatisticas, setEstatisticas] = useState({
    totalDevido: 0,
    totalPago: 0,
    totalPendente: 0,
    percentualPago: 0,
    pagamentosPagos: 0,
    pagamentosPendentes: 0,
  })

  // Função para converter string de moeda para número
  const converterParaNumero = (valorString) => {
    if (!valorString || typeof valorString !== "string") return 0

    // Remover o símbolo R$ e espaços
    const valorLimpo = valorString.replace("R$", "").trim()

    // Substituir ponto por nada (remover separador de milhar) e vírgula por ponto (para decimal)
    const valorNumerico = Number.parseFloat(valorLimpo.replace(/\./g, "").replace(",", "."))

    return isNaN(valorNumerico) ? 0 : valorNumerico
  }

  // Ao montar, busca os projetos
  useEffect(() => {
    fetchProjetos()
  }, [])

  // Quando um projeto é selecionado, busca seus pagamentos
  useEffect(() => {
    if (projetoSelecionado) {
      fetchPagamentosProjeto(projetoSelecionado)
    }
  }, [projetoSelecionado])

  const fetchProjetos = async () => {
    setLoadingProjetos(true)
    try {
      const response = await PagamentosApi.listarPagamentos(1, 50)
      setProjetos(response.pagamentos || [])

      // Se houver projetos, seleciona o primeiro por padrão
      if (response.pagamentos && response.pagamentos.length > 0) {
        setProjetoSelecionado(response.pagamentos[0]._id)
      }
    } catch (error) {
      console.error("Erro ao buscar projetos:", error)
      setError("Erro ao carregar projetos")
    } finally {
      setLoadingProjetos(false)
    }
  }

  const fetchPagamentosProjeto = async (projetoId) => {
    setLoadingPagamentos(true)
    try {
      const response = await PagamentosApi.buscarPagamento(projetoId)
      const projeto = response.pagamento

      if (projeto && projeto.pagamentosSemanais) {
        setPagamentos(projeto.pagamentosSemanais)
        calcularEstatisticas(projeto.pagamentosSemanais)
      } else {
        setPagamentos([])
        calcularEstatisticas([])
      }
    } catch (error) {
      console.error("Erro ao buscar pagamentos:", error)
      setError("Erro ao carregar pagamentos do projeto")
      setPagamentos([])
      calcularEstatisticas([])
    } finally {
      setLoadingPagamentos(false)
    }
  }

  // Função para calcular estatísticas de pagamento
  const calcularEstatisticas = (pagamentos) => {
    let totalDevido = 0
    let totalPago = 0
    let totalPendente = 0
    let pagamentosPagos = 0
    let pagamentosPendentes = 0

    pagamentos.forEach((pagamento) => {
      const valorTotal = pagamento.totalReceber || 0

      totalDevido += valorTotal

      if (pagamento.status === "pagamento efetuado") {
        totalPago += valorTotal
        pagamentosPagos++
      } else if (pagamento.status === "pagar") {
        totalPendente += valorTotal
        pagamentosPendentes++
      }
    })

    const percentualPago = totalDevido > 0 ? (totalPago / totalDevido) * 100 : 0

    setEstatisticas({
      totalDevido,
      totalPago,
      totalPendente,
      percentualPago,
      pagamentosPagos,
      pagamentosPendentes,
    })
  }

  // Abre o modal com detalhes de um pagamento
  const handleShowModal = (pagamento) => {
    setPagamentoSelecionado(pagamento)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setPagamentoSelecionado(null)
    setCopied(false)
  }

  // Cópia da chave PIX
  const handleCopyPix = (chavePix) => {
    navigator.clipboard.writeText(chavePix)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Marcar pagamento como efetuado
  const handleMarcarPago = async (pagamentoId) => {
    try {
      await PagamentosApi.marcarPagamentoEfetuado(projetoSelecionado, pagamentoId)
      setSuccess("Pagamento marcado como efetuado!")
      fetchPagamentosProjeto(projetoSelecionado)
      handleCloseModal()
    } catch (error) {
      setError("Erro ao marcar pagamento como efetuado")
    }
  }

  // Retorna a classe (ou estilo) baseado no status
  const getStatusBadgeClass = (status) => {
    if (status === "pagar") {
      return "warning"
    } else if (status === "pagamento efetuado") {
      return "success"
    }
    return "secondary"
  }

  // Formatar valor como moeda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0)
  }

  // Obter a data atual formatada
  const getDataAtual = () => {
    const data = new Date()
    return data.toLocaleDateString("pt-BR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  // Função para exportar relatório (simulada)
  const exportarRelatorio = () => {
    alert("Funcionalidade de exportação será implementada em breve!")
  }

  // Obter nome do projeto selecionado
  const getNomeProjeto = () => {
    const projeto = projetos.find((p) => p._id === projetoSelecionado)
    return projeto ? projeto.obra.nome : "Projeto"
  }

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <h1 className="mb-2">Gestão de Pagamentos Semanais</h1>
          <p className="text-muted">{getDataAtual()}</p>
        </Col>
      </Row>

      {/* Alertas */}
      {error && (
        <Alert variant="danger" onClose={() => setError("")} dismissible>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" onClose={() => setSuccess("")} dismissible>
          {success}
        </Alert>
      )}

      {loadingProjetos ? (
        <div className="d-flex align-items-center justify-content-center p-5">
          <Spinner animation="border" variant="primary" className="me-2" />
          <span>Carregando projetos...</span>
        </div>
      ) : (
        <>
          {/* Seleção de Projeto */}
          <Row className="mb-4">
            <Col md={6}>
              <Card className="shadow-sm border-0">
                <Card.Body>
                  <Card.Title className="d-flex align-items-center mb-3">
                    <Briefcase className="me-2" size={20} />
                    Selecionar Projeto
                  </Card.Title>
                  <FormSelect value={projetoSelecionado} onChange={(e) => setProjetoSelecionado(e.target.value)}>
                    <option value="">Selecione um projeto...</option>
                    {projetos.map((projeto) => (
                      <option key={projeto._id} value={projeto._id}>
                        {projeto.obra.nome}
                      </option>
                    ))}
                  </FormSelect>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="shadow-sm border-0">
                <Card.Body>
                  <Card.Title className="d-flex align-items-center mb-3">
                    <FileText className="me-2" size={20} />
                    Projeto Atual
                  </Card.Title>
                  <p className="mb-0">{projetoSelecionado ? getNomeProjeto() : "Nenhum projeto selecionado"}</p>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Cards de resumo */}
          {projetoSelecionado && (
            <Row className="mb-4">
              <Col lg={3} md={6} className="mb-3">
                <Card className="h-100 shadow-sm border-0">
                  <Card.Body>
                    <div className="d-flex align-items-center mb-3">
                      <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3">
                        <DollarSign className="text-primary" size={24} />
                      </div>
                      <div>
                        <h6 className="text-muted mb-0">Total Devido</h6>
                        <h4 className="mb-0">{formatCurrency(estatisticas.totalDevido)}</h4>
                      </div>
                    </div>
                    <ProgressBar
                      now={estatisticas.percentualPago}
                      variant="primary"
                      className="mb-2"
                      style={{ height: "8px" }}
                    />
                    <small className="text-muted">
                      {estatisticas.percentualPago.toFixed(1)}% do valor total já foi pago
                    </small>
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={3} md={6} className="mb-3">
                <Card className="h-100 shadow-sm border-0">
                  <Card.Body>
                    <div className="d-flex align-items-center mb-3">
                      <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3">
                        <CheckCircle className="text-success" size={24} />
                      </div>
                      <div>
                        <h6 className="text-muted mb-0">Pagamentos Efetuados</h6>
                        <h4 className="mb-0">{formatCurrency(estatisticas.totalPago)}</h4>
                      </div>
                    </div>
                    <p className="text-muted mb-0">
                      <small>{estatisticas.pagamentosPagos} pagamentos concluídos</small>
                    </p>
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={3} md={6} className="mb-3">
                <Card className="h-100 shadow-sm border-0">
                  <Card.Body>
                    <div className="d-flex align-items-center mb-3">
                      <div className="rounded-circle bg-warning bg-opacity-10 p-3 me-3">
                        <AlertCircle className="text-warning" size={24} />
                      </div>
                      <div>
                        <h6 className="text-muted mb-0">Pagamentos Pendentes</h6>
                        <h4 className="mb-0">{formatCurrency(estatisticas.totalPendente)}</h4>
                      </div>
                    </div>
                    <p className="text-muted mb-0">
                      <small>{estatisticas.pagamentosPendentes} pagamentos aguardando</small>
                    </p>
                  </Card.Body>
                </Card>
              </Col>

              <Col lg={3} md={6} className="mb-3">
                <Card className="h-100 shadow-sm border-0">
                  <Card.Body>
                    <div className="d-flex align-items-center mb-3">
                      <div className="rounded-circle bg-info bg-opacity-10 p-3 me-3">
                        <FileText className="text-info" size={24} />
                      </div>
                      <div>
                        <h6 className="text-muted mb-0">Total de Registros</h6>
                        <h4 className="mb-0">{pagamentos.length}</h4>
                      </div>
                    </div>
                    <p className="text-muted mb-0">
                      <small>
                        Média de {formatCurrency(estatisticas.totalDevido / (pagamentos.length || 1))} por registro
                      </small>
                    </p>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
          )}

          <Card className="shadow-sm border-0 mb-4">
            <Card.Header className="bg-white d-flex justify-content-between align-items-center">
              <Card.Title className="mb-0">Registros de Pagamento</Card.Title>
              <Button
                variant="outline-primary"
                size="sm"
                onClick={exportarRelatorio}
                className="d-flex align-items-center"
              >
                <Download size={16} className="me-2" />
                Exportar
              </Button>
            </Card.Header>

            <Card.Body>
              {loadingPagamentos ? (
                <div className="d-flex align-items-center justify-content-center p-5">
                  <Spinner animation="border" variant="primary" className="me-2" />
                  <span>Carregando pagamentos...</span>
                </div>
              ) : !projetoSelecionado ? (
                <div className="text-center p-5">
                  <p className="text-muted">Selecione um projeto para visualizar os pagamentos.</p>
                </div>
              ) : pagamentos.length === 0 ? (
                <div className="text-center p-5">
                  <p className="text-muted">Nenhum pagamento encontrado para este projeto.</p>
                </div>
              ) : (
                <div style={{ maxHeight: "500px", overflowY: "auto" }}>
                  <Table striped hover responsive>
                    <thead className="bg-light">
                      <tr>
                        <th>Nome</th>
                        <th>Função</th>
                        <th>Tipo Contratação</th>
                        <th>Valor a Pagar</th>
                        <th>Total a Receber</th>
                        <th>Semana/Ano</th>
                        <th>Status</th>
                        <th style={{ width: "120px" }}>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pagamentos.map((pagamento, idx) => (
                        <tr key={pagamento._id || idx}>
                          <td>{pagamento.nome}</td>
                          <td>{pagamento.funcao}</td>
                          <td>{pagamento.tipoContratacao}</td>
                          <td>{formatCurrency(pagamento.valorPagar)}</td>
                          <td>{formatCurrency(pagamento.totalReceber)}</td>
                          <td>
                            {pagamento.semana}/{pagamento.ano}
                          </td>
                          <td>
                            <Badge bg={getStatusBadgeClass(pagamento.status)}>{pagamento.status}</Badge>
                          </td>
                          <td>
                            <Button variant="outline-primary" size="sm" onClick={() => handleShowModal(pagamento)}>
                              Detalhes
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Seção de estatísticas por tipo de contratação */}
          {pagamentos.length > 0 && (
            <Card className="shadow-sm border-0 mb-4">
              <Card.Header className="bg-white">
                <Card.Title className="mb-0 d-flex align-items-center">
                  <Briefcase className="me-2" size={20} />
                  Estatísticas por Tipo
                </Card.Title>
              </Card.Header>
              <Card.Body>
                <Row>
                  {(() => {
                    // Agrupar pagamentos por tipo
                    const tiposContratacao = {}
                    pagamentos.forEach((pagamento) => {
                      const tipo = pagamento.tipoContratacao || "Não especificado"
                      if (!tiposContratacao[tipo]) {
                        tiposContratacao[tipo] = {
                          count: 0,
                          totalDevido: 0,
                        }
                      }
                      tiposContratacao[tipo].count++
                      tiposContratacao[tipo].totalDevido += pagamento.totalReceber || 0
                    })

                    // Renderizar cards para cada tipo
                    return Object.entries(tiposContratacao).map(([tipo, dados], index) => (
                      <Col md={4} key={index} className="mb-3">
                        <Card className="h-100 border-0 shadow-sm">
                          <Card.Body>
                            <h5>{tipo}</h5>
                            <div className="d-flex justify-content-between mb-2">
                              <span className="text-muted">Registros:</span>
                              <span className="fw-bold">{dados.count}</span>
                            </div>
                            <div className="d-flex justify-content-between">
                              <span className="text-muted">Valor Total:</span>
                              <span className="fw-bold">{formatCurrency(dados.totalDevido)}</span>
                            </div>
                          </Card.Body>
                        </Card>
                      </Col>
                    ))
                  })()}
                </Row>
              </Card.Body>
            </Card>
          )}
        </>
      )}

      {/* Modal de detalhes */}
      {pagamentoSelecionado && (
        <Modal show={showModal} onHide={handleCloseModal} centered size="lg">
          <Modal.Header closeButton className="bg-light">
            <Modal.Title>Detalhes do Pagamento</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <h5 className="mb-3">Informações Gerais</h5>
                <p>
                  <strong>Nome:</strong> {pagamentoSelecionado.nome}
                </p>
                <p>
                  <strong>Função:</strong> {pagamentoSelecionado.funcao}
                </p>
                <p>
                  <strong>Tipo de Contratação:</strong> {pagamentoSelecionado.tipoContratacao}
                </p>
                <p>
                  <strong>Qualificação Técnica:</strong> {pagamentoSelecionado.qualificacaoTecnica}
                </p>
                <p>
                  <strong>Início do Contrato:</strong>{" "}
                  {new Date(pagamentoSelecionado.dataInicio).toLocaleDateString("pt-BR")}
                </p>
                <p>
                  <strong>Fim do Contrato:</strong>{" "}
                  {new Date(pagamentoSelecionado.dataFimContrato).toLocaleDateString("pt-BR")}
                </p>
              </Col>
              <Col md={6}>
                <h5 className="mb-3">Informações Financeiras</h5>
                <p>
                  <strong>Valor a Pagar:</strong> {formatCurrency(pagamentoSelecionado.valorPagar)}
                </p>
                <p>
                  <strong>Valor do VT:</strong> {formatCurrency(pagamentoSelecionado.valorVT)}
                </p>
                <p>
                  <strong>Valor da VA:</strong> {formatCurrency(pagamentoSelecionado.valorVA)}
                </p>
                <p>
                  <strong>Total a Receber:</strong>{" "}
                  <span className="fw-bold">{formatCurrency(pagamentoSelecionado.totalReceber)}</span>
                </p>
                <p>
                  <strong>Semana/Ano:</strong> {pagamentoSelecionado.semana}/{pagamentoSelecionado.ano}
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  <Badge bg={getStatusBadgeClass(pagamentoSelecionado.status)}>{pagamentoSelecionado.status}</Badge>
                </p>
              </Col>
            </Row>

            <hr />

            <h5 className="mb-3">Informações de Pagamento</h5>
            <p>
              <strong>Nome do Beneficiário:</strong> {pagamentoSelecionado.nomeChavePix}
            </p>
            <p>
              <strong>Chave PIX:</strong>
            </p>
            <InputGroup className="mb-3">
              <FormControl value={pagamentoSelecionado.chavePix} readOnly style={{ cursor: "pointer" }} />
              <OverlayTrigger
                placement="top"
                overlay={<Tooltip id="tooltip-copy">{copied ? "Chave PIX copiada!" : "Clique para copiar"}</Tooltip>}
              >
                <Button variant="outline-primary" onClick={() => handleCopyPix(pagamentoSelecionado.chavePix)}>
                  <Copy size={16} />
                </Button>
              </OverlayTrigger>
            </InputGroup>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Fechar
            </Button>
            {pagamentoSelecionado.status === "pagar" && (
              <Button variant="success" onClick={() => handleMarcarPago(pagamentoSelecionado._id)}>
                Marcar como Pago
              </Button>
            )}
          </Modal.Footer>
        </Modal>
      )}
    </Container>
  )
}

export default PagamentoCard
