import React, { useEffect, useState } from 'react';
import { Col, Row, Image, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import ApiBase from '../services/ApiBase';

import campanhasImg from '../images/campanhas.png';
import dashboardImg from '../images/dashboard.png';
import trendingTopicsImg from '../images/trending-topics.png';
import StilingueImg from '../images/stilingue.png';
import DemograficoImg from '../images/demografico.png';

const Home = () => {
  const [pendingCount, setPendingCount] = useState(0);

  // Lê a role do localStorage ou sessionStorage
  const role = localStorage.getItem('_role') || sessionStorage.getItem('_role');

  // Se for Admin, buscamos a lista de usuários pendentes para contar
  useEffect(() => {
    if (role === 'Admin') {
      ApiBase.get('/list')
        .then((res) => {
          // Supondo que retorne { users: [...] }
          const users = res.data.users;
          const pending = users.filter((user) => user.role === 'PreAprovacao');
          setPendingCount(pending.length);
        })
        .catch((err) => console.error('Erro ao buscar pendências:', err));
    }
  }, [role]);

  // Cards para o usuário ADMIN
  const adminCards = [
    { link: '/usuarios', img: campanhasImg, text: 'Usuários Sistema', showBadge: true },
    { link: '/inventario', img: DemograficoImg, text: 'Inventário' },
    { link: '/pagamento_semanal', img: trendingTopicsImg, text: 'Pagamentos Semanais' },
    { link: '/obras_ativas', img: dashboardImg, text: 'Obras Ativas' },
    { link: '/financeiro', img: StilingueImg, text: 'Controle Financeiro' }
  ];

  // Cards para o usuário COMUM (User)
  const userCards = [
    { link: '/obras_ativas', img: dashboardImg, text: 'Obras Ativas' },
    { link: '/inventario', img: DemograficoImg, text: 'Inventário' }
  ];

  // Escolhe qual lista de cards exibir de acordo com a role
  const cardsToRender = role === 'Admin' ? adminCards : userCards;

  // Estilos existentes
  const imageStyle = {
    width: '100%',
    height: '330px',
    objectFit: 'cover',
    borderRadius: '12px',
    opacity: 0.6,
    transition: 'opacity 0.3s ease-in-out'
  };

  const overlayStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    background: 'rgba(24, 62, 255, 0.9)',
    color: 'white',
    padding: '12px 20px',
    borderRadius: '12px 12px 0 0',
    fontFamily: 'Rawline',
    fontSize: '1.5rem',
    fontWeight: '600',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 3px 6px rgba(0, 0, 0, 0.1)',
    zIndex: 2
  };

  const cardContainerStyle = {
    position: 'relative',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    marginBottom: '20px',
    border: '1px solid rgba(0, 0, 0, 0.08)',
    borderRadius: '14px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.08)',
    overflow: 'hidden'
  };

  // Estilo do “badge” (bolinha vermelha)
  const badgeStyle = {
    position: 'absolute',
    top: '10px',
    right: '10px',
    backgroundColor: 'red',
    color: '#fff',
    borderRadius: '50%',
    padding: '4px 8px',
    fontSize: '0.8rem',
    zIndex: 3
  };

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-5">
        <h1
          style={{
            fontSize: '2rem', 
            fontFamily: 'Rawline',
            fontWeight: '600',
            textAlign: 'center',
            width: '100%'
          }}
        >
          PAINEL DIRECIONAMENTO 
        </h1>
      </div>
      <Row className="g-4 justify-content-center text-center" style={{ fontFamily: 'Rawline' }}>
        {cardsToRender.map((item, index) => (
          <Col key={index} md={4} className="mx-auto">
            <Link to={item.link} style={{ textDecoration: 'none' }}>
              <div
                style={cardContainerStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.querySelector('img').style.opacity = '0.8';
                  e.currentTarget.style.transform = 'translateY(-5px)';
                  e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.querySelector('img').style.opacity = '0.6';
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow =
                    '0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.08)';
                }}
              >
                {/* Se for o card de Usuários e tiver pendências, mostra o badge */}
                {item.showBadge && pendingCount > 0 && (
                  <span style={badgeStyle}>{pendingCount}</span>
                )}

                <div style={overlayStyle}>{item.text}</div>
                <Image src={item.img} style={imageStyle} />
              </div>
            </Link>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default Home;