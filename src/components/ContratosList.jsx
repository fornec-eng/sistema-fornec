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
  Form
} from "react-bootstrap"
import { 
  FileText, 
  DollarSign, 
  Search,
  Plus,
  Edit,
  Trash2,
  Eye
} from "lucide-react"
import apiService from "../services/apiService"
import ContratoPagamentos from "./forms/ContratoPagamentos"

function ContratosList({ obraId = null, showAddButton = true, onContractAdded }) {
  const [contratos, setContratos] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [showPagamentosModal, setShowPagamentosModal] = useState(false)
  const [selectedContrato, setSelectedContrato] = useState(null)
  const [alert, setAlert] = useState({ show: false, message: "", variant: "" })

  useEffect(() => {
    fetchContratos()
  }, [obraId])

  const fetchContratos = async () => {
    setLoading(true)
    try {
      const params = obraId ? { obraId } : {}
      const response = await apiService.contratos.getAll(params)
      if (!response.error) {
        setContratos(response.contratos || [])
      }
    } catch (error) {
      console.error("Erro ao buscar contratos:", error)
      showAlert("Erro ao carregar contratos", "danger")
    } finally {
      setLoading(false)
    }
  }

  const showAlert = (message, variant) => {
    setAlert({ show: true, message, variant })
    setTimeout(() => setAlert({ show: false, message: "", variant: "" }), 5000)
  }

  const handleOpenPagamentos = (contrato) => {
    setSelectedContrato(contrato)
    setShowPagamentosModal(true)
  }

  const handleDelete = async (contratoId) => {
    if (window.confirm("Tem certeza que deseja excluir este contrato?")) {
      try {
        await apiService.contratos.delete(contratoId)
        showAlert("Contrato excluído com sucesso!", "success")
        fetchContratos()
      } catch (error) {
        console.error("Erro ao excluir contrato:", error)
        showAlert("Erro ao excluir contrato", "danger")
      }
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      sem_pagamentos: { variant: "secondary", label: "Sem Pagamentos" },
      todos_pagos: { variant: "success", label: "Todos Pagos" },
      com_atraso: { variant: "danger", label: "Com Atraso" },
      pendente: { variant: "warning", label: "Pendente" },
      em_processamento: { variant: "info", label: "Em Processamento" }
    }
    return statusConfig[status] || statusConfig.sem_pagamentos
  }

  const formatCurrency = (value) => 
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0)

  const formatDate = (date) => {
    if (!date) return "-"
    return new Date(date).toLocaleDateString("pt-BR")
  }

  // Filtrar contratos
  const filteredContratos = contratos.filter(contrato => {
    const matchesSearch = searchTerm === "" || 
      contrato.loja.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (contrato.contratoId && contrato.contratoId.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = filterStatus === "" || contrato.statusGeralPagamentos === filterStatus
    
    return matchesSearch && matchesStatus
  })

  // Calcular totais
  const totais = {
    totalContratos: filteredContratos.length,
    valorTotalInicial: filteredContratos.reduce((acc, c) => acc + (c.valorInicial || 0), 0),
    valorTotalPagamentos: filteredContratos.reduce((acc, c) => acc + (c.valorTotalPagamentos || 0), 0),
    get saldoGeral() {
      return this.valorTotalInicial - this.valorTotalPagamentos
    }
  }

  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Carregando contratos...</p>
      </div>
    )
  }

  return (
    <>
      <Card className="shadow-sm">
        <Card.Header className="bg-white">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <FileText className="text-primary me-2" size={20} />
              <h5 className="mb-0">Contratos</h5>
              <Badge bg="primary" className="ms-2">{totais.totalContratos}</Badge>
            </div>
            {showAddButton && onContractAdded && (
              <Button variant="primary" size="sm" onClick={onContractAdded}>
                <Plus size={16} className="me-2" />
                Novo Contrato
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

          {/* Resumo Financeiro */}
          <div className="row mb-4">
            <div className="col-md-3">
              <div className="border rounded p-3">
                <h6 className="text-muted mb-1">Valor Total dos Contratos</h6>
                <h4>{formatCurrency(totais.valorTotalInicial)}</h4>
              </div>
            </div>
            <div className="col-md-3">
              <div className="border rounded p-3">
                <h6 className="text-muted mb-1">Total em Pagamentos</h6>
                <h4>{formatCurrency(totais.valorTotalPagamentos)}</h4>
              </div>
            </div>
            <div className="col-md-3">
              <div className="border rounded p-3">
                <h6 className="text-muted mb-1">Saldo Geral</h6>
                <h4 className={totais.saldoGeral >= 0 ? "text-success" : "text-danger"}>
                  {formatCurrency(totais.saldoGeral)}
                </h4>
              </div>
            </div>
            <div className="col-md-3">
              <div className="border rounded p-3">
                <h6 className="text-muted mb-1">Progresso Geral</h6>
                <ProgressBar 
                  now={totais.valorTotalInicial > 0 ? (totais.valorTotalPagamentos / totais.valorTotalInicial) * 100 : 0}
                  variant={totais.saldoGeral >= 0 ? "success" : "danger"}
                  style={{ height: "20px" }}
                  label={`${((totais.valorTotalPagamentos / totais.valorTotalInicial) * 100).toFixed(1)}%`}
                />
              </div>
            </div>
          </div>

          {/* Filtros */}
          <div className="row mb-3">
            <div className="col-md-6">
              <InputGroup>
                <InputGroup.Text>
                  <Search size={16} />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Buscar por loja ou ID do contrato..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </div>
            <div className="col-md-6">
              <Form.Select 
                value={filterStatus} 
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="">Todos os status</option>
                <option value="sem_pagamentos">Sem Pagamentos</option>
                <option value="pendente">Pendente</option>
                <option value="em_processamento">Em Processamento</option>
                <option value="todos_pagos">Todos Pagos</option>
                <option value="com_atraso">Com Atraso</option>
              </Form.Select>
            </div>
          </div>

          {/* Tabela de Contratos */}
          {filteredContratos.length === 0 ? (
            <div className="text-center p-4 text-muted">
              <FileText size={48} className="mb-3" />
              <p>Nenhum contrato encontrado.</p>
            </div>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Loja</th>
                  <th>Valor Inicial</th>
                  <th>Total Pago</th>
                  <th>Saldo</th>
                  <th>Status</th>
                  <th>Início</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredContratos.map((contrato) => {
                  const saldo = (contrato.valorInicial || 0) - (contrato.valorTotalPagamentos || 0)
                  const statusBadge = getStatusBadge(contrato.statusGeralPagamentos)
                  
                  return (
                    <tr key={contrato._id}>
                      <td>{contrato.contratoId}</td>
                      <td>{contrato.loja}</td>
                      <td>{formatCurrency(contrato.valorInicial)}</td>
                      <td>{formatCurrency(contrato.valorTotalPagamentos)}</td>
                      <td className={saldo >= 0 ? "text-success" : "text-danger"}>
                        {formatCurrency(saldo)}
                      </td>
                      <td>
                        <Badge bg={statusBadge.variant}>
                          {statusBadge.label}
                        </Badge>
                      </td>
                      <td>{formatDate(contrato.inicioContrato)}</td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => handleOpenPagamentos(contrato)}
                          title="Gerenciar Pagamentos"
                        >
                          <DollarSign size={14} />
                        </Button>
                        <Button
                          variant="outline-info"
                          size="sm"
                          className="me-2"
                          onClick={() => {/* Implementar edição */}}
                          title="Editar Contrato"
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => handleDelete(contrato._id)}
                          title="Excluir Contrato"
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

      {/* Modal de Pagamentos */}
      {selectedContrato && (
        <ContratoPagamentos
          contratoId={selectedContrato._id}
          show={showPagamentosModal}
          onHide={() => {
            setShowPagamentosModal(false)
            setSelectedContrato(null)
            fetchContratos() // Recarregar contratos após fechar
          }}
          onUpdate={fetchContratos}
        />
      )}
    </>
  )
}

export default ContratosList