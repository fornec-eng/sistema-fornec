import React, { useEffect, useState } from 'react';
import { Card } from 'react-bootstrap';
import ApiBase from '../services/ApiBase';

const Cards_investimentos = ({ obra }) => {
  const [orçamento, setOrçamento] = useState(0);
  const [gastoTotal, setGastoTotal] = useState(0);

  // Função para formatar valores monetários
  const formatCurrency = (value) =>
    value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await ApiBase.post('/google/sheets/data', {
          data: { spreadsheetId: obra.id, range: 'Resumo' }
        });
        const data = res.data.values;

        // Procura os dados necessários pelo índice
        const orçamentoLinha = data.find((row) => row[0] === 'Orçamento:');
        const gastoTotalLinha = data.find((row) => row[0] === 'Gasto total:');

        if (orçamentoLinha) {
          setOrçamento(
            Number(
              orçamentoLinha[1]
                .replace('R$', '')
                .replace(/\./g, '')
                .replace(',', '.')
            )
          );
        }
        if (gastoTotalLinha) {
          setGastoTotal(
            Number(
              gastoTotalLinha[1]
                .replace('R$', '')
                .replace(/\./g, '')
                .replace(',', '.')
            )
          );
        }
      } catch (error) {
        console.error('Erro ao buscar os dados:', error);
      }
    };

    // Certifique-se de que obra esteja disponível antes de chamar a API
    if (obra && obra.id) {
      fetchData();
    }
  }, [obra]);

  const orçamentoRestante = orçamento - gastoTotal;
  const percentualGasto = ((gastoTotal / orçamento) * 100).toFixed(2);

  return (
    <>
      {/* Card 1: Total Investido */}
      <div className="col-md-6 col-lg-4">
        <Card
          style={{
            minHeight: '200px',
            borderRadius: '10px',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <Card.Title
                className="text-primary"
                style={{ fontWeight: 'bold', fontSize: '1.2rem' }}
              >
                Total Investido
              </Card.Title>
              <i
                className="bi bi-currency-dollar"
                style={{ fontSize: '1.5rem', color: '#007bff' }}
              ></i>
            </div>
            <h3 style={{ fontWeight: 'bold', marginBottom: '10px' }}>
              {formatCurrency(gastoTotal)}
            </h3>
            <div className="d-flex justify-content-center mt-4">
              <div
                style={{
                  width: '80%',
                  height: '20px',
                  backgroundColor: '#e9ecef',
                  borderRadius: '5px',
                }}
              >
                <div
                  style={{
                    width: `${percentualGasto}%`,
                    height: '100%',
                    backgroundColor: '#007bff',
                    borderRadius: '5px',
                  }}
                ></div>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Card 2: Orçamento Restante */}
      <div className="col-md-6 col-lg-4">
        <Card
          style={{
            minHeight: '200px',
            borderRadius: '10px',
            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
          }}
        >
          <Card.Body>
            <div className="d-flex justify-content-between align-items-center mb-3">
              <Card.Title
                className="text-danger"
                style={{ fontWeight: 'bold', fontSize: '1.2rem' }}
              >
                Orçamento Restante
              </Card.Title>
              <i
                className="bi bi-bar-chart-line"
                style={{ fontSize: '1.5rem', color: '#28a745' }}
              ></i>
            </div>
            <h3 style={{ fontWeight: 'bold', marginBottom: '10px' }}>
              {formatCurrency(orçamentoRestante)}
            </h3>
            <div className="d-flex justify-content-center mt-4">
              <div
                style={{
                  width: '80%',
                  height: '20px',
                  backgroundColor: '#e9ecef',
                  borderRadius: '5px',
                }}
              >
                <div
                  style={{
                    width: `${(orçamentoRestante / orçamento) * 100}%`,
                    height: '100%',
                    backgroundColor: '#722F37',
                    borderRadius: '5px',
                  }}
                ></div>
              </div>
            </div>
          </Card.Body>
        </Card>
      </div>
    </>
  );
};

export default Cards_investimentos;