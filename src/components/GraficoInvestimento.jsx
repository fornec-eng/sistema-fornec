import React, { useState, useEffect } from 'react';
import { Card } from 'react-bootstrap';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import ApiBase from '../services/ApiBase';

// Registrar os componentes necessários do Chart.js
ChartJS.register(
  CategoryScale, 
  LinearScale, 
  BarElement, 
  Title, 
  Tooltip, 
  Legend, 
  ChartDataLabels
);

const GraficoInvestimentos = ({ obra }) => {
  const [chartData, setChartData] = useState({ labels: [], datasets: [] });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await ApiBase.post('/google/sheets/data', {
          data: { spreadsheetId: obra.id, range: 'Resumo' }
        });
        const result = res.data;
        // Extraindo os valores relevantes do JSON
        const gastos = [
          { label: 'Gasto material', value: parseFloat(result.values[6][1].replace('R$', '').replace('.', '').replace(',', '.').trim()) },
          { label: 'Locação de equipamento', value: parseFloat(result.values[7][1].replace('R$', '').replace('.', '').replace(',', '.').trim()) },
          { label: 'Mão de Obra', value: parseFloat(result.values[8][1].replace('R$', '').replace('.', '').replace(',', '.').trim()) },
          { label: 'Outros gastos', value: parseFloat(result.values[9][1].replace('R$', '').replace('.', '').replace(',', '.').trim()) },
        ];

        setChartData({
          labels: gastos.map(gasto => gasto.label),
          datasets: [
            {
              label: 'Valor Investido (R$)',
              data: gastos.map(gasto => gasto.value),
              backgroundColor: '#007bff',
              borderColor: '#0056b3',
              borderWidth: 1,
              barPercentage: 0.6,
              datalabels: {
                display: true,
                color: '#000000',
                align: 'top',
                font: {
                  weight: 'bold',
                  size: 14,
                },
                formatter: (value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
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
    <div className="col-md-6 col-lg-6">
      <Card style={{ minHeight: '200px', borderRadius: '10px', boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)' }}>
        <Card.Body style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <Card.Title>Divisão do Valor Investido</Card.Title>
          <div className="chart-container" style={{ height: '100%', overflow: 'hidden' }}>
            <Bar
              data={chartData}
              options={{
                responsive: true,
                maintainAspectRatio: true,
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
                    color: '#000000',
                  },
                },
                scales: {
                  y: {
                    title: {
                      display: false,
                    },
                    beginAtZero: true,
                    ticks: {
                      display: false,
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

export default GraficoInvestimentos;
