"use client"

import { useState, useEffect } from "react"
import { Card, Table, Spinner } from "react-bootstrap"
import ApiBase from "../services/ApiBase"

const CardContratos = ({ obra }) => {
  const [contratos, setContratos] = useState([])
  const [loading, setLoading] = useState(true)

  // Função para formatar valores monetários
  const formatCurrency = (value) => {
    if (!value) return "R$ 0,00"
    if (typeof value === "string") {
      return value
    }
    return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
  }

  // Função para converter string de moeda para número
  const currencyToNumber = (currencyStr) => {
    if (!currencyStr || typeof currencyStr !== "string") return 0
    if (!currencyStr.includes("R$")) return 0
    return Number.parseFloat(currencyStr.replace("R$", "").replace(/\./g, "").replace(",", ".").trim())
  }

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await ApiBase.post("/google/sheets/data", {
          data: { spreadsheetId: obra.id, range: "contratos" },
        })

        const result = res.data
        if (!result.values || result.values.length < 3) {
          setContratos([])
          setLoading(false)
          return
        }

        // Ignorar as duas primeiras linhas (cabeçalho e subcabeçalho)
        const rows = result.values.slice(2)

        // Processar cada linha para extrair as informações necessárias
        const processedContratos = rows
          .map((row) => {
            // Verificar se a linha tem dados suficientes
            if (row.length < 3) return null

            // Extrair informações básicas
            const contratoId = row[0]
            const nome = row[1]
            const valorTotal = row[2]

            // Calcular valor pago somando todos os pagamentos
            // Os pagamentos estão nos índices 5, 8, 11, 14, 17, 20, 23, 26, 29, 32
            let valorPago = 0
            for (let i = 5; i < row.length; i += 3) {
              if (row[i] && typeof row[i] === "string" && row[i].includes("R$")) {
                const valor = currencyToNumber(row[i])
                valorPago += valor
              }
            }

            return {
              contratoId,
              nome,
              valorTotal,
              valorPago: formatCurrency(valorPago),
              valorTotalNum: currencyToNumber(valorTotal),
              valorPagoNum: valorPago,
            }
          })
          .filter(Boolean) // Remover itens nulos

        setContratos(processedContratos)
      } catch (error) {
        console.error("Erro ao buscar os dados de contratos:", error)
        setContratos([])
      } finally {
        setLoading(false)
      }
    }

    if (obra && obra.id) {
      fetchData()
    }
  }, [obra])

  return (
    <div className="col-md-6 col-lg-12">
      <Card style={{ minHeight: "200px", borderRadius: "10px", boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}>
        <Card.Body>
          <Card.Title>Contratos</Card.Title>
          {loading ? (
            <div className="d-flex justify-content-center align-items-center" style={{ height: "150px" }}>
              <Spinner animation="border" variant="primary" />
            </div>
          ) : contratos.length === 0 ? (
            <p className="text-center text-muted">Nenhum contrato encontrado.</p>
          ) : (
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Nº Contrato</th>
                    <th>Nome</th>
                    <th>Valor Total</th>
                    <th>Valor Pago</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {contratos.map((contrato, index) => (
                    <tr key={index}>
                      <td>{contrato.contratoId}</td>
                      <td>{contrato.nome}</td>
                      <td>{contrato.valorTotal}</td>
                      <td>{contrato.valorPago}</td>
                      <td>
                        <div className="progress" style={{ height: "20px" }}>
                          <div
                            className={`progress-bar ${
                              contrato.valorPagoNum / contrato.valorTotalNum > 0.9
                                ? "bg-success"
                                : contrato.valorPagoNum / contrato.valorTotalNum > 0.5
                                  ? "bg-warning"
                                  : "bg-danger"
                            }`}
                            role="progressbar"
                            style={{
                              width: `${Math.min((contrato.valorPagoNum / contrato.valorTotalNum) * 100, 100)}%`,
                            }}
                            aria-valuenow={Math.min((contrato.valorPagoNum / contrato.valorTotalNum) * 100, 100)}
                            aria-valuemin="0"
                            aria-valuemax="100"
                          >
                            {Math.round((contrato.valorPagoNum / contrato.valorTotalNum) * 100)}%
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  )
}

export default CardContratos