"use client"

import { Row, Col, Card } from "react-bootstrap"
import { Bar, Doughnut } from "react-chartjs-2"

const ResumoFinanceiro = ({ stats, chartData, chartOptions, doughnutOptions, formatCurrency }) => {
  if (!stats) {
    return null
  }

  return (
    <>
      <Row className="mb-4">
        {[
          { title: "Orçamento Total", value: stats.totalOrcamento, variant: "primary" },
          { title: "Gasto Total", value: stats.totalGasto, variant: "danger" },
          { title: "Saldo Geral", value: stats.saldoGeral, variant: "success" },
          { title: "Total de Obras", value: stats.totalObras, variant: "info", isCurrency: false },
        ].map((card, index) => (
          <Col md={3} key={index}>
            <Card className={`border-${card.variant} shadow-sm h-100`}>
              <Card.Body>
                <Card.Title className={`text-${card.variant}`}>{card.title}</Card.Title>
                <h3 className="mt-3 mb-2">{card.isCurrency === false ? card.value : formatCurrency(card.value)}</h3>
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
    </>
  )
}

export default ResumoFinanceiro
