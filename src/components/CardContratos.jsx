"use client"

import { useState, useEffect } from "react"
import { Card, Table, Button, Badge, Modal, Spinner, ProgressBar } from "react-bootstrap"
import { FileText, Copy } from "lucide-react"
import ApiBase from "../services/ApiBase"

const CardContratos = ({ obra }) => {
  const [contratos, setContratos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [contratoSelecionado, setContratoSelecionado] = useState(null)
  const [copiado, setCopiado] = useState(false)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await ApiBase.post("/google/sheets/data", {
          data: { spreadsheetId: obra.id, range: "contratos" },
        })

        const data = res.data.values || []
        console.log("Dados recebidos da API:", data)

        // Verificar se temos pelo menos duas linhas (cabeçalho e dados)
        if (data.length < 2) {
          setContratos([])
          setLoading(false)
          return
        }

        // Processar os dados para criar objetos de contrato
        const contratosProcessados = data.slice(2).map((row) => {
          // Extrair informações básicas do contrato
          const contrato = {
            id: row[0] || "",
            nome: row[1] || "",
            valorTotal: row[2] || "R$ 0,00",
            pagamentos: [],
          }

          // Processar os pagamentos (grupos de 3 colunas: VALOR, PIX, DATA)
          // O primeiro pagamento começa no índice 3
          for (let i = 3; i < row.length; i += 3) {
            // Verificar se existe um valor no início do grupo
            if (row[i] && row[i].trim() !== "") {
              contrato.pagamentos.push({
                // CORREÇÃO: Trocando a ordem dos campos para corresponder ao formato recebido
                nome: row[i] || "",          // Antes era 'valor'
                data: row[i + 1] || "",      // Antes era 'pix'
                valor: row[i + 2] || "",     // Antes era 'data'
              })
            }
          }
          
          // Log para depuração
          console.log(`Contrato ${contrato.id} - ${contrato.nome}: ${contrato.pagamentos.length} pagamentos processados`)
          
          // Calcular o valor total pago e o valor restante
          const valorTotalNumerico = converterParaNumero(contrato.valorTotal)
          let valorPago = 0

          // Somar todos os valores dos pagamentos
          contrato.pagamentos.forEach((pagamento, idx) => {
            // CORREÇÃO: Agora usando o campo 'valor' corretamente
            const valorNumerico = converterParaNumero(pagamento.valor)
            valorPago += valorNumerico
            console.log(`Pagamento #${idx+1}: ${pagamento.valor} => ${valorNumerico}`)
          })

          console.log(`Total pago: ${valorPago}`)
          
          contrato.valorPago = formatarMoeda(valorPago)
          
          // Calcular o valor restante (pode ser negativo se ultrapassou o planejado)
          const valorRestante = valorTotalNumerico - valorPago
          contrato.valorRestante = formatarMoeda(Math.abs(valorRestante))
          contrato.excedeuOrcamento = valorRestante < 0

          return contrato
        })

        console.log("Contratos processados:", contratosProcessados)
        setContratos(contratosProcessados)
      } catch (error) {
        console.error("Erro ao buscar dados de contratos:", error)
      } finally {
        setLoading(false)
      }
    }

    if (obra && obra.id) {
      fetchData()
    }
  }, [obra])

  // Função para converter valor monetário em número
  const converterParaNumero = (valorString) => {
    if (!valorString || typeof valorString !== "string") return 0
    
    // Remover todos os caracteres não numéricos, exceto o separador decimal
    const valorLimpo = valorString
      .replace("R$", "")
      .replace(/\./g, "")  // Remove pontos de milhar
      .replace(",", ".")   // Substitui vírgula por ponto decimal
      .trim()
    
    // Verificar se o valor é numérico
    if (isNaN(valorLimpo)) {
      console.warn(`Valor não numérico encontrado: "${valorString}" => "${valorLimpo}"`)
      return 0
    }
    
    const valorNumerico = Number.parseFloat(valorLimpo) || 0
    console.log(`Conversão: "${valorString}" => ${valorNumerico}`)
    return valorNumerico
  }

  // Função para formatar valor como moeda
  const formatarMoeda = (valor) => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(valor)
  }

  // Abrir modal com detalhes do contrato
  const abrirDetalhes = (contrato) => {
    setContratoSelecionado(contrato)
    setShowModal(true)
  }

  // Copiar chave PIX
  const copiarPix = (pix) => {
    navigator.clipboard.writeText(pix)
    setCopiado(true)
    setTimeout(() => setCopiado(false), 2000)
  }

  // Calcular estatísticas gerais
  const calcularEstatisticas = () => {
    const totalContratos = contratos.length
    let totalValor = 0
    let totalPago = 0
    let contratosExcedidos = 0
    let contratosNaoPagos = 0

    contratos.forEach((contrato) => {
      totalValor += converterParaNumero(contrato.valorTotal)
      totalPago += converterParaNumero(contrato.valorPago)
      if (contrato.excedeuOrcamento) contratosExcedidos++
      if (converterParaNumero(contrato.valorPago) === 0) contratosNaoPagos++
    })

    const totalRestante = totalValor - totalPago

    return {
      totalContratos,
      totalValor: formatarMoeda(totalValor),
      totalPago: formatarMoeda(totalPago),
      totalRestante: formatarMoeda(Math.abs(totalRestante)),
      excedeuOrcamentoTotal: totalRestante < 0,
      percentualPago: totalValor > 0 ? (totalPago / totalValor) * 100 : 0,
      contratosExcedidos,
      contratosNaoPagos,
    }
  }

  const estatisticas = calcularEstatisticas()

  return (
    <div className="col-md-12 mb-4">
      <Card style={{ borderRadius: "10px", boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}>
        <Card.Header className="bg-white">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <FileText className="text-primary me-2" size={20} />
              <Card.Title className="mb-0">Contratos da Obra</Card.Title>
            </div>
            <Badge bg="primary">{contratos.length} contratos</Badge>
          </div>
        </Card.Header>

        <Card.Body>
          {loading ? (
            <div className="text-center p-4">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2">Carregando contratos...</p>
            </div>
          ) : contratos.length === 0 ? (
            <div className="text-center p-4">
              <p className="text-muted">Nenhum contrato encontrado para esta obra.</p>
            </div>
          ) : (
            <>
              {/* Resumo de estatísticas */}
              <div className="row mb-4">
                <div className="col-md-3 mb-3">
                  <div className="border rounded p-3 h-100">
                    <h6 className="text-muted mb-1">Valor Total dos Contratos</h6>
                    <h4>{estatisticas.totalValor}</h4>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="border rounded p-3 h-100">
                    <h6 className="text-muted mb-1">Valor Total Pago</h6>
                    <h4>{estatisticas.totalPago}</h4>
                    <ProgressBar
                      now={estatisticas.percentualPago > 100 ? 100 : estatisticas.percentualPago}
                      variant={estatisticas.excedeuOrcamentoTotal ? "danger" : "success"}
                      className="mt-2"
                      style={{ height: "8px" }}
                    />
                    <small className={estatisticas.excedeuOrcamentoTotal ? "text-danger" : "text-muted"}>
                      {estatisticas.percentualPago.toFixed(1)}% pago
                      {estatisticas.excedeuOrcamentoTotal ? " (excedeu orçamento)" : ""}
                    </small>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="border rounded p-3 h-100">
                    <h6 className="text-muted mb-1">
                      {estatisticas.excedeuOrcamentoTotal ? "Valor Excedido" : "Valor Restante"}
                    </h6>
                    <h4 className={estatisticas.excedeuOrcamentoTotal ? "text-danger" : ""}>
                      {estatisticas.totalRestante}
                    </h4>
                    <small className="text-muted">
                      {estatisticas.contratosExcedidos} contratos excederam o orçamento
                    </small>
                  </div>
                </div>
                <div className="col-md-3 mb-3">
                  <div className="border rounded p-3 h-100">
                    <h6 className="text-muted mb-1">Contratos sem Pagamentos</h6>
                    <h4>{estatisticas.contratosNaoPagos}</h4>
                    <small className="text-muted">de {estatisticas.totalContratos} contratos</small>
                  </div>
                </div>
              </div>

              {/* Lista de contratos */}
              <div className="table-responsive">
                <Table hover className="align-middle">
                  <thead className="table-light">
                    <tr>
                      <th style={{ width: "5%" }}>#</th>
                      <th style={{ width: "30%" }}>Contratado</th>
                      <th style={{ width: "15%" }}>Valor Total</th>
                      <th style={{ width: "15%" }}>Valor Pago</th>
                      <th style={{ width: "15%" }}>Valor Restante</th>
                      <th style={{ width: "20%" }}>Detalhes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contratos.map((contrato, index) => (
                      <tr key={index}>
                        <td>{contrato.id}</td>
                        <td>{contrato.nome}</td>
                        <td>{contrato.valorTotal}</td>
                        <td>{contrato.valorPago}</td>
                        <td>
                          <span 
                            className={contrato.excedeuOrcamento ? "text-danger" : 
                                       converterParaNumero(contrato.valorPago) === 0 ? "text-warning" : ""}
                          >
                            {contrato.excedeuOrcamento ? `(${contrato.valorRestante})` : contrato.valorRestante}
                          </span>
                        </td>
                        <td>
                          <Button variant="outline-primary" size="sm" onClick={() => abrirDetalhes(contrato)}>
                            Ver Pagamentos
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>
            </>
          )}
        </Card.Body>
      </Card>

      {/* Modal de detalhes do contrato */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
        <Modal.Header closeButton className="bg-light">
          <Modal.Title>Detalhes do Contrato</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {contratoSelecionado && (
            <>
              <div className="mb-4">
                <h5>{contratoSelecionado.nome}</h5>
                <div className="row mt-3">
                  <div className="col-md-4 mb-3">
                    <div className="border rounded p-3">
                      <small className="text-muted d-block">Valor Total</small>
                      <h5 className="mb-0">{contratoSelecionado.valorTotal}</h5>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <div className="border rounded p-3">
                      <small className="text-muted d-block">Valor Pago</small>
                      <h5 className="mb-0">{contratoSelecionado.valorPago}</h5>
                    </div>
                  </div>
                  <div className="col-md-4 mb-3">
                    <div className="border rounded p-3">
                      <small className="text-muted d-block">
                        {contratoSelecionado.excedeuOrcamento ? "Valor Excedido" : "Valor Restante"}
                      </small>
                      <h5 className={`mb-0 ${contratoSelecionado.excedeuOrcamento ? "text-danger" : ""}`}>
                        {contratoSelecionado.excedeuOrcamento
                          ? `(${contratoSelecionado.valorRestante})`
                          : contratoSelecionado.valorRestante}
                      </h5>
                    </div>
                  </div>
                </div>

                <div className="mt-3">
                  <h6 className="mb-3">Progresso do Pagamento</h6>
                  {converterParaNumero(contratoSelecionado.valorTotal) > 0 ? (
                    <>
                      <ProgressBar
                        now={
                          (converterParaNumero(contratoSelecionado.valorPago) /
                            converterParaNumero(contratoSelecionado.valorTotal)) *
                            100 >
                          100
                            ? 100
                            : (converterParaNumero(contratoSelecionado.valorPago) /
                                converterParaNumero(contratoSelecionado.valorTotal)) *
                              100
                        }
                        variant={contratoSelecionado.excedeuOrcamento ? "danger" : "success"}
                        style={{ height: "10px" }}
                        className="mb-2"
                      />
                      <small className={contratoSelecionado.excedeuOrcamento ? "text-danger" : "text-muted"}>
                        {(
                          (converterParaNumero(contratoSelecionado.valorPago) /
                            converterParaNumero(contratoSelecionado.valorTotal)) *
                          100
                        ).toFixed(1)}
                        % do valor total foi pago
                        {contratoSelecionado.excedeuOrcamento ? " (orçamento excedido)" : ""}
                      </small>
                    </>
                  ) : (
                    <div className="alert alert-warning">Valor total do contrato não definido.</div>
                  )}
                </div>
              </div>

              <h6 className="mt-4 mb-3">Histórico de Pagamentos</h6>
              {contratoSelecionado.pagamentos.length > 0 ? (
                <div className="table-responsive">
                  <Table striped bordered hover>
                    <thead className="table-light">
                      <tr>
                        <th>#</th>
                        <th>Nome/Destinatário</th>
                        <th>Data</th>
                        <th>Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contratoSelecionado.pagamentos.map((pagamento, idx) => (
                        <tr key={idx}>
                          <td>{idx + 1}</td>
                          <td>{pagamento.nome || "Não informado"}</td>
                          <td>{pagamento.data || "Não informada"}</td>
                          <td>{pagamento.valor || "R$ 0,00"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <div className="alert alert-info">Nenhum pagamento registrado para este contrato.</div>
              )}
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Fechar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default CardContratos