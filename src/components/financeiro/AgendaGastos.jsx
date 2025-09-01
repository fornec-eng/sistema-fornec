"use client"

import { useState, useEffect } from "react"
import { Row, Col, Card, Spinner, Table, Badge, Button, Collapse, InputGroup, Form } from "react-bootstrap"
import {
  AlertCircle,
  Clock,
  Calendar,
  TrendingUp,
  Edit,
  Trash2,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react"

const AgendaGastos = ({
  agendaData,
  loadingFuturos,
  gastosFuturos,
  totalGastosFuturos,
  formatCurrency,
  formatDate,
  getDiasRestantes,
  getStatusPagamento,
  getStatusBadge,
  handleOpenEditModal,
  handleOpenDeleteModal,
}) => {
  const [showPastWeeks, setShowPastWeeks] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("")
  const [filterTipo, setFilterTipo] = useState("")
  const [filterObra, setFilterObra] = useState("")

  const [filters, setFilters] = useState({
    emAtraso: { search: "", status: "", tipo: "", obra: "" },
    proximosDias: { search: "", status: "", tipo: "", obra: "" },
    proximaSemana: { search: "", status: "", tipo: "", obra: "" },
    futuro: { search: "", status: "", tipo: "", obra: "" },
  })

  const [tipos, setTipos] = useState([])
  const [obras, setObras] = useState([])

  const getColumnHeader = (tipo) => {
    switch (tipo) {
      case "Material":
      case "Materiais":
        return "Local da Compra (Loja)"
      case "Mão de Obra":
      case "MaoObra":
        return "Nome do Funcionário"
      case "Equipamento":
      case "Equipamentos":
        return "Item"
      case "Contrato":
      case "Contratos":
        return "Loja"
      case "Outros":
      case "Outros Gastos":
        return "Descrição"
      default:
        return "Descrição"
    }
  }

  const getColumnValue = (gasto) => {
    switch (gasto.tipo) {
      case "Material":
      case "Materiais":
        return gasto.loja || gasto.nome || gasto.descricao
      case "Mão de Obra":
      case "MaoObra":
        return gasto.nomeFuncionario || gasto.nome || gasto.descricao
      case "Equipamento":
      case "Equipamentos":
        return gasto.item || gasto.nome || gasto.descricao
      case "Contrato":
      case "Contratos":
        return gasto.loja || gasto.nome || gasto.descricao
      case "Outros":
      case "Outros Gastos":
        return gasto.descricao || gasto.nome
      default:
        return gasto.nome || gasto.descricao
    }
  }

  const updateFilter = (section, field, value) => {
    setFilters((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }))
  }

  const filterGastos = (gastos, sectionFilters) => {
    return gastos.filter((gasto) => {
      const matchesSearch =
        sectionFilters.search === "" ||
        getColumnValue(gasto).toLowerCase().includes(sectionFilters.search.toLowerCase()) ||
        (gasto.obraNome && gasto.obraNome.toLowerCase().includes(sectionFilters.search.toLowerCase()))

      const matchesStatus = sectionFilters.status === "" || getStatusPagamento(gasto) === sectionFilters.status
      const matchesTipo = sectionFilters.tipo === "" || gasto.tipo === sectionFilters.tipo
      const matchesObra = sectionFilters.obra === "" || gasto.obraNome === sectionFilters.obra

      return matchesSearch && matchesStatus && matchesTipo && matchesObra
    })
  }

  const groupGastosByType = (gastos) => {
    return gastos.reduce((groups, gasto) => {
      const tipo = gasto.tipo || "Outros"
      if (!groups[tipo]) {
        groups[tipo] = []
      }
      groups[tipo].push(gasto)
      return groups
    }, {})
  }

  useEffect(() => {
    if (gastosFuturos && gastosFuturos.length > 0) {
      // Extract unique tipos
      const tiposUnicos = [...new Set(gastosFuturos.map((g) => g.tipo).filter(Boolean))]
      setTipos(tiposUnicos)

      // Extract unique obras
      const obrasUnicas = [...new Set(gastosFuturos.map((g) => g.obraNome).filter(Boolean))]
      setObras(obrasUnicas)
    }
  }, [gastosFuturos])

  const getPastWeeksGastos = () => {
    if (!gastosFuturos.length) return []

    const hoje = new Date()
    const umaSemanaAtras = new Date(hoje)
    umaSemanaAtras.setDate(hoje.getDate() - 7)
    const duasSemanasAtras = new Date(hoje)
    duasSemanasAtras.setDate(hoje.getDate() - 14)

    return gastosFuturos.filter((g) => {
      const dataVenc = new Date(g.dataVencimento || g.dataPagamento || g.dataInicio)
      return dataVenc < umaSemanaAtras
    })
  }

  const filterPastWeeksGastos = (gastos) => {
    return gastos.filter((gasto) => {
      const matchesSearch =
        searchTerm === "" ||
        getColumnValue(gasto).toLowerCase().includes(searchTerm.toLowerCase()) ||
        (gasto.obraNome && gasto.obraNome.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesStatus = filterStatus === "" || getStatusPagamento(gasto) === filterStatus
      const matchesTipo = filterTipo === "" || gasto.tipo === filterTipo
      const matchesObra = filterObra === "" || gasto.obraNome === filterObra

      return matchesSearch && matchesStatus && matchesTipo && matchesObra
    })
  }

  const pastWeeksGastos = getPastWeeksGastos()
  const filteredPastWeeksGastos = filterPastWeeksGastos(pastWeeksGastos)

  if (loadingFuturos) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Carregando agenda de gastos...</p>
      </div>
    )
  }

  const renderTabelaGastos = (gastos, titulo, corHeader, total, sectionKey) => {
    const sectionFilters = filters[sectionKey] || { search: "", status: "", tipo: "", obra: "" }
    const filteredGastos = filterGastos(gastos, sectionFilters)
    const groupedGastos = groupGastosByType(filteredGastos)
    const filteredTotal = filteredGastos.reduce((acc, g) => acc + (g.valor || 0), 0)

    if (gastos.length === 0) {
      return (
        <Col md={12} className="mb-4">
          <Card className="shadow-sm">
            <Card.Header className={`bg-${corHeader} text-white`}>
              <h5 className="mb-0">{titulo}</h5>
            </Card.Header>
            <Card.Body>
              <p className="text-muted text-center mb-0">Nenhum gasto nesta categoria.</p>
            </Card.Body>
          </Card>
        </Col>
      )
    }

    return (
      <Col md={12} className="mb-4">
        <Card className="shadow-sm">
          <Card.Header className={`bg-${corHeader} text-white`}>
            <h5 className="mb-0">
              {titulo} ({gastos.length} itens)
            </h5>
          </Card.Header>
          <Card.Body>
            {/* Filters */}
            <Row className="mb-3">
              <Col md={3}>
                <InputGroup>
                  <InputGroup.Text>
                    <Search size={16} />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Buscar..."
                    value={sectionFilters.search}
                    onChange={(e) => updateFilter(sectionKey, "search", e.target.value)}
                  />
                </InputGroup>
              </Col>
              <Col md={3}>
                <Form.Select
                  value={sectionFilters.status}
                  onChange={(e) => updateFilter(sectionKey, "status", e.target.value)}
                >
                  <option value="">Todos os status</option>
                  <option value="pendente">Pendente</option>
                  <option value="efetuado">Efetuado</option>
                  <option value="atrasado">Atrasado</option>
                </Form.Select>
              </Col>
              <Col md={3}>
                <InputGroup>
                  <InputGroup.Text>
                    <Filter size={16} />
                  </InputGroup.Text>
                  <Form.Select
                    value={sectionFilters.tipo}
                    onChange={(e) => updateFilter(sectionKey, "tipo", e.target.value)}
                  >
                    <option value="">Todos os tipos</option>
                    {tipos.map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {tipo}
                      </option>
                    ))}
                  </Form.Select>
                </InputGroup>
              </Col>
              <Col md={3}>
                <Form.Select
                  value={sectionFilters.obra}
                  onChange={(e) => updateFilter(sectionKey, "obra", e.target.value)}
                >
                  <option value="">Todas as obras</option>
                  {obras.map((obra) => (
                    <option key={obra} value={obra}>
                      {obra}
                    </option>
                  ))}
                </Form.Select>
              </Col>
            </Row>

            {/* Tables grouped by type */}
            {Object.keys(groupedGastos).length === 0 ? (
              <div className="text-center p-4 text-muted">
                <Calendar size={48} className="mb-3" />
                <p>Nenhum gasto encontrado com os filtros aplicados.</p>
              </div>
            ) : (
              Object.entries(groupedGastos).map(([tipo, gastosDoTipo]) => (
                <div key={tipo} className="mb-4">
                  <h6 className={`text-${corHeader} mb-3`}>
                    <Badge bg={corHeader} className="me-2">
                      {tipo}
                    </Badge>
                    ({gastosDoTipo.length} itens)
                  </h6>
                  <Table responsive hover className="mb-3">
                    <thead className="table-light">
                      <tr>
                        <th>{getColumnHeader(tipo)}</th>
                        <th>Obra</th>
                        <th>Vencimento</th>
                        <th>Dias</th>
                        <th>Status</th>
                        <th className="text-end">Valor</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gastosDoTipo.map((gasto, index) => {
                        const dias = getDiasRestantes(gasto.dataVencimento || gasto.dataPagamento || gasto.dataInicio)
                        const statusBadge = getStatusBadge(getStatusPagamento(gasto))
                        return (
                          <tr key={index} className={corHeader === "danger" ? "table-danger" : ""}>
                            <td>
                              <strong>{getColumnValue(gasto)}</strong>
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
                              <Badge bg={dias <= 0 ? "danger" : dias <= 7 ? "warning" : "info"}>
                                {dias <= 0 ? `${Math.abs(dias)} dias atraso` : `${dias} dias restantes`}
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
                        <td colSpan="5" className="text-end">
                          <strong>Subtotal {tipo}:</strong>
                        </td>
                        <td className="text-end">
                          <strong className={`text-${corHeader}`}>
                            {formatCurrency(gastosDoTipo.reduce((acc, g) => acc + (g.valor || 0), 0))}
                          </strong>
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </Table>
                </div>
              ))
            )}

            {/* Total geral */}
            {Object.keys(groupedGastos).length > 0 && (
              <div className="border-top pt-3">
                <Row>
                  <Col className="text-end">
                    <h5 className={`text-${corHeader}`}>Total Geral: {formatCurrency(filteredTotal)}</h5>
                  </Col>
                </Row>
              </div>
            )}
          </Card.Body>
        </Card>
      </Col>
    )
  }

  return (
    <>
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
        <Col md={2}>
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
        <Col md={2}>
          <Card className="border-info shadow-sm">
            <Card.Body className="text-center">
              <Calendar size={24} className="text-info mb-2" />
              <h4 className="text-info">{formatCurrency(agendaData.totalProximaSemana)}</h4>
              <small className="text-muted">Próxima semana (8-14 dias)</small>
              <div className="mt-2">
                <Badge bg="info">{agendaData.proximaSemana.length} itens</Badge>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="border-secondary shadow-sm">
            <Card.Body className="text-center">
              <TrendingUp size={24} className="text-secondary mb-2" />
              <h4 className="text-secondary">
                {formatCurrency(
                  totalGastosFuturos -
                    agendaData.totalEmAtraso -
                    agendaData.totalProximosDias -
                    agendaData.totalProximaSemana,
                )}
              </h4>
              <small className="text-muted">Futuro (15+ dias)</small>
              <div className="mt-2">
                <Badge bg="secondary">
                  {gastosFuturos.length -
                    agendaData.emAtraso.length -
                    agendaData.proximosDias.length -
                    agendaData.proximaSemana.length}{" "}
                  itens
                </Badge>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="border-primary shadow-sm">
            <Card.Body className="text-center">
              <TrendingUp size={24} className="text-primary mb-2" />
              <h4 className="text-primary">{formatCurrency(totalGastosFuturos)}</h4>
              <small className="text-muted">Total Futuro</small>
              <div className="mt-2">
                <Badge bg="primary">{gastosFuturos.length} itens</Badge>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        {renderTabelaGastos(agendaData.emAtraso, "Em Atraso", "danger", agendaData.totalEmAtraso, "emAtraso")}
        {renderTabelaGastos(
          agendaData.proximosDias,
          "Vencendo nos Próximos 7 Dias",
          "warning",
          agendaData.totalProximosDias,
          "proximosDias",
        )}
        {renderTabelaGastos(
          agendaData.proximaSemana,
          "Vencendo na Próxima Semana (8-14 dias)",
          "info",
          agendaData.totalProximaSemana,
          "proximaSemana",
        )}
        {(() => {
          const hoje = new Date()
          const proximos14dias = new Date(hoje)
          proximos14dias.setDate(hoje.getDate() + 14)

          const gastosFuturosAlem14Dias = gastosFuturos.filter((g) => {
            const dataVenc = new Date(g.dataVencimento || g.dataPagamento || g.dataInicio)
            return dataVenc > proximos14dias && getStatusPagamento(g) !== "efetuado"
          })

          const totalGastosFuturosAlem14Dias = gastosFuturosAlem14Dias.reduce((acc, g) => acc + (g.valor || 0), 0)

          return renderTabelaGastos(
            gastosFuturosAlem14Dias,
            "Vencendo no Futuro (15+ dias)",
            "secondary",
            totalGastosFuturosAlem14Dias,
            "futuro",
          )
        })()}
      </Row>

      {pastWeeksGastos.length > 0 && (
        <Row className="mt-4">
          <Col md={12}>
            <Card className="shadow-sm">
              <Card.Header className="bg-secondary text-white">
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">Semanas Passadas ({pastWeeksGastos.length} itens)</h5>
                  <Button variant="outline-light" size="sm" onClick={() => setShowPastWeeks(!showPastWeeks)}>
                    {showPastWeeks ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    {showPastWeeks ? " Ocultar" : " Mostrar"}
                  </Button>
                </div>
              </Card.Header>
              <Collapse in={showPastWeeks}>
                <Card.Body>
                  {/* Filters */}
                  <Row className="mb-3">
                    <Col md={3}>
                      <InputGroup>
                        <InputGroup.Text>
                          <Search size={16} />
                        </InputGroup.Text>
                        <Form.Control
                          placeholder="Buscar por descrição, obra..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </InputGroup>
                    </Col>
                    <Col md={3}>
                      <Form.Select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                        <option value="">Todos os status</option>
                        <option value="pendente">Pendente</option>
                        <option value="efetuado">Efetuado</option>
                        <option value="atrasado">Atrasado</option>
                      </Form.Select>
                    </Col>
                    <Col md={3}>
                      <InputGroup>
                        <InputGroup.Text>
                          <Filter size={16} />
                        </InputGroup.Text>
                        <Form.Select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)}>
                          <option value="">Todos os tipos</option>
                          {tipos.map((tipo) => (
                            <option key={tipo} value={tipo}>
                              {tipo}
                            </option>
                          ))}
                        </Form.Select>
                      </InputGroup>
                    </Col>
                    <Col md={3}>
                      <Form.Select value={filterObra} onChange={(e) => setFilterObra(e.target.value)}>
                        <option value="">Todas as obras</option>
                        {obras.map((obra) => (
                          <option key={obra} value={obra}>
                            {obra}
                          </option>
                        ))}
                      </Form.Select>
                    </Col>
                  </Row>

                  {/* Filtered Table */}
                  {filteredPastWeeksGastos.length === 0 ? (
                    <div className="text-center p-4 text-muted">
                      <Calendar size={48} className="mb-3" />
                      <p>Nenhum gasto encontrado com os filtros aplicados.</p>
                    </div>
                  ) : (
                    <Table responsive hover>
                      <thead className="table-light">
                        <tr>
                          <th>Descrição</th>
                          <th>Tipo</th>
                          <th>Obra</th>
                          <th>Vencimento</th>
                          <th>Dias</th>
                          <th>Status</th>
                          <th className="text-end">Valor</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredPastWeeksGastos.map((gasto, index) => {
                          const dias = getDiasRestantes(gasto.dataVencimento || gasto.dataPagamento || gasto.dataInicio)
                          const statusBadge = getStatusBadge(getStatusPagamento(gasto))
                          return (
                            <tr key={index}>
                              <td>
                                <strong>{getColumnValue(gasto)}</strong>
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
                                <Badge bg={dias <= 0 ? "danger" : dias <= 7 ? "warning" : "info"}>
                                  {dias <= 0 ? `${Math.abs(dias)} dias atraso` : `${dias} dias restantes`}
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
                                  <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => handleOpenEditModal(gasto)}
                                  >
                                    <Edit size={14} />
                                  </Button>
                                  <Button
                                    variant="outline-danger"
                                    size="sm"
                                    onClick={() => handleOpenDeleteModal(gasto)}
                                  >
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
                            <strong>Total Filtrado:</strong>
                          </td>
                          <td className="text-end">
                            <strong className="text-secondary">
                              {formatCurrency(filteredPastWeeksGastos.reduce((acc, g) => acc + (g.valor || 0), 0))}
                            </strong>
                          </td>
                          <td></td>
                        </tr>
                      </tfoot>
                    </Table>
                  )}
                </Card.Body>
              </Collapse>
            </Card>
          </Col>
        </Row>
      )}
    </>
  )
}

export default AgendaGastos
