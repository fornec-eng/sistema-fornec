import React, { useEffect, useState } from 'react';
import { Card, ProgressBar, Spinner } from 'react-bootstrap';
import ApiBase from '../services/ApiBase';

const TempoTranscorridoCard = ({ obra }) => {
  const [dataInicio, setDataInicio] = useState(null);
  const [dataTermino, setDataTermino] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Realiza a requisição utilizando a nova API
        const res = await ApiBase.post('/google/sheets/data', {
          data: { spreadsheetId: obra.id, range: 'Resumo' }
        });
        const values = res.data.values || [];

        const inicioArray = values.find((item) => item[0] === 'Início da Obra:');
        const terminoArray = values.find((item) => item[0] === 'Data final de Entrega:');

        if (inicioArray && terminoArray) {
          setDataInicio(new Date(inicioArray[1].split('/').reverse().join('-')));
          setDataTermino(new Date(terminoArray[1].split('/').reverse().join('-')));
        }
      } catch (error) {
        console.error('Erro ao buscar os dados:', error);
      } finally {
        setLoading(false);
      }
    };

    // Certifica que o objeto obra está disponível para a requisição
    if (obra && obra.id) {
      fetchData();
    } else {
      setLoading(false);
    }
  }, [obra]);

  if (loading) {
    return (
      <div className="col-md-6 col-lg-4">
        <Card style={{ minHeight: '200px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)' }}>
          <Card.Body className="d-flex justify-content-center align-items-center">
            <Spinner animation="border" />
          </Card.Body>
        </Card>
      </div>
    );
  }

  if (!dataInicio || !dataTermino) {
    return (
      <div className="col-md-6 col-lg-4">
        <Card style={{ minHeight: '200px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)' }}>
          <Card.Body className="d-flex justify-content-center align-items-center text-danger">
            <span>Erro ao carregar as datas.</span>
          </Card.Body>
        </Card>
      </div>
    );
  }

  // Zera as horas para garantir o cálculo correto
  dataInicio.setHours(0, 0, 0, 0);
  dataTermino.setHours(0, 0, 0, 0);
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  // Cálculos para o progresso do tempo
  const totalDias = Math.ceil((dataTermino - dataInicio) / (1000 * 3600 * 24));
  const diasTranscorridos = Math.ceil((hoje - dataInicio) / (1000 * 3600 * 24));
  const progresso = Math.min(Math.max((diasTranscorridos / totalDias) * 100, 0), 100);
  const diasRestantes = Math.max(totalDias - diasTranscorridos, 0);

  return (
    <div className="col-md-6 col-lg-4">
      <Card style={{ minHeight: '200px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)' }}>
        <Card.Body className="d-flex flex-column justify-content-between">
          <Card.Title className="text-center mb-4" style={{ fontWeight: 'bold', fontSize: '1.2rem' }}>
            Tempo Transcorrido e Faltante
          </Card.Title>
          <div className="d-flex justify-content-between align-items-center text-muted small">
            <span>Início: {new Date(dataInicio.getTime() + 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
            <span>Término: {new Date(dataTermino.getTime() + 24 * 60 * 60 * 1000).toLocaleDateString()}</span>
          </div>
          <div className="d-flex justify-content-center mb-3">
            <ProgressBar 
              now={progresso} 
              className="w-75" 
              variant="success" 
              style={{ height: '20px', borderRadius: '5px' }} 
            />
          </div>
          <div className="d-flex justify-content-between align-items-center">
            <div className="text-muted small">
              <i className="bi bi-clock" style={{ marginRight: '5px' }}></i> {progresso.toFixed(0)}% transcorrido
            </div>
            <div className="text-muted small">
              <i className="bi bi-hourglass-split" style={{ marginRight: '5px' }}></i> {diasRestantes} dias restantes
            </div>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default TempoTranscorridoCard;