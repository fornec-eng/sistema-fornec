"use client"

import { useState, useEffect } from "react"
import { Form, Button, Alert, Row, Col, Card, Badge } from "react-bootstrap"
import { Save, X, Calendar, DollarSign } from "lucide-react"
import apiService from "../../services/apiService"

function OutroGastoForm({ onSubmit, onCancel, initialData = null }) {
  const [formData, setFormData] = useState({
    descricao: "",
    valor: "",
    data: "",
    categoriaLivre: "",
    formaPagamento: "pix",
    numeroDocumento: "",
    fornecedor: "",
    observacoes: "",
    obraId: "",
    // Campos de parcelamento
    tipoParcelamento: "avista", // avista, parcelado, recorrente
    numeroParcelas: "",
    intervaloRecorrencia: "mensal", // dias, mensal
    valorIntervalo: "", // número de dias
    diaVencimento: "", // dia do vencimento (1-31)
    dataPrimeiraParcela: "",
  })

  const [parcelasGeradas, setParcelasGeradas] = useState([])
  const [obras, setObras] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    fetchObras()
    if (initialData) {
      setFormData({
        ...initialData,
        data: initialData.data ? new Date(initialData.data).toISOString().split("T")[0] : "",
        tipoParcelamento: "avista",
        numeroParcelas: "",
        intervaloRecorrencia: "mensal",
        valorIntervalo: "",
        diaVencimento: "",
        dataPrimeiraParcela: "",
      })
    }
  }, [initialData])

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

    // Limpar parcelas geradas quando mudar configuração
    if (["tipoParcelamento", "numeroParcelas", "intervaloRecorrencia", "valorIntervalo", "diaVencimento", "dataPrimeiraParcela", "valor"].includes(name)) {
      setParcelasGeradas([])
    }
  }

  const gerarParcelas = () => {
    if (!formData.valor || parseFloat(formData.valor) <= 0) {
      setError("Defina um valor válido antes de gerar parcelas")
      return
    }

    const valorTotal = parseFloat(formData.valor)
    const parcelas = []

    if (formData.tipoParcelamento === "avista") {
      parcelas.push({
        valor: valorTotal,
        tipoPagamento: "avista",
        dataPagamento: formData.dataPrimeiraParcela || formData.data || new Date().toISOString().split("T")[0],
        statusPagamento: "pendente",
        observacoes: "Pagamento à vista"
      })
    } else if (formData.tipoParcelamento === "parcelado") {
      if (!formData.numeroParcelas || parseInt(formData.numeroParcelas) <= 0) {
        setError("Defina o número de parcelas")
        return
      }

      const numParcelas = parseInt(formData.numeroParcelas)
      const valorParcela = valorTotal / numParcelas
      let dataBase = formData.dataPrimeiraParcela ? new Date(formData.dataPrimeiraParcela) : new Date()

      for (let i = 1; i <= numParcelas; i++) {
        const dataParcela = new Date(dataBase)

        if (formData.intervaloRecorrencia === "mensal") {
          dataParcela.setMonth(dataBase.getMonth() + (i - 1))
        } else if (formData.intervaloRecorrencia === "dias") {
          const dias = parseInt(formData.valorIntervalo) || 30
          dataParcela.setDate(dataBase.getDate() + (dias * (i - 1)))
        }

        if (formData.diaVencimento) {
          const dia = parseInt(formData.diaVencimento)
          if (dia >= 1 && dia <= 31) {
            dataParcela.setDate(dia)
          }
        }

        parcelas.push({
          valor: parseFloat(valorParcela.toFixed(2)),
          tipoPagamento: "parcelado",
          dataPagamento: dataParcela.toISOString().split("T")[0],
          statusPagamento: "pendente",
          observacoes: `Parcela ${i}/${numParcelas}`
        })
      }
    } else if (formData.tipoParcelamento === "recorrente") {
      if (!formData.numeroParcelas || parseInt(formData.numeroParcelas) <= 0) {
        setError("Defina o número de parcelas para pagamento recorrente")
        return
      }

      const numParcelas = parseInt(formData.numeroParcelas)
      const valorParcela = valorTotal / numParcelas
      let dataBase = formData.dataPrimeiraParcela ? new Date(formData.dataPrimeiraParcela) : new Date()

      for (let i = 1; i <= numParcelas; i++) {
        const dataParcela = new Date(dataBase)

        if (formData.intervaloRecorrencia === "mensal") {
          dataParcela.setMonth(dataBase.getMonth() + (i - 1))
        } else if (formData.intervaloRecorrencia === "dias") {
          const dias = parseInt(formData.valorIntervalo) || 30
          dataParcela.setDate(dataBase.getDate() + (dias * (i - 1)))
        }

        if (formData.diaVencimento) {
          const dia = parseInt(formData.diaVencimento)
          if (dia >= 1 && dia <= 31) {
            dataParcela.setDate(dia)
          }
        }

        parcelas.push({
          valor: parseFloat(valorParcela.toFixed(2)),
          tipoPagamento: "mensal",
          dataPagamento: dataParcela.toISOString().split("T")[0],
          statusPagamento: "pendente",
          observacoes: `Parcela recorrente ${i}/${numParcelas}`
        })
      }
    }

    setParcelasGeradas(parcelas)
    setError("")
  }

  const handleParcelaChange = (index, field, value) => {
    const novasParcelas = [...parcelasGeradas]
    novasParcelas[index][field] = value
    setParcelasGeradas(novasParcelas)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError("")

    // Validações básicas
    if (!formData.descricao.trim()) {
      setError("Descrição é obrigatória")
      setLoading(false)
      return
    }

    if (!formData.valor || Number.parseFloat(formData.valor) <= 0) {
      setError("Valor deve ser maior que zero")
      setLoading(false)
      return
    }

    if (!formData.data) {
      setError("Data é obrigatória")
      setLoading(false)
      return
    }

    if (!formData.categoriaLivre.trim()) {
      setError("Categoria é obrigatória")
      setLoading(false)
      return
    }

    // Validar que parcelas foram geradas se não for à vista
    if (formData.tipoParcelamento !== "avista" && parcelasGeradas.length === 0) {
      setError("Gere as parcelas antes de salvar ou mude para 'À Vista'")
      setLoading(false)
      return
    }

    try {
      const dataToSubmit = {
        descricao: formData.descricao,
        valor: Number.parseFloat(formData.valor),
        data: formData.data,
        categoriaLivre: formData.categoriaLivre,
        formaPagamento: formData.formaPagamento,
        numeroDocumento: formData.numeroDocumento,
        fornecedor: formData.fornecedor,
        observacoes: formData.observacoes,
        obraId: formData.obraId || undefined,
        pagamentos: parcelasGeradas.length > 0 ? parcelasGeradas : undefined,
      }

      await onSubmit(dataToSubmit)
    } catch (error) {
      console.error("Erro ao salvar gasto:", error)
      setError("Erro ao salvar gasto. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setFormData({
      descricao: "",
      valor: "",
      data: "",
      categoriaLivre: "",
      formaPagamento: "pix",
      numeroDocumento: "",
      fornecedor: "",
      observacoes: "",
      obraId: "",
      tipoParcelamento: "avista",
      numeroParcelas: "",
      intervaloRecorrencia: "mensal",
      valorIntervalo: "",
      diaVencimento: "",
      dataPrimeiraParcela: "",
    })
    setParcelasGeradas([])
    setError("")

    if (onCancel) {
      onCancel()
    }
  }

  const formatCurrency = (value) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0)

  return (
    <>
      {error && (
        <Alert variant="danger" className="mb-3">
          {error}
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Descrição *</Form.Label>
          <Form.Control
            type="text"
            name="descricao"
            value={formData.descricao}
            onChange={handleChange}
            placeholder="Ex: Taxa de licenciamento, Alimentação da equipe"
            required
          />
        </Form.Group>

        <Row>
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Valor Total *</Form.Label>
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
          <Col md={6}>
            <Form.Group className="mb-3">
              <Form.Label>Data *</Form.Label>
              <Form.Control type="date" name="data" value={formData.data} onChange={handleChange} required />
            </Form.Group>
          </Col>
        </Row>

        <Row>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Categoria *</Form.Label>
              <Form.Control
                type="text"
                name="categoriaLivre"
                value={formData.categoriaLivre}
                onChange={handleChange}
                placeholder="Ex: Alimentação, Transporte, Taxas"
                required
              />
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Forma de Pagamento *</Form.Label>
              <Form.Select name="formaPagamento" value={formData.formaPagamento} onChange={handleChange} required>
                <option value="pix">PIX</option>
                <option value="transferencia">Transferência</option>
                <option value="avista">À Vista</option>
                <option value="cartao">Cartão</option>
                <option value="boleto">Boleto</option>
                <option value="cheque">Cheque</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="outro">Outro</option>
              </Form.Select>
            </Form.Group>
          </Col>
          <Col md={4}>
            <Form.Group className="mb-3">
              <Form.Label>Número do Documento</Form.Label>
              <Form.Control
                type="text"
                name="numeroDocumento"
                value={formData.numeroDocumento}
                onChange={handleChange}
                placeholder="Número da nota, recibo, etc."
              />
            </Form.Group>
          </Col>
        </Row>

        <Form.Group className="mb-3">
          <Form.Label>Fornecedor</Form.Label>
          <Form.Control
            type="text"
            name="fornecedor"
            value={formData.fornecedor}
            onChange={handleChange}
            placeholder="Nome do fornecedor"
          />
        </Form.Group>

        {/* SEÇÃO DE PARCELAMENTO */}
        <Card className="mb-3 border-primary">
          <Card.Header className="bg-primary text-white">
            <DollarSign size={18} className="me-2" />
            Configuração de Pagamento e Parcelamento
          </Card.Header>
          <Card.Body>
            <Form.Group className="mb-3">
              <Form.Label>Tipo de Pagamento *</Form.Label>
              <Form.Select name="tipoParcelamento" value={formData.tipoParcelamento} onChange={handleChange} required>
                <option value="avista">À Vista (pagamento único)</option>
                <option value="parcelado">Parcelado (dividir em X vezes)</option>
                <option value="recorrente">Recorrente (pagamentos mensais/periódicos)</option>
              </Form.Select>
            </Form.Group>

            {formData.tipoParcelamento !== "avista" && (
              <>
                <Row>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Número de Parcelas *</Form.Label>
                      <Form.Control
                        type="number"
                        name="numeroParcelas"
                        value={formData.numeroParcelas}
                        onChange={handleChange}
                        placeholder="Ex: 12"
                        min="1"
                        required
                      />
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Data da 1ª Parcela</Form.Label>
                      <Form.Control
                        type="date"
                        name="dataPrimeiraParcela"
                        value={formData.dataPrimeiraParcela}
                        onChange={handleChange}
                      />
                      <Form.Text className="text-muted">
                        Deixe vazio para usar a data de hoje
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Dia de Vencimento</Form.Label>
                      <Form.Control
                        type="number"
                        name="diaVencimento"
                        value={formData.diaVencimento}
                        onChange={handleChange}
                        placeholder="1-31"
                        min="1"
                        max="31"
                      />
                      <Form.Text className="text-muted">
                        Dia fixo do mês (opcional)
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Intervalo entre Parcelas *</Form.Label>
                      <Form.Select name="intervaloRecorrencia" value={formData.intervaloRecorrencia} onChange={handleChange}>
                        <option value="mensal">Mensal (a cada mês)</option>
                        <option value="dias">A cada X dias</option>
                      </Form.Select>
                    </Form.Group>
                  </Col>
                  {formData.intervaloRecorrencia === "dias" && (
                    <Col md={6}>
                      <Form.Group className="mb-3">
                        <Form.Label>Quantidade de Dias *</Form.Label>
                        <Form.Control
                          type="number"
                          name="valorIntervalo"
                          value={formData.valorIntervalo}
                          onChange={handleChange}
                          placeholder="Ex: 15 (quinzenal), 30"
                          min="1"
                        />
                      </Form.Group>
                    </Col>
                  )}
                </Row>

                <Button variant="success" onClick={gerarParcelas} className="mb-3">
                  <Calendar size={16} className="me-2" />
                  Gerar Prévia das Parcelas
                </Button>
              </>
            )}

            {/* PRÉVIA DAS PARCELAS */}
            {parcelasGeradas.length > 0 && (
              <Card className="mt-3">
                <Card.Header>
                  <strong>Prévia das Parcelas</strong>
                  <Badge bg="info" className="ms-2">{parcelasGeradas.length} parcela(s)</Badge>
                </Card.Header>
                <Card.Body style={{ maxHeight: "300px", overflowY: "auto" }}>
                  {parcelasGeradas.map((parcela, index) => (
                    <Card key={index} className="mb-2 border-secondary">
                      <Card.Body className="p-2">
                        <Row>
                          <Col md={1}>
                            <strong>#{index + 1}</strong>
                          </Col>
                          <Col md={3}>
                            <Form.Control
                              type="number"
                              step="0.01"
                              value={parcela.valor}
                              onChange={(e) => handleParcelaChange(index, "valor", parseFloat(e.target.value))}
                              size="sm"
                            />
                            <Form.Text>Valor</Form.Text>
                          </Col>
                          <Col md={3}>
                            <Form.Control
                              type="date"
                              value={parcela.dataPagamento}
                              onChange={(e) => handleParcelaChange(index, "dataPagamento", e.target.value)}
                              size="sm"
                            />
                            <Form.Text>Data</Form.Text>
                          </Col>
                          <Col md={5}>
                            <Form.Control
                              type="text"
                              value={parcela.observacoes}
                              onChange={(e) => handleParcelaChange(index, "observacoes", e.target.value)}
                              size="sm"
                              placeholder="Observação"
                            />
                            <Form.Text>Observação</Form.Text>
                          </Col>
                        </Row>
                      </Card.Body>
                    </Card>
                  ))}
                  <Alert variant="info" className="mt-2 mb-0">
                    <strong>Total:</strong> {formatCurrency(parcelasGeradas.reduce((acc, p) => acc + p.valor, 0))}
                  </Alert>
                </Card.Body>
              </Card>
            )}
          </Card.Body>
        </Card>

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
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Observações</Form.Label>
          <Form.Control
            as="textarea"
            rows={2}
            name="observacoes"
            value={formData.observacoes}
            onChange={handleChange}
            placeholder="Observações adicionais sobre o gasto"
          />
        </Form.Group>

        <div className="d-flex gap-2 mt-4">
          <Button type="submit" variant="primary" disabled={loading} className="d-flex align-items-center">
            <Save size={16} className="me-2" />
            {loading ? "Salvando..." : initialData ? "Atualizar" : "Adicionar Gasto"}
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
      </Form>
    </>
  )
}

export default OutroGastoForm
