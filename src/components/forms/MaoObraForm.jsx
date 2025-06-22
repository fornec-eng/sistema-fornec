"use client"

import { useState } from "react"
import { Card, Form, Button, Alert } from "react-bootstrap"
import { Plus } from "lucide-react"
import ApiBase from "../../services/ApiBase"

const MaoObraForm = ({ obraSelecionada, onItemAdded }) => {
  const [currentFuncionario, setCurrentFuncionario] = useState({
    nome: "",
    funcao: "",
    dataInicio: new Date().toISOString().split("T")[0],
    dataFim: new Date().toISOString().split("T")[0],
    contaBancaria: "",
    valorTotal: "",
    numeroParcelas: 1,
    dataPagamento: new Date().toISOString().split("T")[0],
    statusPagamento: "previsto",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [alert, setAlert] = useState({ show: false, message: "", variant: "" })

  const showAlert = (message, variant = "danger") => {
    setAlert({ show: true, message, variant })
    setTimeout(() => setAlert({ show: false, message: "", variant: "" }), 5000)
  }

  const addFuncionario = async () => {
    if (!obraSelecionada) {
      showAlert("Selecione uma obra primeiro para adicionar contratos.")
      return
    }

    if (
      !currentFuncionario.nome ||
      !currentFuncionario.funcao ||
      !currentFuncionario.valorTotal ||
      !currentFuncionario.dataInicio ||
      !currentFuncionario.dataFim ||
      !currentFuncionario.contaBancaria ||
      !currentFuncionario.dataPagamento
    ) {
      showAlert("Preencha todos os campos obrigatórios.")
      return
    }

    setIsLoading(true)
    try {
      const contratoData = {
        nome: currentFuncionario.nome,
        funcao: currentFuncionario.funcao,
        dataInicio: new Date(currentFuncionario.dataInicio),
        dataFim: new Date(currentFuncionario.dataFim),
        contaBancaria: currentFuncionario.contaBancaria,
        valorTotal: Number.parseFloat(currentFuncionario.valorTotal) || 0,
        numeroParcelas: Number.parseInt(currentFuncionario.numeroParcelas) || 1,
        dataPagamento: new Date(currentFuncionario.dataPagamento),
        statusPagamento: currentFuncionario.statusPagamento,
      }

      const response = await ApiBase.post(`/pagamentos/${obraSelecionada}/contratos`, contratoData)

      if (!response.data.error) {
        showAlert("Contrato adicionado com sucesso!", "success")
        setCurrentFuncionario({
          nome: "",
          funcao: "",
          dataInicio: new Date().toISOString().split("T")[0],
          dataFim: new Date().toISOString().split("T")[0],
          contaBancaria: "",
          valorTotal: "",
          numeroParcelas: 1,
          dataPagamento: new Date().toISOString().split("T")[0],
          statusPagamento: "previsto",
        })
        onItemAdded?.()
      } else {
        showAlert("Erro ao adicionar contrato: " + response.data.message)
      }
    } catch (error) {
      showAlert("Erro ao adicionar contrato: " + error.message)
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
            Adicionar Funcionário/Contrato
          </Card.Title>
          <small className="text-muted">Registre informações de mão de obra e contratos</small>
        </Card.Header>
        <Card.Body>
          <Form>
            <div className="row mb-3">
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Nome *</Form.Label>
                  <Form.Control
                    type="text"
                    value={currentFuncionario.nome}
                    onChange={(e) => setCurrentFuncionario({ ...currentFuncionario, nome: e.target.value })}
                    placeholder="Nome completo"
                  />
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Função *</Form.Label>
                  <Form.Control
                    type="text"
                    value={currentFuncionario.funcao}
                    onChange={(e) => setCurrentFuncionario({ ...currentFuncionario, funcao: e.target.value })}
                    placeholder="Ex: Pedreiro, Eletricista"
                  />
                </Form.Group>
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Data de Início *</Form.Label>
                  <Form.Control
                    type="date"
                    value={currentFuncionario.dataInicio}
                    onChange={(e) => setCurrentFuncionario({ ...currentFuncionario, dataInicio: e.target.value })}
                  />
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Data de Fim do Contrato *</Form.Label>
                  <Form.Control
                    type="date"
                    value={currentFuncionario.dataFim}
                    onChange={(e) => setCurrentFuncionario({ ...currentFuncionario, dataFim: e.target.value })}
                  />
                </Form.Group>
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>PIX/Conta *</Form.Label>
                  <Form.Control
                    type="text"
                    value={currentFuncionario.contaBancaria}
                    onChange={(e) => setCurrentFuncionario({ ...currentFuncionario, contaBancaria: e.target.value })}
                    placeholder="Chave PIX ou dados da conta"
                  />
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Valor a Pagar *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={currentFuncionario.valorTotal}
                    onChange={(e) => setCurrentFuncionario({ ...currentFuncionario, valorTotal: e.target.value })}
                    placeholder="0,00"
                  />
                </Form.Group>
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-4">
                <Form.Group>
                  <Form.Label>Status *</Form.Label>
                  <Form.Select
                    value={currentFuncionario.statusPagamento}
                    onChange={(e) => setCurrentFuncionario({ ...currentFuncionario, statusPagamento: e.target.value })}
                  >
                    <option value="pago">Pago</option>
                    <option value="previsto">Previsto</option>
                    <option value="em atraso">Em Atraso</option>
                  </Form.Select>
                </Form.Group>
              </div>

              <div className="col-md-4">
                <Form.Group>
                  <Form.Label>Número de Parcelas</Form.Label>
                  <Form.Control
                    type="number"
                    value={currentFuncionario.numeroParcelas}
                    onChange={(e) => setCurrentFuncionario({ ...currentFuncionario, numeroParcelas: e.target.value })}
                    min="1"
                  />
                </Form.Group>
              </div>

              <div className="col-md-4">
                <Form.Group>
                  <Form.Label>Data de Pagamento *</Form.Label>
                  <Form.Control
                    type="date"
                    value={currentFuncionario.dataPagamento}
                    onChange={(e) => setCurrentFuncionario({ ...currentFuncionario, dataPagamento: e.target.value })}
                  />
                </Form.Group>
              </div>
            </div>

            <Button
              variant="primary"
              onClick={addFuncionario}
              disabled={isLoading}
              className="w-100 d-flex align-items-center justify-content-center"
            >
              <Plus size={16} className="me-2" />
              {isLoading ? "Adicionando..." : "Adicionar Funcionário"}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </div>
  )
}

export default MaoObraForm
