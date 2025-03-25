import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Table, Button, Modal, Form, Tabs, Tab } from 'react-bootstrap';
import ApiBase from '../services/ApiBase';

const Usuarios = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [approvedUsers, setApprovedUsers] = useState([]);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [selectedPendingUser, setSelectedPendingUser] = useState(null);
  const [approveRole, setApproveRole] = useState('User');
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editData, setEditData] = useState({
    nome: '',
    email: '',
    role: '',
  });

  function getToken() {
    let token = localStorage.getItem('token');
    if (!token) {
      token = sessionStorage.getItem('token');
    }
    return token;
  }
  
  const token = getToken();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await ApiBase.get('/list', { params: { limit: 100 } });
      if (!res.data.error) {
        const users = res.data.users;
        const pending = users.filter((user) => user.role === 'PreAprovacao');
        const approved = users.filter((user) => user.role !== 'PreAprovacao');
        setPendingUsers(pending);
        setApprovedUsers(approved);
      }
    } catch (err) {
      console.error('Erro ao buscar usuários:', err);
    }
  };

  // -- Lógica de aprovação e rejeição (usuários pendentes)
  const handleApproveClick = (user) => {
    setSelectedPendingUser(user);
    setApproveRole('User'); // role padrão para aprovação
    setShowApproveModal(true);
  };

  const handleApprove = async () => {
    try {
        await ApiBase.put(
            `/user/${selectedPendingUser._id}`,
            { role: approveRole, approved: true },
            { headers: { Authorization: `Bearer ${token}` } }
          );
      fetchUsers();
      setShowApproveModal(false);
    } catch (err) {
      console.error('Erro ao aprovar usuário:', err);
    }
  };

  const handleReject = async (user) => {
    if (window.confirm(`Deseja rejeitar o usuário ${user.nome}?`)) {
      try {
        await ApiBase.delete(`/user/${user._id}`);
        fetchUsers();
      } catch (err) {
        console.error('Erro ao rejeitar usuário:', err);
      }
    }
  };

  // -- Lógica de edição e exclusão (usuários aprovados)
  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditData({ nome: user.nome, email: user.email, role: user.role });
    setShowEditModal(true);
  };

  const handleEditChange = (e) => {
    setEditData({ ...editData, [e.target.name]: e.target.value });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    // Verifica se é o último Admin
    const adminCount = approvedUsers.filter((u) => u.role === 'Admin').length;
    if (
      selectedUser.role === 'Admin' &&
      editData.role !== 'Admin' &&
      adminCount === 1
    ) {
      alert('Não é possível alterar a role do último administrador.');
      return;
    }

    try {
      await ApiBase.put(`/user/${selectedUser._id}`, editData);
      fetchUsers();
      setShowEditModal(false);
    } catch (err) {
      console.error('Erro ao editar usuário:', err);
    }
  };

  const handleDeleteUser = async (user) => {
    // Verifica se é o último Admin
    const adminCount = approvedUsers.filter((u) => u.role === 'Admin').length;
    if (user.role === 'Admin' && adminCount === 1) {
      alert('Não é possível excluir o último administrador.');
      return;
    }

    if (window.confirm(`Deseja apagar o usuário ${user.nome}?`)) {
      try {
        await ApiBase.delete(`/user/${user._id}`);
        fetchUsers();
      } catch (err) {
        console.error('Erro ao apagar usuário:', err);
      }
    }
  };

  // Quantidade de administradores
  const adminCount = approvedUsers.filter((user) => user.role === 'Admin').length;

  return (
    <Container
      className="my-4"
      style={{ fontFamily: 'Rawline', maxWidth: '900px' }}
    >
      <Row>
        <Col>
          <div className="d-flex justify-content-between align-items-center mb-5">
            <h1
              style={{
                fontSize: '2rem', 
                fontFamily: 'Rawline',
                fontWeight: '600',
                textAlign: 'center',
                width: '100%'
              }}
            >
            Gerenciamento de Usuários</h1>
          </div>

        </Col>
      </Row>

      <Row>
        <Col>
          <Tabs defaultActiveKey="pendentes" id="user-management-tabs" className="mb-3">
            {/* Aba de Pendentes */}
            <Tab eventKey="pendentes" title="Pendentes de Aprovação">
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Email</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingUsers.length ? (
                      pendingUsers.map((user) => (
                        <tr key={user._id}>
                          <td>{user.nome}</td>
                          <td>{user.email}</td>
                          <td>
                            <div className="d-flex flex-wrap gap-2">
                              <Button
                                variant="success"
                                size="sm"
                                onClick={() => handleApproveClick(user)}
                              >
                                Aprovar
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleReject(user)}
                              >
                                Rejeitar
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-center">
                          Nenhum usuário pendente.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Tab>

            {/* Aba de Todos Usuários */}
            <Tab eventKey="todos" title="Todos Usuários">
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedUsers.length ? (
                      approvedUsers.map((user) => (
                        <tr key={user._id}>
                          <td>{user.nome}</td>
                          <td>{user.email}</td>
                          <td>{user.role}</td>
                          <td>
                            <div className="d-flex flex-wrap gap-2">
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => openEditModal(user)}
                              >
                                Editar
                              </Button>
                              <Button
                                variant="danger"
                                size="sm"
                                onClick={() => handleDeleteUser(user)}
                                disabled={user.role === 'Admin' && adminCount === 1}
                              >
                                Apagar
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="text-center">
                          Nenhum usuário encontrado.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            </Tab>
          </Tabs>
        </Col>
      </Row>

      {/* Modal para aprovação */}
      <Modal show={showApproveModal} onHide={() => setShowApproveModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Aprovar Usuário</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            Selecione a função para o usuário <strong>{selectedPendingUser?.nome}</strong>:
          </p>
          <Form>
            <Form.Group controlId="formRole">
              <Form.Label>Função:</Form.Label>
              <Form.Control
                as="select"
                value={approveRole}
                onChange={(e) => setApproveRole(e.target.value)}
              >
                <option value="User">User</option>
                <option value="Admin">Admin</option>
              </Form.Control>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowApproveModal(false)}>
            Cancelar
          </Button>
          <Button variant="success" onClick={handleApprove}>
            Aprovar
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal para edição */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Editar Usuário</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleEditSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Nome</Form.Label>
              <Form.Control
                type="text"
                name="nome"
                value={editData.nome}
                onChange={handleEditChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                name="email"
                value={editData.email}
                onChange={handleEditChange}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Control
                as="select"
                name="role"
                value={editData.role}
                onChange={handleEditChange}
                disabled={
                  selectedUser?.role === 'Admin' &&
                  adminCount === 1
                }
              >
                <option value="User">User</option>
                <option value="Admin">Admin</option>
                <option value="PreAprovacao">PreAprovacao</option>
              </Form.Control>
              {selectedUser?.role === 'Admin' &&
                adminCount === 1 && (
                  <small className="text-muted">
                    Não é possível alterar a role do último administrador.
                  </small>
                )}
            </Form.Group>
            <Button variant="primary" type="submit">
              Salvar Alterações
            </Button>
          </Form>
        </Modal.Body>
      </Modal>
    </Container>
  );
};

export default Usuarios;