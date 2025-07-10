"use client"

import { useState, useEffect } from "react"
import { Card, Table, Badge, ProgressBar, Button, Modal } from "react-bootstrap"
import { Calendar, CheckCircle, Clock, AlertCircle } from "lucide-react"
import GoogleSheetsService from "../services/GoogleSheetsService"

const Cronograma = ({ obra }) => {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [tarefaSelecionada, setTarefaSelecionada] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Obra recebida:", obra)
        const spreadsheetId = obra?.spreadsheetId || obra?.sheets_id
        console.log("SpreadsheetId encontrado:", spreadsheetId)
        
        if (!spreadsheetId) {
          console.log("Nenhum spreadsheetId encontrado na obra")
          setData([])
          setLoading(false)
          return
        }
        
        setLoading(true)
        const googleSheetsService = new GoogleSheetsService()
        const result = await googleSheetsService.buscarCronograma(spreadsheetId)
        
        console.log("Resultado do cronograma:", result)
        
        if (!result.values || result.values.length === 0) {
          console.log("Nenhum dado encontrado no cronograma")
          setData([])
          return
        }
        
        // Remove o cabeçalho (primeira linha)
        const processedData = result.values.slice(1)

        // Processar os dados para adicionar informações adicionais
        const dadosProcessados = processedData.map((row, index) => {
          // Calcular progresso com base no status
          let progresso = 0
          if (row[3] === "Concluído") {
            progresso = 100
          } else if (row[3] === "Em andamento") {
            // Calcular progresso com base nas datas
            const dataInicio = new Date(converterData(row[1]))
            const dataFim = new Date(converterData(row[2]))
            const hoje = new Date()

            if (hoje >= dataInicio && hoje <= dataFim) {
              const totalDias = Math.ceil((dataFim - dataInicio) / (1000 * 60 * 60 * 24))
              const diasPassados = Math.ceil((hoje - dataInicio) / (1000 * 60 * 60 * 24))
              progresso = Math.min(Math.round((diasPassados / totalDias) * 100), 99)
            } else if (hoje > dataFim) {
              progresso = 99
            }
          }

          return {
            id: index + 1,
            etapa: row[0] || '',
            dataInicio: row[1] || '',
            dataTermino: row[2] || '',
            status: row[3] || '',
            responsavel: row[4] || '',
            observacoes: row[5] || '',
            progresso: progresso,
            atrasado: row[3] !== "Concluído" && new Date() > new Date(converterData(row[2])),
          }
        })

        setData(dadosProcessados)
      } catch (error) {
        console.error("Erro ao buscar os dados:", error)
      } finally {
        setLoading(false)
      }
    }

    if (obra) {
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
          ) : !obra?.spreadsheetId && !obra?.sheets_id ? (
            <div className="text-center p-4">
              <p className="text-muted">Esta obra não possui uma planilha do Google Sheets vinculada.</p>
              <p className="text-muted">Para visualizar o cronograma, vincule uma planilha à obra.</p>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center p-4">
              <p className="text-muted">Nenhum item encontrado no cronograma.</p>
              <p className="text-muted">Adicione itens na aba "Cronograma" da planilha do Google Sheets.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <Table hover className="align-middle">
                <thead className="table-light">
                  <tr>
                    <th>Etapa</th>
                    <th>Data de Início</th>
                    <th>Data de Término</th>
                    <th>Status</th>
                    <th>Responsável</th>
                    <th>Observações</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((item, index) => (
                    <tr key={index}>
                      <td>{item.etapa}</td>
                      <td>{item.dataInicio}</td>
                      <td>{item.dataTermino}</td>
                      <td>
                        <Badge bg={getStatusClass(item.status, item.atrasado)}>
                          {item.status}
                        </Badge>
                      </td>
                      <td>{item.responsavel}</td>
                      <td>{item.observacoes}</td>
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

export default Cronograma