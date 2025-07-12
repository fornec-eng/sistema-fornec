"use client"

import { useState, useEffect, useMemo } from "react"
import { Container, Row, Col, Card, Spinner, Button, Table, Badge, Tabs, Tab, Modal, Accordion, ListGroup } from "react-bootstrap"
import { Bar, Doughnut } from "react-chartjs-2"
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from "chart.js"
import ChartDataLabels from "chartjs-plugin-datalabels"
import { Download, Plus, AlertCircle, Calendar, Clock, TrendingUp, Edit, Building, ChevronDown, ChevronRight, DollarSign, Trash2 } from "lucide-react"
import { useNavigate } from "react-router-dom"
import apiService from "../services/apiService"
import jsPDF from "jspdf"

// Importar formulários para edição
import MaterialForm from "../components/forms/MaterialForm"
import MaoObraForm from "../components/forms/MaoObraForm"
import EquipamentoForm from "../components/forms/EquipamentoForm"
import ContratoForm from "../components/forms/ContratoForm"
import OutroGastoForm from "../components/forms/OutroGastoForm"

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend, ChartDataLabels)

const Financeiro = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState(null)
  const [gastosFuturos, setGastosFuturos] = useState([])
  const [loadingFuturos, setLoadingFuturos] = useState(false)
  const [error, setError] = useState(null)
  const [activeTab, setActiveTab] = useState("resumo")

  // State para modal de edição
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)

  // State para modal de exclusão
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deletingItem, setDeletingItem] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Estados para detalhes dos gastos
  const [showDetalhesGastos, setShowDetalhesGastos] = useState(false)
  const [detalhesGastos, setDetalhesGastos] = useState(null)
  const [loadingDetalhes, setLoadingDetalhes] = useState(false)

  // Estado para alertas
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

  const getDiasRestantes = (dataString) => {
    if (!dataString) return null
    const hoje = new Date()
    hoje.setHours(0, 0, 0, 0)
    const dataVencimento = new Date(dataString)
    dataVencimento.setHours(0, 0, 0, 0)
    const diffTime = dataVencimento - hoje
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const fetchAllData = async () => {
    setLoading(true)
    setError(null)
    try {
      const [obrasRes, materiaisRes, maoObraRes, equipamentosRes, contratosRes, outrosGastosRes] = await Promise.all([
        apiService.obras.getAll(),
        apiService.materiais.getAll(),
        apiService.maoObra.getAll(),
        apiService.equipamentos.getAll(),
        apiService.contratos.getAll(),
        apiService.outrosGastos.getAll(),
      ])

      // Extrair arrays corretamente da resposta da API
      const obras = obrasRes.obras || []
      const materiais = materiaisRes.materiais || []
      const maoObras = maoObraRes.maoObras || []
      const equipamentos = equipamentosRes.equipamentos || []
      const contratos = contratosRes.contratos || []
      const outrosGastos = outrosGastosRes.gastos || []

      const totalOrcamento = obras.reduce((acc, obra) => acc + (obra.valorContrato || 0), 0)

      const gastos = [...materiais, ...maoObras, ...equipamentos, ...contratos, ...outrosGastos]
      const totalGasto = gastos.reduce((acc, gasto) => acc + (gasto.valor || 0), 0)

      const gastosPorCategoria = {
        Materiais: materiais.reduce((acc, item) => acc + (item.valor || 0), 0),
        "Mão de Obra": maoObras.reduce((acc, item) => acc + (item.valor || 0), 0),
        Equipamentos: equipamentos.reduce((acc, item) => acc + (item.valor || 0), 0),
        Contratos: contratos.reduce((acc, item) => acc + (item.valor || 0), 0),
        Outros: outrosGastos.reduce((acc, item) => acc + (item.valor || 0), 0),
      }

      const gastosPorObra = obras.map((obra) => {
        const gastosDaObra = gastos.filter((g) => g.obraId === obra._id)
        const totalGastoObra = gastosDaObra.reduce((acc, g) => acc + (g.valor || 0), 0)
        return {
          nome: obra.nome,
          orcamento: obra.valorContrato || 0,
          gasto: totalGastoObra,
        }
      })

      setStats({
        totalOrcamento,
        totalGasto,
        saldoGeral: totalOrcamento - totalGasto,
        gastosPorCategoria,
        gastosPorObra,
        totalObras: obras.length,
      })
    } catch (err) {
      console.error("Erro ao buscar dados financeiros:", err)
      setError("Não foi possível carregar os dados financeiros. Verifique a conexão com a API.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAllData()
  }, [])

  useEffect(() => {
    if (activeTab === "agenda") {
      fetchGastosFuturos()
    }
  }, [activeTab])

  const fetchGastosFuturos = async () => {
    setLoadingFuturos(true)
    try {
      const [response, obrasRes] = await Promise.all([apiService.buscarGastosFuturos(), apiService.obras.getAll()])

      if (!response.error) {
        const obras = obrasRes.obras || []
        const gastosComObra = (response.gastos || []).map((gasto) => {
          const obra = obras.find((o) => o._id === gasto.obraId)
          return {
            ...gasto,
            obraNome: obra ? obra.nome : null,
          }
        })
        setGastosFuturos(gastosComObra)
      }
    } catch (error) {
      console.error("Erro ao buscar gastos futuros:", error)
    } finally {
      setLoadingFuturos(false)
    }
  }

  // Função para organizar gastos por obra (CORRIGIDA)
  const organizarGastosPorObra = async () => {
    try {
      const [obrasRes, materiaisRes, maoObraRes, equipamentosRes, contratosRes, outrosGastosRes] = await Promise.all([
        apiService.obras.getAll(),
        apiService.materiais.getAll(),
        apiService.maoObra.getAll(),
        apiService.equipamentos.getAll(),
        apiService.contratos.getAll(),
        apiService.outrosGastos.getAll(),
      ])

      const obras = obrasRes.obras || []
      
      // Combinar todos os gastos com tipo
      const todosGastos = [
        ...(materiaisRes.materiais || []).map(item => ({ ...item, tipo: 'Materiais' })),
        ...(maoObraRes.maoObras || []).map(item => ({ ...item, tipo: 'Mão de Obra' })),
        ...(equipamentosRes.equipamentos || []).map(item => ({ ...item, tipo: 'Equipamentos' })),
        ...(contratosRes.contratos || []).map(item => ({ ...item, tipo: 'Contratos' })),
        ...(outrosGastosRes.gastos || []).map(item => ({ ...item, tipo: 'Outros' })),
      ]

      // Organizar por obra
      const gastosPorObra = {}
      let gastosFornec = []

      todosGastos.forEach(gasto => {
        if (gasto.obraId) {
          const obra = obras.find(o => o._id === gasto.obraId)
          // CORREÇÃO: Usar obra.nome em vez de obra.name
          const nomeObra = obra ? obra.nome : `Obra ${gasto.obraId}`
          
          if (!gastosPorObra[nomeObra]) {
            gastosPorObra[nomeObra] = {
              obraId: gasto.obraId,
              gastos: [],
              total: 0
            }
          }
          gastosPorObra[nomeObra].gastos.push(gasto)
          gastosPorObra[nomeObra].total += gasto.valor || 0
        } else {
          gastosFornec.push(gasto)
        }
      })

      // Organizar gastos da Fornec
      const totalFornec = gastosFornec.reduce((acc, gasto) => acc + (gasto.valor || 0), 0)

      // Organizar por tipo dentro de cada categoria
      Object.keys(gastosPorObra).forEach(nomeObra => {
        const gastosPorTipo = {}
        gastosPorObra[nomeObra].gastos.forEach(gasto => {
          if (!gastosPorTipo[gasto.tipo]) {
            gastosPorTipo[gasto.tipo] = {
              gastos: [],
              total: 0
            }
          }
          gastosPorTipo[gasto.tipo].gastos.push(gasto)
          gastosPorTipo[gasto.tipo].total += gasto.valor || 0
        })
        gastosPorObra[nomeObra].gastosPorTipo = gastosPorTipo
      })

      // Organizar gastos da Fornec por tipo
      const gastosFornecPorTipo = {}
      gastosFornec.forEach(gasto => {
        if (!gastosFornecPorTipo[gasto.tipo]) {
          gastosFornecPorTipo[gasto.tipo] = {
            gastos: [],
            total: 0
          }
        }
        gastosFornecPorTipo[gasto.tipo].gastos.push(gasto)
        gastosFornecPorTipo[gasto.tipo].total += gasto.valor || 0
      })

      return {
        gastosPorObra,
        gastosFornec: {
          gastos: gastosFornec,
          gastosPorTipo: gastosFornecPorTipo,
          total: totalFornec
        }
      }
    } catch (error) {
      console.error('Erro ao organizar gastos:', error)
      return null
    }
  }

  const handleToggleDetalhesGastos = async () => {
    if (!showDetalhesGastos) {
      setLoadingDetalhes(true)
      const detalhes = await organizarGastosPorObra()
      setDetalhesGastos(detalhes)
      setLoadingDetalhes(false)
    }
    setShowDetalhesGastos(!showDetalhesGastos)
  }

  // Funções de edição
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
      Materiais: apiService.materiais,
      "Mão de Obra": apiService.maoObra,
      Equipamentos: apiService.equipamentos,
      Contratos: apiService.contratos,
      Outros: apiService.outrosGastos,
    }
    const service = serviceMap[editingItem.tipo]

    if (service) {
      try {
        await service.update(editingItem._id, formData)
        showAlert("Item atualizado com sucesso!", "success")
        handleCloseEditModal()
        // Recarrega todos os dados
        fetchAllData()
        fetchGastosFuturos()
        // Se os detalhes estiverem abertos, recarrega também
        if (showDetalhesGastos) {
          const detalhes = await organizarGastosPorObra()
          setDetalhesGastos(detalhes)
        }
      } catch (error) {
        console.error("Erro ao atualizar item:", error)
        showAlert("Erro ao atualizar item.", "danger")
      }
    }
  }

  // Funções de exclusão
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
         // Recarrega todos os dados
         fetchAllData()
         fetchGastosFuturos()
         // Se os detalhes estiverem abertos, recarrega também
         if (showDetalhesGastos) {
           const detalhes = await organizarGastosPorObra()
           setDetalhesGastos(detalhes)
         }
       }
     } catch (error) {
       console.error("Erro ao excluir item:", error)
       showAlert("Erro ao excluir item.", "danger")
     } finally {
       setIsDeleting(false)
     }
  }

  const getEditFormComponent = () => {
    if (!editingItem) return null
    switch (editingItem.tipo) {
      case "Materiais":
        return MaterialForm
      case "Mão de Obra":
        return MaoObraForm
      case "Equipamentos":
        return EquipamentoForm
      case "Contratos":
        return ContratoForm
      case "Outros":
        return OutroGastoForm
      default:
        return null
    }
  }

  const EditForm = getEditFormComponent()

  const chartData = useMemo(() => {
    if (!stats) return { doughnut: null, bar: null }

    const doughnut = {
      labels: Object.keys(stats.gastosPorCategoria),
      datasets: [
        {
          data: Object.values(stats.gastosPorCategoria),
          backgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"],
          hoverBackgroundColor: ["#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", "#9966FF"],
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
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 1,
        },
        {
          label: "Gasto",
          data: stats.gastosPorObra.map((o) => o.gasto),
          backgroundColor: "rgba(255, 99, 132, 0.5)",
          borderColor: "rgba(255, 99, 132, 1)",
          borderWidth: 1,
        },
      ],
    }

    return { doughnut, bar }
  }, [stats])

  // Função para obter status do pagamento com novo campo
  const getStatusPagamento = (gasto) => {
    // Usar o novo campo statusPagamento se existir
    if (gasto.statusPagamento) return gasto.statusPagamento

    // Fallback para campos antigos
    if (gasto.status) return gasto.status
    if (gasto.efetuado) return "efetuado"

    return "pendente"
  }

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
    const proximosDias = new Date(hoje)
    proximosDias.setDate(hoje.getDate() + 7)

    const proximaSemana = new Date(hoje)
    proximaSemana.setDate(hoje.getDate() + 14)

    const gastosEmAtraso = gastosFuturos.filter((gasto) => {
      const dataStr = gasto.dataVencimento || gasto.dataPagamento || gasto.dataInicio
      if (!dataStr) return false
      const dataVencimento = new Date(dataStr)
      return dataVencimento < hoje && getStatusPagamento(gasto) !== "efetuado"
    })

    const gastosProximosDias = gastosFuturos.filter((gasto) => {
      const dataStr = gasto.dataVencimento || gasto.dataPagamento || gasto.dataInicio
      if (!dataStr) return false
      const dataVencimento = new Date(dataStr)
      return dataVencimento >= hoje && dataVencimento <= proximosDias && getStatusPagamento(gasto) !== "efetuado"
    })

    const gastosProximaSemana = gastosFuturos.filter((gasto) => {
      const dataStr = gasto.dataVencimento || gasto.dataPagamento || gasto.dataInicio
      if (!dataStr) return false
      const dataVencimento = new Date(dataStr)
      return (
        dataVencimento > proximosDias && dataVencimento <= proximaSemana && getStatusPagamento(gasto) !== "efetuado"
      )
    })

    return {
      emAtraso: gastosEmAtraso,
      proximosDias: gastosProximosDias,
      proximaSemana: gastosProximaSemana,
      totalEmAtraso: gastosEmAtraso.reduce((acc, g) => acc + (g.valor || 0), 0),
      totalProximosDias: gastosProximosDias.reduce((acc, g) => acc + (g.valor || 0), 0),
      totalProximaSemana: gastosProximaSemana.reduce((acc, g) => acc + (g.valor || 0), 0),
    }
  }, [gastosFuturos])

  // Calcular total de todos os gastos futuros
  const totalGastosFuturos = useMemo(() => {
    return gastosFuturos.reduce((acc, gasto) => acc + (gasto.valor || 0), 0)
  }, [gastosFuturos])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || ""
            const value = formatCurrency(context.raw)
            return `${label}: ${value}`
          },
        },
      },
      datalabels: {
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
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || ""
            const value = formatCurrency(context.raw)
            const total = context.dataset.data.reduce((a, b) => a + b, 0)
            const percentage = ((context.raw / total) * 100).toFixed(1)
            return `${label}: ${value} (${percentage}%)`
          },
        },
      },
      datalabels: {
        display: false,
      },
    },
  }

  const exportarPDF = () => {
    if (!stats) return
    const doc = new jsPDF()
    let yPos = 16

    doc.setFontSize(18)
    doc.text("Relatório Financeiro Geral - FORNEC", 105, yPos, { align: "center" })
    yPos += 10

    doc.setFontSize(10)
    doc.text(`Gerado em: ${new Date().toLocaleDateString()}`, 105, yPos, { align: "center" })
    yPos += 20

    doc.setFontSize(14)
    doc.text("Resumo Financeiro", 14, yPos)
    yPos += 10

    doc.setFontSize(11)
    doc.text(`Orçamento Total: ${formatCurrency(stats.totalOrcamento)}`, 14, yPos)
    yPos += 7
    doc.text(`Gasto Total: ${formatCurrency(stats.totalGasto)}`, 14, yPos)
    yPos += 7
    doc.text(`Saldo Geral: ${formatCurrency(stats.saldoGeral)}`, 14, yPos)
    yPos += 7
    doc.text(`Total de Obras: ${stats.totalObras}`, 14, yPos)
    yPos += 15

    doc.setFontSize(14)
    doc.text("Distribuição de Gastos por Categoria", 14, yPos)
    yPos += 10

    doc.setFontSize(11)
    Object.entries(stats.gastosPorCategoria).forEach(([categoria, valor]) => {
      doc.text(`${categoria}: ${formatCurrency(valor)}`, 14, yPos)
      yPos += 7
    })

    doc.save("relatorio-financeiro-geral.pdf")
  }

  // Função para obter badge do status
  const getStatusBadge = (status) => {
    const statusConfig = {
      pendente: { variant: "warning", label: "Pendente" },
      efetuado: { variant: "success", label: "Efetuado" },
      em_processamento: { variant: "info", label: "Em Processamento" },
      cancelado: { variant: "danger", label: "Cancelado" },
      atrasado: { variant: "danger", label: "Atrasado" },
    }
    return statusConfig[status] || statusConfig.pendente
  }

  // Componentes auxiliares para detalhes dos gastos (COM AÇÕES DE EDITAR/EXCLUIR)
  const GastoIndividualItem = ({ gasto }) => (
    <ListGroup.Item className="d-flex justify-content-between align-items-start">
      <div className="ms-2 me-auto">
        <div className="fw-bold">{gasto.nome || gasto.descricao || gasto.item || 'Sem descrição'}</div>
        <small className="text-muted">
          {gasto.data && `Data: ${formatDate(gasto.data)}`}
          {gasto.numeroNota && ` • Nota: ${gasto.numeroNota}`}
          {gasto.localCompra && ` • Local: ${gasto.localCompra}`}
          {gasto.funcao && ` • Função: ${gasto.funcao}`}
          {gasto.tipoContratacao && ` • Tipo: ${gasto.tipoContratacao}`}
        </small>
      </div>
      <div className="d-flex align-items-center gap-2">
        <Badge bg="primary" pill>
          {formatCurrency(gasto.valor)}
        </Badge>
        <div className="d-flex gap-1">
          <Button 
            variant="outline-primary" 
            size="sm" 
            onClick={() => handleOpenEditModal(gasto)}
            title="Editar"
          >
            <Edit size={12} />
          </Button>
          <Button 
            variant="outline-danger" 
            size="sm" 
            onClick={() => handleOpenDeleteModal(gasto)}
            title="Excluir"
          >
            <Trash2 size={12} />
          </Button>
        </div>
      </div>
    </ListGroup.Item>
  )

  const DetalhesGastosComponent = ({ detalhes }) => {
    if (!detalhes) return null

    return (
      <Card className="shadow-sm mt-4">
        <Card.Header>
          <h5 className="mb-0">
            <DollarSign className="me-2" />
            Detalhamento Completo dos Gastos
          </h5>
        </Card.Header>
        <Card.Body>
          <Accordion>
            {/* Obras */}
            {Object.entries(detalhes.gastosPorObra).map(([nomeObra, dadosObra], index) => (
              <Accordion.Item eventKey={index.toString()} key={nomeObra}>
                <Accordion.Header>
                  <div className="d-flex justify-content-between align-items-center w-100 me-3">
                    <div className="d-flex align-items-center">
                      <Building className="me-2" size={18} />
                      <strong>{nomeObra}</strong>
                    </div>
                    <Badge bg="primary" className="ms-auto">
                      {formatCurrency(dadosObra.total)}
                    </Badge>
                  </div>
                </Accordion.Header>
                <Accordion.Body>
                  <Accordion>
                    {Object.entries(dadosObra.gastosPorTipo).map(([tipo, dadosTipo], tipoIndex) => (
                      <Accordion.Item eventKey={tipoIndex.toString()} key={tipo}>
                        <Accordion.Header>
                          <div className="d-flex justify-content-between align-items-center w-100 me-3">
                            <span>{tipo}</span>
                            <div className="d-flex align-items-center gap-2">
                              <Badge bg="secondary">
                                {dadosTipo.gastos.length} {dadosTipo.gastos.length === 1 ? 'item' : 'itens'}
                              </Badge>
                              <Badge bg="success">
                                {formatCurrency(dadosTipo.total)}
                              </Badge>
                            </div>
                          </div>
                        </Accordion.Header>
                        <Accordion.Body>
                          <ListGroup variant="flush">
                            {dadosTipo.gastos.map((gasto, gastoIndex) => (
                              <GastoIndividualItem key={gastoIndex} gasto={gasto} />
                            ))}
                          </ListGroup>
                        </Accordion.Body>
                      </Accordion.Item>
                    ))}
                  </Accordion>
                </Accordion.Body>
              </Accordion.Item>
            ))}

            {/* Gastos da Fornec */}
            {detalhes.gastosFornec.gastos.length > 0 && (
              <Accordion.Item eventKey={Object.keys(detalhes.gastosPorObra).length.toString()}>
                <Accordion.Header>
                  <div className="d-flex justify-content-between align-items-center w-100 me-3">
                    <div className="d-flex align-items-center">
                      <Building className="me-2" size={18} />
                      <strong>Fornec (Gastos Gerais)</strong>
                    </div>
                    <Badge bg="secondary" className="ms-auto">
                      {formatCurrency(detalhes.gastosFornec.total)}
                    </Badge>
                  </div>
                </Accordion.Header>
                <Accordion.Body>
                  <Accordion>
                    {Object.entries(detalhes.gastosFornec.gastosPorTipo).map(([tipo, dadosTipo], tipoIndex) => (
                      <Accordion.Item eventKey={tipoIndex.toString()} key={tipo}>
                        <Accordion.Header>
                          <div className="d-flex justify-content-between align-items-center w-100 me-3">
                            <span>{tipo}</span>
                            <div className="d-flex align-items-center gap-2">
                              <Badge bg="secondary">
                                {dadosTipo.gastos.length} {dadosTipo.gastos.length === 1 ? 'item' : 'itens'}
                              </Badge>
                              <Badge bg="success">
                                {formatCurrency(dadosTipo.total)}
                              </Badge>
                            </div>
                          </div>
                        </Accordion.Header>
                        <Accordion.Body>
                          <ListGroup variant="flush">
                            {dadosTipo.gastos.map((gasto, gastoIndex) => (
                              <GastoIndividualItem key={gastoIndex} gasto={gasto} />
                            ))}
                          </ListGroup>
                        </Accordion.Body>
                      </Accordion.Item>
                    ))}
                  </Accordion>
                </Accordion.Body>
              </Accordion.Item>
            )}
          </Accordion>
        </Card.Body>
      </Card>
    )
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
        {/* Alertas */}
        {alert.show && (
          <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 1050 }}>
            <div className={`alert alert-${alert.variant} alert-dismissible fade show`} role="alert">
              {alert.message}
              <button 
                type="button" 
                className="btn-close" 
                onClick={() => setAlert({ show: false })}
                aria-label="Close"
              />
            </div>
          </div>
        )}

        <Row className="mb-4 align-items-center">
          <Col>
            <h1 className="mb-0">Painel Financeiro</h1>
            <p className="text-muted">Visão geral das finanças e agenda de gastos futuros.</p>
          </Col>
          <Col xs="auto" className="d-flex gap-2">
            <Button variant="success" onClick={exportarPDF}>
              <Download size={16} className="me-2" />
              Exportar PDF
            </Button>
            <Button variant="primary" onClick={() => navigate("/adicionar-pagamentos")}>
              <Plus size={16} className="me-2" />
              Adicionar Gasto
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
            <Row className="mb-4">
              {[
                { title: "Orçamento Total", value: stats.totalOrcamento, variant: "primary" },
                { title: "Gasto Total", value: stats.totalGasto, variant: "danger", clickable: true },
                { title: "Saldo Geral", value: stats.saldoGeral, variant: "success" },
                { title: "Total de Obras", value: stats.totalObras, variant: "info", isCurrency: false },
              ].map((card, index) => (
                <Col md={3} key={index}>
                  <Card 
                    className={`border-${card.variant} shadow-sm h-100 ${card.clickable && showDetalhesGastos ? 'border-3' : ''}`}
                    style={{ cursor: card.clickable ? 'pointer' : 'default' }}
                    onClick={card.clickable ? handleToggleDetalhesGastos : undefined}
                  >
                    <Card.Body>
                      <Card.Title className={`text-${card.variant} d-flex justify-content-between align-items-center`}>
                        {card.title}
                        {card.clickable && (
                          loadingDetalhes ? (
                            <Spinner size="sm" />
                          ) : showDetalhesGastos ? (
                            <ChevronDown size={20} />
                          ) : (
                            <ChevronRight size={20} />
                          )
                        )}
                      </Card.Title>
                      <h3 className="mt-3 mb-2">
                        {card.isCurrency === false ? card.value : formatCurrency(card.value)}
                      </h3>
                      {card.clickable && (
                        <small className="text-muted">
                          {showDetalhesGastos ? 'Clique para ocultar detalhes' : 'Clique para ver detalhes'}
                        </small>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>

            <Row className="mb-4">
              <Col md={8}>
                <Card className="shadow-sm">
                  <Card.Body>
                    <Card.Title>Orçamento vs. Gasto por Obra</Card.Title>
                    <div style={{ height: "400px", width: "100%" }}>
                      {chartData.bar && <Bar data={chartData.bar} options={chartOptions} />}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={4}>
                <Card className="shadow-sm">
                  <Card.Body>
                    <Card.Title>Distribuição de Gastos</Card.Title>
                    <div style={{ height: "400px", width: "100%" }}>
                      {chartData.doughnut && <Doughnut data={chartData.doughnut} options={doughnutOptions} />}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Componente de detalhes dos gastos */}
            {showDetalhesGastos && detalhesGastos && (
              <DetalhesGastosComponent detalhes={detalhesGastos} />
            )}
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
            {/* Cards de Resumo da Agenda */}
            <Row className="mb-4">
              <Col md={3}>
                <Card className="border-danger shadow-sm">
                  <Card.Body className="text-center">
                    <AlertCircle size={24} className="text-danger mb-2" />
                    <h4 className="text-danger">{formatCurrency(agendaData.totalEmAtraso)}</h4>
                    <small className="text-muted">Em atraso</small>
                    <div className="mt-2">
                      <Badge bg="danger">{agendaData.emAtraso.length} itens</Badge>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="border-warning shadow-sm">
                  <Card.Body className="text-center">
                    <Clock size={24} className="text-warning mb-2" />
                    <h4 className="text-warning">{formatCurrency(agendaData.totalProximosDias)}</h4>
                    <small className="text-muted">Próximos 7 dias</small>
                    <div className="mt-2">
                      <Badge bg="warning">{agendaData.proximosDias.length} itens</Badge>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="border-info shadow-sm">
                  <Card.Body className="text-center">
                    <Calendar size={24} className="text-info mb-2" />
                    <h4 className="text-info">{formatCurrency(agendaData.totalProximaSemana)}</h4>
                    <small className="text-muted">Próxima semana</small>
                    <div className="mt-2">
                      <Badge bg="info">{agendaData.proximaSemana.length} itens</Badge>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="border-primary shadow-sm">
                  <Card.Body className="text-center">
                    <TrendingUp size={24} className="text-primary mb-2" />
                    <h4 className="text-primary">
                      {formatCurrency(
                        agendaData.totalEmAtraso + agendaData.totalProximosDias + agendaData.totalProximaSemana,
                      )}
                    </h4>
                    <small className="text-muted">Total geral</small>
                    <div className="mt-2">
                      <Badge bg="primary">
                        {agendaData.emAtraso.length + agendaData.proximosDias.length + agendaData.proximaSemana.length}{" "}
                        itens
                      </Badge>
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            </Row>

            {/* Tabelas de Gastos Futuros */}
            {loadingFuturos ? (
              <div className="text-center p-5">
                <Spinner animation="border" variant="primary" />
                <p className="mt-3">Carregando agenda de gastos...</p>
              </div>
            ) : (
              <Row>
                {/* Em Atraso */}
                {agendaData.emAtraso.length > 0 && (
                  <Col md={12} className="mb-4">
                    <Card className="shadow-sm">
                      <Card.Header className="bg-danger text-white">
                        <h5 className="mb-0">
                          <AlertCircle size={16} className="me-2" />
                          Em Atraso ({agendaData.emAtraso.length} itens)
                        </h5>
                      </Card.Header>
                      <Card.Body className="p-0">
                        <Table responsive hover className="mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>Descrição</th>
                              <th>Tipo</th>
                              <th>Obra</th>
                              <th>Vencimento</th>
                              <th>Dias em Atraso</th>
                              <th>Status</th>
                              <th className="text-end">Valor</th>
                              <th>Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {agendaData.emAtraso.map((gasto, index) => {
                              const diasAtraso = Math.abs(
                                getDiasRestantes(gasto.dataVencimento || gasto.dataPagamento || gasto.dataInicio),
                              )
                              const statusBadge = getStatusBadge(getStatusPagamento(gasto))
                              return (
                                <tr key={index} className="table-danger">
                                  <td>
                                    <strong>{gasto.nome || gasto.descricao}</strong>
                                  </td>
                                  <td>
                                    <Badge bg="secondary" className="small">
                                      {gasto.tipo}
                                    </Badge>
                                  </td>
                                  <td>
                                    <small className="text-muted">{gasto.obraNome || "Independente"}</small>
                                  </td>
                                  <td>
                                    <small>
                                      {formatDate(gasto.dataVencimento || gasto.dataPagamento || gasto.dataInicio)}
                                    </small>
                                  </td>
                                  <td>
                                    <Badge bg="danger">
                                      {diasAtraso} {diasAtraso === 1 ? "dia" : "dias"}
                                    </Badge>
                                  </td>
                                  <td>
                                    <Badge bg={statusBadge.variant}>{statusBadge.label}</Badge>
                                  </td>
                                  <td className="text-end">
                                    <strong>{formatCurrency(gasto.valor)}</strong>
                                  </td>
                                  <td>
                                    <div className="d-flex gap-1">
                                      <Button variant="outline-primary" size="sm" onClick={() => handleOpenEditModal(gasto)}>
                                        <Edit size={14} />
                                      </Button>
                                      <Button variant="outline-danger" size="sm" onClick={() => handleOpenDeleteModal(gasto)}>
                                        <Trash2 size={14} />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                          <tfoot className="table-light">
                            <tr>
                              <td colSpan="7" className="text-end">
                                <strong>Total em Atraso:</strong>
                              </td>
                              <td className="text-end">
                                <strong className="text-danger">{formatCurrency(agendaData.totalEmAtraso)}</strong>
                              </td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </Table>
                      </Card.Body>
                    </Card>
                  </Col>
                )}

                {/* Próximos 7 dias e Próxima semana - tabelas simplificadas mas mantendo ações */}
                <Col md={6} className="mb-4">
                  <Card className="shadow-sm">
                    <Card.Header className="bg-warning text-white">
                      <h5 className="mb-0">
                        <Clock size={16} className="me-2" />
                        Próximos 7 dias
                      </h5>
                    </Card.Header>
                    <Card.Body className="p-0">
                      {agendaData.proximosDias.length === 0 ? (
                        <div className="text-center p-4 text-muted">
                          Nenhum gasto programado para os próximos 7 dias
                        </div>
                      ) : (
                        <Table responsive hover className="mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>Descrição</th>
                              <th>Tipo</th>
                              <th>Vencimento</th>
                              <th className="text-end">Valor</th>
                              <th>Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {agendaData.proximosDias.map((gasto, index) => {
                              const diasRestantes = getDiasRestantes(
                                gasto.dataVencimento || gasto.dataPagamento || gasto.dataInicio,
                              )
                              return (
                                <tr key={index}>
                                  <td>
                                    <strong>{gasto.nome || gasto.descricao}</strong>
                                  </td>
                                  <td>
                                    <Badge bg="secondary" className="small">
                                      {gasto.tipo}
                                    </Badge>
                                  </td>
                                  <td>
                                    <small>
                                      {formatDate(gasto.dataVencimento || gasto.dataPagamento || gasto.dataInicio)}
                                      {diasRestantes !== null && (
                                        <div
                                          className={`text-${diasRestantes <= 3 ? "danger" : diasRestantes <= 7 ? "warning" : "muted"}`}
                                        >
                                          {diasRestantes === 0
                                            ? "Hoje"
                                            : diasRestantes === 1
                                              ? "Amanhã"
                                              : `${diasRestantes} dias`}
                                        </div>
                                      )}
                                    </small>
                                  </td>
                                  <td className="text-end">
                                    <strong>{formatCurrency(gasto.valor)}</strong>
                                  </td>
                                  <td>
                                    <div className="d-flex gap-1">
                                      <Button variant="outline-primary" size="sm" onClick={() => handleOpenEditModal(gasto)}>
                                        <Edit size={12} />
                                      </Button>
                                      <Button variant="outline-danger" size="sm" onClick={() => handleOpenDeleteModal(gasto)}>
                                        <Trash2 size={12} />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                          <tfoot className="table-light">
                            <tr>
                              <td colSpan="3" className="text-end">
                                <strong>Total:</strong>
                              </td>
                              <td className="text-end">
                                <strong className="text-warning">{formatCurrency(agendaData.totalProximosDias)}</strong>
                              </td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </Table>
                      )}
                    </Card.Body>
                  </Card>
                </Col>

                {/* Próxima semana */}
                <Col md={6} className="mb-4">
                  <Card className="shadow-sm">
                    <Card.Header className="bg-info text-white">
                      <h5 className="mb-0">
                        <Calendar size={16} className="me-2" />
                        Próxima semana
                      </h5>
                    </Card.Header>
                    <Card.Body className="p-0">
                      {agendaData.proximaSemana.length === 0 ? (
                        <div className="text-center p-4 text-muted">Nenhum gasto programado para a próxima semana</div>
                      ) : (
                        <Table responsive hover className="mb-0">
                          <thead className="table-light">
                            <tr>
                              <th>Descrição</th>
                              <th>Tipo</th>
                              <th>Vencimento</th>
                              <th className="text-end">Valor</th>
                              <th>Ações</th>
                            </tr>
                          </thead>
                          <tbody>
                            {agendaData.proximaSemana.map((gasto, index) => {
                              const diasRestantes = getDiasRestantes(
                                gasto.dataVencimento || gasto.dataPagamento || gasto.dataInicio,
                              )
                              return (
                                <tr key={index}>
                                  <td>
                                    <strong>{gasto.nome || gasto.descricao}</strong>
                                  </td>
                                  <td>
                                    <Badge bg="secondary" className="small">
                                      {gasto.tipo}
                                    </Badge>
                                  </td>
                                  <td>
                                    <small>
                                      {formatDate(gasto.dataVencimento || gasto.dataPagamento || gasto.dataInicio)}
                                      {diasRestantes !== null && <div className="text-muted">{diasRestantes} dias</div>}
                                    </small>
                                  </td>
                                  <td className="text-end">
                                    <strong>{formatCurrency(gasto.valor)}</strong>
                                  </td>
                                  <td>
                                    <div className="d-flex gap-1">
                                      <Button variant="outline-primary" size="sm" onClick={() => handleOpenEditModal(gasto)}>
                                        <Edit size={12} />
                                      </Button>
                                      <Button variant="outline-danger" size="sm" onClick={() => handleOpenDeleteModal(gasto)}>
                                        <Trash2 size={12} />
                                      </Button>
                                    </div>
                                  </td>
                                </tr>
                              )
                            })}
                          </tbody>
                          <tfoot className="table-light">
                            <tr>
                              <td colSpan="3" className="text-end">
                                <strong>Total:</strong>
                              </td>
                              <td className="text-end">
                                <strong className="text-info">{formatCurrency(agendaData.totalProximaSemana)}</strong>
                              </td>
                              <td></td>
                            </tr>
                          </tfoot>
                        </Table>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            )}

            {/* Todos os gastos futuros */}
            {gastosFuturos.length > 0 && (
              <Card className="shadow-sm">
                <Card.Header className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Todos os Gastos Futuros</h5>
                  <div className="d-flex align-items-center gap-3">
                    <Badge bg="primary" className="fs-6 px-3 py-2">
                      {gastosFuturos.length} itens
                    </Badge>
                    <strong className="text-primary fs-5">Total: {formatCurrency(totalGastosFuturos)}</strong>
                  </div>
                </Card.Header>
                <Card.Body className="p-0">
                  <Table responsive hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Descrição</th>
                        <th>Tipo</th>
                        <th>Obra</th>
                        <th>Data Vencimento</th>
                        <th>Dias Restantes</th>
                        <th>Status</th>
                        <th className="text-end">Valor</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gastosFuturos.slice(0, 20).map((gasto, index) => {
                        const diasRestantes = getDiasRestantes(
                          gasto.dataVencimento || gasto.dataPagamento || gasto.dataInicio,
                        )
                        const statusBadge = getStatusBadge(getStatusPagamento(gasto))
                        return (
                          <tr key={index}>
                            <td>
                              <strong>{gasto.nome || gasto.descricao}</strong>
                              {gasto.observacoes && <small className="d-block text-muted">{gasto.observacoes}</small>}
                            </td>
                            <td>
                              <Badge bg="secondary">{gasto.tipo}</Badge>
                            </td>
                            <td>
                              <small className="text-muted">{gasto.obraNome || "Independente"}</small>
                            </td>
                            <td>{formatDate(gasto.dataVencimento || gasto.dataPagamento || gasto.dataInicio)}</td>
                            <td>
                              {diasRestantes !== null && (
                                <Badge
                                  bg={
                                    diasRestantes <= 3
                                      ? "danger"
                                      : diasRestantes <= 7
                                        ? "warning"
                                        : diasRestantes <= 30
                                          ? "info"
                                          : "secondary"
                                  }
                                >
                                  {diasRestantes === 0
                                    ? "Hoje"
                                    : diasRestantes === 1
                                      ? "Amanhã"
                                      : `${diasRestantes} dias`}
                                </Badge>
                              )}
                            </td>
                            <td>
                              <Badge bg={statusBadge.variant}>{statusBadge.label}</Badge>
                            </td>
                            <td className="text-end">
                              <strong>{formatCurrency(gasto.valor)}</strong>
                            </td>
                            <td>
                              <div className="d-flex gap-1">
                                <Button variant="outline-primary" size="sm" onClick={() => handleOpenEditModal(gasto)}>
                                  <Edit size={14} />
                                </Button>
                                <Button variant="outline-danger" size="sm" onClick={() => handleOpenDeleteModal(gasto)}>
                                  <Trash2 size={14} />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                    <tfoot className="table-light">
                      <tr>
                        <td colSpan="6" className="text-end">
                          <strong>Total dos Gastos Futuros:</strong>
                        </td>
                        <td className="text-end">
                          <strong className="text-primary fs-5">{formatCurrency(totalGastosFuturos)}</strong>
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </Table>
                  {gastosFuturos.length > 20 && (
                    <div className="text-center p-3 text-muted">
                      ... e mais {gastosFuturos.length - 20} gastos futuros
                    </div>
                  )}
                </Card.Body>
              </Card>
            )}
          </Tab>
        </Tabs>
      </Container>

      {/* Modal de Edição */}
      <Modal show={showEditModal} onHide={handleCloseEditModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Editar {editingItem?.tipo}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {EditForm && (
            <EditForm
              initialData={editingItem}
              onSubmit={handleEditSubmit}
              onCancel={handleCloseEditModal}
              obraId={editingItem?.obraId}
            />
          )}
        </Modal.Body>
      </Modal>

      {/* Modal de Confirmação de Exclusão */}
      <Modal show={showDeleteModal} onHide={handleCloseDeleteModal} centered>
        <Modal.Header closeButton>
          <Modal.Title className="text-danger">Confirmar Exclusão</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <Trash2 size={48} className="text-danger mb-3" />
            <h5>Tem certeza que deseja excluir este item?</h5>
            {deletingItem && (
              <div className="mt-3">
                <p><strong>Tipo:</strong> {deletingItem.tipo}</p>
                <p><strong>Descrição:</strong> {deletingItem.nome || deletingItem.descricao || 'Sem descrição'}</p>
                <p><strong>Valor:</strong> {formatCurrency(deletingItem.valor)}</p>
                <div className="alert alert-warning mt-3">
                  <strong>Atenção:</strong> Esta ação não pode ser desfeita!
                </div>
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseDeleteModal} disabled={isDeleting}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDeleteSubmit} disabled={isDeleting}>
            {isDeleting ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Excluindo...
              </>
            ) : (
              <>
                <Trash2 size={16} className="me-2" />
                Excluir
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default Financeiro