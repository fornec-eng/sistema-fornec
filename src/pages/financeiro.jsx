"use client"

import { useState, useEffect, useMemo } from "react"
import { Container, Row, Col, Spinner, Button, Tabs, Tab, Card, Alert } from "react-bootstrap"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from "chart.js"
import ChartDataLabels from "chartjs-plugin-datalabels"
import { AlertCircle, Calendar, TrendingUp, Home, Plus, ArrowDownCircle } from "lucide-react"
import { useNavigate } from "react-router-dom"
import apiService from "../services/apiService"

// Importar componentes refatorados
import ResumoFinanceiro from "../components/financeiro/ResumoFinanceiro"
import AgendaGastos from "../components/financeiro/AgendaGastos"
import TabelaGastosCompleta from "../components/financeiro/TabelaGastosCompleta"
import EditGastoModal from "../components/financeiro/EditGastoModal"
import DeleteGastoModal from "../components/financeiro/DeleteGastoModal"
import ContratosResumo from "../components/financeiro/ContratosResumo"
import EntradasList from "../components/EntradasList"
import EntradaModal from "../components/modals/EntradaModal"

import { FileText } from "lucide-react" // Novo ícone para contratos

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend, ChartDataLabels)

const Financeiro = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [gastosFuturos, setGastosFuturos] = useState([])
  const [loadingFuturos, setLoadingFuturos] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("resumo")

  const [showEditModal, setShowEditModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)

  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingItem, setDeletingItem] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [detalhesGastos, setDetalhesGastos] = useState(null)
  const [loadingDetalhes, setLoadingDetalhes] = useState(false)

  const [obras, setObras] = useState([])

  const [showEntradaModal, setShowEntradaModal] = useState(false)
  const [editingEntrada, setEditingEntrada] = useState(null)
  const [entradas, setEntradas] = useState([])
  const [loadingEntradas, setLoadingEntradas] = useState(false)

  const [alert, setAlert] = useState({ show: false, message: "", variant: "" })

  const showAlert = (message, variant = "success", duration = 5000) => {
    setAlert({ show: true, message, variant })
    setTimeout(() => setAlert({ show: false, message: "", variant: "" }), duration)
  }

  const formatCurrency = (value) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0)

  const formatDate = (dateString) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString("pt-BR", { timeZone: "UTC" })
  }

  const extrairObraId = (obraId) => {
    if (!obraId) return null
    if (typeof obraId === "string") return obraId
    if (typeof obraId === "object" && obraId._id) return obraId._id
    return null
  }

  const extrairNomeObraSeguro = (gasto, obras) => {
    if (!gasto || !gasto.obraId) return "Fornec (sem obra associada)"
    if (typeof gasto.obraId === "object" && gasto.obraId !== null && gasto.obraId.nome) return gasto.obraId.nome
    const obraIdString = extrairObraId(gasto.obraId)
    if (obraIdString && obras && Array.isArray(obras)) {
      const obra = obras.find((o) => o && o._id === obraIdString)
      return obra ? obra.nome : `Obra ID: ${obraIdString}`
    }
    return "Fornec (sem obra associada)"
  }

  const getDiasRestantes = (dataString) => {
    if (!dataString) return null
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const dataVencimento = new Date(dataString)
    dataVencimento.setHours(0, 0, 0, 0)
    const diffTime = dataVencimento - hoje
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const filtrarPorObra = (gastos, obraId) => {
    return gastos.filter((gasto) => {
      if (obraId === null || obraId === undefined) return !gasto.obraId
      const gastoObraId = typeof gasto.obraId === "object" && gasto.obraId?._id ? gasto.obraId._id : gasto.obraId
      return String(gastoObraId) === String(obraId)
    })
  }

  const fetchEntradas = async () => {
    setLoadingEntradas(true)
    try {
      const response = await apiService.entradas.getAll({ limit: 60000 })
      if (!response.error) {
        setEntradas(response.entradas || [])
      }
    } catch (error) {
      console.error("Erro ao buscar entradas:", error)
      showAlert("Erro ao carregar entradas", "warning")
    } finally {
      setLoadingEntradas(false)
    }
  }

  const fetchAllData = async () => {
    setLoading(true)
    setError(null)
    try {
      const params = { limit: 60000 }
      const [obrasRes, materiaisRes, maoObraRes, equipamentosRes, contratosRes, outrosGastosRes, entradasRes] =
        await Promise.all([
          apiService.obras.getAll(),
          apiService.materiais.getAll(params),
          apiService.maoObra.getAll(params),
          apiService.equipamentos.getAll(params),
          apiService.contratos.getAll(params),
          apiService.outrosGastos.getAll(params),
          apiService.entradas.getAll(params),
        ])

      const obras = obrasRes.obras || []
      const gastos = [
        ...(materiaisRes.materiais || []),
        ...(maoObraRes.maoObras || []),
        ...(equipamentosRes.equipamentos || []),
        ...(contratosRes.contratos || []),
        ...(outrosGastosRes.gastos || []),
      ]

      const entradas = entradasRes.entradas || []
      setEntradas(entradas)

      const totalOrcamento = obras.reduce((acc, obra) => acc + (obra.valorContrato || 0), 0)
      const totalGasto = gastos.reduce((acc, gasto) => acc + (gasto.valor || 0), 0)
      const totalEntradas = entradas.reduce((acc, entrada) => acc + (entrada.valor || 0), 0)

      const gastosPorCategoria = {
        Materiais: (materiaisRes.materiais || []).reduce((acc, item) => acc + (item.valor || 0), 0),
        "Mão de Obra": (maoObraRes.maoObras || []).reduce((acc, item) => acc + (item.valor || 0), 0),
        Equipamentos: (equipamentosRes.equipamentos || []).reduce((acc, item) => acc + (item.valor || 0), 0),
        Contratos: (contratosRes.contratos || []).reduce((acc, item) => acc + (item.valor || 0), 0),
        Outros: (outrosGastosRes.gastos || []).reduce((acc, item) => acc + (item.valor || 0), 0),
      }

      const gastosPorObra = obras.map((obra) => {
        const gastosDaObra = filtrarPorObra(gastos, obra._id)
        const totalGastoObra = gastosDaObra.reduce((acc, g) => acc + (g.valor || 0), 0)
        return { nome: obra.nome, orcamento: obra.valorContrato || 0, gasto: totalGastoObra }
      })

      setStats({
        totalOrcamento,
        totalGasto,
        totalEntradas,
        saldoGeral: totalOrcamento - totalGasto,
        saldoComEntradas: totalOrcamento + totalEntradas - totalGasto,
        gastosPorCategoria,
        gastosPorObra,
        totalObras: obras.length,
      })
    } catch (err) {
      console.error("Erro ao buscar dados financeiros:", err)
      setError(
        "Não foi possível carregar os dados financeiros. A API pode estar sobrecarregada. Tente novamente mais tarde.",
      )
    } finally {
      setLoading(false)
    }
  }

  const organizarGastosPorObra = async () => {
    try {
      const params = { limit: 60000 }
      const [obrasRes, materiaisRes, maoObraRes, equipamentosRes, contratosRes, outrosGastosRes] = await Promise.all([
        apiService.obras.getAll(params),
        apiService.materiais.getAll(params),
        apiService.maoObra.getAll(params),
        apiService.equipamentos.getAll(params),
        apiService.contratos.getAll(params),
        apiService.outrosGastos.getAll(params),
      ])

      const obras = obrasRes.obras || []
      const gastosPorObra = {}

      obras.forEach((obra) => {
        const gastosDaObra = {
          materiais: filtrarPorObra(materiaisRes.materiais || [], obra._id),
          maoObra: filtrarPorObra(maoObraRes.maoObras || [], obra._id),
          equipamentos: filtrarPorObra(equipamentosRes.equipamentos || [], obra._id),
          contratos: filtrarPorObra(contratosRes.contratos || [], obra._id),
          outrosGastos: filtrarPorObra(outrosGastosRes.gastos || [], obra._id),
        }

        const allGastos = [
          ...gastosDaObra.materiais,
          ...gastosDaObra.maoObra,
          ...gastosDaObra.equipamentos,
          ...gastosDaObra.contratos,
          ...gastosDaObra.outrosGastos,
        ]

        gastosPorObra[obra.nome] = {
          obraId: obra._id,
          total: allGastos.reduce((acc, gasto) => acc + (gasto.valor || 0), 0),
          gastosPorTipo: {
            Materiais: {
              total: gastosDaObra.materiais.reduce((acc, g) => acc + (g.valor || 0), 0),
              gastos: gastosDaObra.materiais.map((g) => ({ ...g, tipo: "Materiais" })),
            },
            "Mão de Obra": {
              total: gastosDaObra.maoObra.reduce((acc, g) => acc + (g.valor || 0), 0),
              gastos: gastosDaObra.maoObra.map((g) => ({ ...g, tipo: "Mão de Obra" })),
            },
            Equipamentos: {
              total: gastosDaObra.equipamentos.reduce((acc, g) => acc + (g.valor || 0), 0),
              gastos: gastosDaObra.equipamentos.map((g) => ({ ...g, tipo: "Equipamentos" })),
            },
            Contratos: {
              total: gastosDaObra.contratos.reduce((acc, g) => acc + (g.valor || 0), 0),
              gastos: gastosDaObra.contratos.map((g) => ({ ...g, tipo: "Contratos" })),
            },
            Outros: {
              total: gastosDaObra.outrosGastos.reduce((acc, g) => acc + (g.valor || 0), 0),
              gastos: gastosDaObra.outrosGastos.map((g) => ({ ...g, tipo: "Outros" })),
            },
          },
        }
      })
      return { gastosPorObra }
    } catch (error) {
      console.error("Erro ao organizar gastos:", error)
      setError("Falha ao organizar os detalhes dos gastos. A API pode estar indisponível.")
      return null
    }
  }

  useEffect(() => {
    fetchAllData()
    const loadDetails = async () => {
      setLoadingDetalhes(true)
      const detalhes = await organizarGastosPorObra()
      setDetalhesGastos(detalhes)
      setLoadingDetalhes(false)
    }
    loadDetails()
  }, [])

  useEffect(() => {
    if (activeTab === "agenda") {
      fetchGastosFuturos()
    } else if (activeTab === "entradas") {
      fetchEntradas()
    }
  }, [activeTab])

  const fetchGastosFuturos = async () => {
    setLoadingFuturos(true)
    try {
      const [response, obrasRes] = await Promise.all([apiService.buscarGastosFuturos(), apiService.obras.getAll()])
      if (!response.error) {
        const obras = obrasRes.obras || []
        const gastosComObra = (response.gastos || []).map((gasto) => ({
          ...gasto,
          obraNome: extrairNomeObraSeguro(gasto, obras),
        }))
        setGastosFuturos(gastosComObra)
      }
    } catch (error) {
      console.error("Erro ao buscar gastos futuros:", error)
    } finally {
      setLoadingFuturos(false)
    }
  }

  const handleOpenEditModal = (item) => {
    setEditingItem(item)
    setShowEditModal(true)
  }

  const handleCloseEditModal = () => {
    setEditingItem(null)
    setShowEditModal(false)
  }

  const handleEditSubmit = async (formData) => {
    if (!editingItem) return

    const serviceMap = {
      // Plural forms (current)
      Materiais: apiService.materiais,
      "Mão de Obra": apiService.maoObra,
      Equipamentos: apiService.equipamentos,
      Contratos: apiService.contratos,
      Outros: apiService.outrosGastos,
      // Singular forms (from API)
      Material: apiService.materiais,
      "Mao de Obra": apiService.maoObra,
      MaoObra: apiService.maoObra,
      Equipamento: apiService.equipamentos,
      Contrato: apiService.contratos,
      Outro: apiService.outrosGastos,
      "Outros Gastos": apiService.outrosGastos,
      OutrosGastos: apiService.outrosGastos,
    }

    console.log("[v0] Item type received:", editingItem.tipo)
    console.log("[v0] Available service mappings:", Object.keys(serviceMap))

    const service = serviceMap[editingItem.tipo]
    if (service) {
      try {
        console.log("[v0] Editing item:", editingItem)
        console.log("[v0] Form data received:", formData)

        // Prepare data for update - ensure we have the ID and all required fields
        const dataToSubmit = {
          ...formData,
          _id: editingItem._id,
          obraId: formData.obraId || editingItem.obraId,
        }

        console.log("[v0] Data being sent to API:", dataToSubmit)

        const response = await service.update(editingItem._id, dataToSubmit)
        console.log("[v0] API response:", response)

        if (response.error) {
          throw new Error(response.message || "Erro na atualização")
        }

        showAlert("Item atualizado com sucesso!", "success")
        handleCloseEditModal()

        // Refresh all data
        await fetchAllData()
        if (activeTab === "agenda") {
          await fetchGastosFuturos()
        }

        // Refresh details
        const detalhes = await organizarGastosPorObra()
        setDetalhesGastos(detalhes)
      } catch (error) {
        console.error("[v0] Error updating item:", error)
        showAlert(
          error.response?.data?.message ||
            error.message ||
            "Erro ao atualizar item. Verifique os dados e tente novamente.",
          "danger",
        )
      }
    } else {
      console.error("[v0] No service found for item type:", editingItem.tipo)
      console.error("[v0] Available mappings:", Object.keys(serviceMap))
      showAlert(
        `Tipo de item não reconhecido para edição: "${editingItem.tipo}". Tipos disponíveis: ${Object.keys(serviceMap).join(", ")}`,
        "danger",
      )
    }
  }

  const handleOpenDeleteModal = (item) => {
    setDeletingItem(item)
    setShowDeleteModal(true)
  }

  const handleCloseDeleteModal = () => {
    setDeletingItem(null)
    setShowDeleteModal(false)
  }

  const handleDeleteSubmit = async () => {
    if (!deletingItem) return
    setIsDeleting(true)
    const serviceMap = {
      Materiais: apiService.materiais,
      "Mão de Obra": apiService.maoObra,
      Equipamentos: apiService.equipamentos,
      Contratos: apiService.contratos,
      Outros: apiService.outrosGastos,
    }
    const service = serviceMap[deletingItem.tipo]
    try {
      if (service) {
        await service.delete(deletingItem._id)
        showAlert("Item excluído com sucesso!", "success")
        handleCloseDeleteModal()
        fetchAllData()
        fetchGastosFuturos()
        const detalhes = await organizarGastosPorObra()
        setDetalhesGastos(detalhes)
      }
    } catch (error) {
      console.error("Erro ao excluir item:", error)
      showAlert("Erro ao excluir item.", "danger")
    } finally {
      setIsDeleting(false)
    }
  }

  const chartData = useMemo(() => {
    if (!stats) return { doughnut: null, bar: null }
    const doughnut = {
      labels: Object.keys(stats.gastosPorCategoria),
      datasets: [
        {
          data: Object.values(stats.gastosPorCategoria),
          backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"],
        },
      ],
    }
    const bar = {
      labels: stats.gastosPorObra.map((o) => o.nome),
      datasets: [
        {
          label: "Orçamento",
          data: stats.gastosPorObra.map((o) => o.orcamento),
          backgroundColor: "rgba(54, 162, 235, 0.5)",
        },
        {
          label: "Gasto",
          data: stats.gastosPorObra.map((o) => o.gasto),
          backgroundColor: "rgba(255, 99, 132, 0.5)",
        },
      ],
    }
    return { doughnut, bar }
  }, [stats])

  const getStatusPagamento = (gasto) =>
    gasto.statusPagamento || gasto.status || (gasto.efetuado ? "efetuado" : "pendente")

  const agendaData = useMemo(() => {
    if (!gastosFuturos.length)
      return {
        proximosDias: [],
        proximaSemana: [],
        emAtraso: [],
        totalProximosDias: 0,
        totalProximaSemana: 0,
        totalEmAtraso: 0,
      }
    const hoje = new Date()
    const proximos7dias = new Date(hoje)
    proximos7dias.setDate(hoje.getDate() + 7)
    const proximos14dias = new Date(hoje)
    proximos14dias.setDate(hoje.getDate() + 14)

    const emAtraso = gastosFuturos.filter((g) => {
      const dataVenc = new Date(g.dataVencimento || g.dataPagamento || g.dataInicio)
      return dataVenc < hoje && getStatusPagamento(g) !== "efetuado"
    })
    const proximosDias = gastosFuturos.filter((g) => {
      const dataVenc = new Date(g.dataVencimento || g.dataPagamento || g.dataInicio)
      return dataVenc >= hoje && dataVenc <= proximos7dias && getStatusPagamento(g) !== "efetuado"
    })
    const proximaSemana = gastosFuturos.filter((g) => {
      const dataVenc = new Date(g.dataVencimento || g.dataPagamento || g.dataInicio)
      return dataVenc > proximos7dias && dataVenc <= proximos14dias && getStatusPagamento(g) !== "efetuado"
    })

    return {
      emAtraso,
      proximosDias,
      proximaSemana,
      totalEmAtraso: emAtraso.reduce((acc, g) => acc + (g.valor || 0), 0),
      totalProximosDias: proximosDias.reduce((acc, g) => acc + (g.valor || 0), 0),
      totalProximaSemana: proximaSemana.reduce((acc, g) => acc + (g.valor || 0), 0),
    }
  }, [gastosFuturos])

  const totalGastosFuturos = useMemo(() => gastosFuturos.reduce((acc, g) => acc + (g.valor || 0), 0), [gastosFuturos])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "top" }, datalabels: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { callback: (v) => formatCurrency(v) } } },
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { position: "bottom" }, datalabels: { display: false } },
  }

  const getStatusBadge = (status) => {
    const config = {
      pendente: { variant: "warning", label: "Pendente" },
      efetuado: { variant: "success", label: "Efetuado" },
      atrasado: { variant: "danger", label: "Atrasado" },
    }
    return config[status] || config.pendente
  }

  const handleOpenEntradaModal = (entrada = null) => {
    setEditingEntrada(entrada)
    setShowEntradaModal(true)
  }

  const handleCloseEntradaModal = () => {
    setEditingEntrada(null)
    setShowEntradaModal(false)
  }

  const handleEntradaSuccess = (entrada) => {
    showAlert(`Entrada ${editingEntrada ? "atualizada" : "adicionada"} com sucesso!`, "success")
    fetchAllData() // Refresh all data including stats
    fetchEntradas() // Refresh entradas list
  }

  const handleDeleteEntrada = async (entradaId) => {
    if (window.confirm("Tem certeza que deseja excluir esta entrada?")) {
      try {
        await apiService.entradas.delete(entradaId)
        showAlert("Entrada excluída com sucesso!", "success")
        fetchAllData()
        fetchEntradas()
      } catch (error) {
        console.error("Erro ao excluir entrada:", error)
        showAlert("Erro ao excluir entrada.", "danger")
      }
    }
  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "300px" }}>
        <Spinner animation="border" variant="primary" />
        <span className="ms-2">Carregando dados financeiros...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Container className="text-center mt-5">
        <Card body className="border-danger">
          <AlertCircle size={48} className="text-danger mb-3" />
          <h4>Ocorreu um Erro</h4>
          <p>{error}</p>
        </Card>
      </Container>
    )
  }

  return (
    <>
      <Container fluid className="mt-4 mb-5">
        {alert.show && (
          <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1050 }}>
            <Alert variant={alert.variant} onClose={() => setAlert({ show: false })} dismissible>
              {alert.message}
            </Alert>
          </div>
        )}

        <Row className="mb-4 align-items-center">
          <Col xs="auto">
            <Button variant="primary" size="sm" onClick={() => navigate("/home")}>
              <Home size={16} className="me-2" />
              Início
            </Button>
          </Col>
          <Col>
            <h1 className="mb-0">Painel Financeiro</h1>
            <p className="text-muted">Visão geral das finanças e agenda de gastos futuros.</p>
          </Col>
          <Col xs="auto" className="d-flex gap-2">
            <Button variant="success" onClick={() => handleOpenEntradaModal()}>
              <Plus size={16} className="me-2" />
              Adicionar Nova Entrada
            </Button>
            <Button variant="primary" onClick={() => navigate("/adicionar-pagamentos")}>
              <Plus size={16} className="me-2" />
              Adicionar Novo Gasto
            </Button>
          </Col>
        </Row>

        <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)} className="mb-4">
          <Tab
            eventKey="resumo"
            title={
              <span>
                <TrendingUp size={16} className="me-2" />
                Resumo Financeiro
              </span>
            }
          >
            <ResumoFinanceiro
              stats={stats}
              chartData={chartData}
              chartOptions={chartOptions}
              doughnutOptions={doughnutOptions}
              formatCurrency={formatCurrency}
            />
            <TabelaGastosCompleta
              stats={stats}
              loadingDetalhes={loadingDetalhes}
              detalhesGastos={detalhesGastos}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              getStatusPagamento={getStatusPagamento}
              getStatusBadge={getStatusBadge}
              handleOpenEditModal={handleOpenEditModal}
              handleOpenDeleteModal={handleOpenDeleteModal}
              navigate={navigate}
            />
          </Tab>
          <Tab
            eventKey="agenda"
            title={
              <span>
                <Calendar size={16} className="me-2" />
                Agenda de Gastos
              </span>
            }
          >
            <AgendaGastos
              agendaData={agendaData}
              loadingFuturos={loadingFuturos}
              gastosFuturos={gastosFuturos}
              totalGastosFuturos={totalGastosFuturos}
              formatCurrency={formatCurrency}
              formatDate={formatDate}
              getDiasRestantes={getDiasRestantes}
              getStatusPagamento={getStatusPagamento}
              getStatusBadge={getStatusBadge}
              handleOpenEditModal={handleOpenEditModal}
              handleOpenDeleteModal={handleOpenDeleteModal}
            />
          </Tab>
          <Tab
            eventKey="entradas"
            title={
              <span>
                <ArrowDownCircle size={16} className="me-2" />
                Entradas
              </span>
            }
          >
            <EntradasList
              gastos={{ entradas }}
              showAddButton={true}
              onEntradaAdded={() => handleOpenEntradaModal()}
              onEditEntrada={(entrada) => handleOpenEntradaModal(entrada)}
              onDeleteEntrada={handleDeleteEntrada}
            />
          </Tab>
          <Tab
            eventKey="contratos"
            title={
              <span>
                <FileText size={16} className="me-2" />
                Contratos
              </span>
            }
          >
            <ContratosResumo obras={obras} />
          </Tab>
        </Tabs>
      </Container>

      <EditGastoModal
        show={showEditModal}
        onHide={handleCloseEditModal}
        editingItem={editingItem}
        onSubmit={handleEditSubmit}
        onCancel={handleCloseEditModal}
      />

      <DeleteGastoModal
        show={showDeleteModal}
        onHide={handleCloseDeleteModal}
        deletingItem={deletingItem}
        onSubmit={handleDeleteSubmit}
        isDeleting={isDeleting}
        formatCurrency={formatCurrency}
      />

      <EntradaModal
        show={showEntradaModal}
        onHide={handleCloseEntradaModal}
        onSuccess={handleEntradaSuccess}
        initialData={editingEntrada}
      />
    </>
  )
}

export default Financeiro
