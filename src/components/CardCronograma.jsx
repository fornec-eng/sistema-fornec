import React, { useState, useEffect } from 'react';
import { Card } from 'react-bootstrap';
import ApiBase from '../services/ApiBase';

const Cronograma = ({ obra }) => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await ApiBase.post('/google/sheets/data', {
          data: { spreadsheetId: obra.id, range: 'cronograma' }
        });
        const result = res.data;
        // Remove o cabeçalho e o título, conforme a lógica original
        const processedData = result.values.slice(2);
        setData(processedData);
      } catch (error) {
        console.error('Erro ao buscar os dados:', error);
      }
    };

    if (obra && obra.id) {
      fetchData();
    }
  }, [obra]);

  return (
    <div className="col-md-6 col-lg-12">
      <Card style={{ minHeight: '200px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)' }}>
        <Card.Body>
          <Card.Title>Tarefa Atual e Status</Card.Title>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Etapa</th>
                  <th>Responsável</th>
                  <th>Prazo</th>
                  <th>Início</th>
                  <th>Fim</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {data.map((row, index) => (
                  <tr key={index}>
                    <td>{row[0]}</td>
                    <td>{row[1]}</td>
                    <td>{row[2]} dias</td>
                    <td>{row[3]}</td>
                    <td>{row[4]}</td>
                    <td>
                      <span
                        className={`badge ${
                          row[5] === 'Em andamento'
                            ? 'bg-primary'
                            : row[5] === 'Concluído'
                            ? 'bg-success'
                            : 'bg-warning'
                        }`}
                      >
                        {row[5]}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default Cronograma;