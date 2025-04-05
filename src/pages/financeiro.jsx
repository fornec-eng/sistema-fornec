import { useState, useEffect, useRef } from "react"
import { Container, Row, Col, Card, Spinner, Form, Button, Table, Tabs, Tab } from "react-bootstrap"
import { Bar, Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"
import ChartDataLabels from "chartjs-plugin-datalabels"
import { Download, Filter, RefreshCw } from "lucide-react"
import ApiBase from "../services/ApiBase"
import jsPDF from "jspdf"

// Registrar componentes do Chart.js (remover ArcElement que era usado apenas para o gráfico de pizza)
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels,
)

const Financeiro = () => {
  // Estados para armazenar dados
  const [loading, setLoading] = useState(true)
  const [obras, setObras] = useState([])
  const [resumoFinanceiro, setResumoFinanceiro] = useState({
    totalOrcamento: 0,
    totalGasto: 0,
    totalRestante: 0,
    gastoMensal: [],
    distribuicaoGastos: [],
  })
  const [planilhasPagamento, setPlanilhasPagamento] = useState([])
  const [funcionarios, setFuncionarios] = useState([])
  const [selectedPlanilha, setSelectedPlanilha] = useState("")
  const [loadingPagamentos, setLoadingPagamentos] = useState(false)
  const [periodoSelecionado, setPeriodoSelecionado] = useState("atual")
  const [filtroMes, setFiltroMes] = useState(new Date().getMonth())
  const [filtroAno, setFiltroAno] = useState(new Date().getFullYear())
  const [dadosFiltrados, setDadosFiltrados] = useState(null)
  const [filtrosAplicados, setFiltrosAplicados] = useState(false)

  // Refs para os gráficos (para exportação PDF)
  const gastoMensalChartRef = useRef(null)
  const distribuicaoGastosChartRef = useRef(null)
  const obrasChartRef = useRef(null)

  // IDs das pastas do Google Drive (copiados do CardFuncionario.jsx)
  const FOLDER_ATUAL_ID = "1JWqpHfPvYy9B846cXPTYotImfd3xqhRC" // Pagamentos atuais
  const FOLDER_HISTORICO_ID = "1BMKBm2pk16I-KyrTyd1l2GpBU4t2Id_o" // Histórico de pagamentos
  const FOLDER_OBRAS_ID = "1ALOCpJyPNQe51HC0TSNX68oa8SIkZqcW" // Pasta de obras

  // Função para formatar valores monetários
  const formatCurrency = (value) =>
    typeof value === "number" ? value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "R$ 0,00"

  // Função para converter string de moeda para número
  const currencyToNumber = (currencyStr) => {
    if (!currencyStr || typeof currencyStr !== "string") return 0
    return Number.parseFloat(currencyStr.replace("R$", "").replace(/\./g, "").replace(",", ".").trim())
  }

  // 1. Buscar lista de obras
  useEffect(() => {
    const fetchObras = async () => {
      try {
        const response = await ApiBase.get(`/google/drive/${FOLDER_OBRAS_ID}`)
        // Filtrar para remover o modelo
        const filteredObras = response.data.filter((obra) => obra.name !== "modelo_planilha_obra (Não mexer)")
        setObras(filteredObras)

        // Buscar dados financeiros de cada obra
        if (filteredObras.length > 0) {
          await fetchFinancialData(filteredObras)
        }
      } catch (error) {
        console.error("Erro ao buscar obras:", error)
      }
    }

    // 2. Buscar planilhas de pagamento
    const fetchPlanilhasPagamento = async () => {
      try {
        // Buscar planilhas atuais
        const resAtuais = await ApiBase.get(`/google/drive/${FOLDER_ATUAL_ID}`)
        const listaAtuais = resAtuais.data || []

        // Buscar planilhas históricas
        const resHistorico = await ApiBase.get(`/google/drive/${FOLDER_HISTORICO_ID}`)
        const listaHistorico = resHistorico.data || []

        // Combinar e filtrar planilhas
        const todasPlanilhas = [...listaAtuais, ...listaHistorico].filter(
          (plan) => !["Automatização da Planilha Semanal", "Modelo", "Histórico"].includes(plan.name),
        )

        setPlanilhasPagamento(todasPlanilhas)

        // Selecionar a primeira planilha por padrão
        if (todasPlanilhas.length > 0) {
          setSelectedPlanilha(todasPlanilhas[0].id)
          await fetchPagamentoData(todasPlanilhas[0].id)
        }
      } catch (error) {
        console.error("Erro ao buscar planilhas de pagamento:", error)
      }
    }

    // Executar as buscas iniciais
    Promise.all([fetchObras(), fetchPlanilhasPagamento()]).finally(() => setLoading(false))
  }, [])

  // Buscar dados financeiros de todas as obras
  const fetchFinancialData = async (obrasList) => {
    try {
      let totalOrcamento = 0
      let totalGasto = 0
      const gastosPorCategoria = {
        "Gasto material": 0,
        "Locação de equipamento": 0,
        "Mão de Obra": 0,
        "Outros gastos": 0,
      }

      const gastoMensalMap = {}

      // Para cada obra, buscar dados financeiros
      await Promise.all(
        obrasList.map(async (obra) => {
          try {
            // Buscar resumo da obra
            const resResumo = await ApiBase.post("/google/sheets/data", {
              data: { spreadsheetId: obra.id, range: "Resumo" },
            })

            const resumoValues = resResumo.data.values || []

            // Extrair orçamento e gasto total
            const orcamentoRow = resumoValues.find((row) => row[0] === "Orçamento:")
            const gastoTotalRow = resumoValues.find((row) => row[0] === "Gasto total:")

            if (orcamentoRow && gastoTotalRow) {
              const orcamento = currencyToNumber(orcamentoRow[1])
              const gastoTotal = currencyToNumber(gastoTotalRow[1])

              totalOrcamento += orcamento
              totalGasto += gastoTotal

              // Extrair gastos por categoria
              const gastoMaterialRow = resumoValues.find((row) => row[0] === "Gasto material:")
              const locacaoEquipamentoRow = resumoValues.find((row) => row[0] === "Locação de equipamento:")
              const maoDeObraRow = resumoValues.find((row) => row[0] === "Mão de Obra:")
              const outrosGastosRow = resumoValues.find((row) => row[0] === "Outros gastos:")

              if (gastoMaterialRow) gastosPorCategoria["Gasto material"] += currencyToNumber(gastoMaterialRow[1])
              if (locacaoEquipamentoRow)
                gastosPorCategoria["Locação de equipamento"] += currencyToNumber(locacaoEquipamentoRow[1])
              if (maoDeObraRow) gastosPorCategoria["Mão de Obra"] += currencyToNumber(maoDeObraRow[1])
              if (outrosGastosRow) gastosPorCategoria["Outros gastos"] += currencyToNumber(outrosGastosRow[1])
            }

            // Buscar gastos mensais
            const resMensal = await ApiBase.post("/google/sheets/data", {
              data: { spreadsheetId: obra.id, range: "resumo_mensal" },
            })

            const mensalValues = resMensal.data.values || []

            // Processar gastos mensais (ignorando primeira e última linha)
            mensalValues.slice(1, -1).forEach((row) => {
              if (row[0] && row[1]) {
                const mes = row[0]
                const valor = currencyToNumber(row[1])

                if (!gastoMensalMap[mes]) {
                  gastoMensalMap[mes] = 0
                }
                gastoMensalMap[mes] += valor
              }
            })
          } catch (error) {
            console.error(`Erro ao buscar dados da obra ${obra.name}:`, error)
          }
        }),
      )

      // Converter mapa de gastos mensais para array
      const gastoMensalArray = Object.entries(gastoMensalMap)
        .map(([mes, valor]) => ({ mes, valor }))
        .sort((a, b) => {
          // Ordenar meses cronologicamente
          const mesesOrdem = [
            "Janeiro",
            "Fevereiro",
            "Março",
            "Abril",
            "Maio",
            "Junho",
            "Julho",
            "Agosto",
            "Setembro",
            "Outubro",
            "Novembro",
            "Dezembro",
          ]
          return mesesOrdem.indexOf(a.mes) - mesesOrdem.indexOf(b.mes)
        })

      // Converter gastos por categoria para array
      const distribuicaoGastos = Object.entries(gastosPorCategoria)
        .map(([categoria, valor]) => ({ categoria, valor }))
        .sort((a, b) => b.valor - a.valor) // Ordenar por valor decrescente

      // Atualizar estado com os dados calculados
      setResumoFinanceiro({
        totalOrcamento,
        totalGasto,
        totalRestante: totalOrcamento - totalGasto,
        gastoMensal: gastoMensalArray,
        distribuicaoGastos,
      })
    } catch (error) {
      console.error("Erro ao processar dados financeiros:", error)
    }
  }

  // Buscar dados de pagamento de uma planilha específica
  const fetchPagamentoData = async (spreadsheetId) => {
    if (!spreadsheetId) return

    setLoadingPagamentos(true)

    try {
      const res = await ApiBase.post("/google/sheets/data", {
        data: {
          spreadsheetId,
          range: "pagamento_semanal",
        },
      })

      const rows = res.data.values || []

      // Verificar se há pelo menos 2 linhas
      if (rows.length < 2) {
        setFuncionarios([])
        return
      }

      // Mapear cabeçalhos
      const headerRow = rows[1]
      const indices = {
        nome: headerRow.indexOf("Nome"),
        funcao: headerRow.indexOf("Função"),
        tipoContratacao: headerRow.indexOf("Tipo de Contratação"),
        valorDevido: headerRow.indexOf("Valor Devido"),
        totalReceber: headerRow.indexOf("TOTAL A RECEBER"),
        status: headerRow.indexOf("Status:"),
      }

      // Processar dados de funcionários
      const dataRows = rows.slice(2)
      const parsedFuncionarios = dataRows.map((row) => ({
        nome: row[indices.nome] || "",
        funcao: row[indices.funcao] || "",
        tipoContratacao: row[indices.tipoContratacao] || "",
        valorDevido: row[indices.valorDevido] || "",
        totalReceber: row[indices.totalReceber] || "",
        status: row[indices.status] || "",
      }))

      setFuncionarios(parsedFuncionarios)
    } catch (error) {
      console.error("Erro ao carregar dados da planilha:", error)
      setFuncionarios([])
    } finally {
      setLoadingPagamentos(false)
    }
  }

  // Quando o usuário seleciona uma planilha no dropdown
  const handleSelectPlanilha = (e) => {
    const chosenId = e.target.value
    setSelectedPlanilha(chosenId)
    fetchPagamentoData(chosenId)
  }

  // Retorna a classe baseada no status
  const getStatusBadgeClass = (status) => {
    if (status === "Pagar") {
      return "bg-warning text-dark" // Amarelo
    } else if (status === "Pagamento Efetuado") {
      return "bg-success" // Verde
    }
    return "bg-secondary" // Cinza (caso apareça algum outro status)
  }

  // Filtrar planilhas por período
  const getPlanilhasFiltradas = () => {
    if (periodoSelecionado === "atual") {
      return planilhasPagamento.filter(
        (p) =>
          p.name.toLowerCase().includes("atual") ||
          p.name.toLowerCase().includes("semana") ||
          p.name.toLowerCase().includes("corrente"),
      )
    } else if (periodoSelecionado === "historico") {
      return planilhasPagamento.filter(
        (p) =>
          !p.name.toLowerCase().includes("atual") &&
          !p.name.toLowerCase().includes("semana") &&
          !p.name.toLowerCase().includes("corrente"),
      )
    } else {
      return planilhasPagamento
    }
  }

  // Aplicar filtros quando o botão Atualizar for clicado
  const aplicarFiltros = () => {
    // Criar array com todos os meses do ano
    const mesesCompletos = [
      "Janeiro",
      "Fevereiro",
      "Março",
      "Abril",
      "Maio",
      "Junho",
      "Julho",
      "Agosto",
      "Setembro",
      "Outubro",
      "Novembro",
      "Dezembro",
    ]

    // Filtrar dados por ano
    const dadosDoAno = resumoFinanceiro.gastoMensal.filter((item) => {
      // Verificar se o mês pertence ao ano selecionado
      // Aqui estamos assumindo que os dados não têm informação de ano,
      // então vamos considerar apenas o ano atual para filtrar
      return true // Filtro simplificado, ajuste conforme necessário
    })

    // Criar array com todos os meses, preenchendo com valores zero para meses sem dados
    const dadosCompletos = mesesCompletos.map((mes) => {
      const dadoExistente = dadosDoAno.find((item) => item.mes === mes)
      return {
        mes,
        valor: dadoExistente ? dadoExistente.valor : 0,
      }
    })

    // Se for o ano atual, mostrar apenas até o mês atual
    const mesAtual = new Date().getMonth()
    const anoAtual = new Date().getFullYear()

    let dadosFiltradosPorMes = dadosCompletos
    if (filtroAno === anoAtual) {
      dadosFiltradosPorMes = dadosCompletos.slice(0, mesAtual + 1)
    }

    setDadosFiltrados(dadosFiltradosPorMes)
    setFiltrosAplicados(true)
  }

  // Exportar para PDF
  const exportarPDF = () => {
    const doc = new jsPDF()

    // Título
    doc.setFontSize(18)
    doc.text("Relatório Financeiro - Fornec Engenharia", 105, 15, { align: "center" })

    // Data do relatório
    doc.setFontSize(10)
    doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 105, 22, { align: "center" })

    // Resumo financeiro
    doc.setFontSize(14)
    doc.text("Resumo Financeiro", 14, 35)

    doc.setFontSize(11)
    doc.text(`Orçamento Total: ${formatCurrency(resumoFinanceiro.totalOrcamento)}`, 14, 45)
    doc.text(`Total Investido: ${formatCurrency(resumoFinanceiro.totalGasto)}`, 14, 52)
    doc.text(`Orçamento Restante: ${formatCurrency(resumoFinanceiro.totalRestante)}`, 14, 59)
    doc.text(`Pagamentos Pendentes: ${formatCurrency(totalPagamentosPendentes)}`, 14, 66)

    // Distribuição de gastos
    doc.setFontSize(14)
    doc.text("Distribuição de Gastos", 14, 80)

    doc.setFontSize(11)
    resumoFinanceiro.distribuicaoGastos.forEach((item, index) => {
      doc.text(`${item.categoria}: ${formatCurrency(item.valor)}`, 14, 90 + index * 7)
    })

    // Obras
    doc.setFontSize(14)
    doc.text("Obras Ativas", 14, 130)

    doc.setFontSize(11)
    obras.forEach((obra, index) => {
      doc.text(`${obra.name}`, 14, 140 + index * 7)
    })

    // Funcionários pendentes
    const funcionariosPendentes = funcionarios.filter((f) => f.status === "Pagar")

    if (funcionariosPendentes.length > 0) {
      doc.addPage()

      doc.setFontSize(14)
      doc.text("Pagamentos Pendentes", 14, 15)

      doc.setFontSize(11)
      funcionariosPendentes.forEach((func, index) => {
        doc.text(`${func.nome} - ${func.funcao} - ${func.valorDevido}`, 14, 25 + index * 7)
      })
    }

    // Salvar o PDF
    doc.save("relatorio-financeiro.pdf")
  }

  // Exportar relatório de pagamentos
  const exportarRelatorioPagamentos = () => {
    const doc = new jsPDF()

    // Título
    doc.setFontSize(18)
    doc.text("Relatório de Pagamentos - Fornec Engenharia", 105, 15, { align: "center" })

    // Data do relatório
    doc.setFontSize(10)
    doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-BR")}`, 105, 22, { align: "center" })

    // Informações da planilha
    const planilhaSelecionada = planilhasPagamento.find((p) => p.id === selectedPlanilha)

    doc.setFontSize(14)
    doc.text(`Planilha: ${planilhaSelecionada ? planilhaSelecionada.name : "Não selecionada"}`, 14, 35)

    // Resumo de pagamentos
    doc.setFontSize(11)
    doc.text(`Total de Funcionários: ${funcionarios.length}`, 14, 45)
    doc.text(`Pagamentos Pendentes: ${funcionarios.filter((f) => f.status === "Pagar").length}`, 14, 52)
    doc.text(`Pagamentos Efetuados: ${funcionarios.filter((f) => f.status === "Pagamento Efetuado").length}`, 14, 59)
    doc.text(`Valor Total Pendente: ${formatCurrency(totalPagamentosPendentes)}`, 14, 66)
    doc.text(`Valor Total Pago: ${formatCurrency(totalPagamentosEfetuados)}`, 14, 73)

    // Lista de funcionários
    doc.setFontSize(14)
    doc.text("Lista de Funcionários", 14, 90)

    // Cabeçalho da tabela
    doc.setFontSize(10)
    doc.text("Nome", 14, 100)
    doc.text("Função", 70, 100)
    doc.text("Valor Devido", 120, 100)
    doc.text("Status", 170, 100)

    // Linha separadora
    doc.line(14, 102, 196, 102)

    // Dados da tabela
    doc.setFontSize(9)
    funcionarios.forEach((func, index) => {
      let y = 110 + index * 7

      // Se ultrapassar o limite da página, criar nova página
      if (y > 280) {
        doc.addPage()

        // Cabeçalho da nova página
        doc.setFontSize(10)
        doc.text("Nome", 14, 20)
        doc.text("Função", 70, 20)
        doc.text("Valor Devido", 120, 20)
        doc.text("Status", 170, 20)

        // Linha separadora
        doc.line(14, 22, 196, 22)

        // Resetar posição Y
        index = 0
        y = 30
      }

      doc.text(func.nome.substring(0, 25), 14, y)
      doc.text(func.funcao.substring(0, 20), 70, y)
      doc.text(func.valorDevido, 120, y)
      doc.text(func.status, 170, y)
    })

    // Salvar o PDF
    doc.save("relatorio-pagamentos.pdf")
  }

  // Calcular total de pagamentos pendentes
  const totalPagamentosPendentes = funcionarios
    .filter((f) => f.status === "Pagar")
    .reduce((total, f) => total + currencyToNumber(f.valorDevido), 0)

  // Calcular total de pagamentos efetuados
  const totalPagamentosEfetuados = funcionarios
    .filter((f) => f.status === "Pagamento Efetuado")
    .reduce((total, f) => total + currencyToNumber(f.valorDevido), 0)

  // Preparar dados para o gráfico de gastos mensais
  const gastoMensalChartData = {
    labels: (dadosFiltrados || resumoFinanceiro.gastoMensal).map((item) => item.mes),
    datasets: [
      {
        label: "Investimento Mensal (R$)",
        data: (dadosFiltrados || resumoFinanceiro.gastoMensal).map((item) => item.valor),
        fill: false,
        borderColor: "#007bff",
        backgroundColor: "rgba(0, 123, 255, 0.5)",
        tension: 0.1,
        datalabels: {
          display: true,
          color: "#007bff",
          align: "top",
          font: {
            weight: "bold",
            size: 12,
          },
          formatter: (value) => formatCurrency(value),
        },
      },
    ],
  }

  // Preparar dados para o gráfico de distribuição de gastos (barras horizontais)
  const distribuicaoGastosChartData = {
    labels: resumoFinanceiro.distribuicaoGastos.map((item) => item.categoria),
    datasets: [
      {
        label: "Distribuição de Gastos",
        data: resumoFinanceiro.distribuicaoGastos.map((item) => item.valor),
        backgroundColor: [
          "rgba(255, 99, 132, 0.7)",
          "rgba(54, 162, 235, 0.7)",
          "rgba(255, 206, 86, 0.7)",
          "rgba(75, 192, 192, 0.7)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
        ],
        borderWidth: 1,
        datalabels: {
          display: true,
          color: "#000",
          font: {
            weight: "bold",
            size: 12,
          },
          formatter: (value) => formatCurrency(value),
        },
      },
    ],
  }

  // Preparar dados para o gráfico de obras
  const obrasChartData = {
    labels: obras.map((obra) => obra.name),
    datasets: [
      {
        label: "Investimento por Obra",
        data: obras.map(() => Math.floor(Math.random() * 100000) + 50000), // Dados aleatórios para exemplo
        backgroundColor: "rgba(75, 192, 192, 0.7)",
        borderColor: "rgba(75, 192, 192, 1)",
        borderWidth: 1,
        datalabels: {
          display: true,
          color: "#000",
          font: {
            weight: "bold",
            size: 12,
          },
          formatter: (value) => formatCurrency(value),
        },
      },
    ],
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "300px" }}>
        <Spinner animation="border" variant="primary" />
        <span className="ms-2">Carregando dados financeiros...</span>
      </div>
    )
  }

  return (
    <Container fluid className="mt-4 mb-5">
      <Row className="mb-4">
        <Col>
          <h1 className="text-center">Controle Financeiro</h1>
        </Col>
      </Row>

      {/* Filtros */}
      <Row className="mb-4">
        <Col md={12}>
          <Card style={{ borderRadius: "10px", boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}>
            <Card.Body>
              <div className="d-flex flex-wrap justify-content-between align-items-center">
                <div className="d-flex align-items-center mb-2 mb-md-0">
                  <Filter className="me-2" size={20} />
                  <h5 className="mb-0">Filtros</h5>
                </div>

                <div className="d-flex flex-wrap gap-3">
                  <Form.Group>
                    <Form.Select
                      value={filtroMes}
                      onChange={(e) => setFiltroMes(Number.parseInt(e.target.value))}
                      style={{ minWidth: "150px" }}
                    >
                      <option value={0}>Janeiro</option>
                      <option value={1}>Fevereiro</option>
                      <option value={2}>Março</option>
                      <option value={3}>Abril</option>
                      <option value={4}>Maio</option>
                      <option value={5}>Junho</option>
                      <option value={6}>Julho</option>
                      <option value={7}>Agosto</option>
                      <option value={8}>Setembro</option>
                      <option value={9}>Outubro</option>
                      <option value={10}>Novembro</option>
                      <option value={11}>Dezembro</option>
                    </Form.Select>
                  </Form.Group>

                  <Form.Group>
                    <Form.Select
                      value={filtroAno}
                      onChange={(e) => setFiltroAno(Number.parseInt(e.target.value))}
                      style={{ minWidth: "120px" }}
                    >
                      <option value={2023}>2023</option>
                      <option value={2024}>2024</option>
                      <option value={2025}>2025</option>
                    </Form.Select>
                  </Form.Group>

                  <Button variant="outline-primary" className="d-flex align-items-center" onClick={aplicarFiltros}>
                    <RefreshCw size={16} className="me-2" />
                    Atualizar
                  </Button>

                  <Button
                    variant="outline-success"                    
                    className="d-flex align-items-center"
                    onClick={exportarPDF}
                  >
                    <Download size={16} className="me-2" />
                    Exportar
                  </Button>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Cards de resumo */}
      <Row className="mb-4">
        <Col md={3}>
          <Card style={{ borderRadius: "10px", boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)", height: "100%" }}>
            <Card.Body className="d-flex flex-column">
              <Card.Title className="text-primary">Orçamento Total</Card.Title>
              <h3 className="mt-3 mb-2">{formatCurrency(resumoFinanceiro.totalOrcamento)}</h3>
              <div className="mt-auto">
                <small className="text-muted">Soma dos orçamentos de todas as obras</small>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card style={{ borderRadius: "10px", boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)", height: "100%" }}>
            <Card.Body className="d-flex flex-column">
              <Card.Title className="text-danger">Total Investido</Card.Title>
              <h3 className="mt-3 mb-2">{formatCurrency(resumoFinanceiro.totalGasto)}</h3>
              <div className="mt-auto">
                <div className="progress" style={{ height: "8px" }}>
                  <div
                    className="progress-bar bg-danger"
                    role="progressbar"
                    style={{ width: `${(resumoFinanceiro.totalGasto / resumoFinanceiro.totalOrcamento) * 100}%` }}
                    aria-valuenow={(resumoFinanceiro.totalGasto / resumoFinanceiro.totalOrcamento) * 100}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  ></div>
                </div>
                <small className="text-muted">
                  {((resumoFinanceiro.totalGasto / resumoFinanceiro.totalOrcamento) * 100).toFixed(1)}% do orçamento
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card style={{ borderRadius: "10px", boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)", height: "100%" }}>
            <Card.Body className="d-flex flex-column">
              <Card.Title className="text-success">Orçamento Restante</Card.Title>
              <h3 className="mt-3 mb-2">{formatCurrency(resumoFinanceiro.totalRestante)}</h3>
              <div className="mt-auto">
                <div className="progress" style={{ height: "8px" }}>
                  <div
                    className="progress-bar bg-success"
                    role="progressbar"
                    style={{ width: `${(resumoFinanceiro.totalRestante / resumoFinanceiro.totalOrcamento) * 100}%` }}
                    aria-valuenow={(resumoFinanceiro.totalRestante / resumoFinanceiro.totalOrcamento) * 100}
                    aria-valuemin="0"
                    aria-valuemax="100"
                  ></div>
                </div>
                <small className="text-muted">
                  {((resumoFinanceiro.totalRestante / resumoFinanceiro.totalOrcamento) * 100).toFixed(1)}% disponível
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={3}>
          <Card style={{ borderRadius: "10px", boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)", height: "100%" }}>
            <Card.Body className="d-flex flex-column">
              <Card.Title className="text-warning">Pagamentos Pendentes</Card.Title>
              <h3 className="mt-3 mb-2">{formatCurrency(totalPagamentosPendentes)}</h3>
              <div className="mt-auto">
                <small className="text-muted">
                  {funcionarios.filter((f) => f.status === "Pagar").length} funcionários aguardando pagamento
                </small>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Gráficos */}
      <Row className="mb-4">
        <Col md={8}>
          <Card style={{ borderRadius: "10px", boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)", height: "100%" }}>
            <Card.Body>
              <Card.Title>Investimento Mensal</Card.Title>
              <div style={{ height: "300px" }}>
                <Line
                  ref={gastoMensalChartRef}
                  data={gastoMensalChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      tooltip: {
                        callbacks: {
                          label: (context) => formatCurrency(context.raw),
                        },
                      },
                      legend: {
                        position: "top",
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: (value) => formatCurrency(value),
                        },
                      },
                    },
                  }}
                />
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card style={{ borderRadius: "10px", boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)", height: "100%" }}>
            <Card.Body>
              <Card.Title>Distribuição de Gastos</Card.Title>
              <div style={{ height: "300px" }}>
                <Bar
                  ref={distribuicaoGastosChartRef}
                  data={distribuicaoGastosChartData}
                  options={{
                    indexAxis: "y",
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            const label = context.label || ""
                            const value = formatCurrency(context.raw)
                            const percentage = ((context.raw / resumoFinanceiro.totalGasto) * 100).toFixed(1)
                            return `${label}: ${value} (${percentage}%)`
                          },
                        },
                      },
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      x: {
                        beginAtZero: true,
                        ticks: {
                          callback: (value) => formatCurrency(value),
                        },
                      },
                    },
                  }}
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Investimento por Obra */}
      <Row className="mb-4">
        <Col md={12}>
          <Card style={{ borderRadius: "10px", boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}>
            <Card.Body>
              <Card.Title>Investimento por Obra</Card.Title>
              <div style={{ height: "300px" }}>
                <Bar
                  ref={obrasChartRef}
                  data={obrasChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      tooltip: {
                        callbacks: {
                          label: (context) => formatCurrency(context.raw),
                        },
                      },
                      legend: {
                        display: false,
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: (value) => formatCurrency(value),
                        },
                      },
                    },
                  }}
                />
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Pagamentos Semanais */}
      <Row>
        <Col md={12}>
          <Card style={{ borderRadius: "10px", boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}>
            <Card.Body>
              <Card.Title>Pagamentos Semanais</Card.Title>

              <Tabs
                defaultActiveKey="atual"
                id="pagamentos-tabs"
                className="mb-3"
                onSelect={(k) => setPeriodoSelecionado(k)}
              >
                <Tab eventKey="atual" title="Semana Atual">
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Selecione a planilha:</Form.Label>
                        <Form.Select onChange={handleSelectPlanilha} value={selectedPlanilha}>
                          <option value="">Selecione uma planilha...</option>
                          {getPlanilhasFiltradas().map((plan) => (
                            <option key={plan.id} value={plan.id}>
                              {plan.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6} className="d-flex align-items-end">
                      <div className="d-flex gap-2">
                        <div className="d-flex align-items-center">
                          <div className="badge bg-warning text-dark me-1">Pagar</div>
                          <span className="me-3">
                            {funcionarios.filter((f) => f.status === "Pagar").length} funcionários
                          </span>
                        </div>
                        <div className="d-flex align-items-center">
                          <div className="badge bg-success me-1">Pagamento Efetuado</div>
                          <span>
                            {funcionarios.filter((f) => f.status === "Pagamento Efetuado").length} funcionários
                          </span>
                        </div>
                      </div>
                    </Col>
                  </Row>

                  {loadingPagamentos ? (
                    <div className="d-flex justify-content-center my-4">
                      <Spinner animation="border" variant="primary" />
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table striped bordered hover>
                        <thead>
                          <tr>
                            <th>Nome</th>
                            <th>Função</th>
                            <th>Tipo de Contratação</th>
                            <th>Valor Devido</th>
                            <th>Total a Receber</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {funcionarios.length === 0 ? (
                            <tr>
                              <td colSpan="6" className="text-center">
                                Nenhum registro encontrado.
                              </td>
                            </tr>
                          ) : (
                            funcionarios.map((func, idx) => (
                              <tr key={idx}>
                                <td>{func.nome}</td>
                                <td>{func.funcao}</td>
                                <td>{func.tipoContratacao}</td>
                                <td>{func.valorDevido}</td>
                                <td>{func.totalReceber}</td>
                                <td>
                                  <span className={`badge ${getStatusBadgeClass(func.status)}`}>{func.status}</span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Tab>

                <Tab eventKey="historico" title="Histórico">
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Selecione a planilha histórica:</Form.Label>
                        <Form.Select onChange={handleSelectPlanilha} value={selectedPlanilha}>
                          <option value="">Selecione uma planilha...</option>
                          {getPlanilhasFiltradas().map((plan) => (
                            <option key={plan.id} value={plan.id}>
                              {plan.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6} className="d-flex align-items-end justify-content-end">
                      <Button
                        variant="outline-primary"
                        className="d-flex align-items-center"
                        onClick={exportarRelatorioPagamentos}
                      >
                        <Download size={16} className="me-2" />
                        Exportar Relatório
                      </Button>
                    </Col>
                  </Row>

                  {loadingPagamentos ? (
                    <div className="d-flex justify-content-center my-4">
                      <Spinner animation="border" variant="primary" />
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table striped bordered hover>
                        <thead>
                          <tr>
                            <th>Nome</th>
                            <th>Função</th>
                            <th>Tipo de Contratação</th>
                            <th>Valor Devido</th>
                            <th>Total a Receber</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {funcionarios.length === 0 ? (
                            <tr>
                              <td colSpan="6" className="text-center">
                                Nenhum registro histórico encontrado.
                              </td>
                            </tr>
                          ) : (
                            funcionarios.map((func, idx) => (
                              <tr key={idx}>
                                <td>{func.nome}</td>
                                <td>{func.funcao}</td>
                                <td>{func.tipoContratacao}</td>
                                <td>{func.valorDevido}</td>
                                <td>{func.totalReceber}</td>
                                <td>
                                  <span className={`badge ${getStatusBadgeClass(func.status)}`}>{func.status}</span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Tab>

                <Tab eventKey="todos" title="Todos">
                  <Row className="mb-3">
                    <Col md={6}>
                      <Form.Group>
                        <Form.Label>Selecione a planilha:</Form.Label>
                        <Form.Select onChange={handleSelectPlanilha} value={selectedPlanilha}>
                          <option value="">Selecione uma planilha...</option>
                          {planilhasPagamento.map((plan) => (
                            <option key={plan.id} value={plan.id}>
                              {plan.name}
                            </option>
                          ))}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={6} className="d-flex align-items-end justify-content-end">
                      <div className="d-flex gap-2">
                        <Button
                          variant="outline-success"
                          className="d-flex align-items-center"
                          onClick={exportarRelatorioPagamentos}
                        >
                          <Download size={16} className="me-2" />
                          Exportar Relatório
                        </Button>
                      </div>
                    </Col>
                  </Row>

                  {loadingPagamentos ? (
                    <div className="d-flex justify-content-center my-4">
                      <Spinner animation="border" variant="primary" />
                    </div>
                  ) : (
                    <div className="table-responsive">
                      <Table striped bordered hover>
                        <thead>
                          <tr>
                            <th>Nome</th>
                            <th>Função</th>
                            <th>Tipo de Contratação</th>
                            <th>Valor Devido</th>
                            <th>Total a Receber</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {funcionarios.length === 0 ? (
                            <tr>
                              <td colSpan="6" className="text-center">
                                Nenhum registro encontrado.
                              </td>
                            </tr>
                          ) : (
                            funcionarios.map((func, idx) => (
                              <tr key={idx}>
                                <td>{func.nome}</td>
                                <td>{func.funcao}</td>
                                <td>{func.tipoContratacao}</td>
                                <td>{func.valorDevido}</td>
                                <td>{func.totalReceber}</td>
                                <td>
                                  <span className={`badge ${getStatusBadgeClass(func.status)}`}>{func.status}</span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </Table>
                    </div>
                  )}
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default Financeiro