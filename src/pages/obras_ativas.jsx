import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, Form, Row, Col, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import ApiBase from '../services/ApiBase';

const Obras_ativas = () => {
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newObraName, setNewObraName] = useState('');

  // Substitua 'YOUR_FOLDER_ID' pelo ID da sua pasta onde estão as planilhas
  const folderId = '1ALOCpJyPNQe51HC0TSNX68oa8SIkZqcW';
  const templateId = '1tnLeEwbrDgpE8p26zcUe3fhWpmmKnxifyiymxgsX8aU';
  
  // Função para buscar as obras (arquivos na pasta)
  const fetchObras = async () => {
    setLoading(true);
    try {
      const response = await ApiBase.get(`/google/drive/${folderId}`);
      setObras(response.data);
    } catch (error) {
      console.error('Erro ao buscar obras:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObras();
  }, []);

  // Função para criar uma nova obra (nova planilha) e atualizar a lista
  const handleCreateObra = async (e) => {
    e.preventDefault();
    try {
      // Cria a nova planilha enviando o título no body
      const data = {
        templateId: templateId, 
        newTitle: newObraName, 
        folderId: folderId
      }
      await ApiBase.post('/google/sheets/copy', { data });
      setNewObraName('');
      setShowModal(false);
      // Atualiza a lista de obras
      fetchObras();
    } catch (error) {
      console.error('Erro ao criar obra:', error);
    }
  };

  return (
    <Container className="mt-4">
      <h1>Lista de Obras</h1>
      {loading ? (
        <p>Carregando...</p>
      ) : (
        <Row>
          {obras.length > 0 ? (
            obras.map((obra) => (
              <Col key={obra.id} md={4} className="mb-4">
                <Card className="h-100">
                  <Card.Body>
                    <Card.Title>{obra.name}</Card.Title>
                    {/* O link 'stretched-link' torna o card inteiro clicável */}
                    <Link to={`/dashboard/${obra.id}`} className="stretched-link"></Link>
                  </Card.Body>
                </Card>
              </Col>
            ))
          ) : (
            <Col>
              <p>Nenhuma obra encontrada.</p>
            </Col>
          )}
          {/* Card para adicionar nova obra */}
          <Col md={4} className="mb-4">
            <Card className="h-100 text-center">
              <Card.Body>
                <Card.Title>Adicionar Nova Obra</Card.Title>
                <Button variant="primary" onClick={() => setShowModal(true)}>
                  Nova Obra
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Modal para criar nova obra */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Form onSubmit={handleCreateObra}>
          <Modal.Header closeButton>
            <Modal.Title>Nova Obra</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Form.Group controlId="obraName">
              <Form.Label>Nome da Obra</Form.Label>
              <Form.Control
                type="text"
                placeholder="Digite o nome da obra"
                value={newObraName}
                onChange={(e) => setNewObraName(e.target.value)}
                required
              />
            </Form.Group>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowModal(false)}>
              Cancelar
            </Button>
            <Button variant="primary" type="submit">
              Criar
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </Container>
  );
};

export default Obras_ativas;
