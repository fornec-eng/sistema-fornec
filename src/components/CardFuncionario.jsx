import React, { useState, useEffect } from 'react';
import {
  Container,
  Row,
  Col,
  Card,
  Table,
  Spinner,
  Modal,
  Button,
  FormSelect,
  InputGroup,
  FormControl,
  Tooltip,
  OverlayTrigger
} from 'react-bootstrap';
import ApiBase from '../services/ApiBase';

const PagamentoCard = () => {
  // Pastas do Google Drive
  const FOLDER_ATUAL_ID = '1JWqpHfPvYy9B846cXPTYotImfd3xqhRC';      // Pagamentos atuais
  const FOLDER_HISTORICO_ID = '1BMKBm2pk16I-KyrTyd1l2GpBU4t2Id_o'; // Histórico de pagamentos

  // Estados para armazenar a lista de planilhas de cada pasta
  const [planilhasAtuais, setPlanilhasAtuais] = useState([]);
  const [planilhasHistorico, setPlanilhasHistorico] = useState([]);

  // Planilha selecionada (ID) e dados carregados
  const [selectedSpreadsheetId, setSelectedSpreadsheetId] = useState('');
  const [funcionarios, setFuncionarios] = useState([]);

  // Controle de loading
  const [loadingPlanilhas, setLoadingPlanilhas] = useState(false);
  const [loadingDados, setLoadingDados] = useState(false);

  // Modal de detalhes
  const [showModal, setShowModal] = useState(false);
  const [funcionarioSelecionado, setFuncionarioSelecionado] = useState(null);

  // Controle de cópia de PIX
  const [copied, setCopied] = useState(false);

  // Nomes de planilhas a serem ignoradas
  const IGNORAR_NOMES = [
    'Automatização da Planilha Semanal',
    'Modelo',
    'Histórico'
  ];

  // Ao montar, busca as planilhas das duas pastas
  useEffect(() => {
    const fetchPlanilhas = async () => {
      try {
        setLoadingPlanilhas(true);

        // 1) Busca planilhas de pagamentos atuais
        const resAtuais = await ApiBase.get(`/google/drive/${FOLDER_ATUAL_ID}`);
        const listaAtuais = (resAtuais.data || []).filter(
          (plan) => !IGNORAR_NOMES.includes(plan.name)
        );
        setPlanilhasAtuais(listaAtuais);

        // 2) Busca planilhas de histórico de pagamentos
        const resHistorico = await ApiBase.get(`/google/drive/${FOLDER_HISTORICO_ID}`);
        const listaHistorico = (resHistorico.data || []).filter(
          (plan) => !IGNORAR_NOMES.includes(plan.name)
        );
        setPlanilhasHistorico(listaHistorico);

        // Se houver ao menos 1 planilha atual, define como selecionada por padrão
        if (listaAtuais.length > 0) {
          const primeiraPlanilha = listaAtuais[0];
          setSelectedSpreadsheetId(primeiraPlanilha.id);
          carregarDadosPlanilha(primeiraPlanilha.id);
        }
      } catch (error) {
        console.error('Erro ao listar planilhas:', error);
      } finally {
        setLoadingPlanilhas(false);
      }
    };

    fetchPlanilhas();
  }, []);

  // Função para buscar os dados do range 'pagamento_semanal' da planilha selecionada
  const carregarDadosPlanilha = async (spreadsheetId) => {
    if (!spreadsheetId) return;
    try {
      setLoadingDados(true);

      // Faz a requisição para /google/sheets/data
      const res = await ApiBase.post('/google/sheets/data', {
        data: {
          spreadsheetId,
          range: 'pagamento_semanal',
        },
      });

      const rows = res.data.values || [];
      console.log('Retorno da planilha:', rows);

      // Verifica se há pelo menos 2 linhas:
      // - Linha 0 (título extra, ex.: "Mão de Obra")
      // - Linha 1 (cabeçalho real)
      if (rows.length < 2) {
        setFuncionarios([]);
        setLoadingDados(false);
        return;
      }

      // A linha 1 (rows[1]) é o cabeçalho real
      const headerRow = rows[1];

      // Mapeia cada coluna ao índice correspondente
      const indices = {
        nome: headerRow.indexOf('Nome'),
        funcao: headerRow.indexOf('Função'),
        tipoContratacao: headerRow.indexOf('Tipo de Contratação'),
        valorDevido: headerRow.indexOf('Valor Devido'),
        inicioContrato: headerRow.indexOf('Início contrato'),
        fimContrato: headerRow.indexOf('Fim contrato'),
        chavePix: headerRow.indexOf('CHAVE PIX'),
        nomePix: headerRow.indexOf('NOME DO PIX'),
        qualificacaoTecnica: headerRow.indexOf('QUALIFICAÇÃO TECNICA'),
        valorVT: headerRow.indexOf('VALOR DO VT'),
        valorAlimentacao: headerRow.indexOf('VALOR DA ALIMENTAÇÃO'),
        vtAlimentacaoSemana: headerRow.indexOf('VALOR DO VT MAIS ALIMENT NA SEMANA'),
        vale: headerRow.indexOf('VALE'),
        totalReceber: headerRow.indexOf('TOTAL A RECEBER'),
        status: headerRow.indexOf('Status:')
      };

      // As linhas de dados começam em rows[2]
      const dataRows = rows.slice(2);

      // Monta a lista de funcionários
      const parsedFuncionarios = dataRows.map((row) => ({
        nome: row[indices.nome] || '',
        funcao: row[indices.funcao] || '',
        tipoContratacao: row[indices.tipoContratacao] || '',
        valorDevido: row[indices.valorDevido] || '',
        inicioContrato: row[indices.inicioContrato] || '',
        fimContrato: row[indices.fimContrato] || '',
        chavePix: row[indices.chavePix] || '',
        nomePix: row[indices.nomePix] || '',
        qualificacaoTecnica: row[indices.qualificacaoTecnica] || '',
        valorVT: row[indices.valorVT] || '',
        valorAlimentacao: row[indices.valorAlimentacao] || '',
        vtAlimentacaoSemana: row[indices.vtAlimentacaoSemana] || '',
        vale: row[indices.vale] || '',
        totalReceber: row[indices.totalReceber] || '',
        status: row[indices.status] || ''
      }));

      setFuncionarios(parsedFuncionarios);
    } catch (error) {
      console.error('Erro ao carregar dados da planilha:', error);
      setFuncionarios([]);
    } finally {
      setLoadingDados(false);
    }
  };

  // Abre o modal com detalhes de um funcionário
  const handleShowModal = (funcionario) => {
    setFuncionarioSelecionado(funcionario);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setFuncionarioSelecionado(null);
    setCopied(false);
  };

  // Cópia da chave PIX
  const handleCopyPix = (chavePix) => {
    navigator.clipboard.writeText(chavePix);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Quando o usuário seleciona uma planilha no dropdown, carrega seus dados
  const handleSelectPlanilha = (e) => {
    const chosenId = e.target.value;
    setSelectedSpreadsheetId(chosenId);
    carregarDadosPlanilha(chosenId);
  };

  // Retorna a classe (ou estilo) baseado no status
  const getStatusBadgeClass = (status) => {
    if (status === 'Pagar') {
      return 'bg-warning text-dark'; // Amarelo
    } else if (status === 'Pagamento Efetuado') {
      return 'bg-success'; // Verde
    }
    return 'bg-secondary'; // Cinza (caso apareça algum outro status)
  };

  return (
    <Container className="mt-4">
      <h1 className="mb-4">Pagamento Semanal</h1>

      {loadingPlanilhas ? (
        <div className="d-flex align-items-center mb-4">
          <Spinner animation="border" variant="primary" className="me-2" />
          Carregando planilhas...
        </div>
      ) : (
        <>
          <Row className="mb-4">
            <Col md={6}>
              <Card style={{ borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                <Card.Body>
                  <Card.Title>Semana Atual</Card.Title>
                  <FormSelect onChange={handleSelectPlanilha} value={selectedSpreadsheetId}>
                    <option value="">Selecione uma planilha...</option>
                    {planilhasAtuais.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name}
                      </option>
                    ))}
                  </FormSelect>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card style={{ borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
                <Card.Body>
                  <Card.Title>Histórico de Semanas</Card.Title>
                  <FormSelect onChange={handleSelectPlanilha} value={selectedSpreadsheetId}>
                    <option value="">Selecione uma semana anterior...</option>
                    {planilhasHistorico.map((plan) => (
                      <option key={plan.id} value={plan.id}>
                        {plan.name}
                      </option>
                    ))}
                  </FormSelect>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Card style={{ borderRadius: '10px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}>
            <Card.Body>
              <Card.Title>Funcionários para Pagamento</Card.Title>

              {loadingDados ? (
                <div className="d-flex align-items-center">
                  <Spinner animation="border" variant="primary" className="me-2" />
                  Carregando dados...
                </div>
              ) : (
                <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
                  {funcionarios.length === 0 ? (
                    <p className="text-muted">Nenhum registro encontrado.</p>
                  ) : (
                    <Table striped bordered hover>
                      <thead>
                        <tr>
                          <th>Nome</th>
                          <th>Função</th>
                          <th>Valor Devido</th>
                          <th>Status</th>
                          <th style={{ width: '120px' }}>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {funcionarios.map((func, idx) => (
                          <tr key={idx}>
                            <td>{func.nome}</td>
                            <td>{func.funcao}</td>
                            <td>{func.valorDevido}</td>
                            <td>
                              <span className={`badge ${getStatusBadgeClass(func.status)}`}>
                                {func.status}
                              </span>
                            </td>
                            <td>
                              <Button
                                variant="outline-primary"
                                size="sm"
                                onClick={() => handleShowModal(func)}
                              >
                                Detalhes
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </div>
              )}
            </Card.Body>
          </Card>
        </>
      )}

      {/* Modal de detalhes */}
      {funcionarioSelecionado && (
        <Modal show={showModal} onHide={handleCloseModal} centered>
          <Modal.Header closeButton>
            <Modal.Title>Detalhes do Pagamento</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <p><strong>Nome:</strong> {funcionarioSelecionado.nome}</p>
            <p><strong>Função:</strong> {funcionarioSelecionado.funcao}</p>
            <p><strong>Tipo de Contratação:</strong> {funcionarioSelecionado.tipoContratacao}</p>
            <p><strong>Valor Devido:</strong> {funcionarioSelecionado.valorDevido}</p>
            <p><strong>Início contrato:</strong> {funcionarioSelecionado.inicioContrato}</p>
            <p><strong>Fim contrato:</strong> {funcionarioSelecionado.fimContrato}</p>
            <p><strong>QUALIFICAÇÃO TÉCNICA:</strong> {funcionarioSelecionado.qualificacaoTecnica}</p>
            <p><strong>VALOR DO VT:</strong> {funcionarioSelecionado.valorVT}</p>
            <p><strong>VALOR DA ALIMENTAÇÃO:</strong> {funcionarioSelecionado.valorAlimentacao}</p>
            <p><strong>VT + ALIMENT (semana):</strong> {funcionarioSelecionado.vtAlimentacaoSemana}</p>
            <p><strong>VALE:</strong> {funcionarioSelecionado.vale}</p>
            <p><strong>TOTAL A RECEBER:</strong> {funcionarioSelecionado.totalReceber}</p>
            <p><strong>Status:</strong> {funcionarioSelecionado.status}</p>

            <p><strong>NOME DO PIX:</strong> {funcionarioSelecionado.nomePix}</p>
            <p><strong>CHAVE PIX:</strong></p>
            <InputGroup className="mb-3">
              <FormControl
                value={funcionarioSelecionado.chavePix}
                readOnly
                style={{ cursor: 'pointer' }}
              />
              <OverlayTrigger
                placement="top"
                overlay={
                  <Tooltip id="tooltip-copy">
                    {copied ? 'Chave PIX copiada!' : 'Clique para copiar'}
                  </Tooltip>
                }
              >
                <Button
                  variant="outline-secondary"
                  onClick={() => handleCopyPix(funcionarioSelecionado.chavePix)}
                >
                  Copiar
                </Button>
              </OverlayTrigger>
            </InputGroup>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModal}>
              Fechar
            </Button>
          </Modal.Footer>
        </Modal>
      )}
    </Container>
  );
};

export default PagamentoCard;