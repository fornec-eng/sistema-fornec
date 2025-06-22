"use client"

import { useState } from "react"
import { Card, Form, Button, Alert } from "react-bootstrap"
import { Plus } from "lucide-react"
import ApiBase from "../../services/ApiBase"

const PagamentoSemanalForm = ({ obraSelecionada, onItemAdded }) => {
  const [currentPagamento, setCurrentPagamento] = useState({
    nome: "",
    funcao: "",
    dataInicio: new Date().toISOString().split("T")[0],
    dataFimContrato: new Date().toISOString().split("T")[0],
    tipoContratacao: "",
    valorPagar: "",
    chavePix: "",
    nomeChavePix: "",
    qualificacaoTecnica: "",
    valorVT: 0,
    valorVA: 0,
    status: "pagar",
    semana: 1,
    ano: new Date().getFullYear(),
  })
  const [isLoading, setIsLoading] = useState(false)
  const [alert, setAlert] = useState({ show: false, message: "", variant: "" })

  const showAlert = (message, variant = "danger") => {
    setAlert({ show: true, message, variant })
    setTimeout(() => setAlert({ show: false, message: "", variant: "" }), 5000)
  }

  const addPagamento = async () => {
    if (!obraSelecionada) {
      showAlert("Selecione uma obra primeiro para adicionar pagamentos semanais.")
      return
    }

    if (
      !currentPagamento.nome ||
      !currentPagamento.funcao ||
      !currentPagamento.valorPagar ||
      !currentPagamento.chavePix ||
      !currentPagamento.nomeChavePix ||
      !currentPagamento.qualificacaoTecnica ||
      !currentPagamento.tipoContratacao
    ) {
      showAlert("Preencha todos os campos obrigatórios.")
      return
    }

    setIsLoading(true)
    try {
      const valorVA = Number.parseFloat(currentPagamento.valorVA) || 0
      const valorVT = Number.parseFloat(currentPagamento.valorVT) || 0
      const valorPagar = Number.parseFloat(currentPagamento.valorPagar) || 0

      const pagamentoData = {
        nome: currentPagamento.nome,
        funcao: currentPagamento.funcao,
        dataInicio: new Date(currentPagamento.dataInicio),
        dataFimContrato: new Date(currentPagamento.dataFimContrato),
        tipoContratacao: currentPagamento.tipoContratacao,
        valorPagar: valorPagar,
        chavePix: currentPagamento.chavePix,
        nomeChavePix: currentPagamento.nomeChavePix,
        qualificacaoTecnica: currentPagamento.qualificacaoTecnica,
        valorVT: valorVT,
        valorVA: valorVA,
        valorVAVT: valorVA + valorVT,
        totalReceber: valorPagar + valorVA + valorVT,
        status: currentPagamento.status,
        semana: Number.parseInt(currentPagamento.semana),
        ano: Number.parseInt(currentPagamento.ano),
      }

      const response = await ApiBase.post(`/pagamentos/${obraSelecionada}/pagamentos-semanais`, pagamentoData)

      if (!response.data.error) {
        showAlert("Pagamento semanal adicionado com sucesso!", "success")
        setCurrentPagamento({
          nome: "",
          funcao: "",
          dataInicio: new Date().toISOString().split("T")[0],
          dataFimContrato: new Date().toISOString().split("T")[0],
          tipoContratacao: "",
          valorPagar: "",
          chavePix: "",
          nomeChavePix: "",
          qualificacaoTecnica: "",
          valorVT: 0,
          valorVA: 0,
          status: "pagar",
          semana: 1,
          ano: new Date().getFullYear(),
        })
        onItemAdded?.()
      } else {
        showAlert("Erro ao adicionar pagamento semanal: " + response.data.message)
      }
    } catch (error) {
      showAlert("Erro ao adicionar pagamento semanal: " + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const valorVAVT =
    (Number.parseFloat(currentPagamento.valorVA) || 0) + (Number.parseFloat(currentPagamento.valorVT) || 0)
  const totalReceber = (Number.parseFloat(currentPagamento.valorPagar) || 0) + valorVAVT

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
            Adicionar Pagamento Semanal
          </Card.Title>
          <small className="text-muted">Registre pagamentos semanais de funcionários</small>
        </Card.Header>
        <Card.Body>
          <Form>
            <div className="row mb-3">
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Nome *</Form.Label>
                  <Form.Control
                    type="text"
                    value={currentPagamento.nome}
                    onChange={(e) => setCurrentPagamento({ ...currentPagamento, nome: e.target.value })}
                    placeholder="Nome completo"
                  />
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Função *</Form.Label>
                  <Form.Control
                    type="text"
                    value={currentPagamento.funcao}
                    onChange={(e) => setCurrentPagamento({ ...currentPagamento, funcao: e.target.value })}
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
                    value={currentPagamento.dataInicio}
                    onChange={(e) => setCurrentPagamento({ ...currentPagamento, dataInicio: e.target.value })}
                  />
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Data Fim do Contrato *</Form.Label>
                  <Form.Control
                    type="date"
                    value={currentPagamento.dataFimContrato}
                    onChange={(e) => setCurrentPagamento({ ...currentPagamento, dataFimContrato: e.target.value })}
                  />
                </Form.Group>
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Tipo de Contratação *</Form.Label>
                  <Form.Control
                    type="text"
                    value={currentPagamento.tipoContratacao}
                    onChange={(e) => setCurrentPagamento({ ...currentPagamento, tipoContratacao: e.target.value })}
                    placeholder="Ex: CLT, Freelancer"
                  />
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Valor a Pagar *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={currentPagamento.valorPagar}
                    onChange={(e) => setCurrentPagamento({ ...currentPagamento, valorPagar: e.target.value })}
                    placeholder="0,00"
                  />
                </Form.Group>
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Chave PIX *</Form.Label>
                  <Form.Control
                    type="text"
                    value={currentPagamento.chavePix}
                    onChange={(e) => setCurrentPagamento({ ...currentPagamento, chavePix: e.target.value })}
                    placeholder="Chave PIX"
                  />
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Nome da Chave PIX *</Form.Label>
                  <Form.Control
                    type="text"
                    value={currentPagamento.nomeChavePix}
                    onChange={(e) => setCurrentPagamento({ ...currentPagamento, nomeChavePix: e.target.value })}
                    placeholder="Nome do titular"
                  />
                </Form.Group>
              </div>
            </div>

            <div className="mb-3">
              <Form.Group>
                <Form.Label>Qualificação Técnica *</Form.Label>
                <Form.Control
                  type="text"
                  value={currentPagamento.qualificacaoTecnica}
                  onChange={(e) => setCurrentPagamento({ ...currentPagamento, qualificacaoTecnica: e.target.value })}
                  placeholder="Qualificação técnica"
                />
              </Form.Group>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Valor VT</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={currentPagamento.valorVT}
                    onChange={(e) => setCurrentPagamento({ ...currentPagamento, valorVT: e.target.value })}
                    placeholder="0,00"
                  />
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Valor VA</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={currentPagamento.valorVA}
                    onChange={(e) => setCurrentPagamento({ ...currentPagamento, valorVA: e.target.value })}
                    placeholder="0,00"
                  />
                </Form.Group>
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-4">
                <Form.Group>
                  <Form.Label>Semana *</Form.Label>
                  <Form.Control
                    type="number"
                    value={currentPagamento.semana}
                    onChange={(e) => setCurrentPagamento({ ...currentPagamento, semana: e.target.value })}
                    min="1"
                    max="53"
                  />
                </Form.Group>
              </div>

              <div className="col-md-4">
                <Form.Group>
                  <Form.Label>Ano *</Form.Label>
                  <Form.Control
                    type="number"
                    value={currentPagamento.ano}
                    onChange={(e) => setCurrentPagamento({ ...currentPagamento, ano: e.target.value })}
                  />
                </Form.Group>
              </div>

              <div className="col-md-4">
                <Form.Group>
                  <Form.Label>Status *</Form.Label>
                  <Form.Select
                    value={currentPagamento.status}
                    onChange={(e) => setCurrentPagamento({ ...currentPagamento, status: e.target.value })}
                  >
                    <option value="pagar">A Pagar</option>
                    <option value="pagamento efetuado">Pagamento Efetuado</option>
                  </Form.Select>
                </Form.Group>
              </div>
            </div>

            <div className="p-3 bg-light rounded mb-3">
              <div className="row">
                <div className="col-md-6">
                  <strong>Valor VA + VT:</strong>
                  <span className="ms-2">R$ {valorVAVT.toFixed(2)}</span>
                </div>
                <div className="col-md-6">
                  <strong>Total a Receber:</strong>
                  <span className="ms-2">R$ {totalReceber.toFixed(2)}</span>
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              onClick={addPagamento}
              disabled={isLoading}
              className="w-100 d-flex align-items-center justify-content-center"
            >
              <Plus size={16} className="me-2" />
              {isLoading ? "Adicionando..." : "Adicionar Pagamento Semanal"}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </div>
  )
}

export default PagamentoSemanalForm
