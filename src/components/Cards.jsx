import React from 'react';
import { useParams, useLocation } from 'react-router-dom';
import CardFuncionario from './CardFuncionario';
import TempoTranscorrido from './CardTempo';
import CardInvestimentos from './Cards_investimentos';
import Cronograma from './CardCronograma';
import GraficoMensal from './GraficoMensal';
import GraficoInvestimentos from './GraficoInvestimento';

const Cards = () => {
  const { id } = useParams();
  // Recupera o nome da obra que foi passado via state na navegação
  const location = useLocation();
  const obraName = location.state?.name || 'Dashboard';

  // Cria o objeto obra para ser repassado aos componentes filhos
  const obra = { id, name: obraName };

  return (
    <div className="container mt-4">
      <h1 className="text-center mb-4">{obra.name}</h1>
      <div className="row g-4">
        {/* Card 1 e 2 */}
        <CardInvestimentos obra={obra} />

        {/* Card 3: Tempo Transcorrido e Faltante */}
        <TempoTranscorrido obra={obra} />

        {/* Card 6: Tarefa Atual e Status */}
        <Cronograma obra={obra} />

        {/* Card 4: Gasto Dividido */}
        <GraficoMensal obra={obra} />

        {/* Card 5: Tarefa Atual e Status */}
        <GraficoInvestimentos obra={obra} />

        
      </div>
    </div>
  );
};

export default Cards;