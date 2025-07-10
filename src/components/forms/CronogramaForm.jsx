"use client"

import { useState } from "react"
import { Card, Form, Button, Alert } from "react-bootstrap"
import { Plus } from "lucide-react"
import ApiBase from "../../services/ApiBase"

const CronogramaForm = ({ obraSelecionada, onItemAdded }) => {
  const [currentEtapa, setCurrentEtapa] = useState({
    etapa: "",
    responsavel: "",
    prazoEmDias: "",
    dataInicio: new Date().toISOString().split("T")[0],
    dataFim: new Date().toISOString().split("T")[0],
    status: "previsto",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [alert, setAlert] = useState({ show: false, message: "", variant: "" })

  const showAlert = (message, variant = "danger") => {
    setAlert({ show: true, message, variant })
    setTimeout(() => setAlert({ show: false, message: "", variant: "" }), 5000)
  }

  const addEtapa = async () => {
    if (!obraSelecionada) {
      showAlert("Selecione uma obra primeiro para adicionar etapas do cronograma.")
      return
    }

    if (
      !currentEtapa.etapa ||
      !currentEtapa.responsavel ||
      !currentEtapa.prazoEmDias ||
      !currentEtapa.dataInicio ||
      !currentEtapa.dataFim
    ) {
      showAlert("Preencha todos os campos obrigatórios.")
      return
    }

    setIsLoading(true)
    try {
      const etapaData = {
        etapa: currentEtapa.etapa,
        responsavel: currentEtapa.responsavel,
        prazoEmDias: Number.parseInt(currentEtapa.prazoEmDias) || 0,
        dataInicio: new Date(currentEtapa.dataInicio),
        dataFim: new Date(currentEtapa.dataFim),
        status: currentEtapa.status,
      }

      const response = await ApiBase.post(`/pagamentos/${obraSelecionada}/cronograma`, etapaData)

      if (!response.data.error) {
        showAlert("Etapa adicionada com sucesso!", "success")
        setCurrentEtapa({
          etapa: "",
          responsavel: "",
          prazoEmDias: "",
          dataInicio: new Date().toISOString().split("T")[0],
          dataFim: new Date().toISOString().split("T")[0],
          status: "previsto",
        })
        onItemAdded?.()
      } else {
        showAlert("Erro ao adicionar etapa: " + response.data.message)
      }
    } catch (error) {
      showAlert("Erro ao adicionar etapa: " + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {alert.show && (
        <Alert variant={alert.variant} dismissible onClose={() => setAlert({ show: false, message: "", variant: "" })}>
          {alert.message}
        </Alert>
      )}

      <Card>
        <Card.Header>
          <Card.Title className="d-flex align-items-center">
            <Plus className="me-2" size={20} />
            Adicionar Etapa do Cronograma
          </Card.Title>
          <small className="text-muted">Registre etapas do cronograma do projeto</small>
        </Card.Header>
        <Card.Body>
          <Form>
            <div className="row mb-3">
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Nome da Etapa *</Form.Label>
                  <Form.Control
                    type="text"
                    value={currentEtapa.etapa}
                    onChange={(e) => setCurrentEtapa({ ...currentEtapa, etapa: e.target.value })}
                    placeholder="Ex: Fundação, Estrutura"
                  />
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Responsável *</Form.Label>
                  <Form.Control
                    type="text"
                    value={currentEtapa.responsavel}
                    onChange={(e) => setCurrentEtapa({ ...currentEtapa, responsavel: e.target.value })}
                    placeholder="Nome do responsável"
                  />
                </Form.Group>
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-4">
                <Form.Group>
                  <Form.Label>Prazo em Dias *</Form.Label>
                  <Form.Control
                    type="number"
                    value={currentEtapa.prazoEmDias}
                    onChange={(e) => setCurrentEtapa({ ...currentEtapa, prazoEmDias: e.target.value })}
                    placeholder="Ex: 30"
                    min="1"
                  />
                </Form.Group>
              </div>

              <div className="col-md-4">
                <Form.Group>
                  <Form.Label>Data de Início *</Form.Label>
                  <Form.Control
                    type="date"
                    value={currentEtapa.dataInicio}
                    onChange={(e) => setCurrentEtapa({ ...currentEtapa, dataInicio: e.target.value })}
                  />
                </Form.Group>
              </div>

              <div className="col-md-4">
                <Form.Group>
                  <Form.Label>Data de Fim *</Form.Label>
                  <Form.Control
                    type="date"
                    value={currentEtapa.dataFim}
                    onChange={(e) => setCurrentEtapa({ ...currentEtapa, dataFim: e.target.value })}
                  />
                </Form.Group>
              </div>
            </div>

            <div className="mb-3">
              <Form.Group>
                <Form.Label>Status *</Form.Label>
                <Form.Select
                  value={currentEtapa.status}
                  onChange={(e) => setCurrentEtapa({ ...currentEtapa, status: e.target.value })}
                >
                  <option value="previsto">Previsto</option>
                  <option value="em andamento">Em Andamento</option>
                  <option value="concluida">Concluída</option>
                </Form.Select>
              </Form.Group>
            </div>

            <Button
              variant="primary"
              onClick={addEtapa}
              disabled={isLoading}
              className="w-100 d-flex align-items-center justify-content-center"
            >
              <Plus size={16} className="me-2" />
              {isLoading ? "Adicionando..." : "Adicionar Etapa"}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </div>
  )
}

export default CronogramaForm
