"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useNavigate } from "react-router-dom"
import {
  Container,
  Row,
  Col,
  Card,
  Spinner,
  Alert,
  Tabs,
  Tab,
  Button,
  Modal,
  Table,
  Badge,
  ProgressBar,
} from "react-bootstrap"
import { ArrowLeft, Plus, Edit, Trash2, ExternalLink } from "lucide-react"
// Importar todos os formulários
import ObraForm from "../components/forms/ObraForm"
import MaterialForm from "../components/forms/MaterialForm"
import MaoObraForm from "../components/forms/MaoObraForm"
import EquipamentoForm from "../components/forms/EquipamentoForm"
import ContratoForm from "../components/forms/ContratoForm"
import OutroGastoForm from "../components/forms/OutroGastoForm"
import apiService from "../services/apiService"
import ObrasApi from "../services/ObrasApi"
import GoogleSheetsService from "../services/GoogleSheetsService"

const ObraDashboard = () => {
  const { id: obraId } = useParams()
  const navigate = useNavigate()

  const [obra, setObra] = useState(null)
  const [gastos, setGastos] = useState({
    materiais: [],
    maoObra: [],
    equipamentos: [],
    contratos: [],
    outrosGastos: [],
  })
  const [cronograma, setCronograma] = useState([])
  const [relatorio, setRelatorio] = useState(null)
  const [loading, setLoading] = useState(true)
  const [alert, setAlert] = useState({ show: false, message: "", variant: "" })

  // State para modais
  const [showModal, setShowModal] = useState(false)
  const [modalConfig, setModalConfig] = useState({ type: null, data: null })

  const showAlert = (message, variant = "success", duration = 4000) => {
    setAlert({ show: true, message, variant })
    setTimeout(() => setAlert({ show: false, message: "", variant: "" }), duration)
  }

  const formatCurrency = (value) =>
    new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0)

  const fetchGastos = useCallback(async () => {
    try {
      console.log(`Buscando gastos para a obra ID: ${obraId}`)

      // Buscar gastos diretamente do banco de dados usando apiService
      const [materiaisRes, maoObraRes, equipamentosRes, contratosRes, outrosGastosRes] = await Promise.allSettled([
        apiService.materiais.getAll({ limit: 10000 }),
        apiService.maoObra.getAll({ limit: 10000 }),
        apiService.equipamentos.getAll({ limit: 10000 }),
        apiService.contratos.getAll({ limit: 10000 }),
        apiService.outrosGastos.getAll({ limit: 10000 }),
      ])

      // Filtrar gastos por obra
      const filtrarPorObra = (gastos) => {
        return gastos.filter(gasto => {
          const gastoObraId = typeof gasto.obraId === 'object' ? gasto.obraId?._id : gasto.obraId
          return gastoObraId === obraId || (!gasto.obraId && obraId === null)
        })
      }

      console.log('Mão de obra total:', maoObraRes.status === "fulfilled" ? maoObraRes.value.maoObras?.length : 0)
      console.log('Obra ID:', obraId)

      setGastos({
        materiais: materiaisRes.status === "fulfilled" ? filtrarPorObra(materiaisRes.value.materiais || []) : [],
        maoObra: maoObraRes.status === "fulfilled" ? filtrarPorObra(maoObraRes.value.maoObras || []) : [],
        equipamentos: equipamentosRes.status === "fulfilled" ? filtrarPorObra(equipamentosRes.value.equipamentos || []) : [],
        contratos: contratosRes.status === "fulfilled" ? filtrarPorObra(contratosRes.value.contratos || []) : [],
        outrosGastos: outrosGastosRes.status === "fulfilled" ? filtrarPorObra(outrosGastosRes.value.gastos || []) : [],
      })
    } catch (error) {
      console.error("Erro ao buscar gastos:", error)
      showAlert("Erro ao carregar gastos da obra", "warning")
    }
  }, [obraId])

  const fetchCronograma = useCallback(async (obra) => {
    try {
      if (!obra.spreadsheetId) {
        console.log("Obra não possui spreadsheetId, usando cronograma do banco de dados")
        setCronograma(obra.cronograma || [])
        return
      }

      console.log(`Buscando cronograma da planilha: ${obra.spreadsheetId}`)

      // Buscar cronograma da planilha Google Sheets
      const cronogramaData = await GoogleSheetsService.buscarCronograma(obra.spreadsheetId)

      if (cronogramaData && cronogramaData.values && cronogramaData.values.length > 2) {
        // Alterado de > 1 para > 2
        // Converter dados da planilha para formato do cronograma
        const cronogramaFormatado = cronogramaData.values
          .slice(2) // Alterado de .slice(1) para .slice(2)
          .map((linha, index) => ({
            _id: `cronograma_${index}`,
            etapa: linha[0] || "",
            dataInicio: linha[1] || "",
            dataTermino: linha[2] || "",
            status: linha[3] || "pendente",
            responsavel: linha[4] || "",
            observacoes: linha[5] || "",
          }))
          .filter((item) => item.etapa) // Filtrar linhas vazias

        console.log("Cronograma formatado:", cronogramaFormatado)
        setCronograma(cronogramaFormatado)
      } else {
        console.log("Nenhum dado de cronograma encontrado na planilha, usando dados do banco")
        setCronograma(obra.cronograma || [])
      }
    } catch (error) {
      console.error("Erro ao buscar cronograma da planilha:", error)
      console.log("Usando cronograma do banco de dados como fallback")
      setCronograma(obra.cronograma || [])
    }
  }, [])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      console.log(`Buscando dados para a obra ID: ${obraId}`)

      // 1. Busca o documento principal da obra
      const response = await ObrasApi.buscarObra(obraId)
      console.log("Dados da obra recebidos:", response)

      const obraData = response.obra

      if (!obraData) {
        throw new Error("A resposta da API não contém os dados da obra esperados.")
      }

      setObra(obraData)

      // 2. Buscar cronograma (da planilha ou do banco)
      await fetchCronograma(obraData)

      // 3. Buscar gastos da obra
      await fetchGastos()

      // 4. Inicializar relatório básico
      setRelatorio({
        totalGeral: 0,
        saldo: obraData.valorContrato || 0,
      })
    } catch (error) {
      console.error("Erro detalhado ao buscar dados da obra:", error)
      const errorMessage =
        error.response?.data?.message || error.message || "Falha ao carregar dados da obra. Tente novamente."
      showAlert(errorMessage, "danger")
      setObra(null)
    } finally {
      setLoading(false)
    }
  }, [obraId, fetchGastos, fetchCronograma])

  useEffect(() => {
    if (obraId) {
      fetchData()
    }
  }, [fetchData, obraId])

  // Recalcular relatório quando gastos mudarem
  useEffect(() => {
    if (obra && gastos) {
      const todosGastos = [
        ...(gastos.materiais || []),
        ...(gastos.maoObra || []),
        ...(gastos.equipamentos || []),
        ...(gastos.contratos || []),
        ...(gastos.outrosGastos || []),
      ]

      const totalGeral = todosGastos.reduce((acc, gasto) => acc + (gasto.valor || 0), 0)

      setRelatorio({
        totalGeral,
        saldo: (obra.valorContrato || 0) - totalGeral,
        gastosPorTipo: {
          materiais: (gastos.materiais || []).reduce((acc, item) => acc + (item.valor || 0), 0),
          maoObra: (gastos.maoObra || []).reduce((acc, item) => acc + (item.valor || 0), 0),
          equipamentos: (gastos.equipamentos || []).reduce((acc, item) => acc + (item.valor || 0), 0),
          contratos: (gastos.contratos || []).reduce((acc, item) => acc + (item.valor || 0), 0),
          outrosGastos: (gastos.outrosGastos || []).reduce((acc, item) => acc + (item.valor || 0), 0),
        },
      })
    }
  }, [obra, gastos])

  const handleOpenModal = (type, data = null) => {
    setModalConfig({ type, data })
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setModalConfig({ type: null, data: null })
  }

  const handleSubmit = async (formData) => {
    const { type, data } = modalConfig
    try {
      const isEdit = data && data._id
      const payload = { ...formData, obraId }

      if (type === "obrasForm") {
        await apiService.obras.update(obraId, formData)
      } else if (type === "materiaisForm") {
        if (isEdit) {
          await apiService.materiais.update(data._id, payload)
        } else {
          await apiService.materiais.create(payload)
        }
      } else if (type === "maoObraForm") {
        if (isEdit) {
          await apiService.maoObra.update(data._id, payload)
        } else {
          await apiService.maoObra.create(payload)
        }
      } else if (type === "equipamentosForm") {
        if (isEdit) {
          await apiService.equipamentos.update(data._id, payload)
        } else {
          await apiService.equipamentos.create(payload)
        }
      } else if (type === "contratosForm") {
        if (isEdit) {
          await apiService.contratos.update(data._id, payload)
        } else {
          await apiService.contratos.create(payload)
        }
      } else if (type === "outrosGastosForm") {
        if (isEdit) {
          await apiService.outrosGastos.update(data._id, payload)
        } else {
          await apiService.outrosGastos.create(payload)
        }
      } else {
        throw new Error(`Tipo de formulário desconhecido: ${type}`)
      }

      showAlert(`${isEdit ? "Atualizado" : "Adicionado"} com sucesso!`, "success")
      handleCloseModal()
      fetchData()
    } catch (error) {
      console.error("Erro ao salvar:", error)
      showAlert(error.response?.data?.msg || "Erro ao salvar.", "danger")
    }
  }

  const handleDelete = async (type, id) => {
    if (window.confirm("Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.")) {
      try {
        if (type === "materiais") {
          await apiService.materiais.delete(id)
        } else if (type === "maoObra") {
          await apiService.maoObra.delete(id)
        } else if (type === "equipamentos") {
          await apiService.equipamentos.delete(id)
        } else if (type === "contratos") {
          await apiService.contratos.delete(id)
        } else if (type === "outrosGastos") {
          await apiService.outrosGastos.delete(id)
        }
        showAlert("Item excluído com sucesso!", "success")
        fetchData()
      } catch (error) {
        console.error("Erro ao excluir:", error)
        showAlert(error.response?.data?.msg || "Erro ao excluir.", "danger")
      }
    }
  }

  const handleOpenSpreadsheet = () => {
    if (obra.spreadsheetUrl) {
      window.open(obra.spreadsheetUrl, "_blank")
    } else if (obra.spreadsheetId) {
      window.open(`https://docs.google.com/spreadsheets/d/${obra.spreadsheetId}/edit`, "_blank")
    }
  }

  const renderTable = (type, data, columns) => (
    <>
      <div className="d-flex justify-content-end mb-3">
        <Button variant="primary" onClick={() => handleOpenModal(`${type}Form`)}>
          <Plus size={16} className="me-2" /> Adicionar
        </Button>
      </div>
      <Table striped bordered hover responsive>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.key}>{col.label}</th>
            ))}
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((item, index) => (
              <tr key={item._id || index}>
                {columns.map((col) => (
                  <td key={col.key}>{col.render ? col.render(item) : item[col.key]}</td>
                ))}
                <td>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="me-2"
                    onClick={() => handleOpenModal(`${type}Form`, item)}
                  >
                    <Edit size={14} />
                  </Button>
                  <Button variant="outline-danger" size="sm" onClick={() => handleDelete(type, item._id)}>
                    <Trash2 size={14} />
                  </Button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length + 1} className="text-center">
                Nenhum item encontrado.
              </td>
            </tr>
          )}
        </tbody>
      </Table>
    </>
  )

  const renderCronogramaTable = () => (
    <Table striped bordered hover responsive>
      <thead>
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
        {cronograma.length > 0 ? (
          cronograma.map((item, index) => (
            <tr key={item._id || index}>
              <td>{item.etapa}</td>
              <td>{item.dataInicio}</td>
              <td>{item.dataTermino}</td>
              <td>
                <Badge
                  bg={
                    item.status === "concluido"
                      ? "success"
                      : item.status === "em_andamento"
                        ? "primary"
                        : item.status === "atrasado"
                          ? "danger"
                          : "secondary"
                  }
                >
                  {item.status}
                </Badge>
              </td>
              <td>{item.responsavel}</td>
              <td>{item.observacoes}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={6} className="text-center">
              Nenhum item de cronograma encontrado.
              {obra?.spreadsheetId && (
                <div className="mt-2">
                  <small className="text-muted">Adicione itens na aba "Cronograma" da planilha do Google Sheets.</small>
                </div>
              )}
            </td>
          </tr>
        )}
      </tbody>
    </Table>
  )

  const modalMap = {
    obrasForm: { title: "Obra", FormComponent: ObraForm },
    materiaisForm: { title: "Material", FormComponent: MaterialForm },
    maoObraForm: { title: "Mão de Obra", FormComponent: MaoObraForm },
    equipamentosForm: { title: "Equipamento", FormComponent: EquipamentoForm },
    contratosForm: { title: "Contrato", FormComponent: ContratoForm },
    outrosGastosForm: { title: "Outro Gasto", FormComponent: OutroGastoForm },
  }

  const { FormComponent, title } = modalMap[modalConfig.type] || {}

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "80vh" }}>
        <Spinner animation="border" variant="primary" />
        <span className="ms-3">Carregando dados da obra...</span>
      </div>
    )
  }

  if (!obra) {
    return (
      <Container className="text-center mt-5">
        <Alert variant="danger">
          <h4>Obra não encontrada</h4>
          <p>A obra com ID {obraId} não foi encontrada no sistema.</p>
          <hr />
          <p className="mb-0">Verifique se o ID está correto ou se a obra ainda existe no banco de dados.</p>
        </Alert>
        <Button variant="secondary" onClick={() => navigate("/obras_ativas")}>
          Voltar para Obras
        </Button>
      </Container>
    )
  }

  const percentualGasto = obra.valorContrato > 0 ? ((relatorio?.totalGeral || 0) / obra.valorContrato) * 100 : 0

  return (
    <Container fluid className="mt-4 mb-5">
      {alert.show && (
        <Alert variant={alert.variant} onClose={() => setAlert({ show: false, message: "", variant: "" })} dismissible>
          {alert.message}
        </Alert>
      )}

      <Row className="mb-4 align-items-center">
        <Col>
          <Button variant="outline-secondary" onClick={() => navigate("/obras_ativas")} className="mb-3">
            <ArrowLeft size={16} className="me-2" />
            Voltar para Obras
          </Button>
          <div className="d-flex align-items-center gap-3">
            <h1 className="mb-0">{obra.nome}</h1>
          </div>
          <p className="text-muted">{obra.endereco}</p>
        </Col>
        <Col xs="auto">
          {(obra.spreadsheetId || obra.spreadsheetUrl) && (
            <Button variant="outline-success" onClick={handleOpenSpreadsheet}>
              <ExternalLink size={16} className="me-2" />
              Abrir Planilha
            </Button>
          )}
        </Col>
      </Row>

      <Card className="mb-4">
        <Card.Header as="h5">Resumo Financeiro</Card.Header>
        <Card.Body>
          <Row>
            <Col md={3}>
              <strong>Valor do Contrato:</strong>
              <p className="h4 text-success">{formatCurrency(obra.valorContrato)}</p>
            </Col>
            <Col md={3}>
              <strong>Total Gasto:</strong>
              <p className="h4 text-danger">{formatCurrency(relatorio?.totalGeral)}</p>
            </Col>
            <Col md={3}>
              <strong>Saldo:</strong>
              <p className={`h4 ${relatorio?.saldo >= 0 ? "text-success" : "text-danger"}`}>
                {formatCurrency(relatorio?.saldo)}
              </p>
            </Col>
            <Col md={3}>
              <strong>% Executado:</strong>
              <p
                className={`h4 ${percentualGasto > 90 ? "text-danger" : percentualGasto > 70 ? "text-warning" : "text-info"}`}
              >
                {percentualGasto.toFixed(1)}%
              </p>
            </Col>
          </Row>
          <ProgressBar className="mt-2" style={{ height: "20px" }}>
            <ProgressBar
              variant={percentualGasto > 90 ? "danger" : percentualGasto > 70 ? "warning" : "success"}
              now={Math.min(percentualGasto, 100)}
              key={1}
              label={`${percentualGasto.toFixed(1)}% Gasto`}
            />
          </ProgressBar>

          {relatorio?.gastosPorTipo && (
            <Row className="mt-3">
              <Col>
                <h6>Distribuição dos Gastos:</h6>
                <Row>
                  <Col>
                    <small>Materiais: {formatCurrency(relatorio.gastosPorTipo.materiais)}</small>
                  </Col>
                  <Col>
                    <small>Mão de Obra: {formatCurrency(relatorio.gastosPorTipo.maoObra)}</small>
                  </Col>
                  <Col>
                    <small>Equipamentos: {formatCurrency(relatorio.gastosPorTipo.equipamentos)}</small>
                  </Col>
                  <Col>
                    <small>Contratos: {formatCurrency(relatorio.gastosPorTipo.contratos)}</small>
                  </Col>
                  <Col>
                    <small>Outros: {formatCurrency(relatorio.gastosPorTipo.outrosGastos)}</small>
                  </Col>
                </Row>
              </Col>
            </Row>
          )}
        </Card.Body>
      </Card>

      <Tabs defaultActiveKey="resumo" id="obra-dashboard-tabs" className="mb-3" fill>
        <Tab eventKey="resumo" title="📋 Resumo da Obra">
          <Card>
            <Card.Body>
              <div className="d-flex justify-content-end mb-3">
                <Button variant="primary" onClick={() => handleOpenModal("obrasForm", obra)}>
                  <Edit size={16} className="me-2" /> Editar Obra
                </Button>
              </div>
              <Row>
                <Col md={6}>
                  <p>
                    <strong>Cliente:</strong> {obra.cliente}
                  </p>
                  <p>
                    <strong>Endereço:</strong> {obra.endereco}
                  </p>
                  <p>
                    <strong>Status:</strong> <Badge bg="info">{obra.status}</Badge>
                  </p>
                </Col>
                <Col md={6}>
                  <p>
                    <strong>Data de Início:</strong> {new Date(obra.dataInicio).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                  </p>
                  <p>
                    <strong>Previsão de Término:</strong> {new Date(obra.dataPrevisaoTermino).toLocaleDateString("pt-BR", { timeZone: "UTC" })}
                  </p>
                  <p>
                    <strong>Valor do Contrato:</strong> {formatCurrency(obra.valorContrato)}
                  </p>
                </Col>
              </Row>
              {obra.descricao && (
                <Row className="mt-3">
                  <Col>
                    <strong>Descrição:</strong>
                    <p>{obra.descricao}</p>
                  </Col>
                </Row>
              )}
            </Card.Body>
          </Card>
        </Tab>
        <Tab eventKey="cronograma" title={`🗓️ Cronograma (${cronograma.length})`}>
          <Card>
            <Card.Body>
              {obra?.spreadsheetId && (
                <Alert variant="info" className="mb-3">
                  <strong>📊 Cronograma integrado com Google Sheets</strong>
                  <br />
                  Os dados do cronograma são carregados automaticamente da aba "Cronograma" da planilha.
                  <Button variant="outline-success" size="sm" className="ms-2" onClick={handleOpenSpreadsheet}>
                    <ExternalLink size={14} className="me-1" />
                    Editar na Planilha
                  </Button>
                </Alert>
              )}
              {renderCronogramaTable()}
            </Card.Body>
          </Card>
        </Tab>
        <Tab eventKey="materiais" title={`📦 Materiais (${gastos.materiais.length})`}>
          <Card>
            <Card.Body>
              {renderTable("materiais", gastos.materiais, [
                { key: "numeroNota", label: "Nota" },
                { key: "descricao", label: "Descrição" },
                { key: "localCompra", label: "Local" },
                { key: "valor", label: "Valor", render: (item) => formatCurrency(item.valor) },
                { key: "data", label: "Data", render: (item) => new Date(item.data).toLocaleDateString("pt-BR", { timeZone: "UTC" }) },
              ])}
            </Card.Body>
          </Card>
        </Tab>
        <Tab eventKey="maoObra" title={`👷 Mão de Obra (${gastos.maoObra.length})`}>
          <Card>
            <Card.Body>
              {renderTable("maoObra", gastos.maoObra, [
                { key: "nome", label: "Nome" },
                { key: "funcao", label: "Função" },
                { key: "valor", label: "Valor", render: (item) => formatCurrency(item.valor) },
                { key: "status", label: "Status", render: (item) => <Badge bg="primary">{item.status}</Badge> },
              ])}
            </Card.Body>
          </Card>
        </Tab>
        <Tab eventKey="equipamentos" title={`🔧 Equipamentos (${gastos.equipamentos.length})`}>
          <Card>
            <Card.Body>
              {renderTable("equipamentos", gastos.equipamentos, [
                { key: "item", label: "Item" },
                { key: "tipoContratacao", label: "Tipo" },
                { key: "valor", label: "Valor", render: (item) => formatCurrency(item.valor) },
                { key: "data", label: "Data", render: (item) => new Date(item.data).toLocaleDateString("pt-BR", { timeZone: "UTC" }) },
              ])}
            </Card.Body>
          </Card>
        </Tab>
        <Tab eventKey="contratos" title={`📄 Contratos (${gastos.contratos.length})`}>
          <Card>
            <Card.Body>
              {renderTable("contratos", gastos.contratos, [
                { key: "nome", label: "Objeto" },
                { key: "tipoPagamento", label: "Pagamento" },
                { key: "valor", label: "Valor", render: (item) => formatCurrency(item.valor) },
                { key: "status", label: "Status", render: (item) => <Badge bg="info">{item.status}</Badge> },
              ])}
            </Card.Body>
          </Card>
        </Tab>
        <Tab eventKey="outrosGastos" title={`💸 Outros (${gastos.outrosGastos.length})`}>
          <Card>
            <Card.Body>
              {renderTable("outrosGastos", gastos.outrosGastos, [
                { key: "descricao", label: "Descrição" },
                { key: "categoriaLivre", label: "Categoria" },
                { key: "valor", label: "Valor", render: (item) => formatCurrency(item.valor) },
                { key: "data", label: "Data", render: (item) => new Date(item.data).toLocaleDateString("pt-BR", { timeZone: "UTC" }) },
              ])}
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Modal Genérico */}
      <Modal show={showModal} onHide={handleCloseModal} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {modalConfig.data ? "Editar" : "Adicionar"} {title}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {FormComponent && (
            <FormComponent
              onSubmit={handleSubmit}
              initialData={modalConfig.data}
              onCancel={handleCloseModal}
              obraId={obraId}
            />
          )}
        </Modal.Body>
      </Modal>
    </Container>
  )
}

export default ObraDashboard
