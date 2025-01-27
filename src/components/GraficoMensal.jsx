import React, { useState, useEffect } from 'react';
import { Card } from 'react-bootstrap';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels'; // Importando o plugin

// Registrar os componentes necessários do Chart.js
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  ChartDataLabels // Registrando o plugin de rótulos
);

const GraficoMensal = () => {
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });

  useEffect(() => {
    fetch('https://api-google-sheets-7zph.vercel.app/getDataEngResumoMensal')
      .then((response) => response.json())
      .then((result) => {
        const months = [];
        const values = [];
        
        result.values.slice(1, -1).forEach(row => {
          if (row[1]) {
            months.push(row[0]);
            values.push(parseFloat(row[1].replace('R$', '').replace('.', '').replace(',', '.').trim())); // Converte para número
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
              // Adicionando rótulos de valor nos pontos do gráfico
              datalabels: {
                display: true,
                color: '#007bff',
                align: 'top',
                font: {
                  weight: 'bold',
                  size: 12,
                },
                formatter: (value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
              },
            },
          ],
        });
      });
  }, []);

  return (
    <div className="col-md-6 col-lg-6">
      <Card style={{ minHeight: '200px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)' }}>
        <Card.Body>
          <Card.Title>Investimento ao Longo dos Meses</Card.Title>
          <div className="chart-container">
            <Line
              data={chartData}
              options={{
                responsive: true,
                plugins: {
                  tooltip: {
                    callbacks: {
                      label: function (context) {
                        return `R$ ${context.raw.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
                      },
                    },
                  },
                  datalabels: { // Habilitando rótulos de dados
                    display: true,
                  },
                },
                scales: {
                  y: {
                    title: {
                      display: true,
                      text: 'Valor (R$)',
                    },
                    beginAtZero: true,
                    ticks: {
                      display: false, // Removendo os valores no eixo Y
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