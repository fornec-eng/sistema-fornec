"use client"

import { Row, Col, Card, Spinner, Table, Badge, Button } from "react-bootstrap"
import { AlertCircle, Clock, Calendar, TrendingUp, Edit, Trash2 } from "lucide-react"

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
  if (loadingFuturos) {
    return (
      <div className="text-center p-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Carregando agenda de gastos...</p>
      </div>
    )
  }

  const renderTabelaGastos = (gastos, titulo, corHeader, total) => {
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
          <Card.Body className="p-0">
            <Table responsive hover className="mb-0">
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
                {gastos.map((gasto, index) => {
                  const dias = getDiasRestantes(gasto.dataVencimento || gasto.dataPagamento || gasto.dataInicio)
                  const statusBadge = getStatusBadge(getStatusPagamento(gasto))
                  return (
                    <tr key={index} className={corHeader === "danger" ? "table-danger" : ""}>
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
                        <small>{formatDate(gasto.dataVencimento || gasto.dataPagamento || gasto.dataInicio)}</small>
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
                  <td colSpan="6" className="text-end">
                    <strong>Total:</strong>
                  </td>
                  <td className="text-end">
                    <strong className={`text-${corHeader}`}>{formatCurrency(total)}</strong>
                  </td>
                  <td></td>
                </tr>
              </tfoot>
            </Table>
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
              <small className="text-muted">Próxima semana (8-14 dias)</small>
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
        {renderTabelaGastos(agendaData.emAtraso, "Em Atraso", "danger", agendaData.totalEmAtraso)}
        {renderTabelaGastos(
          agendaData.proximosDias,
          "Vencendo nos Próximos 7 Dias",
          "warning",
          agendaData.totalProximosDias,
        )}
        {renderTabelaGastos(
          agendaData.proximaSemana,
          "Vencendo na Próxima Semana (8-14 dias)",
          "info",
          agendaData.totalProximaSemana,
        )}
      </Row>
    </>
  )
}

export default AgendaGastos
