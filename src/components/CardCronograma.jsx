import React, { useState, useEffect } from 'react';
import { Card } from 'react-bootstrap';

const Cronograma = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetch('https://api-google-sheets-7zph.vercel.app/getDataEngCronograma')
      .then((response) => response.json())
      .then((result) => {
        const processedData = result.values.slice(2); // Remove o cabeçalho e o título
        setData(processedData);
      });
  }, []);

  return (
    <div className="col-md-6 col-lg-12">
      <Card style={{ minHeight: '200px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)' }}>
        <Card.Body>
          <Card.Title>Tarefa Atual e Status</Card.Title>
          {/* Adicione a classe 'table-responsive' para tornar a tabela rolável em telas pequenas */}
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
                    <td>{row[0]}</td> {/* Etapa */}
                    <td>{row[1]}</td> {/* Responsável */}
                    <td>{row[2]} dias</td> {/* Prazo */}
                    <td>{row[3]}</td> {/* Início */}
                    <td>{row[4]}</td> {/* Fim */}
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