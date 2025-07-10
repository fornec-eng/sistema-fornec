"use client"

import { useState } from "react"
import { Card, Badge, Button, Modal, Form, Image } from "react-bootstrap"
import { Users, Phone, Mail, UserPlus } from "lucide-react"

const CardEquipe = ({ obra }) => {
  const [equipe, setEquipe] = useState([
    {
      id: 1,
      nome: "João Silva",
      cargo: "Engenheiro Civil",
      contato: "(11) 98765-4321",
      email: "joao.silva@fornec.com",
      foto: "https://randomuser.me/api/portraits/men/1.jpg",
      status: "Ativo",
    },
    {
      id: 2,
      nome: "Maria Oliveira",
      cargo: "Arquiteta",
      contato: "(11) 91234-5678",
      email: "maria.oliveira@fornec.com",
      foto: "https://randomuser.me/api/portraits/women/2.jpg",
      status: "Ativo",
    },
    {
      id: 3,
      nome: "Carlos Santos",
      cargo: "Mestre de Obras",
      contato: "(11) 99876-5432",
      email: "carlos.santos@fornec.com",
      foto: "https://randomuser.me/api/portraits/men/3.jpg",
      status: "Ativo",
    },
    {
      id: 4,
      nome: "Ana Pereira",
      cargo: "Engenheira Elétrica",
      contato: "(11) 95678-1234",
      email: "ana.pereira@fornec.com",
      foto: "https://randomuser.me/api/portraits/women/4.jpg",
      status: "Férias",
    },
  ])

  const [showModal, setShowModal] = useState(false)
  const [membroAtual, setMembroAtual] = useState(null)

  // Função para obter a classe de cor com base no status
  const getStatusClass = (status) => {
    switch (status) {
      case "Ativo":
        return "success"
      case "Férias":
        return "warning"
      case "Afastado":
        return "danger"
      default:
        return "secondary"
    }
  }

  // Função para abrir o modal de edição
  const editarMembro = (membro) => {
    setMembroAtual(membro)
    setShowModal(true)
  }

  // Função para adicionar novo membro
  const adicionarMembro = () => {
    setMembroAtual({
      id: equipe.length + 1,
      nome: "",
      cargo: "",
      contato: "",
      email: "",
      foto: "https://randomuser.me/api/portraits/lego/1.jpg",
      status: "Ativo",
    })
    setShowModal(true)
  }

  // Função para salvar membro (novo ou editado)
  const salvarMembro = () => {
    if (membroAtual.id) {
      // Editar membro existente
      setEquipe(equipe.map((m) => (m.id === membroAtual.id ? membroAtual : m)))
    } else {
      // Adicionar novo membro
      setEquipe([...equipe, { ...membroAtual, id: equipe.length + 1 }])
    }
    setShowModal(false)
  }

  // Estatísticas da equipe
  const estatisticas = {
    total: equipe.length,
    ativos: equipe.filter((m) => m.status === "Ativo").length,
    ferias: equipe.filter((m) => m.status === "Férias").length,
    afastados: equipe.filter((m) => m.status === "Afastado").length,
  }

  return (
    <div className="col-md-12 mb-4">
      <Card style={{ borderRadius: "10px", boxShadow: "0 4px 10px rgba(0, 0, 0, 0.1)" }}>
        <Card.Header className="bg-white">
          <div className="d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center">
              <Users className="text-primary me-2" size={20} />
              <Card.Title className="mb-0">Equipe da Obra</Card.Title>
            </div>
            <Button variant="primary" size="sm" className="d-flex align-items-center" onClick={adicionarMembro}>
              <UserPlus size={16} className="me-1" />
              Adicionar Membro
            </Button>
          </div>
        </Card.Header>

        <Card.Body>
          {/* Resumo de estatísticas */}
          <div className="row mb-4">
            <div className="col-md-3 mb-3">
              <div className="border rounded p-3 h-100">
                <h6 className="text-muted mb-1">Total de Membros</h6>
                <h4>{estatisticas.total}</h4>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="border rounded p-3 h-100">
                <h6 className="text-muted mb-1">Ativos</h6>
                <h4>{estatisticas.ativos}</h4>
                <Badge bg="success">Disponíveis</Badge>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="border rounded p-3 h-100">
                <h6 className="text-muted mb-1">Em Férias</h6>
                <h4>{estatisticas.ferias}</h4>
                <Badge bg="warning" text="dark">
                  Temporário
                </Badge>
              </div>
            </div>
            <div className="col-md-3 mb-3">
              <div className="border rounded p-3 h-100">
                <h6 className="text-muted mb-1">Afastados</h6>
                <h4>{estatisticas.afastados}</h4>
                <Badge bg="danger">Indisponíveis</Badge>
              </div>
            </div>
          </div>

          {/* Lista de membros da equipe */}
          <div className="row">
            {equipe.map((membro) => (
              <div key={membro.id} className="col-md-6 col-lg-3 mb-4">
                <Card className="h-100 border-0 shadow-sm">
                  <Card.Body className="text-center">
                    <div className="mb-3">
                      <Image
                        src={membro.foto || "/placeholder.svg"}
                        roundedCircle
                        width={80}
                        height={80}
                        className="border"
                      />
                    </div>
                    <h5 className="mb-1">{membro.nome}</h5>
                    <p className="text-muted mb-2">{membro.cargo}</p>
                    <Badge bg={getStatusClass(membro.status)} className="mb-3">
                      {membro.status}
                    </Badge>
                    <div className="d-flex justify-content-center gap-2 mb-3">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        href={`tel:${membro.contato}`}
                        className="d-flex align-items-center"
                      >
                        <Phone size={14} className="me-1" />
                        Ligar
                      </Button>
                      <Button
                        variant="outline-secondary"
                        size="sm"
                        href={`mailto:${membro.email}`}
                        className="d-flex align-items-center"
                      >
                        <Mail size={14} className="me-1" />
                        Email
                      </Button>
                    </div>
                    <Button
                      variant="link"
                      size="sm"
                      className="text-decoration-none"
                      onClick={() => editarMembro(membro)}
                    >
                      Editar Informações
                    </Button>
                  </Card.Body>
                </Card>
              </div>
            ))}
          </div>
        </Card.Body>
      </Card>

      {/* Modal para adicionar/editar membro */}
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>{membroAtual?.id ? "Editar Membro" : "Novo Membro"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {membroAtual && (
            <Form>
              <div className="text-center mb-3">
                <Image
                  src={membroAtual.foto || "/placeholder.svg"}
                  roundedCircle
                  width={100}
                  height={100}
                  className="border"
                />
              </div>

              <Form.Group className="mb-3">
                <Form.Label>Nome</Form.Label>
                <Form.Control
                  type="text"
                  value={membroAtual.nome}
                  onChange={(e) => setMembroAtual({ ...membroAtual, nome: e.target.value })}
                  placeholder="Nome completo"
                  required
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>Cargo</Form.Label>
                <Form.Control
                  type="text"
                  value={membroAtual.cargo}
                  onChange={(e) => setMembroAtual({ ...membroAtual, cargo: e.target.value })}
                  placeholder="Cargo ou função"
                />
              </Form.Group>

              <div className="row">
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Contato</Form.Label>
                    <Form.Control
                      type="text"
                      value={membroAtual.contato}
                      onChange={(e) => setMembroAtual({ ...membroAtual, contato: e.target.value })}
                      placeholder="Telefone"
                    />
                  </Form.Group>
                </div>
                <div className="col-md-6">
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      value={membroAtual.email}
                      onChange={(e) => setMembroAtual({ ...membroAtual, email: e.target.value })}
                      placeholder="Email"
                    />
                  </Form.Group>
                </div>
              </div>

              <Form.Group className="mb-3">
                <Form.Label>Status</Form.Label>
                <Form.Select
                  value={membroAtual.status}
                  onChange={(e) => setMembroAtual({ ...membroAtual, status: e.target.value })}
                >
                  <option value="Ativo">Ativo</option>
                  <option value="Férias">Férias</option>
                  <option value="Afastado">Afastado</option>
                </Form.Select>
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Label>URL da Foto</Form.Label>
                <Form.Control
                  type="text"
                  value={membroAtual.foto}
                  onChange={(e) => setMembroAtual({ ...membroAtual, foto: e.target.value })}
                  placeholder="URL da imagem"
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={salvarMembro}>
            Salvar
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default CardEquipe
