"use client"

import { Accordion, Badge, Spinner, Table, Button } from "react-bootstrap"
import { Building, Edit, Trash2, ExternalLink } from "lucide-react"

const TabelaGastosCompleta = ({
  stats,
  loadingDetalhes,
  detalhesGastos,
  formatCurrency,
  formatDate,
  getStatusPagamento,
  getStatusBadge,
  handleOpenEditModal,
  handleOpenDeleteModal,
  navigate,
}) => {
  const getTabKeyForGastoType = (tipo) => {
    const map = {
      Materiais: "materiais",
      "Mão de Obra": "mao-de-obra",
      Equipamentos: "equipamentos",
      Contratos: "contratos",
      Outros: "outros-gastos",
    }
    return map[tipo] || "materiais"
  }

  if (loadingDetalhes) {
    return (
      <div className="text-center p-4">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Carregando detalhes dos gastos...</p>
      </div>
    )
  }

  if (!detalhesGastos || !detalhesGastos.gastosPorObra) {
    return <div className="text-center p-4 text-muted">Nenhum dado de gasto detalhado para exibir.</div>
  }

  return (
    <Accordion>
      <Accordion.Item eventKey="0">
        <Accordion.Header>
          <div className="d-flex justify-content-between align-items-center w-100 me-3">
            <span>Ver Tabela Completa de Gastos</span>
            <Badge bg="primary">{stats ? formatCurrency(stats.totalGasto) : "Carregando..."}</Badge>
          </div>
        </Accordion.Header>
        <Accordion.Body className="p-0">
          <Accordion>
            {Object.entries(detalhesGastos.gastosPorObra).map(([nomeObra, dadosObra], index) => (
              <Accordion.Item eventKey={index.toString()} key={nomeObra}>
                <Accordion.Header>
                  <div className="d-flex justify-content-between align-items-center w-100 me-3">
                    <div className="d-flex align-items-center">
                      <Building className="me-2" size={18} />
                      <strong>{nomeObra}</strong>
                    </div>
                    <Badge bg="primary">{formatCurrency(dadosObra.total)}</Badge>
                  </div>
                </Accordion.Header>
                <Accordion.Body className="p-2">
                  <Accordion>
                    {Object.entries(dadosObra.gastosPorTipo)
                      .filter(([, dadosTipo]) => dadosTipo.gastos.length > 0)
                      .map(([tipo, dadosTipo], tipoIndex) => (
                        <Accordion.Item eventKey={tipoIndex.toString()} key={tipo}>
                          <Accordion.Header>
                            <div className="d-flex justify-content-between align-items-center w-100 me-3">
                              <span>{tipo}</span>
                              <div className="d-flex align-items-center gap-2">
                                <Button
                                  variant="outline-secondary"
                                  size="sm"
                                  className="py-0 px-1"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    const tabKey = getTabKeyForGastoType(tipo)
                                    navigate(`/obra-dashboard/${dadosObra.obraId}`, { state: { activeTab: tabKey } })
                                  }}
                                  title={`Ir para ${tipo} no dashboard`}
                                >
                                  <ExternalLink size={14} />
                                </Button>
                                <Badge bg="secondary">
                                  {dadosTipo.gastos.length} {dadosTipo.gastos.length === 1 ? "item" : "itens"}
                                </Badge>
                                <Badge bg="success">{formatCurrency(dadosTipo.total)}</Badge>
                              </div>
                            </div>
                          </Accordion.Header>
                          <Accordion.Body className="p-0">
                            <Table responsive hover className="mb-0">
                              <thead className="table-light">
                                <tr>
                                  <th>Descrição</th>
                                  <th>Data</th>
                                  <th>Status</th>
                                  <th className="text-end">Valor</th>
                                  <th>Ações</th>
                                </tr>
                              </thead>
                              <tbody>
                                {dadosTipo.gastos.map((gasto, gastoIndex) => (
                                  <tr key={gastoIndex}>
                                    <td>
                                      <strong>{gasto.nome || gasto.descricao || gasto.item || "Sem descrição"}</strong>
                                      {gasto.observacoes && (
                                        <small className="d-block text-muted">{gasto.observacoes}</small>
                                      )}
                                    </td>
                                    <td>
                                      <small>{formatDate(gasto.data || gasto.dataVencimento)}</small>
                                    </td>
                                    <td>
                                      {(() => {
                                        const status = getStatusPagamento(gasto)
                                        const statusBadge = getStatusBadge(status)
                                        return <Badge bg={statusBadge.variant}>{statusBadge.label}</Badge>
                                      })()}
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
                                          <Edit size={12} />
                                        </Button>
                                        <Button
                                          variant="outline-danger"
                                          size="sm"
                                          onClick={() => handleOpenDeleteModal(gasto)}
                                        >
                                          <Trash2 size={12} />
                                        </Button>
                                      </div>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </Table>
                          </Accordion.Body>
                        </Accordion.Item>
                      ))}
                  </Accordion>
                </Accordion.Body>
              </Accordion.Item>
            ))}
          </Accordion>
        </Accordion.Body>
      </Accordion.Item>
    </Accordion>
  )
}

export default TabelaGastosCompleta
