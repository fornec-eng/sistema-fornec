"use client"

import { useState, useEffect } from "react"
import { Form, Button, Alert, Row, Col, Card } from "react-bootstrap"
import { Save, X } from "lucide-react"
import apiService from "../../services/apiService"

function MaterialForm({ onSubmit, onCancel, initialData = null, obraId = null }) {
  const [formData, setFormData] = useState({
    numeroNota: "",
    data: "",
    localCompra: "",
    valor: "",
    solicitante: "",
    formaPagamento: "",
    chavePixBoleto: "",
    descricao: "",
    observacoes: "",
    obraId: obraId || "",
    criarPagamentoInicial: false,
    valorPagamento: "",
    tipoPagamento: "",
    dataPagamento: "",
    statusPagamento: "pendente",
    observacoesPagamento: "",
  })

  const [obras, setObras] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchObras()
    if (initialData) {
      setFormData({
        ...initialData,
        data: initialData.data ? new Date(initialData.data).toISOString().split("T")[0] : "",
        obraId: initialData.obraId || obraId || "",
        criarPagamentoInicial: false,
        valorPagamento: "",
        tipoPagamento: "",
        dataPagamento: "",
        statusPagamento: "pendente",
        observacoesPagamento: "",
      })
    } else if (obraId) {
      setFormData((prev) => ({
        ...prev,
        obraId: obraId,
      }))
    }
  }, [initialData, obraId])

  const fetchObras = async () => {
    try {
      const response = await apiService.obras.getAll()
      if (!response.error) {
        setObras(response.obras || [])
      }
    } catch (error) {
      console.error("Erro ao buscar obras:", error)
    }
  }

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError("")

    // Validações básicas
    if (!formData.numeroNota.trim()) {
      setError("Número da nota é obrigatório")
      setLoading(false)
      return
    }

    if (!formData.data) {
      setError("Data é obrigatória")
      setLoading(false)
      return
    }

    if (!formData.localCompra.trim()) {
      setError("Local da compra é obrigatório")
      setLoading(false)
      return
    }

    if (!formData.valor || Number.parseFloat(formData.valor) <= 0) {
      setError("Valor deve ser maior que zero")
      setLoading(false)
      return
    }

    if (!formData.solicitante.trim()) {
      setError("Solicitante é obrigatório")
      setLoading(false)
      return
    }

    if (!formData.formaPagamento) {
      setError("Forma de pagamento é obrigatória")
      setLoading(false)
      return
    }

    if (formData.criarPagamentoInicial) {
      if (!formData.valorPagamento || Number.parseFloat(formData.valorPagamento) <= 0) {
        setError("Valor do pagamento deve ser maior que zero")
        setLoading(false)
        return
      }

      if (!formData.tipoPagamento) {
        setError("Tipo de pagamento é obrigatório")
        setLoading(false)
        return
      }

      if (!formData.dataPagamento) {
        setError("Data do pagamento é obrigatória")
        setLoading(false)
        return
      }
    }

    try {
      const dataToSubmit = {
        numeroNota: formData.numeroNota,
        data: formData.data,
        localCompra: formData.localCompra,
        valor: Number.parseFloat(formData.valor),
        solicitante: formData.solicitante,
        formaPagamento: formData.formaPagamento,
        chavePixBoleto: formData.chavePixBoleto,
        descricao: formData.descricao,
        observacoes: formData.observacoes,
        obraId: formData.obraId || null,
      }

      if (formData.criarPagamentoInicial && !initialData) {
        dataToSubmit.pagamentoInicial = {
          valor: Number.parseFloat(formData.valorPagamento),
          tipoPagamento: formData.tipoPagamento,
          dataPagamento: formData.dataPagamento,
          statusPagamento: formData.statusPagamento,
          observacoes: formData.observacoesPagamento,
        }
      }

      console.log("[v0] Data to submit:", dataToSubmit)

      await onSubmit(dataToSubmit)
    } catch (error) {
      console.error("Erro ao salvar material:", error)
      setError("Erro ao salvar material. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      numeroNota: "",
      data: "",
      localCompra: "",
      valor: "",
      solicitante: "",
      formaPagamento: "",
      chavePixBoleto: "",
      descricao: "",
      observacoes: "",
      obraId: obraId || "",
      criarPagamentoInicial: false,
      valorPagamento: "",
      tipoPagamento: "",
      dataPagamento: "",
      statusPagamento: "pendente",
      observacoesPagamento: "",
    })
    setError("")

    if (onCancel) {
      onCancel()
    }
  }

  return (
    <>
      {error && (
        <Alert variant="danger" className="mb-3">
          {error}
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Número da Nota *</Form.Label>
              <Form.Control
                type="text"
                name="numeroNota"
                value={formData.numeroNota}
                onChange={handleChange}
                placeholder="Ex: NF-001234"
                required
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Data *</Form.Label>
              <Form.Control type="date" name="data" value={formData.data} onChange={handleChange} required />
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Local da Compra *</Form.Label>
              <Form.Control
                type="text"
                name="localCompra"
                value={formData.localCompra}
                onChange={handleChange}
                placeholder="Ex: Loja de Materiais ABC"
                required
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Valor *</Form.Label>
              <Form.Control
                type="number"
                name="valor"
                value={formData.valor}
                onChange={handleChange}
                placeholder="0.00"
                step="0.01"
                min="0"
                required
              />
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Solicitante *</Form.Label>
              <Form.Control
                type="text"
                name="solicitante"
                value={formData.solicitante}
                onChange={handleChange}
                placeholder="Nome do solicitante"
                required
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Forma de Pagamento *</Form.Label>
              <Form.Select name="formaPagamento" value={formData.formaPagamento} onChange={handleChange} required>
                <option value="">Selecione a forma de pagamento</option>
                <option value="pix">PIX</option>
                <option value="transferencia">Transferência</option>
                <option value="avista">À Vista</option>
                <option value="cartao">Cartão</option>
                <option value="boleto">Boleto</option>
                <option value="cheque">Cheque</option>
                <option value="outro">Outro</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Chave PIX/Boleto</Form.Label>
              <Form.Control
                type="text"
                name="chavePixBoleto"
                value={formData.chavePixBoleto}
                onChange={handleChange}
                placeholder="Chave PIX ou código do boleto"
              />
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Obra</Form.Label>
              <Form.Select name="obraId" value={formData.obraId} onChange={handleChange}>
                <option value="">Selecione uma obra (opcional)</option>
                {obras.map((obra) => (
                  <option key={obra._id} value={obra._id}>
                    {obra.nome}
                  </option>
                ))}
              </Form.Select>
              {obraId && <Form.Text className="text-muted">Obra pré-selecionada do dashboard atual</Form.Text>}
            </Form.Group>
          </Col>
        </Row>

        <Form.Group className="mb-3">
          <Form.Label>Descrição</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            name="descricao"
            value={formData.descricao}
            onChange={handleChange}
            placeholder="Descrição dos materiais comprados"
          />
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Observações</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            name="observacoes"
            value={formData.observacoes}
            onChange={handleChange}
            placeholder="Observações adicionais"
          />
        </Form.Group>

        {!initialData && (
          <Card className="mb-3">
            <Card.Header>
              <Form.Check
                type="checkbox"
                name="criarPagamentoInicial"
                checked={formData.criarPagamentoInicial}
                onChange={handleChange}
                label="Criar pagamento inicial junto com o material"
              />
            </Card.Header>
            {formData.criarPagamentoInicial && (
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Valor do Pagamento *</Form.Label>
                      <Form.Control
                        type="number"
                        name="valorPagamento"
                        value={formData.valorPagamento}
                        onChange={handleChange}
                        placeholder="0.00"
                        step="0.01"
                        min="0"
                        required={formData.criarPagamentoInicial}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Tipo de Pagamento *</Form.Label>
                      <Form.Select
                        name="tipoPagamento"
                        value={formData.tipoPagamento}
                        onChange={handleChange}
                        required={formData.criarPagamentoInicial}
                      >
                        <option value="">Selecione o tipo</option>
                        <option value="avista">À Vista</option>
                        <option value="parcelado">Parcelado</option>
                        <option value="mensal">Mensal</option>
                        <option value="por_etapa">Por Etapa</option>
                        <option value="pix">PIX</option>
                        <option value="transferencia">Transferência</option>
                        <option value="cartao">Cartão</option>
                        <option value="boleto">Boleto</option>
                        <option value="cheque">Cheque</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Data do Pagamento *</Form.Label>
                      <Form.Control
                        type="date"
                        name="dataPagamento"
                        value={formData.dataPagamento}
                        onChange={handleChange}
                        required={formData.criarPagamentoInicial}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Status do Pagamento</Form.Label>
                      <Form.Select name="statusPagamento" value={formData.statusPagamento} onChange={handleChange}>
                        <option value="pendente">Pendente</option>
                        <option value="efetuado">Efetuado</option>
                        <option value="em_processamento">Em Processamento</option>
                        <option value="cancelado">Cancelado</option>
                        <option value="atrasado">Atrasado</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>
                <Form.Group className="mb-3">
                  <Form.Label>Observações do Pagamento</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    name="observacoesPagamento"
                    value={formData.observacoesPagamento}
                    onChange={handleChange}
                    placeholder="Observações sobre o pagamento"
                  />
                </Form.Group>
              </Card.Body>
            )}
          </Card>
        )}

        <div className="d-flex gap-2 mt-4">
          <Button type="submit" variant="primary" disabled={loading} className="d-flex align-items-center">
            <Save size={16} className="me-2" />
            {loading ? "Salvando..." : initialData ? "Atualizar" : "Adicionar Material"}
          </Button>

          <Button
            type="button"
            variant="outline-secondary"
            onClick={handleCancel}
            disabled={loading}
            className="d-flex align-items-center"
          >
            <X size={16} className="me-2" />
            Cancelar
          </Button>
        </div>

        {initialData && (
          <Alert variant="info" className="mt-3">
            <strong>💡 Dica:</strong> Após salvar o material, você pode gerenciar os pagamentos usando o botão
            "Gerenciar Pagamentos" na lista de materiais.
          </Alert>
        )}
      </Form>
    </>
  )
}

export default MaterialForm
