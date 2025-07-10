"use client"

import { useState } from "react"
import { Card, Table, Badge, ProgressBar, Button, Modal, Form } from "react-bootstrap"
import { AlertTriangle, Plus, Edit2, Trash2 } from "lucide-react"

const CardRiscos = ({ obra }) => {
  const [riscos, setRiscos] = useState([
    {
      id: 1,
      descricao: "Atraso na entrega de materiais",
      categoria: "Fornecedores",
      impacto: "Alto",
      probabilidade: "Média",
      mitigacao: "Contatar fornecedores alternativos",
      responsavel: "João Silva",
      status: "Monitorando",
    },
    {
      id: 2,
      descricao: "Condições climáticas adversas",
      categoria: "Externo",
      impacto: "Alto",
      probabilidade: "Baixa",
      mitigacao: "Planejar atividades alternativas para dias de chuva",
      responsavel: "Maria Oliveira",
      status: "Mitigado",
    },
    {
      id: 3,
      descricao: "Falha em equipamentos críticos",
      categoria: "Operacional",
      impacto: "Médio",
      probabilidade: "Média",
      mitigacao: "Manutenção preventiva e equipamentos reserva",
      responsavel: "Carlos Santos",
      status: "Ativo",
    },
  ])

  const [showModal, setShowModal] = useState(false)
  const [riscoAtual, setRiscoAtual] = useState(null)

  // Função para obter a classe de cor com base no impacto
  const getImpactoClass = (impacto) => {
    switch (impacto) {
      case "Alto":
        return "danger"
      case "Médio":
        return "warning"
      case "Baixo":
        return "success"
      default:
        return "secondary"
    }
  }

  // Função para obter a classe de cor com base no status
  const getStatusClass = (status) => {
    switch (status) {
      case "Ativo":
        return "danger"
      case "Monitorando":
        return "warning"
      case "Mitigado":
        return "success"
      default:
        return "secondary"
    }
  }

  // Função para abrir o modal de edição
  const editarRisco = (risco) => {
    setRiscoAtual(risco)
    setShowModal(true)
  }

  // Função para adicionar novo risco
  const adicionarRisco = () => {
    setRiscoAtual({
      id: riscos.length + 1,
      descricao: "",
      categoria: "",
      impacto: "Médio",
      probabilidade: "Média",
      mitigacao: "",
      responsavel: "",
      status: "Monitorando",
    })
    setShowModal(true)
  }

  // Função para salvar risco (novo ou editado)
  const salvarRisco = () => {
    if (riscoAtual.id) {
      // Editar risco existente
      setRiscos(riscos.map((r) => (r.id === riscoAtual.id ? riscoAtual : r)))
    } else {
      // Adicionar novo risco
      setRiscos([...riscos, { ...riscoAtual, id: riscos.length + 1 }])
    }
    setShowModal(false)
  }

  // Função para excluir risco
  const excluirRisco = (id) => {
    if (window.confirm("Tem certeza que deseja excluir este risco?")) {
      setRiscos(riscos.filter((r) => r.id !== id))
    }
  }

  // Estatísticas de riscos
  const estatisticas = {
    total: riscos.length,
    ativos: riscos.filter((r) => r.status === "Ativo").length,
    monitorando: riscos.filter((r) => r.status === "Monitorando").length,
    mitigados: riscos.filter((r) => r.status === "Mitigado").length,
    altoImpacto: riscos.filter((r) => r.impacto === "Alto").length,
  }

  return (
    <div className="col-md-12 mb-4">
      <Card style={{ borderRadius: "10px", boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}>
        <Card.Header className="bg-white">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <AlertTriangle className="text-warning me-2" size={20} />
              <Card.Title className="mb-0">Matriz de Riscos</Card.Title>
            </div>
            <Button variant="primary" size="sm" className="d-flex align-items-center" onClick={adicionarRisco}>
              <Plus size={16} className="me-1" />
              Novo Risco
            </Button>
          </div>
        </Card.Header>

        <Card.Body>
          {/* Resumo de estatísticas */}
          <div className="row mb-4">
            <div className="col-md-3 mb-3">
              <div className="border rounded p-3 h-100">
                <h6 className="text-muted mb-1">Total de Riscos</h6>
                <h4>{estatisticas.total}</h4>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="border rounded p-3 h-100">
                <h6 className="text-muted mb-1">Riscos Ativos</h6>
                <h4>{estatisticas.ativos}</h4>
                <Badge bg="danger">Alto Impacto: {estatisticas.altoImpacto}</Badge>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="border rounded p-3 h-100">
                <h6 className="text-muted mb-1">Monitorando</h6>
                <h4>{estatisticas.monitorando}</h4>
                <ProgressBar
                  now={(estatisticas.monitorando / estatisticas.total) * 100}
                  variant="warning"
                  className="mt-2"
                  style={{ height: "8px" }}
                />
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="border rounded p-3 h-100">
                <h6 className="text-muted mb-1">Mitigados</h6>
                <h4>{estatisticas.mitigados}</h4>
                <ProgressBar
                  now={(estatisticas.mitigados / estatisticas.total) * 100}
                  variant="success"
                  className="mt-2"
                  style={{ height: "8px" }}
                />
              </div>
            </div>
          </div>

          {/* Tabela de riscos */}
          <div className="table-responsive">
            <Table hover className="align-middle">
              <thead className="table-light">
                <tr>
                  <th style={{ width: "5%" }}>#</th>
                  <th style={{ width: "25%" }}>Descrição</th>
                  <th style={{ width: "10%" }}>Categoria</th>
                  <th style={{ width: "10%" }}>Impacto</th>
                  <th style={{ width: "10%" }}>Probabilidade</th>
                  <th style={{ width: "15%" }}>Responsável</th>
                  <th style={{ width: "10%" }}>Status</th>
                  <th style={{ width: "15%" }}>Ações</th>
                </tr>
              </thead>
              <tbody>
                {riscos.map((risco) => (
                  <tr key={risco.id}>
                    <td>{risco.id}</td>
                    <td>{risco.descricao}</td>
                    <td>{risco.categoria}</td>
                    <td>
                      <Badge bg={getImpactoClass(risco.impacto)}>{risco.impacto}</Badge>
                    </td>
                    <td>{risco.probabilidade}</td>
                    <td>{risco.responsavel}</td>
                    <td>
                      <Badge bg={getStatusClass(risco.status)}>{risco.status}</Badge>
                    </td>
                    <td>
                      <div className="d-flex gap-2">
                        <Button variant="outline-primary" size="sm" onClick={() => editarRisco(risco)}>
                          <Edit2 size={14} />
                        </Button>
                        <Button variant="outline-danger" size="sm" onClick={() => excluirRisco(risco.id)}>
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Modal para adicionar/editar risco */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{riscoAtual?.id ? "Editar Risco" : "Novo Risco"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {riscoAtual && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>Descrição</Form.Label>
                <Form.Control
                  type="text"
                  value={riscoAtual.descricao}
                  onChange={(e) => setRiscoAtual({ ...riscoAtual, descricao: e.target.value })}
                  placeholder="Descreva o risco"
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Categoria</Form.Label>
                <Form.Control
                  type="text"
                  value={riscoAtual.categoria}
                  onChange={(e) => setRiscoAtual({ ...riscoAtual, categoria: e.target.value })}
                  placeholder="Ex: Fornecedores, Operacional, Externo"
                />
              </Form.Group>

              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Impacto</Form.Label>
                    <Form.Select
                      value={riscoAtual.impacto}
                      onChange={(e) => setRiscoAtual({ ...riscoAtual, impacto: e.target.value })}
                    >
                      <option value="Alto">Alto</option>
                      <option value="Médio">Médio</option>
                      <option value="Baixo">Baixo</option>
                    </Form.Select>
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Probabilidade</Form.Label>
                    <Form.Select
                      value={riscoAtual.probabilidade}
                      onChange={(e) => setRiscoAtual({ ...riscoAtual, probabilidade: e.target.value })}
                    >
                      <option value="Alta">Alta</option>
                      <option value="Média">Média</option>
                      <option value="Baixa">Baixa</option>
                    </Form.Select>
                  </Form.Group>
                </div>
              </div>

              <Form.Group className="mb-3">
                <Form.Label>Mitigação</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={2}
                  value={riscoAtual.mitigacao}
                  onChange={(e) => setRiscoAtual({ ...riscoAtual, mitigacao: e.target.value })}
                  placeholder="Estratégia para mitigar o risco"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Responsável</Form.Label>
                <Form.Control
                  type="text"
                  value={riscoAtual.responsavel}
                  onChange={(e) => setRiscoAtual({ ...riscoAtual, responsavel: e.target.value })}
                  placeholder="Nome do responsável"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={riscoAtual.status}
                  onChange={(e) => setRiscoAtual({ ...riscoAtual, status: e.target.value })}
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Monitorando">Monitorando</option>
                  <option value="Mitigado">Mitigado</option>
                </Form.Select>
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={salvarRisco}>
            Salvar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default CardRiscos