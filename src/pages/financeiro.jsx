"use client"

import { useState, useEffect, useRef } from "react"
import { Container, Row, Col, Card, Spinner, Button, Table, Form } from "react-bootstrap"
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
import { Download, ExternalLink } from "lucide-react"
import { Link } from "react-router-dom"
import ApiBase from "../services/ApiBase"
import jsPDF from "jspdf"

// Registrar componentes do Chart.js
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
  const [totalPagamentosPendentes, setTotalPagamentosPendentes] = useState(0)
  const [totalPagamentosEfetuados, setTotalPagamentosEfetuados] = useState(0)
  const [obrasSummary, setObrasSummary] = useState([])

  // Refs para os gráficos (para exportação PDF)
  const gastoMensalChartRef = useRef(null)
  const distribuicaoGastosChartRef = useRef(null)

  // IDs das pastas do Google Drive
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

  // 1. Buscar lista de obras e planilhas de pagamento
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
          await fetchObrasSummary(filteredObras)
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

  // Buscar resumo de cada obra (similar ao componente obras_ativas)
  const fetchObrasSummary = async (obrasList) => {
    try {
      const summaries = await Promise.all(
        obrasList.map(async (obra) => {
          try {
            const res = await ApiBase.post("/google/sheets/data", {
              data: { spreadsheetId: obra.id, range: "Resumo" },
            })
            const values = res.data.values || []

            // Extrair dados do resumo
            const orcamentoRow = values.find((row) => row[0] === "Orçamento:")
            const inicioRow = values.find((row) => row[0] === "Início da Obra:")
            const terminoRow = values.find((row) => row[0] === "Data final de Entrega:")
            const gastoTotalRow = values.find((row) => row[0] === "Gasto total:")

            return {
              ...obra,
              summaryData: {
                orcamento: orcamentoRow ? orcamentoRow[1] : "N/A",
                inicio: inicioRow ? inicioRow[1] : "N/A",
                fim: terminoRow ? terminoRow[1] : "N/A",
                gastoTotal: gastoTotalRow ? gastoTotalRow[1] : "N/A",
              },
            }
          } catch (error) {
            console.error(`Erro ao buscar resumo para a obra ${obra.name}:`, error)
            return {
              ...obra,
              summaryData: {
                orcamento: "N/A",
                inicio: "N/A",
                fim: "N/A",
                gastoTotal: "N/A",
              },
            }
          }
        }),
      )

      setObrasSummary(summaries)
    } catch (error) {
      console.error("Erro ao buscar resumos das obras:", error)
    }
  }

  // Buscar dados financeiros de todas as obras
  const fetchFinancialData = async (obrasList) => {
    try {
      let totalOrcamento = 0
      let totalGasto = 0
      const gastosPorCategoria = {
        "Gasto material": 0,
        "Locação de equipamento": 0,
        "Mão de Obra": 0,
        Contratos: 0,
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

              // Extrair gastos por categoria (ajustado para incluir Contratos)
              // Baseado no exemplo do GraficoInvestimento
              try {
                if (resumoValues[6] && resumoValues[6][1]) {
                  gastosPorCategoria["Gasto material"] += currencyToNumber(resumoValues[6][1])
                }
                if (resumoValues[7] && resumoValues[7][1]) {
                  gastosPorCategoria["Locação de equipamento"] += currencyToNumber(resumoValues[7][1])
                }
                if (resumoValues[8] && resumoValues[8][1]) {
                  gastosPorCategoria["Mão de Obra"] += currencyToNumber(resumoValues[8][1])
                }
                if (resumoValues[9] && resumoValues[9][1]) {
                  gastosPorCategoria["Contratos"] += currencyToNumber(resumoValues[9][1])
                }
                if (resumoValues[10] && resumoValues[10][1]) {
                  gastosPorCategoria["Outros gastos"] += currencyToNumber(resumoValues[10][1])
                }
              } catch (error) {
                console.error("Erro ao processar categorias de gastos:", error)
              }
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
        .filter((item) => item.valor > 0) // Remover categorias com valor zero
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
        setTotalPagamentosPendentes(0)
        setTotalPagamentosEfetuados(0)
        setLoadingPagamentos(false)
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

      // Verificar se os índices são válidos
      if (indices.nome === -1 || indices.status === -1) {
        setFuncionarios([])
        setTotalPagamentosPendentes(0)
        setTotalPagamentosEfetuados(0)
        setLoadingPagamentos(false)
        return
      }

      // Processar dados de funcionários
      const dataRows = rows.slice(2)
      const parsedFuncionarios = dataRows
        .filter((row) => row.length > Math.max(indices.nome, indices.status)) // Filtrar linhas vazias
        .map((row) => ({
          nome: row[indices.nome] || "",
          funcao: row[indices.funcao] || "",
          tipoContratacao: row[indices.tipoContratacao] || "",
          valorDevido: row[indices.valorDevido] || "",
          totalReceber: row[indices.totalReceber] || "",
          status: row[indices.status] || "",
        }))
        .filter((func) => func.nome && func.nome.trim() !== "") // Filtrar funcionários sem nome

      setFuncionarios(parsedFuncionarios)

      // Calcular totais de pagamentos
      const pendentes = parsedFuncionarios
        .filter((f) => f.status === "Pagar")
        .reduce((total, f) => total + currencyToNumber(f.valorDevido), 0)

      const efetuados = parsedFuncionarios
        .filter((f) => f.status === "Pagamento Efetuado")
        .reduce((total, f) => total + currencyToNumber(f.valorDevido), 0)

      setTotalPagamentosPendentes(pendentes)
      setTotalPagamentosEfetuados(efetuados)
    } catch (error) {
      console.error("Erro ao carregar dados da planilha:", error)
      setFuncionarios([])
      setTotalPagamentosPendentes(0)
      setTotalPagamentosEfetuados(0)
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

  // Preparar dados para o gráfico de gastos mensais
  const gastoMensalChartData = {
    labels: resumoFinanceiro.gastoMensal.map((item) => item.mes),
    datasets: [
      {
        label: "Investimento Mensal (R$)",
        data: resumoFinanceiro.gastoMensal.map((item) => item.valor),
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
          "rgba(153, 102, 255, 0.7)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(153, 102, 255, 1)",
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
          <div className="d-flex justify-content-between align-items-center">
            <h1 className="text-center flex-grow-1">Controle Financeiro</h1>
            <Button variant="outline-success" className="d-flex align-items-center" onClick={exportarPDF}>
              <Download size={16} className="me-2" />
              Exportar PDF
            </Button>
          </div>
        </Col>
      </Row>

      {/* PARTE 1: Cards de KPIs */}
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

      {/* PARTE 2: Gráficos aglomerados das obras */}
      <Row className="mb-4">
        <Col md={8}>
          <Card style={{ borderRadius: "10px", boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)", height: "100%" }}>
            <Card.Body>
              <Card.Title>Investimento Mensal (Todas as Obras)</Card.Title>
              {resumoFinanceiro.gastoMensal.length > 0 ? (
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
              ) : (
                <div className="d-flex justify-content-center align-items-center" style={{ height: "300px" }}>
                  <p className="text-muted">Nenhum dado de investimento mensal disponível</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          <Card style={{ borderRadius: "10px", boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)", height: "100%" }}>
            <Card.Body>
              <Card.Title>Distribuição de Gastos (Todas as Obras)</Card.Title>
              {resumoFinanceiro.distribuicaoGastos.length > 0 ? (
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
              ) : (
                <div className="d-flex justify-content-center align-items-center" style={{ height: "300px" }}>
                  <p className="text-muted">Nenhum dado de distribuição de gastos disponível</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* PARTE 3: Pagamentos Semanais */}
      <Row className="mb-4">
        <Col md={12}>
          <Card style={{ borderRadius: "10px", boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}>
            <Card.Body>
              <Card.Title>Pagamentos Semanais</Card.Title>

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
                {funcionarios.length > 0 && (
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
                        <span>{funcionarios.filter((f) => f.status === "Pagamento Efetuado").length} funcionários</span>
                      </div>
                    </div>
                  </Col>
                )}
              </Row>

              {loadingPagamentos ? (
                <div className="d-flex justify-content-center my-4">
                  <Spinner animation="border" variant="primary" />
                </div>
              ) : funcionarios.length > 0 ? (
                <>
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
                        {funcionarios.map((func, idx) => (
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
                        ))}
                      </tbody>
                    </Table>
                  </div>

                  <div className="mt-3">
                    <div className="d-flex justify-content-between">
                      <div>
                        <strong>Total Pendente:</strong> {formatCurrency(totalPagamentosPendentes)}
                      </div>
                      <div>
                        <strong>Total Pago:</strong> {formatCurrency(totalPagamentosEfetuados)}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted">Nenhum registro de pagamento encontrado na planilha selecionada.</p>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* PARTE 4: Resumo por Obra */}
      <Row>
        <Col md={12}>
          <Card style={{ borderRadius: "10px", boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}>
            <Card.Body>
              <Card.Title>Resumo por Obra</Card.Title>
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Nome da Obra</th>
                      <th>Orçamento</th>
                      <th>Gasto Total</th>
                      <th>Restante</th>
                      <th>Progresso</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {obrasSummary.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="text-center">
                          Nenhuma obra encontrada.
                        </td>
                      </tr>
                    ) : (
                      obrasSummary.map((obra) => {
                        // Verificamos se a obra tem dados de resumo
                        const summaryData = obra.summaryData || {}
                        const orcamento = currencyToNumber(summaryData.orcamento || "0")
                        const gastoTotal = currencyToNumber(summaryData.gastoTotal || "0")
                        const restante = orcamento - gastoTotal
                        const progresso = orcamento > 0 ? (gastoTotal / orcamento) * 100 : 0

                        return (
                          <tr key={obra.id}>
                            <td>{obra.name}</td>
                            <td>{summaryData.orcamento || "N/A"}</td>
                            <td>{summaryData.gastoTotal || "N/A"}</td>
                            <td>{formatCurrency(restante)}</td>
                            <td>
                              <div className="progress" style={{ height: "20px" }}>
                                <div
                                  className={`progress-bar ${progresso > 90 ? "bg-danger" : "bg-success"}`}
                                  role="progressbar"
                                  style={{ width: `${Math.min(progresso, 100)}%` }}
                                  aria-valuenow={progresso}
                                  aria-valuemin="0"
                                  aria-valuemax="100"
                                >
                                  {progresso.toFixed(1)}%
                                </div>
                              </div>
                            </td>
                            <td>
                              <div className="d-flex gap-2">
                                <Button
                                  variant="outline-primary"
                                  size="sm"
                                  onClick={() =>
                                    window.open(`https://docs.google.com/spreadsheets/d/${obra.id}/edit`, "_blank")
                                  }
                                >
                                  Planilha
                                </Button>
                                <Link
                                  to={`/dashboard/${obra.id}`}
                                  state={{ name: obra.name }}
                                  className="btn btn-outline-success btn-sm d-flex align-items-center"
                                >
                                  Dashboard <ExternalLink size={14} className="ms-1" />
                                </Link>
                              </div>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </Table>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default Financeiro