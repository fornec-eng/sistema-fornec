"use client"

import { useState, useEffect } from "react"
import { Card, Row, Col, Badge, ProgressBar, Spinner, Button } from "react-bootstrap"
import { FileText, TrendingUp, AlertCircle, CheckCircle, Clock, DollarSign } from "lucide-react"
import apiService from "../../services/apiService"
import ContratosList from "../ContratosList"

const ContratosResumo = ({ obras }) => {
  const [contratos, setContratos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showContratosList, setShowContratosList] = useState(false)
  const [estatisticas, setEstatisticas] = useState({
    totalContratos: 0,
    valorTotalInicial: 0,
    valorTotalPagamentos: 0,
    saldoTotal: 0,
    contratosSemPagamentos: 0,
    contratosComAtraso: 0,
    contratosPagos: 0,
    contratosPendentes: 0,
  })

  useEffect(() => {
    fetchContratos()
  }, [])

  const fetchContratos = async () => {
    setLoading(true)
    try {
      const response = await apiService.contratos.getAll({ limit: 10000 })
      if (!response.error) {
        const contratosData = response.contratos || []
        setContratos(contratosData)
        calcularEstatisticas(contratosData)
      }
    } catch (error) {
      console.error("Erro ao buscar contratos:", error)
    } finally {
      setLoading(false)
    }
  }

  const calcularEstatisticas = (contratosData) => {
    const stats = {
      totalContratos: contratosData.length,
      valorTotalInicial: 0,
      valorTotalPagamentos: 0,
      saldoTotal: 0,
      contratosSemPagamentos: 0,
      contratosComAtraso: 0,
      contratosPagos: 0,
      contratosPendentes: 0,
    }

    contratosData.forEach((contrato) => {
      const valorInicial = contrato.valorInicial || 0
      const valorPagamentos = contrato.valorTotalPagamentos || 0

      stats.valorTotalInicial += valorInicial
      stats.valorTotalPagamentos += valorPagamentos

      switch (contrato.statusGeralPagamentos) {
        case "sem_pagamentos":
          stats.contratosSemPagamentos++
          break
        case "com_atraso":
          stats.contratosComAtraso++
          break
        case "todos_pagos":
          stats.contratosPagos++
          break
        case "pendente":
        case "em_processamento":
          stats.contratosPendentes++
          break
      }
    })

    stats.saldoTotal = stats.valorTotalInicial - stats.valorTotalPagamentos
    setEstatisticas(stats)
  }

  const formatCurrency = (value) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0)

  const getProgressVariant = (percentual) => {
    if (percentual >= 100) return "danger"
    if (percentual >= 80) return "warning"
    return "success"
  }

  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Carregando resumo de contratos...</p>
      </div>
    )
  }

  const percentualPago = estatisticas.valorTotalInicial > 0 
    ? (estatisticas.valorTotalPagamentos / estatisticas.valorTotalInicial) * 100 
    : 0

  return (
    <>
      <Card className="shadow-sm mb-4">
        <Card.Header className="bg-white">
          <div className="d-flex justify-content-between align-items-center">
            <h5 className="mb-0">
              <FileText className="me-2" />
              Resumo de Contratos
            </h5>
            <Button 
              variant="outline-primary" 
              size="sm"
              onClick={() => setShowContratosList(!showContratosList)}
            >
              {showContratosList ? "Ocultar Detalhes" : "Ver Todos os Contratos"}
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          <Row className="mb-4">
            <Col md={3}>
              <Card className="text-center border-primary h-100">
                <Card.Body>
                  <DollarSign size={32} className="text-primary mb-2" />
                  <h6 className="text-muted">Valor Total dos Contratos</h6>
                  <h4 className="text-primary">{formatCurrency(estatisticas.valorTotalInicial)}</h4>
                  <Badge bg="secondary">{estatisticas.totalContratos} contratos</Badge>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center border-success h-100">
                <Card.Body>
                  <CheckCircle size={32} className="text-success mb-2" />
                  <h6 className="text-muted">Total em Pagamentos</h6>
                  <h4 className="text-success">{formatCurrency(estatisticas.valorTotalPagamentos)}</h4>
                  <Badge bg="success">{estatisticas.contratosPagos} pagos</Badge>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center border-warning h-100">
                <Card.Body>
                  <Clock size={32} className="text-warning mb-2" />
                  <h6 className="text-muted">Saldo Pendente</h6>
                  <h4 className={estatisticas.saldoTotal >= 0 ? "text-info" : "text-danger"}>
                    {formatCurrency(estatisticas.saldoTotal)}
                  </h4>
                  <Badge bg="warning" text="dark">{estatisticas.contratosPendentes} pendentes</Badge>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center border-danger h-100">
                <Card.Body>
                  <AlertCircle size={32} className="text-danger mb-2" />
                  <h6 className="text-muted">Contratos com Atraso</h6>
                  <h4 className="text-danger">{estatisticas.contratosComAtraso}</h4>
                  <Badge bg="danger">Atenção necessária</Badge>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row>
            <Col>
              <h6 className="mb-2">Progresso Geral dos Pagamentos</h6>
              <ProgressBar 
                now={percentualPago}
                variant={getProgressVariant(percentualPago)}
                style={{ height: "25px" }}
                label={`${percentualPago.toFixed(1)}% pago`}
              />
              <small className="text-muted d-flex justify-content-between mt-2">
                <span>Valor total: {formatCurrency(estatisticas.valorTotalInicial)}</span>
                <span>Pago: {formatCurrency(estatisticas.valorTotalPagamentos)}</span>
                <span>Restante: {formatCurrency(estatisticas.saldoTotal)}</span>
              </small>
            </Col>
          </Row>

          {/* Resumo por Status */}
          <Row className="mt-4">
            <Col>
              <h6 className="mb-3">Distribuição por Status</h6>
              <div className="d-flex justify-content-between flex-wrap">
                <div className="text-center p-2">
                  <h5>{estatisticas.contratosSemPagamentos}</h5>
                  <small className="text-muted">Sem Pagamentos</small>
                </div>
                <div className="text-center p-2">
                  <h5 className="text-warning">{estatisticas.contratosPendentes}</h5>
                  <small className="text-muted">Em Andamento</small>
                </div>
                <div className="text-center p-2">
                  <h5 className="text-success">{estatisticas.contratosPagos}</h5>
                  <small className="text-muted">Totalmente Pagos</small>
                </div>
                <div className="text-center p-2">
                  <h5 className="text-danger">{estatisticas.contratosComAtraso}</h5>
                  <small className="text-muted">Com Atraso</small>
                </div>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Lista Detalhada de Contratos */}
      {showContratosList && (
        <ContratosList 
          showAddButton={false}
          onContractAdded={null}
        />
      )}
    </>
  )
}

export default ContratosResumo