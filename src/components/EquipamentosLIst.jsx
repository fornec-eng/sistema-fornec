// EquipamentosList.jsx - Componente para equipamentos com filtros
"use client"

import { useState, useEffect } from "react"
import { Card, Table, Button, Badge, ProgressBar, Spinner, Alert, InputGroup, Form, Row, Col } from "react-bootstrap"
import { Wrench, Search, Plus, Edit, Trash2, Calendar, MapPin, User } from "lucide-react"

function EquipamentosList({
  obraId = null,
  showAddButton = true,
  onEquipamentoAdded,
  gastos,
  onEditEquipamento,
  onDeleteEquipamento,
}) {
  const [equipamentos, setEquipamentos] = useState([])
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [filterLocal, setFilterLocal] = useState("")
  const [filterSolicitante, setFilterSolicitante] = useState("")
  const [alert, setAlert] = useState({ show: false, message: "", variant: "" })

  const [locais, setLocais] = useState([])
  const [solicitantes, setSolicitantes] = useState([])

  useEffect(() => {
    if (gastos && gastos.equipamentos) {
      setEquipamentos(gastos.equipamentos)
      const locaisUnicos = [...new Set(gastos.equipamentos.map((e) => e.localCompra).filter(Boolean))]
      setLocais(locaisUnicos)
      const solicitantesUnicos = [...new Set(gastos.equipamentos.map((e) => e.solicitante).filter(Boolean))]
      setSolicitantes(solicitantesUnicos)
    }
  }, [gastos])

  const getStatusBadge = (status) => {
    const statusConfig = {
      pendente: { variant: "warning", label: "Pendente" },
      efetuado: { variant: "success", label: "Conclu�do" },
    }
    return statusConfig[status] || statusConfig.pendente
  }

  const formatCurrency = (value) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0)

  const formatDate = (date) => {
    if (!date) return "-"
    return new Date(date).toLocaleDateString("pt-BR", { timeZone: "UTC" })
  }

  const equipamentosFiltrados = equipamentos.filter((equipamento) => {
    const matchesSearch =
      searchTerm === "" ||
      (equipamento.numeroNota && equipamento.numeroNota.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (equipamento.descricao && equipamento.descricao.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (equipamento.localCompra && equipamento.localCompra.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = filterStatus === "" || equipamento.statusPagamento === filterStatus
    const matchesLocal = filterLocal === "" || equipamento.localCompra === filterLocal
    const matchesSolicitante = filterSolicitante === "" || equipamento.solicitante === filterSolicitante
    return matchesSearch && matchesStatus && matchesLocal && matchesSolicitante
  })

  const calcularTotais = () => {
    const total = equipamentosFiltrados.reduce((acc, e) => acc + (e.valor || 0), 0)
    const pago = equipamentosFiltrados
      .filter((e) => e.statusPagamento === "efetuado")
      .reduce((acc, e) => acc + (e.valor || 0), 0)
    const pendente = total - pago
    const quantidadePago = equipamentosFiltrados.filter((e) => e.statusPagamento === "efetuado").length
    const quantidadePendente = equipamentosFiltrados.filter((e) => e.statusPagamento === "pendente").length

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
        <p className="mt-3">Carregando equipamentos...</p>
      </div>
    )
  }

  return (
    <>
      <Card className="shadow-sm">
        <Card.Header className="bg-white">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <Wrench className="text-primary me-2" size={20} />
              <h5 className="mb-0">Equipamentos</h5>
              <Badge bg="primary" className="ms-2">
                {equipamentosFiltrados.length}
              </Badge>
            </div>
            {showAddButton && onEquipamentoAdded && (
              <Button variant="primary" size="sm" onClick={onEquipamentoAdded}>
                <Plus size={16} className="me-2" />
                Novo Equipamento
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
                <h6 className="text-muted mb-1">Valor Total dos Equipamentos</h6>
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
                <small className="text-muted">{totais.quantidadePendente} equipamentos pendentes</small>
              </div>
            </div>
            <div className="col-md-3">
              <div className="border rounded p-3">
                <h6 className="text-muted mb-1">Taxa de Conclusão</h6>
                <h4 className="text-success">{totais.quantidadePago}</h4>
                <small className="text-muted">
                  {equipamentosFiltrados.length > 0
                    ? ((totais.quantidadePago / equipamentosFiltrados.length) * 100).toFixed(1)
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
                  placeholder="Buscar por nota, descri��o ou local..."
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
                <th>Valor</th>
                <th>Data</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {equipamentosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center p-4 text-muted">
                    <Wrench size={48} className="mb-3" />
                    <p>Nenhum equipamento encontrado.</p>
                  </td>
                </tr>
              ) : (
                equipamentosFiltrados.map((equipamento) => {
                  const statusBadge = getStatusBadge(equipamento.statusPagamento)

                  return (
                    <tr key={equipamento._id}>
                      <td>
                        <strong>{equipamento.numeroNota || "-"}</strong>
                      </td>
                      <td>
                        {equipamento.descricao || "-"}
                        {equipamento.observacoes && <small className="d-block text-muted">{equipamento.observacoes}</small>}
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <MapPin size={14} className="me-1 text-muted" />
                          {equipamento.localCompra || "-"}
                        </div>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <User size={14} className="me-1 text-muted" />
                          {equipamento.solicitante || "-"}
                        </div>
                      </td>
                      <td>
                        <strong>{formatCurrency(equipamento.valor)}</strong>
                      </td>
                      <td>
                        <div className="d-flex align-items-center">
                          <Calendar size={14} className="me-1 text-muted" />
                          {formatDate(equipamento.data)}
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
                          onClick={() => onEditEquipamento && onEditEquipamento(equipamento)}
                          title="Editar Equipamento"
                        >
                          <Edit size={14} />
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() => onDeleteEquipamento && onDeleteEquipamento(equipamento._id)}
                          title="Excluir Equipamento"
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
    </>
  )
}

export default EquipamentosList
