"use client"

import { useState, useEffect } from "react"
import { Row, Col, Card, Spinner, Table, Badge, Button, Accordion, InputGroup, Form } from "react-bootstrap"
import {
  AlertCircle,
  Clock,
  Calendar,
  TrendingUp,
  Edit,
  Trash2,
  Search,
  Filter,
  CheckCircle,
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
  const [filters, setFilters] = useState({
    emAtraso: { search: "", status: "", tipo: "", obra: "" },
    proximosDias: { search: "", status: "", tipo: "", obra: "" },
    proximaSemana: { search: "", status: "", tipo: "", obra: "" },
    futuro: { search: "", status: "", tipo: "", obra: "" },
    efetuados: { search: "", status: "", tipo: "", obra: "" },
    pastWeeks: { search: "", status: "", tipo: "", obra: "" },
  })

  const [tipos, setTipos] = useState([])
  const [obras, setObras] = useState([])

  const getColumnHeader = (tipo) => {
    switch (tipo) {
      case "Material":
      case "Materiais":
        return "Local da Compra"
      case "Mão de Obra":
      case "MaoObra":
        return "Nome do Funcionário"
      case "Equipamento":
      case "Equipamentos":
        return "Item"
      case "Contrato":
      case "Contratos":
        return "Nome"
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
        return gasto.localCompra || gasto.nome || gasto.descricao
      case "Mão de Obra":
      case "MaoObra":
        return gasto.nomeFuncionario || gasto.nome || gasto.descricao
      case "Equipamento":
      case "Equipamentos":
        return gasto.item || gasto.nome || gasto.descricao
      case "Contrato":
      case "Contratos":
        return gasto.nome || gasto.loja || gasto.descricao
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
      // Busca expandida nos campos: descricao, localCompra, numeroNota, obraNome, solicitante, observacoes
      const searchableFields = [
        gasto.descricao,
        gasto.localCompra,
        gasto.numeroNota,
        gasto.obraNome,
        gasto.solicitante,
        gasto.observacoes,
        getColumnValue(gasto),
      ].filter(Boolean).join(" ").toLowerCase()

      const matchesSearch = sectionFilters.search === "" || 
        searchableFields.includes(sectionFilters.search.toLowerCase())

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
      const tiposUnicos = [...new Set(gastosFuturos.map((g) => g.tipo).filter(Boolean))]
      setTipos(tiposUnicos)

      const obrasUnicas = [...new Set(gastosFuturos.map((g) => g.obraNome).filter(Boolean))]
      setObras(obrasUnicas)
    }
  }, [gastosFuturos])

  const getPastWeeksGastos = () => {
    if (!gastosFuturos.length) return []

    const hoje = new Date()
    const umaSemanaAtras = new Date(hoje)
    umaSemanaAtras.setDate(hoje.getDate() - 7)

    return gastosFuturos.filter((g) => {
      const dataVenc = new Date(g.dataVencimento || g.dataPagamento || g.dataInicio || g.data)
      const status = getStatusPagamento(g)
      return dataVenc < umaSemanaAtras && status !== "efetuado"
    })
  }

  const getGastosEfetuados = () => {
    if (!gastosFuturos.length) return []

    return gastosFuturos.filter((g) => {
      const status = getStatusPagamento(g)
      return status === "efetuado"
    })
  }

  const pastWeeksGastos = getPastWeeksGastos()
  const gastosEfetuados = getGastosEfetuados()

  if (loadingFuturos) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Carregando agenda de gastos...</p>
      </div>
    )
  }

  const renderAccordionSection = (gastos, titulo, corHeader, total, sectionKey, eventKey) => {
    const sectionFilters = filters[sectionKey] || { search: "", status: "", tipo: "", obra: "" }
    const filteredGastos = filterGastos(gastos, sectionFilters)
    const groupedGastos = groupGastosByType(filteredGastos)
    const filteredTotal = filteredGastos.reduce((acc, g) => acc + (g.valor || 0), 0)

    return (
      <Accordion.Item eventKey={eventKey}>
        <Accordion.Header>
          <div className="d-flex justify-content-between align-items-center w-100 me-3">
            <div className="d-flex align-items-center gap-2">
              <Badge bg={corHeader} className="px-3 py-2">
                {gastos.length}
              </Badge>
              <strong>{titulo}</strong>
            </div>
            <div className="d-flex align-items-center gap-2">
              <Badge bg={corHeader} pill className="px-3 py-2">
                {formatCurrency(total)}
              </Badge>
            </div>
          </div>
        </Accordion.Header>
        <Accordion.Body className="p-0">
          <div className="p-3">
            {/* Filters */}
            <Row className="mb-3">
              <Col md={3}>
                <InputGroup size="sm">
                  <InputGroup.Text>
                    <Search size={14} />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Buscar por descrição, nota, solicitante..."
                    value={sectionFilters.search}
                    onChange={(e) => updateFilter(sectionKey, "search", e.target.value)}
                    size="sm"
                  />
                </InputGroup>
              </Col>
              <Col md={3}>
                <Form.Select
                  size="sm"
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
                <InputGroup size="sm">
                  <InputGroup.Text>
                    <Filter size={14} />
                  </InputGroup.Text>
                  <Form.Select
                    size="sm"
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
                  size="sm"
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
                  <Table responsive hover className="mb-3" size="sm">
                    <thead className="table-light">
                      <tr>
                        <th>{getColumnHeader(tipo)}</th>
                        <th>Descrição / Nº Nota</th>
                        <th>Obra</th>
                        <th>Solicitante</th>
                        <th>Data</th>
                        <th>Dias</th>
                        <th>Status</th>
                        <th className="text-end">Valor</th>
                        <th>Ações</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gastosDoTipo.map((gasto, index) => {
                        const dias = getDiasRestantes(gasto.dataVencimento || gasto.dataPagamento || gasto.data)
                        const statusBadge = getStatusBadge(getStatusPagamento(gasto))
                        return (
                          <tr key={index}>
                            <td>
                              <strong>{getColumnValue(gasto)}</strong>
                            </td>
                            <td>
                              <div>
                                {gasto.descricao && (
                                  <small className="d-block text-muted">
                                    {gasto.descricao.length > 50 
                                      ? gasto.descricao.substring(0, 50) + "..." 
                                      : gasto.descricao}
                                  </small>
                                )}
                                {gasto.numeroNota && (
                                  <small className="d-block">
                                    <Badge bg="secondary" className="me-1">NF</Badge>
                                    {gasto.numeroNota}
                                  </small>
                                )}
                              </div>
                            </td>
                            <td>
                              <small className="text-muted">{gasto.obraNome || "Fornec"}</small>
                            </td>
                            <td>
                              <small className="text-muted">{gasto.solicitante || "-"}</small>
                            </td>
                            <td>
                              <small>{formatDate(gasto.dataVencimento || gasto.dataPagamento || gasto.data)}</small>
                            </td>
                            <td>
                              {dias !== null ? (
                                <Badge bg={dias <= 0 ? "danger" : dias <= 7 ? "warning" : "info"} className="small">
                                  {dias <= 0 ? `${Math.abs(dias)}d atraso` : `${dias}d`}
                                </Badge>
                              ) : (
                                <Badge bg="secondary" className="small">-</Badge>
                              )}
                            </td>
                            <td>
                              <Badge bg={statusBadge.variant} className="small">{statusBadge.label}</Badge>
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
                        <td colSpan="7" className="text-end">
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
              <div className="border-top pt-3 px-3 bg-light">
                <Row>
                  <Col className="text-end">
                    <h5 className={`text-${corHeader} mb-0`}>
                      Total Geral: {formatCurrency(filteredTotal)}
                    </h5>
                  </Col>
                </Row>
              </div>
            )}
          </div>
        </Accordion.Body>
      </Accordion.Item>
    )
  }

  // Calcular gastos futuros além de 14 dias
  const hoje = new Date()
  const proximos14dias = new Date(hoje)
  proximos14dias.setDate(hoje.getDate() + 14)

  const gastosFuturosAlem14Dias = gastosFuturos.filter((g) => {
    const dataVenc = new Date(g.dataVencimento || g.dataPagamento || g.dataInicio || g.data)
    return dataVenc > proximos14dias && getStatusPagamento(g) !== "efetuado"
  })

  const totalGastosFuturosAlem14Dias = gastosFuturosAlem14Dias.reduce((acc, g) => acc + (g.valor || 0), 0)

  return (
    <>
      {/* Cards de Resumo */}
      <Row className="mb-4">
        <Col md={2}>
          <Card className="border-danger shadow-sm">
            <Card.Body className="text-center p-3">
              <AlertCircle size={20} className="text-danger mb-2" />
              <h5 className="text-danger mb-1">{formatCurrency(agendaData.totalEmAtraso)}</h5>
              <small className="text-muted d-block">Em atraso</small>
              <Badge bg="danger" className="mt-2">{agendaData.emAtraso.length}</Badge>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="border-warning shadow-sm">
            <Card.Body className="text-center p-3">
              <Clock size={20} className="text-warning mb-2" />
              <h5 className="text-warning mb-1">{formatCurrency(agendaData.totalProximosDias)}</h5>
              <small className="text-muted d-block">Próximos 7 dias</small>
              <Badge bg="warning" className="mt-2">{agendaData.proximosDias.length}</Badge>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="border-info shadow-sm">
            <Card.Body className="text-center p-3">
              <Calendar size={20} className="text-info mb-2" />
              <h5 className="text-info mb-1">{formatCurrency(agendaData.totalProximaSemana)}</h5>
              <small className="text-muted d-block">8-14 dias</small>
              <Badge bg="info" className="mt-2">{agendaData.proximaSemana.length}</Badge>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="border-secondary shadow-sm">
            <Card.Body className="text-center p-3">
              <TrendingUp size={20} className="text-secondary mb-2" />
              <h5 className="text-secondary mb-1">
                {formatCurrency(
                  totalGastosFuturos -
                    agendaData.totalEmAtraso -
                    agendaData.totalProximosDias -
                    agendaData.totalProximaSemana -
                    gastosEfetuados.reduce((acc, g) => acc + (g.valor || 0), 0),
                )}
              </h5>
              <small className="text-muted d-block">Futuro (15+ dias)</small>
              <Badge bg="secondary" className="mt-2">
                {gastosFuturos.length -
                  agendaData.emAtraso.length -
                  agendaData.proximosDias.length -
                  agendaData.proximaSemana.length -
                  gastosEfetuados.length}
              </Badge>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="border-success shadow-sm">
            <Card.Body className="text-center p-3">
              <CheckCircle size={20} className="text-success mb-2" />
              <h5 className="text-success mb-1">
                {formatCurrency(gastosEfetuados.reduce((acc, g) => acc + (g.valor || 0), 0))}
              </h5>
              <small className="text-muted d-block">Já Efetuados</small>
              <Badge bg="success" className="mt-2">{gastosEfetuados.length}</Badge>
            </Card.Body>
          </Card>
        </Col>
        <Col md={2}>
          <Card className="border-primary shadow-sm">
            <Card.Body className="text-center p-3">
              <TrendingUp size={20} className="text-primary mb-2" />
              <h5 className="text-primary mb-1">{formatCurrency(totalGastosFuturos)}</h5>
              <small className="text-muted d-block">Total Geral</small>
              <Badge bg="primary" className="mt-2">{gastosFuturos.length}</Badge>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Accordion de Gastos */}
      <Accordion defaultActiveKey="0" className="mb-4">
        {renderAccordionSection(
          agendaData.emAtraso,
          "Em Atraso",
          "danger",
          agendaData.totalEmAtraso,
          "emAtraso",
          "0"
        )}
        {renderAccordionSection(
          agendaData.proximosDias,
          "Vencendo nos Próximos 7 Dias",
          "warning",
          agendaData.totalProximosDias,
          "proximosDias",
          "1"
        )}
        {renderAccordionSection(
          agendaData.proximaSemana,
          "Vencendo na Próxima Semana (8-14 dias)",
          "info",
          agendaData.totalProximaSemana,
          "proximaSemana",
          "2"
        )}
        {renderAccordionSection(
          gastosFuturosAlem14Dias,
          "Vencendo no Futuro (15+ dias)",
          "secondary",
          totalGastosFuturosAlem14Dias,
          "futuro",
          "3"
        )}
        {gastosEfetuados.length > 0 &&
          renderAccordionSection(
            gastosEfetuados,
            "Gastos Já Efetuados",
            "success",
            gastosEfetuados.reduce((acc, g) => acc + (g.valor || 0), 0),
            "efetuados",
            "4"
          )}
        {pastWeeksGastos.length > 0 &&
          renderAccordionSection(
            pastWeeksGastos,
            "Semanas Passadas (Pendentes)",
            "dark",
            pastWeeksGastos.reduce((acc, g) => acc + (g.valor || 0), 0),
            "pastWeeks",
            "5"
          )}
      </Accordion>
    </>
  )
}

export default AgendaGastos