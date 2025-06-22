"use client"

import { useState, useEffect } from "react"
import { Card, Button, Modal, Form, Row, Col, Container, Spinner, Alert } from "react-bootstrap"
import { Link } from "react-router-dom"
import ApiBase from "../services/ApiBase"
import ObrasApi from "../services/ObrasApi" // Mudança aqui: usar ObrasApi ao invés de PagamentosApi

// 10 ilustrações do Freepik (exemplos). Verifique a licença antes de usar.
const watermarkImages = [
  "https://img.freepik.com/vetores-gratis/ilustracao-do-conceito-de-construcao_114360-2558.jpg",
  "https://img.freepik.com/vetores-premium/arquiteto-ou-engenheiro-no-canteiro-de-obras-segurando-o-homem-do-plano-de-construcao-na-ilustracao-do-canteiro-de-obras_375605-340.jpg",
  "https://img.freepik.com/vetores-premium/ilustracao-plana-para-celebracao-do-dia-dos-engenheiros_23-2149549867.jpg",
  "https://https://img.freepik.com/vetores-gratis/ilustracao-de-engenharia-e-construcao_23-2148904169.jpg",
  "https://img.freepik.com/vetores-gratis/pessoas-trabalhando-na-construcao_23-2148888797.jpg",
  "https://img.freepik.com/vetores-gratis/ilustracao-de-engenharia-e-construcao-plana_52683-59165.jpg",
  "https://img.freepik.com/vetores-gratis/ilustracao-de-engenharia-e-construcao-plana_23-2148897395.jpg",
  "https://img.freepik.com/vetores-gratis/ilustracao-de-engenharia-e-construcao_23-2148904168.jpg",
]

const Obras_ativas = () => {
  const [obras, setObras] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [summariesLoading, setSummariesLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  // Formulário para nova obra
  const [obraForm, setObraForm] = useState({
    nome: "",
    dataInicio: "",
    dataFinalEntrega: "",
    orcamento: "",
    // Campos adicionais para integração com API
    descricao: "",
    endereco: "",
    responsavel: "",
  })

  // IDs fixos da pasta e do modelo
  const folderId = "1ALOCpJyPNQe51HC0TSNX68oa8SIkZqcW"
  const templateId = "1tnLeEwbrDgpE8p26zcUe3fhWpmmKnxifyiymxgsX8aU"

  // 1) Buscar lista de planilhas e filtrar "modelo_planilha_obra (Não mexer)"
  const fetchObras = async () => {
    setLoading(true)
    try {
      const response = await ApiBase.get(`/google/drive/${folderId}`)
      const filtered = response.data.filter((obra) => obra.name !== "modelo_planilha_obra (Não mexer)")
      setObras(filtered)
    } catch (error) {
      console.error("Erro ao buscar obras:", error)
      setError("Erro ao carregar obras")
    } finally {
      setLoading(false)
    }
  }

  // 2) Para cada obra, buscar o 'Resumo' via /google/sheets/data (POST)
  const fetchSummaryDataForObras = async () => {
    if (obras.length === 0) return
    setSummariesLoading(true)

    try {
      const updatedObras = await Promise.all(
        obras.map(async (obra) => {
          try {
            const res = await ApiBase.post("/google/sheets/data", {
              data: { spreadsheetId: obra.id, range: "Resumo" },
            })
            const values = res.data.values || []
            const summaryData = parseResumo(values)
            return {
              ...obra,
              summaryData,
            }
          } catch (err) {
            console.error(`Erro ao buscar resumo para a obra ${obra.name}:`, err)
            return { ...obra, summaryData: null }
          }
        }),
      )
      setObras(updatedObras)
    } catch (err) {
      console.error("Erro no Promise.all:", err)
    } finally {
      setSummariesLoading(false)
    }
  }

  // Extrai dados do array "values" retornado
  const parseResumo = (values) => {
    const summary = {}
    values.forEach((row) => {
      if (row[0] === "Orçamento:") summary.orcamento = row[1]
      if (row[0] === "Início da Obra:") summary.inicio = row[1]
      if (row[0] === "Data final de Entrega:") summary.fim = row[1]
      if (row[0] === "Gasto total:") summary.gastoTotal = row[1]
    })
    return summary
  }

  useEffect(() => {
    fetchObras()
  }, [])

  useEffect(() => {
    if (obras.length > 0) {
      fetchSummaryDataForObras()
    }
  }, [obras.length])

  // Função para converter data do formato brasileiro para ISO
  const formatDateToISO = (dateString) => {
    if (!dateString) return new Date().toISOString()

    // Se já está no formato ISO (YYYY-MM-DD), retorna como está
    if (dateString.includes("-") && dateString.length === 10) {
      return new Date(dateString).toISOString()
    }

    // Se está no formato brasileiro (DD/MM/YYYY), converte
    if (dateString.includes("/")) {
      const [day, month, year] = dateString.split("/")
      return new Date(`${year}-${month}-${day}`).toISOString()
    }

    return new Date(dateString).toISOString()
  }

  // Cria nova obra (cópia da planilha modelo + criação na API)
  const handleCreateObra = async (e) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    try {
      // Validações básicas
      if (!obraForm.nome || !obraForm.dataInicio || !obraForm.dataFinalEntrega || !obraForm.orcamento) {
        setError("Todos os campos obrigatórios devem ser preenchidos")
        return
      }

      if (Number.parseFloat(obraForm.orcamento) <= 0) {
        setError("O orçamento deve ser maior que zero")
        return
      }

      if (new Date(obraForm.dataInicio) >= new Date(obraForm.dataFinalEntrega)) {
        setError("A data de entrega deve ser posterior à data de início")
        return
      }

      setLoading(true)

      // 1. Criar a planilha no Google Sheets
      const planilhaData = {
        templateId: templateId,
        newTitle: obraForm.nome,
        folderId: folderId,
      }

      const planilhaResponse = await ApiBase.post("/google/sheets/copy", { data: planilhaData })

      // 2. Criar a obra na API usando ObrasApi ao invés de PagamentosApi
      const obraData = {
        obra: {
          nome: obraForm.nome,
          dataInicio: formatDateToISO(obraForm.dataInicio),
          dataFinalEntrega: formatDateToISO(obraForm.dataFinalEntrega),
          orcamento: Number.parseFloat(obraForm.orcamento),
          // Incluir campos adicionais se preenchidos
          descricao: obraForm.descricao || "",
          endereco: obraForm.endereco || "",
          responsavel: obraForm.responsavel || "",
        },
        // Inicializar arrays vazios
        gastos: [],
        contratos: [],
        cronograma: [],
        pagamentosSemanais: [],
      }

      // Mudança aqui: usar ObrasApi.criarObra ao invés de PagamentosApi.criarPagamento
      const apiResponse = await ObrasApi.criarObra(obraData)

      setSuccess(`Obra "${obraForm.nome}" criada com sucesso!`)

      // Limpar formulário
      setObraForm({
        nome: "",
        dataInicio: "",
        dataFinalEntrega: "",
        orcamento: "",
        descricao: "",
        endereco: "",
        responsavel: "",
      })

      setShowModal(false)

      // Recarregar lista de obras
      fetchObras()
    } catch (error) {
      console.error("Erro ao criar obra:", error)
      setError(error.response?.data?.message || "Erro ao criar obra. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  // Função para formatar valor monetário
  const formatCurrency = (value) => {
    if (!value) return "R$ 0,00"

    // Se já está formatado, retorna como está
    if (typeof value === "string" && value.includes("R$")) {
      return value
    }

    // Se é um número, formata
    const numValue =
      typeof value === "string" ? Number.parseFloat(value.replace(/[^\d,.-]/g, "").replace(",", ".")) : value

    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(numValue || 0)
  }

  // Estilos do card, sem minHeight
  const cardContainerStyle = {
    position: "relative",
    borderRadius: "12px",
    boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
    overflow: "hidden",
  }

  // Imagem preenche o card, mas não define altura
  const cardImageStyle = {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    zIndex: 1,
  }

  // Overlay para o conteúdo, garantindo leitura
  const overlayStyle = {
    position: "relative",
    zIndex: 2,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderRadius: "8px",
    padding: "1rem",
  }

  return (
    <Container className="mt-4">
      <h1 className="text-center mb-4">Lista de Obras</h1>

      {/* Alertas de sucesso e erro */}
      {error && (
        <Alert variant="danger" onClose={() => setError("")} dismissible>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" onClose={() => setSuccess("")} dismissible>
          {success}
        </Alert>
      )}

      {(loading || summariesLoading) && (
        <div className="d-flex justify-content-center mb-4">
          <Spinner animation="border" variant="primary" />
          <span className="ms-2">{loading ? "Carregando obras..." : "Carregando resumos..."}</span>
        </div>
      )}

      {!loading && !summariesLoading && (
        <Row className="g-4 justify-content-center">
          {obras.length > 0 ? (
            obras.map((obra, index) => {
              // Cada obra recebe uma imagem fixa, baseada no index
              const imageIndex = index % watermarkImages.length
              const imageUrl = watermarkImages[imageIndex]

              return (
                <Col key={obra.id} xs={12} sm={6} md={4} lg={3}>
                  <Card style={cardContainerStyle} className="h-100">
                    {/* Imagem de fundo absoluta */}
                    <img src={imageUrl || "/placeholder.svg"} alt="Fundo Engenharia" style={cardImageStyle} />

                    {/* Conteúdo sobreposto */}
                    <Card.Body style={{ position: "relative", zIndex: 2 }}>
                      <div style={overlayStyle}>
                        <Card.Title style={{ fontSize: "1.25rem", fontWeight: "600" }}>{obra.name}</Card.Title>

                        {obra.summaryData ? (
                          <>
                            <p>
                              <strong>Orçamento:</strong> {formatCurrency(obra.summaryData.orcamento)}
                            </p>
                            <p>
                              <strong>Início:</strong> {obra.summaryData.inicio || "N/A"}
                            </p>
                            <p>
                              <strong>Fim:</strong> {obra.summaryData.fim || "N/A"}
                            </p>
                            <p>
                              <strong>Gasto Total:</strong> {formatCurrency(obra.summaryData.gastoTotal)}
                            </p>
                          </>
                        ) : (
                          <p>Nenhum resumo encontrado.</p>
                        )}

                        {/* Botões (Planilha e Dashboard) */}
                        <div className="d-flex pt-3">
                          <Button
                            variant="primary"
                            className="me-2 w-50"
                            onClick={() =>
                              window.open(`https://docs.google.com/spreadsheets/d/${obra.id}/edit`, "_blank")
                            }
                          >
                            Planilha
                          </Button>
                          <Link
                            to={`/dashboard/${obra.id}`}
                            state={{ name: obra.name }}
                            className="w-50"
                            style={{ textDecoration: "none" }}
                          >
                            <Button variant="success" className="w-100">
                              Dashboard
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              )
            })
          ) : (
            <Col>
              <p>Nenhuma obra encontrada.</p>
            </Col>
          )}

          <Col xs={12} sm={6} md={4} lg={3}>
            <Card
              className="h-100 d-flex flex-column"
              style={{
                borderRadius: "12px",
                boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)",
              }}
            >
              {/* Área que cresce para preencher o espaço, centralizando o conteúdo */}
              <Card.Body className="d-flex flex-column justify-content-center align-items-center flex-grow-1">
                <Card.Title className="text-center mb-3">Adicionar Nova Obra</Card.Title>
              </Card.Body>

              {/* Rodapé com o botão, fixo ao final do card */}
              <div className="p-3">
                <Button variant="warning" className="w-100" onClick={() => setShowModal(true)}>
                  Nova Obra
                </Button>
              </div>
            </Card>
          </Col>
        </Row>
      )}

      {/* Modal para criar nova obra */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Form onSubmit={handleCreateObra}>
          <Modal.Header closeButton>
            <Modal.Title>Nova Obra</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row>
              <Col md={6}>
                <Form.Group controlId="obraName" className="mb-3">
                  <Form.Label>Nome da Obra *</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Digite o nome da obra"
                    value={obraForm.nome}
                    onChange={(e) => setObraForm({ ...obraForm, nome: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="obraOrcamento" className="mb-3">
                  <Form.Label>Orçamento (R$) *</Form.Label>
                  <Form.Control
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={obraForm.orcamento}
                    onChange={(e) => setObraForm({ ...obraForm, orcamento: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group controlId="obraDataInicio" className="mb-3">
                  <Form.Label>Data de Início *</Form.Label>
                  <Form.Control
                    type="date"
                    value={obraForm.dataInicio}
                    onChange={(e) => setObraForm({ ...obraForm, dataInicio: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="obraDataFim" className="mb-3">
                  <Form.Label>Data de Entrega *</Form.Label>
                  <Form.Control
                    type="date"
                    value={obraForm.dataFinalEntrega}
                    onChange={(e) => setObraForm({ ...obraForm, dataFinalEntrega: e.target.value })}
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Row>
              <Col md={6}>
                <Form.Group controlId="obraResponsavel" className="mb-3">
                  <Form.Label>Responsável</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Nome do responsável"
                    value={obraForm.responsavel}
                    onChange={(e) => setObraForm({ ...obraForm, responsavel: e.target.value })}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group controlId="obraEndereco" className="mb-3">
                  <Form.Label>Endereço</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Endereço da obra"
                    value={obraForm.endereco}
                    onChange={(e) => setObraForm({ ...obraForm, endereco: e.target.value })}
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group controlId="obraDescricao" className="mb-3">
              <Form.Label>Descrição</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                placeholder="Descrição detalhada da obra"
                value={obraForm.descricao}
                onChange={(e) => setObraForm({ ...obraForm, descricao: e.target.value })}
              />
            </Form.Group>

            <small className="text-muted">* Campos obrigatórios</small>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Criando...
                </>
              ) : (
                "Criar Obra"
              )}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  )
}

export default Obras_ativas