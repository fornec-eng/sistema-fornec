import React, { useState, useEffect } from 'react';
import { Card, Modal, Button, InputGroup, FormControl, Tooltip, OverlayTrigger, Spinner } from 'react-bootstrap';

const PagamentoCard = () => {
  const [funcionarios, setFuncionarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleShowModal = (funcionario) => {
    setFuncionarioSelecionado(funcionario);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFuncionarioSelecionado(null);
    setCopied(false);
  };

  const handleCopyPix = (chavePix) => {
    navigator.clipboard.writeText(chavePix);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('https://api-google-sheets-7zph.vercel.app/getDataEngMaoObra');
        const data = await response.json();
        const rows = data.values;

        const headerRow = rows[1];
        const indices = {
          nome: headerRow.indexOf('Nome'),
          funcao: headerRow.indexOf('Função'),
          tipoContratacao: headerRow.indexOf('Tipo de Contratação'),
          valorDevido: headerRow.indexOf('Valor Devido'),
          chavePix: headerRow.indexOf('CHAVE PIX'),
          status: headerRow.indexOf('Status:'),
        };

        const filteredFuncionarios = rows
          .slice(2)
          .filter((row) => row[indices.status]?.trim() === 'Pagar')
          .map((row) => ({
            nome: row[indices.nome] || '-',
            funcao: row[indices.funcao] || '-',
            tipoContratacao: row[indices.tipoContratacao] || '-',
            valorDevido: row[indices.valorDevido] || '-',
            chavePix: row[indices.chavePix] || '-',
          }));

        setFuncionarios(filteredFuncionarios);
        setLoading(false);
      } catch (error) {
        console.error('Erro ao buscar os dados:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="col-md-6 col-lg-6">
      <Card style={{ height: '100%', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)' }}>
        <Card.Body>
          <Card.Title>Lista de pagamento</Card.Title>
          {loading ? (
            <Spinner animation="border" />
          ) : (
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <ul className="list-group list-group-flush">
                {funcionarios.length > 0 ? (
                  funcionarios.map((funcionario, index) => (
                    <li
                      key={index}
                      className="list-group-item d-flex justify-content-between align-items-center"
                      style={{ cursor: 'pointer', padding: '10px' }}
                      onClick={() => handleShowModal(funcionario)}
                    >
                      <span style={{ flex: 1, wordBreak: 'break-word' }}>{funcionario.nome}</span>
                      <span style={{ flex: 1, wordBreak: 'break-word' }}>{funcionario.funcao}</span>
                      <span style={{ flex: 1, wordBreak: 'break-word' }}>{funcionario.valorDevido}</span>
                    </li>
                  ))
                ) : (
                  <li className="list-group-item">Nenhum funcionário para pagamento.</li>
                )}
              </ul>
            </div>
          )}
        </Card.Body>
      </Card>

      {funcionarioSelecionado && (
        <Modal show={showModal} onHide={handleCloseModal} centered>
          <Modal.Header closeButton>
            <Modal.Title>Detalhes do Funcionário</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <ul>
              <li><strong>Nome:</strong> {funcionarioSelecionado.nome}</li>
              <li><strong>Função:</strong> {funcionarioSelecionado.funcao}</li>
              <li><strong>Tipo de Contratação:</strong> {funcionarioSelecionado.tipoContratacao}</li>
              <li><strong>Valor Devido:</strong> {funcionarioSelecionado.valorDevido}</li>
              <li>
                <strong>Chave PIX:</strong>
                <InputGroup className="mb-3">
                  <FormControl
                    value={funcionarioSelecionado.chavePix}
                    readOnly
                    style={{ cursor: 'pointer' }}
                  />
                  <OverlayTrigger
                    placement="top"
                    overlay={<Tooltip id="tooltip-copy">{copied ? 'Chave PIX copiada!' : 'Clique para copiar'}</Tooltip>}
                  >
                    <Button variant="outline-secondary" onClick={() => handleCopyPix(funcionarioSelecionado.chavePix)}>
                      Copiar
                    </Button>
                  </OverlayTrigger>
                </InputGroup>
              </li>
            </ul>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Fechar
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </div>
  );
};

export default PagamentoCard;