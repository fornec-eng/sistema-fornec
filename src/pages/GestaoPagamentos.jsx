"use client"

import { useState, useEffect } from "react"
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Modal,
  Form,
  Table,
  Badge,
  Spinner,
  Alert,
  ProgressBar,
} from "react-bootstrap"
import { CheckCircle, Plus, Edit, Trash2 } from "lucide-react"
import PagamentosApi from "../services/PagamentosApi"

const GestaoPagamentos = () => {
  // Estados principais
  const [projetos, setProjetos] = useState([])
  const [projetoAtual, setProjetoAtual] = useState(null)
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("obra")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Estados para modais
  const [showObraModal, setShowObraModal] = useState(false)
  const [showGastoModal, setShowGastoModal] = useState(false)
  const [showContratoModal, setShowContratoModal] = useState(false)
  const [showCronogramaModal, setShowCronogramaModal] = useState(false)
  const [showPagamentoModal, setShowPagamentoModal] = useState(false)

  // Estados para edição
  const [editingItem, setEditingItem] = useState(null)
  const [editMode, setEditMode] = useState(false)

  // Estados para formulários
  const [obraForm, setObraForm] = useState({
    nome: "",
    dataInicio: "",
    dataFinalEntrega: "",
    orcamento: "",
  })

  const [gastoForm, setGastoForm] = useState({
    nrNota: "",
    descricao: "",
    data: "",
    localCompra: "",
    valor: "",
    solicitante: "",
    formaPagamento: "pix",
  })

  const [contratoForm, setContratoForm] = useState({
    nome: "",
    funcao: "",
    dataInicio: "",
    dataFim: "",
    contaBancaria: "",
    valorTotal: "",
    numeroParcelas: 1,
    dataPagamento: "",
    statusPagamento: "previsto",
  })

  const [cronogramaForm, setCronogramaForm] = useState({
    etapa: "",
    responsavel: "",
    prazoEmDias: "",
    dataInicio: "",
    dataFim: "",
    status: "previsto",
  })

  const [pagamentoForm, setPagamentoForm] = useState({
    nome: "",
    funcao: "",
    dataInicio: "",
    dataFimContrato: "",
    tipoContratacao: "",
    valorPagar: "",
    chavePix: "",
    nomeChavePix: "",
    qualificacaoTecnica: "",
    valorVT: 0,
    valorVA: 0,
    status: "pagar",
    semana: getWeekNumber(new Date()),
    ano: new Date().getFullYear(),
  })

  // Função para obter semana do ano
  function getWeekNumber(d) {
    const date = new Date(d.getTime())
    date.setHours(0, 0, 0, 0)
    date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7))
    const week1 = new Date(date.getFullYear(), 0, 4)
    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7)
  }

  // Carregar projetos da API
  useEffect(() => {
    fetchProjetos()
  }, [])

  const fetchProjetos = async () => {
    setLoading(true)
    try {
      const response = await PagamentosApi.listarPagamentos(1, 50)
      setProjetos(response.pagamentos || [])
    } catch (error) {
      console.error("Erro ao buscar projetos:", error)
      setError("Erro ao carregar projetos")
    } finally {
      setLoading(false)
    }
  }

  const fetchProjetoById = async (id) => {
    try {
      const response = await PagamentosApi.buscarPagamento(id)
      setProjetoAtual(response.pagamento)
    } catch (error) {
      console.error("Erro ao buscar projeto:", error)
      setError("Erro ao carregar detalhes do projeto")
    }
  }

  // Função para formatar valores monetários
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value || 0)
  }

  // Função para formatar data
  const formatDate = (date) => {
    if (!date) return "N/A"
    return new Date(date).toLocaleDateString("pt-BR")
  }

  // Funções para obra
  const handleObraSubmit = async (e) => {
    e.preventDefault()
    try {
      const obraData = {
        obra: {
          nome: obraForm.nome,
          dataInicio: new Date(obraForm.dataInicio).toISOString(),
          dataFinalEntrega: new Date(obraForm.dataFinalEntrega).toISOString(),
          orcamento: Number.parseFloat(obraForm.orcamento),
        },
      }

      if (editMode && projetoAtual) {
        await PagamentosApi.atualizarObra(projetoAtual._id, obraData.obra)
        setSuccess("Obra atualizada com sucesso!")
      } else {
        await PagamentosApi.criarPagamento(obraData)
        setSuccess("Obra criada com sucesso!")
        fetchProjetos()
      }

      setShowObraModal(false)
      resetObraForm()
      if (projetoAtual) fetchProjetoById(projetoAtual._id)
    } catch (error) {
      setError("Erro ao salvar obra")
    }
  }

  const resetObraForm = () => {
    setObraForm({
      nome: "",
      dataInicio: "",
      dataFinalEntrega: "",
      orcamento: "",
    })
    setEditMode(false)
  }

  // Funções para gastos
  const handleGastoSubmit = async (e) => {
    e.preventDefault()
    try {
      const gastoData = {
        ...gastoForm,
        data: new Date(gastoForm.data).toISOString(),
        valor: Number.parseFloat(gastoForm.valor),
      }

      if (editMode && editingItem) {
        await PagamentosApi.atualizarGasto(projetoAtual._id, editingItem._id, gastoData)
        setSuccess("Gasto atualizado com sucesso!")
      } else {
        await PagamentosApi.adicionarGasto(projetoAtual._id, gastoData)
        setSuccess("Gasto adicionado com sucesso!")
      }

      setShowGastoModal(false)
      resetGastoForm()
      fetchProjetoById(projetoAtual._id)
    } catch (error) {
      setError("Erro ao salvar gasto")
    }
  }

  const resetGastoForm = () => {
    setGastoForm({
      nrNota: "",
      descricao: "",
      data: "",
      localCompra: "",
      valor: "",
      solicitante: "",
      formaPagamento: "pix",
    })
    setEditMode(false)
    setEditingItem(null)
  }

  const handleDeleteGasto = async (gastoId) => {
    if (window.confirm("Tem certeza que deseja excluir este gasto?")) {
      try {
        await PagamentosApi.removerGasto(projetoAtual._id, gastoId)
        setSuccess("Gasto removido com sucesso!")
        fetchProjetoById(projetoAtual._id)
      } catch (error) {
        setError("Erro ao remover gasto")
      }
    }
  }

  // Funções para contratos
  const handleContratoSubmit = async (e) => {
    e.preventDefault()
    try {
      const contratoData = {
        ...contratoForm,
        dataInicio: new Date(contratoForm.dataInicio).toISOString(),
        dataFim: new Date(contratoForm.dataFim).toISOString(),
        dataPagamento: new Date(contratoForm.dataPagamento).toISOString(),
        valorTotal: Number.parseFloat(contratoForm.valorTotal),
        numeroParcelas: Number.parseInt(contratoForm.numeroParcelas),
      }

      if (editMode && editingItem) {
        await PagamentosApi.atualizarContrato(projetoAtual._id, editingItem._id, contratoData)
        setSuccess("Contrato atualizado com sucesso!")
      } else {
        await PagamentosApi.adicionarContrato(projetoAtual._id, contratoData)
        setSuccess("Contrato adicionado com sucesso!")
      }

      setShowContratoModal(false)
      resetContratoForm()
      fetchProjetoById(projetoAtual._id)
    } catch (error) {
      setError("Erro ao salvar contrato")
    }
  }

  const resetContratoForm = () => {
    setContratoForm({
      nome: "",
      funcao: "",
      dataInicio: "",
      dataFim: "",
      contaBancaria: "",
      valorTotal: "",
      numeroParcelas: 1,
      dataPagamento: "",
      statusPagamento: "previsto",
    })
    setEditMode(false)
    setEditingItem(null)
  }

  const handleDeleteContrato = async (contratoId) => {
    if (window.confirm("Tem certeza que deseja excluir este contrato?")) {
      try {
        await PagamentosApi.removerContrato(projetoAtual._id, contratoId)
        setSuccess("Contrato removido com sucesso!")
        fetchProjetoById(projetoAtual._id)
      } catch (error) {
        setError("Erro ao remover contrato")
      }
    }
  }

  // Funções para cronograma
  const handleCronogramaSubmit = async (e) => {
    e.preventDefault()
    try {
      const cronogramaData = {
        ...cronogramaForm,
        dataInicio: new Date(cronogramaForm.dataInicio).toISOString(),
        dataFim: new Date(cronogramaForm.dataFim).toISOString(),
        prazoEmDias: Number.parseInt(cronogramaForm.prazoEmDias),
      }

      if (editMode && editingItem) {
        await PagamentosApi.atualizarEtapaCronograma(projetoAtual._id, editingItem._id, cronogramaData)
        setSuccess("Etapa atualizada com sucesso!")
      } else {
        await PagamentosApi.adicionarEtapaCronograma(projetoAtual._id, cronogramaData)
        setSuccess("Etapa adicionada com sucesso!")
      }

      setShowCronogramaModal(false)
      resetCronogramaForm()
      fetchProjetoById(projetoAtual._id)
    } catch (error) {
      setError("Erro ao salvar etapa do cronograma")
    }
  }

  const resetCronogramaForm = () => {
    setCronogramaForm({
      etapa: "",
      responsavel: "",
      prazoEmDias: "",
      dataInicio: "",
      dataFim: "",
      status: "previsto",
    })
    setEditMode(false)
    setEditingItem(null)
  }

  const handleDeleteCronograma = async (etapaId) => {
    if (window.confirm("Tem certeza que deseja excluir esta etapa?")) {
      try {
        await PagamentosApi.removerEtapaCronograma(projetoAtual._id, etapaId)
        setSuccess("Etapa removida com sucesso!")
        fetchProjetoById(projetoAtual._id)
      } catch (error) {
        setError("Erro ao remover etapa")
      }
    }
  }

  // Funções para pagamentos semanais
  const handlePagamentoSubmit = async (e) => {
    e.preventDefault()
    try {
      const pagamentoData = {
        ...pagamentoForm,
        dataInicio: new Date(pagamentoForm.dataInicio).toISOString(),
        dataFimContrato: new Date(pagamentoForm.dataFimContrato).toISOString(),
        valorPagar: Number.parseFloat(pagamentoForm.valorPagar),
        valorVT: Number.parseFloat(pagamentoForm.valorVT),
        valorVA: Number.parseFloat(pagamentoForm.valorVA),
        semana: Number.parseInt(pagamentoForm.semana),
        ano: Number.parseInt(pagamentoForm.ano),
      }

      if (editMode && editingItem) {
        await PagamentosApi.atualizarPagamentoSemanal(projetoAtual._id, editingItem._id, pagamentoData)
        setSuccess("Pagamento atualizado com sucesso!")
      } else {
        await PagamentosApi.adicionarPagamentoSemanal(projetoAtual._id, pagamentoData)
        setSuccess("Pagamento adicionado com sucesso!")
      }

      setShowPagamentoModal(false)
      resetPagamentoForm()
      fetchProjetoById(projetoAtual._id)
    } catch (error) {
      setError("Erro ao salvar pagamento")
    }
  }

  const resetPagamentoForm = () => {
    setPagamentoForm({
      nome: "",
      funcao: "",
      dataInicio: "",
      dataFimContrato: "",
      tipoContratacao: "",
      valorPagar: "",
      chavePix: "",
      nomeChavePix: "",
      qualificacaoTecnica: "",
      valorVT: 0,
      valorVA: 0,
      status: "pagar",
      semana: getWeekNumber(new Date()),
      ano: new Date().getFullYear(),
    })
    setEditMode(false)
    setEditingItem(null)
  }

  const handleDeletePagamento = async (pagamentoId) => {
    if (window.confirm("Tem certeza que deseja excluir este pagamento?")) {
      try {
        await PagamentosApi.removerPagamentoSemanal(projetoAtual._id, pagamentoId)
        setSuccess("Pagamento removido com sucesso!")
        fetchProjetoById(projetoAtual._id)
      } catch (error) {
        setError("Erro ao remover pagamento")
      }
    }
  }

  const handleMarcarPago = async (pagamentoId) => {
    try {
      await PagamentosApi.marcarPagamentoEfetuado(projetoAtual._id, pagamentoId)
      setSuccess("Pagamento marcado como efetuado!")
      fetchProjetoById(projetoAtual._id)
    } catch (error) {
      setError("Erro ao marcar pagamento como efetuado")
    }
  }

  // Função para obter classe de badge baseada no status
  const getStatusBadge = (status) => {
    const statusMap = {
      pago: "success",
      "pagamento efetuado": "success",
      previsto: "warning",
      "em atraso": "danger",
      pagar: "warning",
      "em andamento": "primary",
      concluida: "success",
    }

    return statusMap[status?.toLowerCase()] || "secondary"
  }

  // Função para editar item
  const handleEditItem = (item, type) => {
    setEditingItem(item)
    setEditMode(true)

    switch (type) {
      case "gasto":
        setGastoForm({
          nrNota: item.nrNota || "",
          descricao: item.descricao || "",
          data: item.data ? new Date(item.data).toISOString().split("T")[0] : "",
          localCompra: item.localCompra || "",
          valor: item.valor || "",
          solicitante: item.solicitante || "",
          formaPagamento: item.formaPagamento || "pix",
        })
        setShowGastoModal(true)
        break
      case "contrato":
        setContratoForm({
          nome: item.nome || "",
          funcao: item.funcao || "",
          dataInicio: item.dataInicio ? new Date(item.dataInicio).toISOString().split("T")[0] : "",
          dataFim: item.dataFim ? new Date(item.dataFim).toISOString().split("T")[0] : "",
          contaBancaria: item.contaBancaria || "",
          valorTotal: item.valorTotal || "",
          numeroParcelas: item.numeroParcelas || 1,
          dataPagamento: item.dataPagamento ? new Date(item.dataPagamento).toISOString().split("T")[0] : "",
          statusPagamento: item.statusPagamento || "previsto",
        })
        setShowContratoModal(true)
        break
      case "cronograma":
        setCronogramaForm({
          etapa: item.etapa || "",
          responsavel: item.responsavel || "",
          prazoEmDias: item.prazoEmDias || "",
          dataInicio: item.dataInicio ? new Date(item.dataInicio).toISOString().split("T")[0] : "",
          dataFim: item.dataFim ? new Date(item.dataFim).toISOString().split("T")[0] : "",
          status: item.status || "previsto",
        })
        setShowCronogramaModal(true)
        break
      case "pagamento":
        setPagamentoForm({
          nome: item.nome || "",
          funcao: item.funcao || "",
          dataInicio: item.dataInicio ? new Date(item.dataInicio).toISOString().split("T")[0] : "",
          dataFimContrato: item.dataFimContrato ? new Date(item.dataFimContrato).toISOString().split("T")[0] : "",
          tipoContratacao: item.tipoContratacao || "",
          valorPagar: item.valorPagar || "",
          chavePix: item.chavePix || "",
          nomeChavePix: item.nomeChavePix || "",
          qualificacaoTecnica: item.qualificacaoTecnica || "",
          valorVT: item.valorVT || 0,
          valorVA: item.valorVA || 0,
          status: item.status || "pagar",
          semana: item.semana || getWeekNumber(new Date()),
          ano: item.ano || new Date().getFullYear(),
        })
        setShowPagamentoModal(true)
        break
    }
  }

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Gestão de Pagamentos</h1>
        <Button variant="primary" onClick={() => setShowObraModal(true)}>
          <Plus size={16} className="me-2" />
          Nova Obra
        </Button>
      </div>

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

      {/* Lista de Projetos */}
      <Card className="mb-4">
        <Card.Header>
          <h5 className="mb-0">Projetos Ativos</h5>
        </Card.Header>
        <Card.Body>
          {loading ? (
            <div className="d-flex align-items-center justify-content-center p-5">
              <Spinner animation="border" variant="primary" className="me-2" />
              <span>Carregando projetos...</span>
            </div>
          ) : projetos.length === 0 ? (
            <div className="text-center p-5">
              <p className="text-muted">Nenhum projeto cadastrado. Crie uma nova obra para começar.</p>
            </div>
          ) : (
            <Row>
              {projetos.map((projeto) => (
                <Col key={projeto._id} md={6} lg={4} className="mb-3">
                  <Card
                    className={`h-100 cursor-pointer ${projetoAtual?._id === projeto._id ? "border-primary" : ""}`}
                    onClick={() => fetchProjetoById(projeto._id)}
                    style={{ cursor: "pointer" }}
                  >
                    <Card.Body>
                      <Card.Title>{projeto.obra.nome}</Card.Title>
                      <div className="mb-2">
                        <small className="text-muted">Orçamento: </small>
                        <strong>{formatCurrency(projeto.obra.orcamento)}</strong>
                      </div>
                      <div className="mb-2">
                        <small className="text-muted">Gasto: </small>
                        <strong>{formatCurrency(projeto.valorTotalGasto)}</strong>
                      </div>
                      <ProgressBar
                        now={projeto.percentualConcluido}
                        variant="success"
                        className="mb-2"
                        style={{ height: "8px" }}
                      />
                      <div className="d-flex justify-content-between align-items-center">
                        <Badge bg={projeto.saldoRestante >= 0 ? "success" : "danger"}>{projeto.statusOrcamento}</Badge>
                        <small className="text-muted">{projeto.diasRestantes} dias restantes</small>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </Card.Body>
      </Card>

      {/* Detalhes do Projeto Selecionado */}
      {projetoAtual && (
        <Card>
          <Card.Header>
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">{projetoAtual.obra.nome}</h5>
              <div className="d-flex gap-2">
                <Badge bg={projetoAtual.saldoRestante >= 0 ? "success" : "danger"}>
                  Saldo: {formatCurrency(projetoAtual.saldoRestante)}
                </Badge>
                <Badge bg="info">{projetoAtual.percentualConcluido.toFixed(0)}% Concluído</Badge>
              </div>
            </div>
          </Card.Header>
          <Card.Body>
            {/* Tabs */}
            <div className="border-bottom mb-3">
              <nav className="nav nav-tabs">
                {[
                  { key: "obra", label: "🏗️ Obra", icon: "🏗️" },
                  { key: "gastos", label: `🛒 Gastos (${projetoAtual.gastos?.length || 0})` },
                  { key: "contratos", label: `👥 Contratos (${projetoAtual.contratos?.length || 0})` },
                  { key: "cronograma", label: `📅 Cronograma (${projetoAtual.cronograma?.length || 0})` },
                  {
                    key: "pagamentos",
                    label: `💰 Pagamentos Semanais (${projetoAtual.pagamentosSemanais?.length || 0})`,
                  },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    className={`nav-link ${activeTab === tab.key ? "active" : ""}`}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Conteúdo das Abas */}
            {activeTab === "obra" && (
              <div>
                <Row>
                  <Col md={6}>
                    <p>
                      <strong>Data Início:</strong> {formatDate(projetoAtual.obra.dataInicio)}
                    </p>
                    <p>
                      <strong>Data Entrega:</strong> {formatDate(projetoAtual.obra.dataFinalEntrega)}
                    </p>
                  </Col>
                  <Col md={6}>
                    <p>
                      <strong>Orçamento:</strong> {formatCurrency(projetoAtual.obra.orcamento)}
                    </p>
                    <p>
                      <strong>Total Gasto:</strong> {formatCurrency(projetoAtual.valorTotalGasto)}
                    </p>
                  </Col>
                </Row>
              </div>
            )}

            {activeTab === "gastos" && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6>Material e Equipamentos</h6>
                  <Button variant="success" onClick={() => setShowGastoModal(true)}>
                    <Plus size={16} className="me-2" />
                    Adicionar Gasto
                  </Button>
                </div>

                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Nota</th>
                      <th>Descrição</th>
                      <th>Data</th>
                      <th>Local</th>
                      <th>Valor</th>
                      <th>Pagamento</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projetoAtual.gastos?.map((gasto) => (
                      <tr key={gasto._id}>
                        <td>{gasto.nrNota}</td>
                        <td>{gasto.descricao}</td>
                        <td>{formatDate(gasto.data)}</td>
                        <td>{gasto.localCompra}</td>
                        <td>{formatCurrency(gasto.valor)}</td>
                        <td>
                          <Badge bg="info">{gasto.formaPagamento}</Badge>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <Button variant="outline-primary" size="sm" onClick={() => handleEditItem(gasto, "gasto")}>
                              <Edit size={14} />
                            </Button>
                            <Button variant="outline-danger" size="sm" onClick={() => handleDeleteGasto(gasto._id)}>
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}

            {activeTab === "contratos" && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6>Contratos de Serviço</h6>
                  <Button variant="success" onClick={() => setShowContratoModal(true)}>
                    <Plus size={16} className="me-2" />
                    Adicionar Contrato
                  </Button>
                </div>

                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Função</th>
                      <th>Período</th>
                      <th>Valor Total</th>
                      <th>Parcelas</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projetoAtual.contratos?.map((contrato) => (
                      <tr key={contrato._id}>
                        <td>{contrato.nome}</td>
                        <td>{contrato.funcao}</td>
                        <td>
                          {formatDate(contrato.dataInicio)} - {formatDate(contrato.dataFim)}
                        </td>
                        <td>{formatCurrency(contrato.valorTotal)}</td>
                        <td>{contrato.numeroParcelas}x</td>
                        <td>
                          <Badge bg={getStatusBadge(contrato.statusPagamento)}>{contrato.statusPagamento}</Badge>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleEditItem(contrato, "contrato")}
                            >
                              <Edit size={14} />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDeleteContrato(contrato._id)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}

            {activeTab === "cronograma" && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6>Etapas do Projeto</h6>
                  <Button variant="success" onClick={() => setShowCronogramaModal(true)}>
                    <Plus size={16} className="me-2" />
                    Adicionar Etapa
                  </Button>
                </div>

                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Etapa</th>
                      <th>Responsável</th>
                      <th>Prazo (dias)</th>
                      <th>Período</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projetoAtual.cronograma?.map((etapa) => (
                      <tr key={etapa._id}>
                        <td>{etapa.etapa}</td>
                        <td>{etapa.responsavel}</td>
                        <td>{etapa.prazoEmDias}</td>
                        <td>
                          {formatDate(etapa.dataInicio)} - {formatDate(etapa.dataFim)}
                        </td>
                        <td>
                          <Badge bg={getStatusBadge(etapa.status)}>{etapa.status}</Badge>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleEditItem(etapa, "cronograma")}
                            >
                              <Edit size={14} />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDeleteCronograma(etapa._id)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}

            {activeTab === "pagamentos" && (
              <div>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6>Pagamentos Recorrentes</h6>
                  <Button variant="success" onClick={() => setShowPagamentoModal(true)}>
                    <Plus size={16} className="me-2" />
                    Adicionar Pagamento
                  </Button>
                </div>

                <Table responsive hover>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Função</th>
                      <th>Tipo</th>
                      <th>Valor</th>
                      <th>Total a Receber</th>
                      <th>Semana/Ano</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projetoAtual.pagamentosSemanais?.map((pagamento) => (
                      <tr key={pagamento._id}>
                        <td>{pagamento.nome}</td>
                        <td>{pagamento.funcao}</td>
                        <td>{pagamento.tipoContratacao}</td>
                        <td>{formatCurrency(pagamento.valorPagar)}</td>
                        <td>{formatCurrency(pagamento.totalReceber)}</td>
                        <td>
                          {pagamento.semana}/{pagamento.ano}
                        </td>
                        <td>
                          <Badge bg={getStatusBadge(pagamento.status)}>{pagamento.status}</Badge>
                        </td>
                        <td>
                          <div className="d-flex gap-1">
                            {pagamento.status === "pagar" && (
                              <Button
                                variant="outline-success"
                                size="sm"
                                onClick={() => handleMarcarPago(pagamento._id)}
                                title="Marcar como pago"
                              >
                                <CheckCircle size={14} />
                              </Button>
                            )}
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => handleEditItem(pagamento, "pagamento")}
                            >
                              <Edit size={14} />
                            </Button>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => handleDeletePagamento(pagamento._id)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* Modal Obra */}
      <Modal show={showObraModal} onHide={() => setShowObraModal(false)} size="lg">
        <Form onSubmit={handleObraSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>{editMode ? "Editar Obra" : "Nova Obra"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nome da Obra</Form.Label>
                  <Form.Control
                    type="text"
                    value={obraForm.nome}
                    onChange={(e) => setObraForm({ ...obraForm, nome: e.target.value })}
                    placeholder="Digite o nome da obra"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Orçamento</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={obraForm.orcamento}
                    onChange={(e) => setObraForm({ ...obraForm, orcamento: e.target.value })}
                    placeholder="0,00"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Data de Início</Form.Label>
                  <Form.Control
                    type="date"
                    value={obraForm.dataInicio}
                    onChange={(e) => setObraForm({ ...obraForm, dataInicio: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Data de Entrega</Form.Label>
                  <Form.Control
                    type="date"
                    value={obraForm.dataFinalEntrega}
                    onChange={(e) => setObraForm({ ...obraForm, dataFinalEntrega: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowObraModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              {editMode ? "Atualizar" : "Criar"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal Gasto */}
      <Modal show={showGastoModal} onHide={() => setShowGastoModal(false)} size="lg">
        <Form onSubmit={handleGastoSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>{editMode ? "Editar Gasto" : "Novo Gasto"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Número da Nota</Form.Label>
                  <Form.Control
                    type="text"
                    value={gastoForm.nrNota}
                    onChange={(e) => setGastoForm({ ...gastoForm, nrNota: e.target.value })}
                    placeholder="NF001"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Data da Compra</Form.Label>
                  <Form.Control
                    type="date"
                    value={gastoForm.data}
                    onChange={(e) => setGastoForm({ ...gastoForm, data: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Descrição do Item</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={gastoForm.descricao}
                onChange={(e) => setGastoForm({ ...gastoForm, descricao: e.target.value })}
                placeholder="Descreva o item comprado"
                required
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Local da Compra</Form.Label>
                  <Form.Control
                    type="text"
                    value={gastoForm.localCompra}
                    onChange={(e) => setGastoForm({ ...gastoForm, localCompra: e.target.value })}
                    placeholder="Nome da loja"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Solicitante</Form.Label>
                  <Form.Control
                    type="text"
                    value={gastoForm.solicitante}
                    onChange={(e) => setGastoForm({ ...gastoForm, solicitante: e.target.value })}
                    placeholder="Nome do solicitante"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Valor</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={gastoForm.valor}
                    onChange={(e) => setGastoForm({ ...gastoForm, valor: e.target.value })}
                    placeholder="0,00"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Forma de Pagamento</Form.Label>
                  <Form.Select
                    value={gastoForm.formaPagamento}
                    onChange={(e) => setGastoForm({ ...gastoForm, formaPagamento: e.target.value })}
                    required
                  >
                    <option value="pix">PIX</option>
                    <option value="transferencia">Transferência</option>
                    <option value="avista">À Vista</option>
                    <option value="cartao">Cartão</option>
                    <option value="boleto">Boleto</option>
                    <option value="outro">Outro</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowGastoModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              {editMode ? "Atualizar" : "Adicionar"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal Contrato */}
      <Modal show={showContratoModal} onHide={() => setShowContratoModal(false)} size="lg">
        <Form onSubmit={handleContratoSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>{editMode ? "Editar Contrato" : "Novo Contrato"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nome do Contratado</Form.Label>
                  <Form.Control
                    type="text"
                    value={contratoForm.nome}
                    onChange={(e) => setContratoForm({ ...contratoForm, nome: e.target.value })}
                    placeholder="Nome completo"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Função</Form.Label>
                  <Form.Control
                    type="text"
                    value={contratoForm.funcao}
                    onChange={(e) => setContratoForm({ ...contratoForm, funcao: e.target.value })}
                    placeholder="Ex: Pedreiro, Eletricista"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Data de Início</Form.Label>
                  <Form.Control
                    type="date"
                    value={contratoForm.dataInicio}
                    onChange={(e) => setContratoForm({ ...contratoForm, dataInicio: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Data de Fim</Form.Label>
                  <Form.Control
                    type="date"
                    value={contratoForm.dataFim}
                    onChange={(e) => setContratoForm({ ...contratoForm, dataFim: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>PIX/Conta Bancária</Form.Label>
              <Form.Control
                type="text"
                value={contratoForm.contaBancaria}
                onChange={(e) => setContratoForm({ ...contratoForm, contaBancaria: e.target.value })}
                placeholder="Chave PIX ou dados bancários"
                required
              />
            </Form.Group>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Valor Total</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={contratoForm.valorTotal}
                    onChange={(e) => setContratoForm({ ...contratoForm, valorTotal: e.target.value })}
                    placeholder="0,00"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Número de Parcelas</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    value={contratoForm.numeroParcelas}
                    onChange={(e) => setContratoForm({ ...contratoForm, numeroParcelas: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Data de Pagamento</Form.Label>
                  <Form.Control
                    type="date"
                    value={contratoForm.dataPagamento}
                    onChange={(e) => setContratoForm({ ...contratoForm, dataPagamento: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Status do Pagamento</Form.Label>
              <Form.Select
                value={contratoForm.statusPagamento}
                onChange={(e) => setContratoForm({ ...contratoForm, statusPagamento: e.target.value })}
                required
              >
                <option value="previsto">Previsto</option>
                <option value="pago">Pago</option>
                <option value="em atraso">Em Atraso</option>
              </Form.Select>
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowContratoModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              {editMode ? "Atualizar" : "Adicionar"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal Cronograma */}
      <Modal show={showCronogramaModal} onHide={() => setShowCronogramaModal(false)} size="lg">
        <Form onSubmit={handleCronogramaSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>{editMode ? "Editar Etapa" : "Nova Etapa do Cronograma"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row>
              <Col md={8}>
                <Form.Group className="mb-3">
                  <Form.Label>Nome da Etapa</Form.Label>
                  <Form.Control
                    type="text"
                    value={cronogramaForm.etapa}
                    onChange={(e) => setCronogramaForm({ ...cronogramaForm, etapa: e.target.value })}
                    placeholder="Ex: Fundação, Estrutura, Acabamento"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Prazo (dias)</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    value={cronogramaForm.prazoEmDias}
                    onChange={(e) => setCronogramaForm({ ...cronogramaForm, prazoEmDias: e.target.value })}
                    placeholder="30"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Responsável</Form.Label>
              <Form.Control
                type="text"
                value={cronogramaForm.responsavel}
                onChange={(e) => setCronogramaForm({ ...cronogramaForm, responsavel: e.target.value })}
                placeholder="Nome do responsável pela etapa"
                required
              />
            </Form.Group>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Data de Início</Form.Label>
                  <Form.Control
                    type="date"
                    value={cronogramaForm.dataInicio}
                    onChange={(e) => setCronogramaForm({ ...cronogramaForm, dataInicio: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Data de Fim</Form.Label>
                  <Form.Control
                    type="date"
                    value={cronogramaForm.dataFim}
                    onChange={(e) => setCronogramaForm({ ...cronogramaForm, dataFim: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={cronogramaForm.status}
                    onChange={(e) => setCronogramaForm({ ...cronogramaForm, status: e.target.value })}
                    required
                  >
                    <option value="previsto">Previsto</option>
                    <option value="em andamento">Em Andamento</option>
                    <option value="concluida">Concluída</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowCronogramaModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              {editMode ? "Atualizar" : "Adicionar"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* Modal Pagamento Semanal */}
      <Modal show={showPagamentoModal} onHide={() => setShowPagamentoModal(false)} size="lg">
        <Form onSubmit={handlePagamentoSubmit}>
          <Modal.Header closeButton>
            <Modal.Title>{editMode ? "Editar Pagamento" : "Novo Pagamento Semanal"}</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nome</Form.Label>
                  <Form.Control
                    type="text"
                    value={pagamentoForm.nome}
                    onChange={(e) => setPagamentoForm({ ...pagamentoForm, nome: e.target.value })}
                    placeholder="Nome completo"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Função</Form.Label>
                  <Form.Control
                    type="text"
                    value={pagamentoForm.funcao}
                    onChange={(e) => setPagamentoForm({ ...pagamentoForm, funcao: e.target.value })}
                    placeholder="Ex: Auxiliar, Servente"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Data de Início</Form.Label>
                  <Form.Control
                    type="date"
                    value={pagamentoForm.dataInicio}
                    onChange={(e) => setPagamentoForm({ ...pagamentoForm, dataInicio: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Data Fim do Contrato</Form.Label>
                  <Form.Control
                    type="date"
                    value={pagamentoForm.dataFimContrato}
                    onChange={(e) => setPagamentoForm({ ...pagamentoForm, dataFimContrato: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Form.Group className="mb-3">
              <Form.Label>Tipo de Contratação</Form.Label>
              <Form.Control
                type="text"
                value={pagamentoForm.tipoContratacao}
                onChange={(e) => setPagamentoForm({ ...pagamentoForm, tipoContratacao: e.target.value })}
                placeholder="Ex: CLT, Freelancer, Diário"
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Qualificação Técnica</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={pagamentoForm.qualificacaoTecnica}
                onChange={(e) => setPagamentoForm({ ...pagamentoForm, qualificacaoTecnica: e.target.value })}
                placeholder="Descrição das qualificações e experiências"
                required
              />
            </Form.Group>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Chave PIX</Form.Label>
                  <Form.Control
                    type="text"
                    value={pagamentoForm.chavePix}
                    onChange={(e) => setPagamentoForm({ ...pagamentoForm, chavePix: e.target.value })}
                    placeholder="CPF, telefone, email ou chave aleatória"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Nome da Chave PIX</Form.Label>
                  <Form.Control
                    type="text"
                    value={pagamentoForm.nomeChavePix}
                    onChange={(e) => setPagamentoForm({ ...pagamentoForm, nomeChavePix: e.target.value })}
                    placeholder="Nome do titular da conta"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Valor a Pagar</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={pagamentoForm.valorPagar}
                    onChange={(e) => setPagamentoForm({ ...pagamentoForm, valorPagar: e.target.value })}
                    placeholder="0,00"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Valor VT</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={pagamentoForm.valorVT}
                    onChange={(e) => setPagamentoForm({ ...pagamentoForm, valorVT: e.target.value })}
                    placeholder="0,00"
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Valor VA</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={pagamentoForm.valorVA}
                    onChange={(e) => setPagamentoForm({ ...pagamentoForm, valorVA: e.target.value })}
                    placeholder="0,00"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Semana</Form.Label>
                  <Form.Control
                    type="number"
                    min="1"
                    max="53"
                    value={pagamentoForm.semana}
                    onChange={(e) => setPagamentoForm({ ...pagamentoForm, semana: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Ano</Form.Label>
                  <Form.Control
                    type="number"
                    min="2020"
                    max="2030"
                    value={pagamentoForm.ano}
                    onChange={(e) => setPagamentoForm({ ...pagamentoForm, ano: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group className="mb-3">
                  <Form.Label>Status</Form.Label>
                  <Form.Select
                    value={pagamentoForm.status}
                    onChange={(e) => setPagamentoForm({ ...pagamentoForm, status: e.target.value })}
                    required
                  >
                    <option value="pagar">A Pagar</option>
                    <option value="pagamento efetuado">Pagamento Efetuado</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
            <div className="p-3 bg-light rounded">
              <strong>Total a Receber:</strong>{" "}
              {formatCurrency(
                (Number.parseFloat(pagamentoForm.valorPagar) || 0) +
                  (Number.parseFloat(pagamentoForm.valorVT) || 0) +
                  (Number.parseFloat(pagamentoForm.valorVA) || 0),
              )}
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowPagamentoModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              {editMode ? "Atualizar" : "Adicionar"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  )
}

export default GestaoPagamentos
