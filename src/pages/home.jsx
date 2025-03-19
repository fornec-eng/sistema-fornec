import React from 'react';
import { Col, Row, Image, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import campanhasImg from '../images/campanhas.png';
import dashboardImg from '../images/dashboard.png';
import trendingTopicsImg from '../images/trending-topics.png';
import StilingueImg from '../images/stilingue.png';
import DemograficoImg from '../images/demografico.png';

const Home = () => {
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
    fontSize: '1.5rem', // Aumentei o tamanho da fonte aqui
    fontWeight: '600',
    textAlign: 'center',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 3px 6px rgba(0, 0, 0, 0.1)',
    zIndex: 2 // Adicionado para garantir que o título fique em cima
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

  return (
    <>
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-5">
        <h1 style={{ fontSize: '2rem', fontFamily: 'Rawline', fontWeight: '600', textAlign: 'center', width: '100%' }}>
          PAINEL GERAL
        </h1>
      </div>
      <Row className="g-4" style={{ fontFamily: 'Rawline' }}>
        {[
          { link: '/usuarios', img: campanhasImg, text: 'Usuários Sistema' },
          { link: '/demografico', img: DemograficoImg, text: 'Inventário' },
          { link: '/powerbi', img: trendingTopicsImg, text: 'Pagamentos Semanais' },
          { link: '/obra', img: dashboardImg, text: 'Obras ativas' },
          { link: '/stilingue', img: StilingueImg, text: 'Controle Financeiro' }
        ].map((item, index) => (
          <Col key={index} md={4}>
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
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.08)';
                }}
              >
                <div style={overlayStyle}>{item.text}</div>
                <Image src={item.img} style={imageStyle} />
              </div>
            </Link>
          </Col>
        ))}
      </Row>
      </Container>
    </>
  );
};

export default Home
