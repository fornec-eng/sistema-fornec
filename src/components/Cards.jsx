import React from 'react';
import CardFuncionario from './CardFuncionario';
import TempoTranscorrido from './CardTempo';
import CardInvestimentos from './Cards_investimentos';
import Cronograma from './CardCronograma';
import GraficoMensal from './GraficoMensal';
import GraficoInvestimentos from './GraficoInvestimento';

const Cards = () => {

    return (
    <div className="container mt-4">
      <div className="row g-4">
        
        {/* Card 1 e 2 */}
        <CardInvestimentos />

        {/* Card 3: Tempo Transcorrido e Faltante */}
        <TempoTranscorrido />

        {/* Card 4: Gasto Dividido */}
        <GraficoMensal />

        {/* Card 5: Lista de pagamento */}
        <CardFuncionario />

        {/* Card 6: Tarefa Atual e Status */}
        <Cronograma />

        {/* Card 7: Tarefa Atual e Status */}
        <GraficoInvestimentos />
      </div>
    </div>
  );
};

export default Cards;
