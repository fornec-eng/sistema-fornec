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
} from "react-bootstrap"
import { DollarSign, Calendar, CheckCircle, AlertCircle, Clock, Download, FileText, Briefcase } from "lucide-react"
import ApiBase from "../services/ApiBase"

const PagamentoCard = () => {
  // Pastas do Google Drive
  const FOLDER_ATUAL_ID = "1JWqpHfPvYy9B846cXPTYotImfd3xqhRC" // Pagamentos atuais
  const FOLDER_HISTORICO_ID = "1BMKBm2pk16I-KyrTyd1l2GpBU4t2Id_o" // Histórico de pagamentos

  // Estados para armazenar a lista de planilhas de cada pasta
  const [planilhasAtuais, setPlanilhasAtuais] = useState([])
  const [planilhasHistorico, setPlanilhasHistorico] = useState([])

  // Planilha selecionada (ID) e dados carregados
  const [selectedSpreadsheetId, setSelectedSpreadsheetId] = useState("")
  const [pagamentos, setPagamentos] = useState([])

  // Controle de loading
  const [loadingPlanilhas, setLoadingPlanilhas] = useState(false)
  const [loadingDados, setLoadingDados] = useState(false)

  // Modal de detalhes
  const [showModal, setShowModal] = useState(false)
  const [pagamentoSelecionado, setPagamentoSelecionado] = useState(null)

  // Controle de cópia de PIX
  const [copied, setCopied] = useState(false)

  // Estatísticas de pagamento
  const [estatisticas, setEstatisticas] = useState({
    totalDevido: 0,
    totalPago: 0,
    totalPendente: 0,
    percentualPago: 0,
    pagamentosPagos: 0,
    pagamentosPendentes: 0,
  })

  // Nomes de planilhas a serem ignoradas
  const IGNORAR_NOMES = ["Automatização da Planilha Semanal", "Modelo", "Histórico"]

  // Função para converter string de moeda para número
  const converterParaNumero = (valorString) => {
    if (!valorString || typeof valorString !== "string") return 0

    // Remover o símbolo R$ e espaços
    const valorLimpo = valorString.replace("R$", "").trim()

    // Substituir ponto por nada (remover separador de milhar) e vírgula por ponto (para decimal)
    const valorNumerico = Number.parseFloat(valorLimpo.replace(/\./g, "").replace(",", "."))

    return isNaN(valorNumerico) ? 0 : valorNumerico
  }

  // Ao montar, busca as planilhas das duas pastas
  useEffect(() => {
    const fetchPlanilhas = async () => {
      try {
        setLoadingPlanilhas(true)

        // 1) Busca planilhas de pagamentos atuais
        const resAtuais = await ApiBase.get(`/google/drive/${FOLDER_ATUAL_ID}`)
        const listaAtuais = (resAtuais.data || []).filter((plan) => !IGNORAR_NOMES.includes(plan.name))
        setPlanilhasAtuais(listaAtuais)

        // 2) Busca planilhas de histórico de pagamentos
        const resHistorico = await ApiBase.get(`/google/drive/${FOLDER_HISTORICO_ID}`)
        const listaHistorico = (resHistorico.data || []).filter((plan) => !IGNORAR_NOMES.includes(plan.name))
        setPlanilhasHistorico(listaHistorico)

        // Se houver ao menos 1 planilha atual, define como selecionada por padrão
        if (listaAtuais.length > 0) {
          const primeiraPlanilha = listaAtuais[0]
          setSelectedSpreadsheetId(primeiraPlanilha.id)
          carregarDadosPlanilha(primeiraPlanilha.id)
        }
      } catch (error) {
        console.error("Erro ao listar planilhas:", error)
      } finally {
        setLoadingPlanilhas(false)
      }
    }

    fetchPlanilhas()
  }, [])

  // Função para buscar os dados do range 'pagamento_semanal' da planilha selecionada
  const carregarDadosPlanilha = async (spreadsheetId) => {
    if (!spreadsheetId) return
    try {
      setLoadingDados(true)

      // Faz a requisição para /google/sheets/data
      const res = await ApiBase.post("/google/sheets/data", {
        data: {
          spreadsheetId,
          range: "pagamento_semanal",
        },
      })

      const rows = res.data.values || []
      console.log("Retorno da planilha:", rows)

      // Verifica se há pelo menos 2 linhas:
      // - Linha 0 (título extra, ex.: "Mão de Obra")
      // - Linha 1 (cabeçalho real)
      if (rows.length < 2) {
        setPagamentos([])
        setLoadingDados(false)
        return
      }

      // A linha 1 (rows[1]) é o cabeçalho real
      const headerRow = rows[1]

      // Mapeia cada coluna ao índice correspondente
      const indices = {
        nome: headerRow.indexOf("Nome"),
        funcao: headerRow.indexOf("Função"),
        tipoContratacao: headerRow.indexOf("Tipo de Contratação"),
        valorDevido: headerRow.indexOf("Valor Devido"),
        inicioContrato: headerRow.indexOf("Início contrato"),
        fimContrato: headerRow.indexOf("Fim contrato"),
        chavePix: headerRow.indexOf("CHAVE PIX"),
        nomePix: headerRow.indexOf("NOME DO PIX"),
        qualificacaoTecnica: headerRow.indexOf("QUALIFICAÇÃO TECNICA"),
        valorVT: headerRow.indexOf("VALOR DO VT"),
        valorAlimentacao: headerRow.indexOf("VALOR DA ALIMENTAÇÃO"),
        vtAlimentacaoSemana: headerRow.indexOf("VALOR DO VT MAIS ALIMENT NA SEMANA"),
        vale: headerRow.indexOf("VALE"),
        totalReceber: headerRow.indexOf("TOTAL A RECEBER"),
        status: headerRow.indexOf("Status:"),
      }

      // As linhas de dados começam em rows[2]
      const dataRows = rows.slice(2)

      // Monta a lista de pagamentos
      const parsedPagamentos = dataRows.map((row) => ({
        nome: row[indices.nome] || "",
        funcao: row[indices.funcao] || "",
        tipoContratacao: row[indices.tipoContratacao] || "",
        valorDevido: row[indices.valorDevido] || "",
        inicioContrato: row[indices.inicioContrato] || "",
        fimContrato: row[indices.fimContrato] || "",
        chavePix: row[indices.chavePix] || "",
        nomePix: row[indices.nomePix] || "",
        qualificacaoTecnica: row[indices.qualificacaoTecnica] || "",
        valorVT: row[indices.valorVT] || "",
        valorAlimentacao: row[indices.valorAlimentacao] || "",
        vtAlimentacaoSemana: row[indices.vtAlimentacaoSemana] || "",
        vale: row[indices.vale] || "",
        totalReceber: row[indices.totalReceber] || "",
        status: row[indices.status] || "",
      }))

      setPagamentos(parsedPagamentos)

      // Calcular estatísticas
      calcularEstatisticas(parsedPagamentos)
    } catch (error) {
      console.error("Erro ao carregar dados da planilha:", error)
      setPagamentos([])
    } finally {
      setLoadingDados(false)
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
      // Converter valor devido para número usando a função auxiliar
      const valorNumerico = converterParaNumero(pagamento.valorDevido)

      totalDevido += valorNumerico

      if (pagamento.status === "Pagamento Efetuado") {
        totalPago += valorNumerico
        pagamentosPagos++
      } else if (pagamento.status === "Pagar") {
        totalPendente += valorNumerico
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

  // Quando o usuário seleciona uma planilha no dropdown, carrega seus dados
  const handleSelectPlanilha = (e) => {
    const chosenId = e.target.value
    setSelectedSpreadsheetId(chosenId)
    carregarDadosPlanilha(chosenId)
  }

  // Retorna a classe (ou estilo) baseado no status
  const getStatusBadgeClass = (status) => {
    if (status === "Pagar") {
      return "bg-warning text-dark" // Amarelo
    } else if (status === "Pagamento Efetuado") {
      return "bg-success" // Verde
    }
    return "bg-secondary" // Cinza (caso apareça algum outro status)
  }

  // Formatar valor como moeda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value)
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

  return (
    <Container className="mt-4">
      <Row className="mb-4">
        <Col>
          <h1 className="mb-2">Gestão de Pagamentos</h1>
          <p className="text-muted">{getDataAtual()}</p>
        </Col>
      </Row>

      {loadingPlanilhas ? (
        <div className="d-flex align-items-center justify-content-center p-5">
          <Spinner animation="border" variant="primary" className="me-2" />
          <span>Carregando planilhas...</span>
        </div>
      ) : (
        <>
          {/* Cards de resumo */}
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

          <Row className="mb-4">
            <Col md={6}>
              <Card className="shadow-sm border-0">
                <Card.Body>
                  <Card.Title className="d-flex align-items-center mb-3">
                    <Calendar className="me-2" size={20} />
                    Semana Atual
                  </Card.Title>
                  <FormSelect onChange={handleSelectPlanilha} value={selectedSpreadsheetId}>
                    <option value="">Selecione uma planilha...</option>
                    {planilhasAtuais.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name}
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
                    <Clock className="me-2" size={20} />
                    Histórico de Semanas
                  </Card.Title>
                  <FormSelect onChange={handleSelectPlanilha} value={selectedSpreadsheetId}>
                    <option value="">Selecione uma semana anterior...</option>
                    {planilhasHistorico.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name}
                      </option>
                    ))}
                  </FormSelect>
                </Card.Body>
              </Card>
            </Col>
          </Row>

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
              {loadingDados ? (
                <div className="d-flex align-items-center justify-content-center p-5">
                  <Spinner animation="border" variant="primary" className="me-2" />
                  <span>Carregando dados...</span>
                </div>
              ) : (
                <div style={{ maxHeight: "500px", overflowY: "auto" }}>
                  {pagamentos.length === 0 ? (
                    <div className="text-center p-5">
                      <p className="text-muted">Nenhum registro encontrado.</p>
                      <p className="text-muted small">Selecione uma planilha para visualizar os dados.</p>
                    </div>
                  ) : (
                    <Table striped hover responsive>
                      <thead className="bg-light">
                        <tr>
                          <th>Nome/Descrição</th>
                          <th>Tipo</th>
                          <th>Valor Devido</th>
                          <th>Status</th>
                          <th style={{ width: "120px" }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagamentos.map((pagamento, idx) => (
                          <tr key={idx}>
                            <td>{pagamento.nome}</td>
                            <td>{pagamento.funcao}</td>
                            <td>{pagamento.valorDevido}</td>
                            <td>
                              <Badge className={`${getStatusBadgeClass(pagamento.status)}`}>{pagamento.status}</Badge>
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
                  )}
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

                      // Usar a função auxiliar para converter o valor
                      tiposContratacao[tipo].totalDevido += converterParaNumero(pagamento.valorDevido)
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
                  <strong>Nome/Descrição:</strong> {pagamentoSelecionado.nome}
                </p>
                <p>
                  <strong>Tipo:</strong> {pagamentoSelecionado.funcao}
                </p>
                <p>
                  <strong>Categoria:</strong> {pagamentoSelecionado.tipoContratacao}
                </p>
                <p>
                  <strong>Qualificação/Detalhes:</strong> {pagamentoSelecionado.qualificacaoTecnica}
                </p>
                <p>
                  <strong>Início contrato/serviço:</strong> {pagamentoSelecionado.inicioContrato}
                </p>
                <p>
                  <strong>Fim contrato/serviço:</strong> {pagamentoSelecionado.fimContrato}
                </p>
              </Col>
              <Col md={6}>
                <h5 className="mb-3">Informações Financeiras</h5>
                <p>
                  <strong>Valor Devido:</strong> {pagamentoSelecionado.valorDevido}
                </p>
                <p>
                  <strong>Valor do VT:</strong> {pagamentoSelecionado.valorVT}
                </p>
                <p>
                  <strong>Valor da Alimentação:</strong> {pagamentoSelecionado.valorAlimentacao}
                </p>
                <p>
                  <strong>VT + Alimentação (semana):</strong> {pagamentoSelecionado.vtAlimentacaoSemana}
                </p>
                <p>
                  <strong>Vale:</strong> {pagamentoSelecionado.vale}
                </p>
                <p>
                  <strong>Total a Pagar:</strong> <span className="fw-bold">{pagamentoSelecionado.totalReceber}</span>
                </p>
                <p>
                  <strong>Status:</strong>{" "}
                  <Badge className={`${getStatusBadgeClass(pagamentoSelecionado.status)}`}>
                    {pagamentoSelecionado.status}
                  </Badge>
                </p>
              </Col>
            </Row>

            <hr />

            <h5 className="mb-3">Informações de Pagamento</h5>
            <p>
              <strong>Nome do Beneficiário:</strong> {pagamentoSelecionado.nomePix}
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
                  Copiar
                </Button>
              </OverlayTrigger>
            </InputGroup>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Fechar
            </Button>
            {pagamentoSelecionado.status === "Pagar" && <Button variant="success">Marcar como Pago</Button>}
          </Modal.Footer>
        </Modal>
      )}
    </Container>
  )
}

export default PagamentoCard