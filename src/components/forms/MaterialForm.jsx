"use client"

import { useState } from "react"
import { Card, Form, Button, Alert } from "react-bootstrap"
import { Plus } from "lucide-react"
import ApiBase from "../../services/ApiBase"

const MaterialForm = ({ obraSelecionada, onItemAdded }) => {
  const [currentItem, setCurrentItem] = useState({
    nrNota: "",
    descricao: "",
    data: new Date().toISOString().split("T")[0],
    localCompra: "",
    valor: "",
    solicitante: "",
    formaPagamento: "pix",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [alert, setAlert] = useState({ show: false, message: "", variant: "" })

  const showAlert = (message, variant = "danger") => {
    setAlert({ show: true, message, variant })
    setTimeout(() => setAlert({ show: false, message: "", variant: "" }), 5000)
  }

  const addItem = async () => {
    if (!obraSelecionada) {
      showAlert("Selecione uma obra primeiro para adicionar materiais.")
      return
    }

    if (!currentItem.nrNota || !currentItem.descricao || !currentItem.valor || !currentItem.data) {
      showAlert("Preencha todos os campos obrigatórios: Número da Nota, Descrição, Valor e Data.")
      return
    }

    setIsLoading(true)
    try {
      const gastoData = {
        nrNota: currentItem.nrNota,
        descricao: currentItem.descricao,
        data: new Date(currentItem.data),
        localCompra: currentItem.localCompra || "",
        valor: Number.parseFloat(currentItem.valor) || 0,
        solicitante: currentItem.solicitante || "",
        formaPagamento: currentItem.formaPagamento,
      }

      const response = await ApiBase.post(`/pagamentos/${obraSelecionada}/gastos`, gastoData)

      if (!response.data.error) {
        showAlert("Material adicionado com sucesso!", "success")
        setCurrentItem({
          nrNota: "",
          descricao: "",
          data: new Date().toISOString().split("T")[0],
          localCompra: "",
          valor: "",
          solicitante: "",
          formaPagamento: "pix",
        })
        onItemAdded?.()
      } else {
        showAlert("Erro ao adicionar material: " + response.data.message)
      }
    } catch (error) {
      showAlert("Erro ao adicionar material: " + error.message)
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
            Adicionar Material/Equipamento
          </Card.Title>
          <small className="text-muted">Preencha os dados do material ou equipamento adquirido</small>
        </Card.Header>
        <Card.Body>
          <Form>
            <div className="row mb-3">
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Número da Nota *</Form.Label>
                  <Form.Control
                    type="text"
                    value={currentItem.nrNota}
                    onChange={(e) => setCurrentItem({ ...currentItem, nrNota: e.target.value })}
                    placeholder="Ex: 12345"
                  />
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Descrição *</Form.Label>
                  <Form.Control
                    type="text"
                    value={currentItem.descricao}
                    onChange={(e) => setCurrentItem({ ...currentItem, descricao: e.target.value })}
                    placeholder="Nome do item"
                  />
                </Form.Group>
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Local de Compra</Form.Label>
                  <Form.Control
                    type="text"
                    value={currentItem.localCompra}
                    onChange={(e) => setCurrentItem({ ...currentItem, localCompra: e.target.value })}
                    placeholder="Nome da loja/fornecedor"
                  />
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Valor *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    value={currentItem.valor}
                    onChange={(e) => setCurrentItem({ ...currentItem, valor: e.target.value })}
                    placeholder="0,00"
                  />
                </Form.Group>
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Solicitante</Form.Label>
                  <Form.Control
                    type="text"
                    value={currentItem.solicitante}
                    onChange={(e) => setCurrentItem({ ...currentItem, solicitante: e.target.value })}
                    placeholder="Nome do solicitante"
                  />
                </Form.Group>
              </div>

              <div className="col-md-6">
                <Form.Group>
                  <Form.Label>Forma de Pagamento</Form.Label>
                  <Form.Select
                    value={currentItem.formaPagamento}
                    onChange={(e) => setCurrentItem({ ...currentItem, formaPagamento: e.target.value })}
                  >
                    <option value="pix">PIX</option>
                    <option value="transferencia">Transferência</option>
                    <option value="avista">À Vista</option>
                    <option value="cartao">Cartão</option>
                    <option value="boleto">Boleto</option>
                    <option value="outro">Outro</option>
                  </Form.Select>
                </Form.Group>
              </div>
            </div>

            <div className="mb-3">
              <Form.Group>
                <Form.Label>Data da Compra *</Form.Label>
                <Form.Control
                  type="date"
                  value={currentItem.data}
                  onChange={(e) => setCurrentItem({ ...currentItem, data: e.target.value })}
                />
              </Form.Group>
            </div>

            <Button
              variant="primary"
              onClick={addItem}
              disabled={isLoading}
              className="w-100 d-flex align-items-center justify-content-center"
            >
              <Plus size={16} className="me-2" />
              {isLoading ? "Adicionando..." : "Adicionar Item"}
            </Button>
          </Form>
        </Card.Body>
      </Card>
    </div>
  )
}

export default MaterialForm
