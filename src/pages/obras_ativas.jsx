import React, { useState, useEffect } from 'react';
import { Card, Button, Modal, Form, Row, Col, Container, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import ApiBase from '../services/ApiBase';

// 10 ilustrações do Freepik (exemplos). Verifique a licença antes de usar.
const watermarkImages = [ 
    'https://img.freepik.com/vetores-gratis/ilustracao-do-conceito-de-construcao_114360-2558.jpg', 
    'https://img.freepik.com/vetores-premium/arquiteto-ou-engenheiro-no-canteiro-de-obras-segurando-o-homem-do-plano-de-construcao-na-ilustracao-do-canteiro-de-obras_375605-340.jpg', 
    'https://img.freepik.com/vetores-premium/ilustracao-plana-para-celebracao-do-dia-dos-engenheiros_23-2149549867.jpg', 
    'https://https://img.freepik.com/vetores-gratis/ilustracao-de-engenharia-e-construcao_23-2148904169.jpg', 
    'https://img.freepik.com/vetores-gratis/pessoas-trabalhando-na-construcao_23-2148888797.jpg', 
    'https://img.freepik.com/vetores-gratis/ilustracao-de-engenharia-e-construcao-plana_52683-59165.jpg', 
    'https://img.freepik.com/vetores-gratis/ilustracao-de-engenharia-e-construcao-plana_23-2148897395.jpg', 
    'https://img.freepik.com/vetores-gratis/ilustracao-de-engenharia-e-construcao_23-2148904168.jpg' 
];

const Obras_ativas = () => {
  const [obras, setObras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newObraName, setNewObraName] = useState('');
  const [summariesLoading, setSummariesLoading] = useState(false);

  // IDs fixos da pasta e do modelo
  const folderId = '1ALOCpJyPNQe51HC0TSNX68oa8SIkZqcW';
  const templateId = '1tnLeEwbrDgpE8p26zcUe3fhWpmmKnxifyiymxgsX8aU';

  // 1) Buscar lista de planilhas e filtrar "modelo_planilha_obra (Não mexer)"
  const fetchObras = async () => {
    setLoading(true);
    try {
      const response = await ApiBase.get(`/google/drive/${folderId}`);
      const filtered = response.data.filter(
        (obra) => obra.name !== 'modelo_planilha_obra (Não mexer)'
      );
      setObras(filtered);
    } catch (error) {
      console.error('Erro ao buscar obras:', error);
    } finally {
      setLoading(false);
    }
  };

  // 2) Para cada obra, buscar o 'Resumo' via /google/sheets/data (POST)
  const fetchSummaryDataForObras = async () => {
    if (obras.length === 0) return;
    setSummariesLoading(true);

    try {
      const updatedObras = await Promise.all(
        obras.map(async (obra) => {
          try {
            const res = await ApiBase.post('/google/sheets/data', {
              data: { spreadsheetId: obra.id, range: 'Resumo' }
            });
            const values = res.data.values || [];
            const summaryData = parseResumo(values);
            return {
              ...obra,
              summaryData
            };
          } catch (err) {
            console.error(`Erro ao buscar resumo para a obra ${obra.name}:`, err);
            return { ...obra, summaryData: null };
          }
        })
      );
      setObras(updatedObras);
    } catch (err) {
      console.error('Erro no Promise.all:', err);
    } finally {
      setSummariesLoading(false);
    }
  };

  // Extrai dados do array "values" retornado
  const parseResumo = (values) => {
    const summary = {};
    values.forEach((row) => {
      if (row[0] === 'Orçamento:') summary.orcamento = row[1];
      if (row[0] === 'Início da Obra:') summary.inicio = row[1];
      if (row[0] === 'Data final de Entrega:') summary.fim = row[1];
      if (row[0] === 'Gasto total:') summary.gastoTotal = row[1];
    });
    return summary;
  };

  useEffect(() => {
    fetchObras();
  }, []);

  useEffect(() => {
    if (obras.length > 0) {
      fetchSummaryDataForObras();
    }
  }, [obras.length]);

  // Cria nova obra (cópia da planilha modelo)
  const handleCreateObra = async (e) => {
    e.preventDefault();
    try {
      const data = {
        templateId: templateId,
        newTitle: newObraName,
        folderId: folderId
      };
      await ApiBase.post('/google/sheets/copy', { data });
      setNewObraName('');
      setShowModal(false);
      fetchObras();
    } catch (error) {
      console.error('Erro ao criar obra:', error);
    }
  };

  // Estilos do card, sem minHeight
  const cardContainerStyle = {
    position: 'relative',
    borderRadius: '12px',
    boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden'
  };

  // Imagem preenche o card, mas não define altura
  const cardImageStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    zIndex: 1
  };

  // Overlay para o conteúdo, garantindo leitura
  const overlayStyle = {
    position: 'relative',
    zIndex: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: '8px',
    padding: '1rem'
  };

  return (
    <Container className="mt-4">
      <h1 className="text-center mb-4">Lista de Obras</h1>

      {(loading || summariesLoading) && (
        <div className="d-flex justify-content-center">
          <Spinner animation="border" variant="primary" />
          <span className="ms-2">Carregando...</span>
        </div>
      )}

      {!loading && !summariesLoading && (
        <Row className="g-4 justify-content-center">
          {obras.length > 0 ? (
            obras.map((obra, index) => {
              // Cada obra recebe uma imagem fixa, baseada no index
              const imageIndex = index % watermarkImages.length;
              const imageUrl = watermarkImages[imageIndex];

              return (
                <Col key={obra.id} xs={12} sm={6} md={4} lg={3}>
                  <Card style={cardContainerStyle} className="h-100">
                    {/* Imagem de fundo absoluta */}
                    <img src={imageUrl} alt="Fundo Engenharia" style={cardImageStyle} />

                    {/* Conteúdo sobreposto */}
                    <Card.Body style={{ position: 'relative', zIndex: 2 }}>
                      <div style={overlayStyle}>
                        <Card.Title style={{ fontSize: '1.25rem', fontWeight: '600' }}>
                          {obra.name}
                        </Card.Title>

                        {obra.summaryData ? (
                          <>
                            <p><strong>Orçamento:</strong> {obra.summaryData.orcamento || 'N/A'}</p>
                            <p><strong>Início:</strong> {obra.summaryData.inicio || 'N/A'}</p>
                            <p><strong>Fim:</strong> {obra.summaryData.fim || 'N/A'}</p>
                            <p><strong>Gasto Total:</strong> {obra.summaryData.gastoTotal || 'N/A'}</p>
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
                              window.open(
                                `https://docs.google.com/spreadsheets/d/${obra.id}/edit`,
                                '_blank'
                              )
                            }
                          >
                            Planilha
                          </Button>
                          <Link
                            to={`/dashboard/${obra.id}`}
                            className="w-50"
                            style={{ textDecoration: 'none' }}
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
              );
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
                borderRadius: '12px',
                boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)'
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
