"use client"

import { useState, useEffect } from "react"
import { Card, Table, Badge, ProgressBar, Button, Modal } from "react-bootstrap"
import { Calendar, CheckCircle, Clock, AlertCircle } from "lucide-react"
import ApiBase from "../services/ApiBase"

const Cronograma = ({ obra }) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [tarefaSelecionada, setTarefaSelecionada] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        const res = await ApiBase.post("/google/sheets/data", {
          data: { spreadsheetId: obra.id, range: "cronograma" },
        })
        const result = res.data
        // Remove o cabeçalho e o título, conforme a lógica original
        const processedData = result.values.slice(2)

        // Processar os dados para adicionar informações adicionais
        const dadosProcessados = processedData.map((row, index) => {
          // Calcular progresso com base no status
          let progresso = 0
          if (row[5] === "Concluído") {
            progresso = 100
          } else if (row[5] === "Em andamento") {
            // Calcular progresso com base nas datas
            const dataInicio = new Date(converterData(row[3]))
            const dataFim = new Date(converterData(row[4]))
            const hoje = new Date()

            if (hoje >= dataInicio && hoje <= dataFim) {
              const totalDias = Math.ceil((dataFim - dataInicio) / (1000 * 60 * 60 * 24))
              const diasPassados = Math.ceil((hoje - dataInicio) / (1000 * 60 * 60 * 24))
              progresso = Math.min(Math.round((diasPassados / totalDias) * 100), 99) // Máximo 99% se não estiver concluído
            } else if (hoje > dataFim) {
              progresso = 99 // Deveria estar concluído, mas não está
            }
          }

          return {
            id: index + 1,
            etapa: row[0],
            responsavel: row[1],
            prazo: row[2],
            inicio: row[3],
            fim: row[4],
            status: row[5],
            progresso: progresso,
            atrasado: row[5] !== "Concluído" && new Date() > new Date(converterData(row[4])),
          }
        })

        setData(dadosProcessados)
      } catch (error) {
        console.error("Erro ao buscar os dados:", error)
      } finally {
        setLoading(false)
      }
    }

    if (obra && obra.id) {
      fetchData()
    }
  }, [obra])

  // Função para converter data do formato brasileiro para o formato ISO
  const converterData = (dataStr) => {
    if (!dataStr) return null
    const partes = dataStr.split("/")
    if (partes.length !== 3) return null
    return `${partes[2]}-${partes[1]}-${partes[0]}`
  }

  // Função para obter a classe de cor com base no status
  const getStatusClass = (status, atrasado) => {
    if (atrasado) return "danger"
    switch (status) {
      case "Concluído":
        return "success"
      case "Em andamento":
        return "primary"
      default:
        return "warning"
    }
  }

  // Função para abrir o modal de detalhes
  const verDetalhes = (tarefa) => {
    setTarefaSelecionada(tarefa)
    setShowModal(true)
  }

  // Estatísticas do cronograma
  const calcularEstatisticas = () => {
    const total = data.length
    const concluidas = data.filter((item) => item.status === "Concluído").length
    const emAndamento = data.filter((item) => item.status === "Em andamento").length
    const atrasadas = data.filter((item) => item.atrasado).length

    return {
      total,
      concluidas,
      emAndamento,
      atrasadas,
      percentualConcluido: total > 0 ? (concluidas / total) * 100 : 0,
    }
  }

  const estatisticas = calcularEstatisticas()

  return (
    <div className="col-md-12 mb-4">
      <Card style={{ borderRadius: "10px", boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}>
        <Card.Header className="bg-white">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <Calendar className="text-primary me-2" size={20} />
              <Card.Title className="mb-0">Cronograma da Obra</Card.Title>
            </div>
            <Badge bg="primary">{data.length} etapas</Badge>
          </div>
        </Card.Header>

        <Card.Body>
          {loading ? (
            <div className="text-center p-4">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Carregando...</span>
              </div>
              <p className="mt-2">Carregando cronograma...</p>
            </div>
          ) : (
            <>
              {/* Resumo de estatísticas */}
              <div className="row mb-4">
                <div className="col-md-3 mb-3">
                  <div className="border rounded p-3 h-100">
                    <h6 className="text-muted mb-1">Progresso Geral</h6>
                    <h4>{estatisticas.percentualConcluido.toFixed(0)}%</h4>
                    <ProgressBar
                      now={estatisticas.percentualConcluido}
                      variant="success"
                      className="mt-2"
                      style={{ height: "8px" }}
                    />
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="border rounded p-3 h-100">
                    <h6 className="text-muted mb-1">Etapas Concluídas</h6>
                    <h4>
                      {estatisticas.concluidas} de {estatisticas.total}
                    </h4>
                    <div className="d-flex align-items-center">
                      <CheckCircle size={16} className="text-success me-1" />
                      <small className="text-success">Finalizadas</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="border rounded p-3 h-100">
                    <h6 className="text-muted mb-1">Em Andamento</h6>
                    <h4>{estatisticas.emAndamento}</h4>
                    <div className="d-flex align-items-center">
                      <Clock size={16} className="text-primary me-1" />
                      <small className="text-primary">Em execução</small>
                    </div>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="border rounded p-3 h-100">
                    <h6 className="text-muted mb-1">Etapas Atrasadas</h6>
                    <h4>{estatisticas.atrasadas}</h4>
                    <div className="d-flex align-items-center">
                      <AlertCircle size={16} className="text-danger me-1" />
                      <small className="text-danger">Atenção necessária</small>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabela de cronograma */}
              <div className="table-responsive">
                <Table hover className="align-middle">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: "5%" }}>#</th>
                      <th style={{ width: "25%" }}>Etapa</th>
                      <th style={{ width: "15%" }}>Responsável</th>
                      <th style={{ width: "10%" }}>Prazo</th>
                      <th style={{ width: "15%" }}>Período</th>
                      <th style={{ width: "15%" }}>Progresso</th>
                      <th style={{ width: "10%" }}>Status</th>
                      <th style={{ width: "5%" }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((item, index) => (
                      <tr key={index} className={item.atrasado ? "table-danger" : ""}>
                        <td>{item.id}</td>
                        <td>{item.etapa}</td>
                        <td>{item.responsavel}</td>
                        <td>{item.prazo} dias</td>
                        <td>
                          <small className="d-block">{item.inicio}</small>
                          <small className="d-block">{item.fim}</small>
                        </td>
                        <td>
                          <ProgressBar
                            now={item.progresso}
                            variant={getStatusClass(item.status, item.atrasado)}
                            style={{ height: "8px" }}
                          />
                          <small className="text-muted">{item.progresso}%</small>
                        </td>
                        <td>
                          <Badge bg={getStatusClass(item.status, item.atrasado)}>
                            {item.atrasado && item.status !== "Concluído" ? "Atrasado" : item.status}
                          </Badge>
                        </td>
                        <td>
                          <Button variant="link" className="p-0" onClick={() => verDetalhes(item)}>
                            Detalhes
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      {/* Modal de detalhes da tarefa */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Detalhes da Etapa</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {tarefaSelecionada && (
            <>
              <h5>{tarefaSelecionada.etapa}</h5>
              <div className="row mt-3">
                <div className="col-md-6 mb-3">
                  <div className="border rounded p-3">
                    <small className="text-muted d-block">Responsável</small>
                    <h6 className="mb-0">{tarefaSelecionada.responsavel}</h6>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="border rounded p-3">
                    <small className="text-muted d-block">Status</small>
                    <Badge bg={getStatusClass(tarefaSelecionada.status, tarefaSelecionada.atrasado)}>
                      {tarefaSelecionada.atrasado && tarefaSelecionada.status !== "Concluído"
                        ? "Atrasado"
                        : tarefaSelecionada.status}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <div className="border rounded p-3">
                    <small className="text-muted d-block">Data de Início</small>
                    <h6 className="mb-0">{tarefaSelecionada.inicio}</h6>
                  </div>
                </div>
                <div className="col-md-6 mb-3">
                  <div className="border rounded p-3">
                    <small className="text-muted d-block">Data de Término</small>
                    <h6 className="mb-0">{tarefaSelecionada.fim}</h6>
                  </div>
                </div>
              </div>

              <div className="mt-3">
                <h6 className="mb-3">Progresso</h6>
                <ProgressBar
                  now={tarefaSelecionada.progresso}
                  variant={getStatusClass(tarefaSelecionada.status, tarefaSelecionada.atrasado)}
                  style={{ height: "10px" }}
                  className="mb-2"
                />
                <small className="text-muted">{tarefaSelecionada.progresso}% concluído</small>
              </div>

              {tarefaSelecionada.atrasado && tarefaSelecionada.status !== "Concluído" && (
                <div className="alert alert-danger mt-3">
                  <AlertCircle size={16} className="me-2" />
                  Esta etapa está atrasada. A data de término prevista já passou.
                </div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default Cronograma