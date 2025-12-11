"use client"

import { useState, useEffect } from "react"
import { Form, Button, Alert, Row, Col, Card, Table } from "react-bootstrap"
import { Save, X, Plus, Trash2 } from "lucide-react"
import apiService from "../../services/apiService"

function MaterialForm({ onSubmit, onCancel, initialData = null, obraId = null }) {
  const [formData, setFormData] = useState({
    numeroNota: "",
    data: "",
    localCompra: "",
    valor: "",
    solicitante: "",
    formaPagamento: "", // pix, transferencia, avista, cartao, boleto, parcelado
    chavePixBoleto: "",
    descricao: "",
    observacoes: "",
    obraId: obraId || "",
    // Campos para parcelamento (só usados quando formaPagamento === "parcelado")
    tipoParcelamento: "parcelado", // parcelado ou recorrente
    numeroParcelas: "1",
    dataPrimeiraParcela: "",
    diaVencimento: "", // Dia fixo do mês (1-31)
    intervaloRecorrencia: "mensal", // mensal ou dias
    valorIntervalo: "30", // Usado quando intervaloRecorrencia === "dias"
  })

  const [obras, setObras] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [parcelasGeradas, setParcelasGeradas] = useState([])

  useEffect(() => {
    fetchObras()
    if (initialData) {
      setFormData({
        ...initialData,
        data: initialData.data ? new Date(initialData.data).toISOString().split("T")[0] : "",
        obraId: initialData.obraId || obraId || "",
        // Campos de parcelamento
        formaPagamento: initialData.formaPagamento || "",
        tipoParcelamento: initialData.tipoParcelamento || "parcelado",
        numeroParcelas: initialData.numeroParcelas || "1",
        dataPrimeiraParcela: initialData.dataPrimeiraParcela || "",
        diaVencimento: initialData.diaVencimento || "",
        intervaloRecorrencia: initialData.intervaloRecorrencia || "mensal",
        valorIntervalo: initialData.valorIntervalo || "30",
      })
      // Se já tem pagamentos, carregar
      if (initialData.pagamentos && initialData.pagamentos.length > 0) {
        setParcelasGeradas(initialData.pagamentos)
      }
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
    const { name, value, type, checked } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))

    // Se mudar a forma de pagamento para algo diferente de parcelado, limpar parcelas geradas
    if (name === "formaPagamento" && value !== "parcelado") {
      setParcelasGeradas([])
    }
  }

  // Gerar parcelas automaticamente
  const gerarParcelas = () => {
    if (!formData.valor || parseFloat(formData.valor) <= 0) {
      setError("Defina um valor válido antes de gerar parcelas")
      return
    }

    const valorTotal = parseFloat(formData.valor)
    const parcelas = []

    if (formData.tipoParcelamento === "parcelado") {
      // Parcelado em N vezes
      const numParcelas = parseInt(formData.numeroParcelas)
      if (!numParcelas || numParcelas < 1) {
        setError("Número de parcelas deve ser maior que zero")
        return
      }

      const valorParcela = valorTotal / numParcelas
      let dataBase = formData.dataPrimeiraParcela ? new Date(formData.dataPrimeiraParcela) : new Date()

      for (let i = 1; i <= numParcelas; i++) {
        const dataParcela = new Date(dataBase)

        if (formData.intervaloRecorrencia === "mensal") {
          // Avançar meses
          dataParcela.setMonth(dataBase.getMonth() + (i - 1))
        } else if (formData.intervaloRecorrencia === "dias") {
          // Avançar dias
          const dias = parseInt(formData.valorIntervalo) || 30
          dataParcela.setDate(dataBase.getDate() + (dias * (i - 1)))
        }

        // Se diaVencimento foi definido, ajustar para esse dia do mês
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
      // Pagamentos recorrentes (ex: mensalidade)
      const numParcelas = parseInt(formData.numeroParcelas)
      if (!numParcelas || numParcelas < 1) {
        setError("Número de parcelas deve ser maior que zero")
        return
      }

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
          valor: valorTotal, // Cada parcela tem o valor total (recorrente)
          tipoPagamento: "recorrente",
          dataPagamento: dataParcela.toISOString().split("T")[0],
          statusPagamento: "pendente",
          observacoes: `Pagamento recorrente ${i}/${numParcelas}`
        })
      }
    }

    setParcelasGeradas(parcelas)
    setError("")
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
        // Incluir pagamentos se foram gerados (quando formaPagamento === "parcelado")
        pagamentos: parcelasGeradas.length > 0 ? parcelasGeradas : undefined,
      }

      console.log("[MaterialForm] Data to submit:", dataToSubmit)

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
      tipoParcelamento: "parcelado",
      numeroParcelas: "1",
      dataPrimeiraParcela: "",
      diaVencimento: "",
      intervaloRecorrencia: "mensal",
      valorIntervalo: "30",
    })
    setError("")
    setParcelasGeradas([])

    if (onCancel) {
      onCancel()
    }
  }

  // Editar uma parcela específica
  const handleEditParcela = (index, field, value) => {
    const novasParcelas = [...parcelasGeradas]
    novasParcelas[index] = {
      ...novasParcelas[index],
      [field]: field === "valor" ? parseFloat(value) : value
    }
    setParcelasGeradas(novasParcelas)
  }

  // Remover uma parcela
  const handleRemoveParcela = (index) => {
    const novasParcelas = parcelasGeradas.filter((_, i) => i !== index)
    setParcelasGeradas(novasParcelas)
  }

  // Adicionar parcela manualmente
  const handleAddParcela = () => {
    const novaParcela = {
      valor: 0,
      tipoPagamento: "parcelado",
      dataPagamento: new Date().toISOString().split("T")[0],
      statusPagamento: "pendente",
      observacoes: ""
    }
    setParcelasGeradas([...parcelasGeradas, novaParcela])
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
                <option value="parcelado">Parcelado</option>
              </Form.Select>
            </Form.Group>
          </Col>
        </Row>

        {/* CONFIGURAÇÃO DE PARCELAMENTO - Aparece quando formaPagamento === "parcelado" */}
        {formData.formaPagamento === "parcelado" && (
          <Card className="mb-3 border-primary">
            <Card.Header className="bg-primary text-white">
              <strong>Configuração de Parcelamento</strong>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={12}>
                  <Form.Group className="mb-3">
                    <Form.Label>Tipo de Parcelamento</Form.Label>
                    <Form.Select
                      name="tipoParcelamento"
                      value={formData.tipoParcelamento}
                      onChange={handleChange}
                    >
                      <option value="parcelado">Parcelado (dividir valor total)</option>
                      <option value="recorrente">Recorrente (valor fixo repetido)</option>
                    </Form.Select>
                    <Form.Text className="text-muted">
                      {formData.tipoParcelamento === "parcelado" && "Divide o valor total em parcelas iguais"}
                      {formData.tipoParcelamento === "recorrente" && "Repete o valor total em cada período (ex: mensalidade)"}
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Número de Parcelas</Form.Label>
                    <Form.Control
                      type="number"
                      name="numeroParcelas"
                      value={formData.numeroParcelas}
                      onChange={handleChange}
                      min="1"
                      step="1"
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Data da Primeira Parcela</Form.Label>
                    <Form.Control
                      type="date"
                      name="dataPrimeiraParcela"
                      value={formData.dataPrimeiraParcela}
                      onChange={handleChange}
                    />
                  </Form.Group>
                </Col>
                <Col md={4}>
                  <Form.Group className="mb-3">
                    <Form.Label>Dia de Vencimento (1-31)</Form.Label>
                    <Form.Control
                      type="number"
                      name="diaVencimento"
                      value={formData.diaVencimento}
                      onChange={handleChange}
                      min="1"
                      max="31"
                      placeholder="Opcional"
                    />
                    <Form.Text className="text-muted">
                      Ex: 10 para todo dia 10
                    </Form.Text>
                  </Form.Group>
                </Col>
              </Row>

              <Row>
                <Col md={6}>
                  <Form.Group className="mb-3">
                    <Form.Label>Intervalo de Recorrência</Form.Label>
                    <Form.Select
                      name="intervaloRecorrencia"
                      value={formData.intervaloRecorrencia}
                      onChange={handleChange}
                    >
                      <option value="mensal">Mensal</option>
                      <option value="dias">A cada X dias</option>
                    </Form.Select>
                  </Form.Group>
                </Col>
                {formData.intervaloRecorrencia === "dias" && (
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Intervalo em Dias</Form.Label>
                      <Form.Control
                        type="number"
                        name="valorIntervalo"
                        value={formData.valorIntervalo}
                        onChange={handleChange}
                        min="1"
                        step="1"
                      />
                      <Form.Text className="text-muted">
                        Ex: 15 para a cada 15 dias
                      </Form.Text>
                    </Form.Group>
                  </Col>
                )}
              </Row>

              <Button
                type="button"
                variant="info"
                onClick={gerarParcelas}
                disabled={!formData.valor || parseFloat(formData.valor) <= 0}
              >
                Gerar Parcelas
              </Button>
            </Card.Body>
          </Card>
        )}

        {/* Preview das parcelas geradas */}
        {parcelasGeradas.length > 0 && (
          <Card className="mb-3">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <span>Parcelas Geradas ({parcelasGeradas.length})</span>
              <Button size="sm" variant="success" onClick={handleAddParcela}>
                <Plus size={14} className="me-1" /> Adicionar Parcela
              </Button>
            </Card.Header>
            <Card.Body style={{ maxHeight: "400px", overflowY: "auto" }}>
              <Table striped bordered hover size="sm">
                <thead>
                  <tr>
                    <th style={{ width: "5%" }}>#</th>
                    <th style={{ width: "15%" }}>Valor</th>
                    <th style={{ width: "15%" }}>Tipo</th>
                    <th style={{ width: "15%" }}>Data</th>
                    <th style={{ width: "15%" }}>Status</th>
                    <th style={{ width: "25%" }}>Observações</th>
                    <th style={{ width: "10%" }}>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {parcelasGeradas.map((parcela, index) => (
                    <tr key={index}>
                      <td>{index + 1}</td>
                      <td>
                        <Form.Control
                          type="number"
                          size="sm"
                          value={parcela.valor}
                          onChange={(e) => handleEditParcela(index, "valor", e.target.value)}
                          step="0.01"
                          min="0"
                        />
                      </td>
                      <td>
                        <Form.Select
                          size="sm"
                          value={parcela.tipoPagamento}
                          onChange={(e) => handleEditParcela(index, "tipoPagamento", e.target.value)}
                        >
                          <option value="avista">À Vista</option>
                          <option value="parcelado">Parcelado</option>
                          <option value="recorrente">Recorrente</option>
                        </Form.Select>
                      </td>
                      <td>
                        <Form.Control
                          type="date"
                          size="sm"
                          value={parcela.dataPagamento}
                          onChange={(e) => handleEditParcela(index, "dataPagamento", e.target.value)}
                        />
                      </td>
                      <td>
                        <Form.Select
                          size="sm"
                          value={parcela.statusPagamento}
                          onChange={(e) => handleEditParcela(index, "statusPagamento", e.target.value)}
                        >
                          <option value="pendente">Pendente</option>
                          <option value="pago">Pago</option>
                          <option value="atrasado">Atrasado</option>
                        </Form.Select>
                      </td>
                      <td>
                        <Form.Control
                          type="text"
                          size="sm"
                          value={parcela.observacoes}
                          onChange={(e) => handleEditParcela(index, "observacoes", e.target.value)}
                          placeholder="Observações"
                        />
                      </td>
                      <td>
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() => handleRemoveParcela(index)}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              <div className="mt-2">
                <strong>Total: R$ {parcelasGeradas.reduce((acc, p) => acc + p.valor, 0).toFixed(2)}</strong>
              </div>
            </Card.Body>
          </Card>
        )}

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
