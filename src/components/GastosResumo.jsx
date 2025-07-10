import React from "react"
import { Card, Row, Col, Badge } from "react-bootstrap"

const GastosResumo = ({ gastos, valorContrato, totalGastos: totalGastosProps }) => {
  const formatCurrency = (value) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0)

  const totalGastos = totalGastosProps !== undefined ? totalGastosProps : gastos?.reduce((acc, gasto) => acc + (gasto.valor || 0), 0) || 0
  const saldo = (valorContrato || 0) - totalGastos
  const percentual = valorContrato > 0 ? (totalGastos / valorContrato) * 100 : 0

  const getVariantByPercentual = (perc) => {
    if (perc > 90) return "danger"
    if (perc > 70) return "warning"
    return "success"
  }

  return (
    <Card className="mt-2">
      <Card.Body className="py-2">
        <Row className="align-items-center">
          <Col md={4}>
            <small className="text-muted">Total Gasto:</small>
            <div className="fw-bold text-danger">{formatCurrency(totalGastos)}</div>
          </Col>
          <Col md={4}>
            <small className="text-muted">Saldo:</small>
            <div className={`fw-bold ${saldo >= 0 ? "text-success" : "text-danger"}`}>
              {formatCurrency(saldo)}
            </div>
          </Col>
          <Col md={4}>
            <small className="text-muted">Progresso:</small>
            <div>
              <Badge bg={getVariantByPercentual(percentual)}>
                {percentual.toFixed(1)}%
              </Badge>
            </div>
          </Col>
        </Row>
        {totalGastos > 0 && (
          <div className="mt-2">
            <div className="progress" style={{ height: "6px" }}>
              <div
                className={`progress-bar bg-${getVariantByPercentual(percentual)}`}
                style={{ width: `${Math.min(percentual, 100)}%` }}
              ></div>
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  )
}

export default GastosResumo