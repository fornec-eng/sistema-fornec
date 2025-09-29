// MaterialsList.jsx - Novo componente para materiais com filtros
"use client"

import { useState, useEffect } from "react"
import { Card, Table, Button, Badge, ProgressBar, Spinner, Alert, InputGroup, Form, Row, Col } from "react-bootstrap"
import { Package, Search, Plus, Edit, Trash2, Calendar, MapPin, User, CreditCard } from "lucide-react"
import MaterialPagamentos from "./forms/MaterialPagamentos"
import apiService from "../services/apiService"

function MaterialsList({
  obraId = null,
  showAddButton = true,
  onMaterialAdded,
  gastos,
  onEditMaterial,
  onDeleteMaterial,
}) {
  const [materiais, setMateriais] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [filterLocal, setFilterLocal] = useState("")
  const [filterSolicitante, setFilterSolicitante] = useState("")
  const [alert, setAlert] = useState({ show: false, message: "", variant: "" })

  const [showPagamentosModal, setShowPagamentosModal] = useState(false)
  const [selectedMaterialId, setSelectedMaterialId] = useState(null)
  const [locais, setLocais] = useState([])
  const [solicitantes, setSolicitantes] = useState([])
  const [materiaisPagamentos, setMateriaisPagamentos] = useState({})

  useEffect(() => {
    if (gastos && gastos.materiais) {
      setMateriais(gastos.materiais)
      const locaisUnicos = [...new Set(gastos.materiais.map((m) => m.localCompra).filter(Boolean))]
      setLocais(locaisUnicos)
      const solicitantesUnicos = [...new Set(gastos.materiais.map((m) => m.solicitante).filter(Boolean))]
      setSolicitantes(solicitantesUnicos)
    }
  }, [gastos])

  // FUNÇÃO ATUALIZADA: Define o status correto com a nova regra de 99%
  const calcularStatusCorreto = (material) => {
    const valorTotal = material.valor || 0
    const valorPago = material.valorTotalPagamentos || 0

    // CONDIÇÃO 1: Se o status já vem como "efetuado" (override manual)
    if (material.statusPagamento === "efetuado") {
      return "efetuado"
    }

    // CONDIÇÃO 2 (NOVA): Se o valor pago for >= 99% do valor total
    if (valorTotal > 0 && valorPago / valorTotal >= 0.99) {
      return "efetuado"
    }

    // Se nenhuma das condições for atendida, o status é "pendente".
    return "pendente"
  }

  // FUNÇÃO NOVA: Garante que o valor pago exibido seja consistente com o status
  const getValorPagoConsistente = (material) => {
    const statusFinal = calcularStatusCorreto(material)

    // Se o status for "Concluído" (efetuado), o valor pago a ser exibido é o valor total.
    if (statusFinal === "efetuado") {
      return material.valor || 0
    }

    // Se o status for "Pendente", exibimos a soma real dos pagamentos parciais.
    return material.valorTotalPagamentos || 0
  }

  const calcularValoresMaterial = (material) => {
    const valorCombinado = material.valor || 0
    // ATUALIZADO: Usa a nova função para garantir consistência
    const valorPago = getValorPagoConsistente(material)
    const valorRestante = valorCombinado - valorPago

    return {
      valorCombinado,
      valorPago,
      valorRestante: valorRestante > 0 ? valorRestante : 0,
    }
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pendente: { variant: "warning", label: "Pendente" },
      efetuado: { variant: "success", label: "Concluído" },
    }
    return statusConfig[status] || statusConfig.pendente
  }

  const formatCurrency = (value) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0)

  const formatDate = (date) => {
    if (!date) return "-"
    return new Date(date).toLocaleDateString("pt-BR", { timeZone: "UTC" })
  }

  const handleOpenPagamentos = (materialId) => {
    setSelectedMaterialId(materialId)
    setShowPagamentosModal(true)
  }

  const handleClosePagamentos = () => {
    setShowPagamentosModal(false)
    setSelectedMaterialId(null)
  }

  const handleUpdatePagamentos = async () => {
    if (selectedMaterialId && gastos && gastos.materiais) {
      try {
        const pagamentos = await apiService.materiais.listarPagamentos(selectedMaterialId)
        setMateriaisPagamentos((prev) => ({
          ...prev,
          [selectedMaterialId]: pagamentos,
        }))
      } catch (error) {
        console.error("Erro ao atualizar pagamentos:", error)
        setMateriaisPagamentos((prev) => ({
          ...prev,
          [selectedMaterialId]: [],
        }))
      }
    }
  }

  const materiaisFiltrados = materiais.filter((material) => {
    const statusCalculado = calcularStatusCorreto(material)
    const matchesSearch =
      searchTerm === "" ||
      (material.numeroNota && material.numeroNota.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (material.descricao && material.descricao.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (material.localCompra && material.localCompra.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = filterStatus === "" || statusCalculado === filterStatus
    const matchesLocal = filterLocal === "" || material.localCompra === filterLocal
    const matchesSolicitante = filterSolicitante === "" || material.solicitante === filterSolicitante
    return matchesSearch && matchesStatus && matchesLocal && matchesSolicitante
  })

  const calcularTotais = () => {
    const total = materiaisFiltrados.reduce((acc, m) => acc + (m.valor || 0), 0)
    // ATUALIZADO: Usa a nova função para somar os valores consistentes
    const pago = materiaisFiltrados.reduce((acc, m) => acc + getValorPagoConsistente(m), 0)
    const pendente = total - pago
    const quantidadePago = materiaisFiltrados.filter((m) => calcularStatusCorreto(m) === "efetuado").length
    const quantidadePendente = materiaisFiltrados.filter((m) => calcularStatusCorreto(m) === "pendente").length

    return {
      total,
      pago,
      pendente,
      quantidadePago,
      quantidadePendente,
    }
  }

  const totais = calcularTotais()
  const percentualPago = totais.total > 0 ? (totais.pago / totais.total) * 100 : 0

  if (loading) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Carregando materiais...</p>
      </div>
    )
  }

  return (
    <>
      <Card className="shadow-sm">
        <Card.Header className="bg-white">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <Package className="text-primary me-2" size={20} />
              <h5 className="mb-0">Materiais</h5>
              <Badge bg="primary" className="ms-2">
                {materiaisFiltrados.length}
              </Badge>
            </div>
            {showAddButton && onMaterialAdded && (
              <Button variant="primary" size="sm" onClick={onMaterialAdded}>
                <Plus size={16} className="me-2" />
                Novo Material
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

          <div className="row mb-4">
            <div className="col-md-3">
              <div className="border rounded p-3">
                <h6 className="text-muted mb-1">Valor Total dos Materiais</h6>
                <h4>{formatCurrency(totais.total)}</h4>
              </div>
            </div>
            <div className="col-md-3">
              <div className="border rounded p-3">
                <h6 className="text-muted mb-1">Total Pago</h6>
                <h4>{formatCurrency(totais.pago)}</h4>
                <ProgressBar
                  now={percentualPago > 100 ? 100 : percentualPago}
                  variant="success"
                  className="mt-2"
                  style={{ height: "8px" }}
                />
                <small className="text-muted">
                  {percentualPago.toFixed(1)}% pago ({totais.quantidadePago} concluídos)
                </small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="border rounded p-3">
                <h6 className="text-muted mb-1">Pendente</h6>
                <h4 className="text-warning">{formatCurrency(totais.pendente)}</h4>
                <small className="text-muted">{totais.quantidadePendente} materiais pendentes</small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="border rounded p-3">
                <h6 className="text-muted mb-1">Taxa de Conclusão</h6>
                <h4 className="text-success">{totais.quantidadePago}</h4>
                <small className="text-muted">
                  {materiaisFiltrados.length > 0
                    ? ((totais.quantidadePago / materiaisFiltrados.length) * 100).toFixed(1)
                    : 0}
                  % concluídos
                </small>
              </div>
            </div>
          </div>

          <Row className="mb-3">
            <Col md={3}>
              <InputGroup>
                <InputGroup.Text>
                  <Search size={16} />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Buscar por nota, descrição ou local..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={3}>
              <Form.Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="">Todos os status</option>
                <option value="pendente">Pendente</option>
                <option value="efetuado">Concluído</option>
              </Form.Select>
            </Col>
            <Col md={3}>
              <InputGroup>
                <InputGroup.Text>
                  <MapPin size={16} />
                </InputGroup.Text>
                <Form.Select value={filterLocal} onChange={(e) => setFilterLocal(e.target.value)}>
                  <option value="">Todos os locais</option>
                  {locais.map((local) => (
                    <option key={local} value={local}>
                      {local}
                    </option>
                  ))}
                </Form.Select>
              </InputGroup>
            </Col>
            <Col md={3}>
              <InputGroup>
                <InputGroup.Text>
                  <User size={16} />
                </InputGroup.Text>
                <Form.Select value={filterSolicitante} onChange={(e) => setFilterSolicitante(e.target.value)}>
                  <option value="">Todos os solicitantes</option>
                  {solicitantes.map((solicitante) => (
                    <option key={solicitante} value={solicitante}>
                      {solicitante}
                    </option>
                  ))}
                </Form.Select>
              </InputGroup>
            </Col>
          </Row>

          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Nota Fiscal</th>
                <th>Descrição</th>
                <th>Local de Compra</th>
                <th>Solicitante</th>
                <th>Valor Combinado</th>
                <th>Valor Pago</th>
                <th>Valor Restante</th>
                <th>Data</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {materiaisFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center p-4 text-muted">
                    <Package size={48} className="mb-3" />
                    <p>Nenhum material encontrado.</p>
                  </td>
                </tr>
              ) : (
                materiaisFiltrados.map((material) => {
                  const { valorCombinado, valorPago, valorRestante } = calcularValoresMaterial(material)
                  const statusCalculado = calcularStatusCorreto(material)
                  const statusBadge = getStatusBadge(statusCalculado)
                  const percentualPagoIndividual = valorCombinado > 0 ? (valorPago / valorCombinado) * 100 : 0

                  return (
                    <tr key={material._id}>
                      <td>
                        <strong>{material.numeroNota || "-"}</strong>
                      </td>
                      <td>
                        {material.descricao || "-"}
                        {material.observacoes && <small className="d-block text-muted">{material.observacoes}</small>}
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <MapPin size={14} className="me-1 text-muted" />
                          {material.localCompra || "-"}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <User size={14} className="me-1 text-muted" />
                          {material.solicitante || "-"}
                        </div>
                      </td>
                      <td>
                        <strong>{formatCurrency(valorCombinado)}</strong>
                      </td>
                      <td>
                        <strong className="text-success">{formatCurrency(valorPago)}</strong>
                        {valorPago > 0 && valorCombinado > 0 && (
                          <small className="d-block text-muted">
                            {Math.min(percentualPagoIndividual, 100).toFixed(1)}%
                          </small>
                        )}
                      </td>
                      <td>
                        <strong className={valorRestante > 0.01 ? "text-warning" : "text-success"}>
                          {formatCurrency(valorRestante)}
                        </strong>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <Calendar size={14} className="me-1 text-muted" />
                          {formatDate(material.data)}
                        </div>
                      </td>
                      <td>
                        <Badge bg={statusBadge.variant}>{statusBadge.label}</Badge>
                      </td>
                      <td>
                        <Button
                          variant="outline-primary"
                          size="sm"
                          className="me-2"
                          onClick={() => onEditMaterial && onEditMaterial(material)}
                          title="Editar Material"
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          variant="outline-success"
                          size="sm"
                          className="me-2"
                          onClick={() => handleOpenPagamentos(material._id)}
                          title="Gerenciar Pagamentos"
                        >
                          <CreditCard size={14} />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => onDeleteMaterial && onDeleteMaterial(material._id)}
                          title="Excluir Material"
                        >
                          <Trash2 size={14} />
                        </Button>
                      </td>
                    </tr>
                  )
                }))}
              </tbody>
          </Table>
        </Card.Body>
      </Card>

      {selectedMaterialId && (
        <MaterialPagamentos
          materialId={selectedMaterialId}
          show={showPagamentosModal}
          onHide={handleClosePagamentos}
          onUpdate={handleUpdatePagamentos}
        />
      )}
    </>
    )
}

export default MaterialsList