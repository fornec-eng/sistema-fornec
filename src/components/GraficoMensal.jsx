import React, { useState, useEffect } from 'react';
import { Card } from 'react-bootstrap';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import ApiBase from '../services/ApiBase';

ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  ChartDataLabels
);

const GraficoMensal = ({ obra }) => {
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Requisição utilizando a nova API e enviando o range "resumo_mensal"
        const res = await ApiBase.post('/google/sheets/data', {
          data: { spreadsheetId: obra.id, range: 'resumo_mensal' }
        });
        const result = res.data;
        const months = [];
        const values = [];
        
        // Processa os dados (ignorando a primeira e última linha, conforme a lógica original)
        result.values.slice(1, -1).forEach(row => {
          if (row[1]) {
            months.push(row[0]);
            values.push(
              parseFloat(
                row[1]
                  .replace('R$', '')
                  .replace('.', '')
                  .replace(',', '.')
                  .trim()
              )
            );
          }
        });

        setChartData({
          labels: months,
          datasets: [
            {
              label: 'Investimento (R$)',
              data: values,
              fill: false,
              borderColor: '#007bff',
              tension: 0.1,
              // Configuração do plugin para exibir os rótulos de dados
              datalabels: {
                display: true,
                color: '#007bff',
                align: 'top',
                font: {
                  weight: 'bold',
                  size: 12,
                },
                formatter: (value) =>
                  `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
              },
            },
          ],
        });
      } catch (error) {
        console.error('Erro ao buscar os dados:', error);
      }
    };

    if (obra && obra.id) {
      fetchData();
    }
  }, [obra]);

  return (
    <div className="col-md-12 col-lg-12 mb-4"> {/* Alterado para ocupar toda a largura */}
      <Card style={{ minHeight: '400px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)' }}> {/* Aumentado a altura mínima */}
        <Card.Body>
          <Card.Title>Investimento ao Longo dos Meses</Card.Title>
          <div className="chart-container" style={{ height: '350px' }}> {/* Definição explícita da altura */}
            <Line
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: false, // Importante para controlar a altura
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: function (context) {
                        return `R$ ${context.raw.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                      },
                    },
                  },
                  datalabels: {
                    display: true,
                  },
                  legend: {
                    display: true,
                    position: 'top',
                  },
                },
                scales: {
                  y: {
                    title: {
                      display: true,
                      text: 'Valor (R$)',
                      font: {
                        size: 14,
                      },
                    },
                    beginAtZero: true,
                    ticks: {
                      display: true, // Alterado para mostrar os valores do eixo Y
                      font: {
                        size: 12,
                      },
                    },
                  },
                  x: {
                    ticks: {
                      font: {
                        size: 12,
                      },
                    },
                  },
                },
              }}
            />
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default GraficoMensal;