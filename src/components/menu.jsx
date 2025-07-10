import React, { useState, useEffect } from 'react';
import { Container, Nav, Navbar, Offcanvas, Button } from 'react-bootstrap';
import { NavLink, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import ApiBase from '../services/ApiBase';
import logo_mini from '../images/logo_min_fornec.svg';

/* 
  Estilizamos o NavLink para mudar o fundo e a cor do texto 
  quando estiver ativo (rota atual).
*/
const StyledNavLink = styled(NavLink)`
  display: block;
  color: #000000;
  text-decoration: none;
  padding: 0.5rem;
  margin: 0.25rem 0;
  border-radius: 8px;
  transition: background-color 0.2s ease;

  &.active {
    background-color: #FFC107;
    color: #000 !important; /* sobrescreve a cor do texto para preto */
    border: 1px solid #ddd;
  }
`;

const Badge = styled.span`
  background-color: red;
  color: #fff;
  border-radius: 50%;
  padding: 2px 6px;
  font-size: 0.8rem;
  margin-left: 8px;
`;

const Menu = () => {
  const navigate = useNavigate();

  // Lê o e-mail e a role do storage
  const storedEmail = localStorage.getItem('email') || sessionStorage.getItem('email');
  const storedRole = localStorage.getItem('_role') || sessionStorage.getItem('_role');

  // Controla a abertura do Offcanvas
  const [showOffcanvas, setShowOffcanvas] = useState(false);
  const handleOpenOffcanvas = () => setShowOffcanvas(true);
  const handleCloseOffcanvas = () => setShowOffcanvas(false);

  // Quantidade de usuários pendentes (só importa para Admin)
  const [pendingCount, setPendingCount] = useState(0);

  // Se for Admin, busca quantos usuários precisam de aprovação
  useEffect(() => {
    if (storedRole === 'Admin') {
      ApiBase.get('/list')
        .then((res) => {
          // Supondo que retorne { users: [...] }
          const users = res.data.users;
          const pending = users.filter((user) => user.role === 'PreAprovacao');
          setPendingCount(pending.length);
        })
        .catch((err) => console.error('Erro ao buscar pendências:', err));
    }
  }, [storedRole]);

  // Função de logout
  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate('/login');
  };

  // Se NÃO estiver logado, renderiza apenas o brand
  if (!storedEmail) {
    return (
      <Navbar bg="dark" variant="dark" className="mb-3">
        <Container fluid>
          <Navbar.Brand href="/">
            <img
              alt="Logo Fornec"
              src={logo_mini}
              width="30"
              height="30"
              className="d-inline-block align-top"
            />{' '}
            Fornec Engenharia
          </Navbar.Brand>
        </Container>
      </Navbar>
    );
  }

  return (
    <Navbar bg="dark" variant="dark" expand="false" className="mb-3">
      <Container fluid>
        <Navbar.Brand href="/home">
          <img
            alt="Logo Fornec"
            src={logo_mini}
            width="30"
            height="30"
            className="d-inline-block align-top"
          />{' '}
          Fornec Engenharia
        </Navbar.Brand>

        {/* Botão que abre o Offcanvas */}
        <Navbar.Toggle aria-controls="offcanvasNavbar" onClick={handleOpenOffcanvas} />

        <Navbar.Offcanvas
          id="offcanvasNavbar"
          aria-labelledby="offcanvasNavbarLabel"
          placement="end"
          show={showOffcanvas}
          onHide={handleCloseOffcanvas}
          style={{ width: '75%' }}
        >
          <Offcanvas.Header closeButton>
            <Offcanvas.Title id="offcanvasNavbarLabel">
              Menu
            </Offcanvas.Title>
          </Offcanvas.Header>

          {/*
            d-flex flex-column justify-content-between
            para que o bloco de links fique no topo
            e o bloco de usuário/logout fique embaixo
          */}
          <Offcanvas.Body className="d-flex flex-column justify-content-between">
            <Nav className="flex-column">
              {/* Links comuns a todos os usuários */}
              <StyledNavLink to="/home" onClick={handleCloseOffcanvas}>
                Início
              </StyledNavLink>
              <StyledNavLink to="/obras_ativas" onClick={handleCloseOffcanvas}>
                Obras Ativas
              </StyledNavLink>
              <StyledNavLink to="/inventario" onClick={handleCloseOffcanvas}>
                Inventário
              </StyledNavLink>

              {/* Links exclusivos de Admin */}
              {storedRole === 'Admin' && (
                <>
                  <StyledNavLink to="/pagamento_semanal" onClick={handleCloseOffcanvas}>
                    Pagamento Semanal
                  </StyledNavLink>
                  <StyledNavLink to="/financeiro" onClick={handleCloseOffcanvas}>
                    Financeiro
                  </StyledNavLink>
                  <StyledNavLink to="/usuarios" onClick={handleCloseOffcanvas}>
                    Gerenciar Usuários
                    {pendingCount > 0 && <Badge>{pendingCount}</Badge>}
                  </StyledNavLink>
                </>
              )}
            </Nav>

            <div className="d-flex flex-column align-items-start mt-3">
              <Navbar.Text className="ms-3 mb-2">
                Usuário: <strong>{storedEmail}</strong>
              </Navbar.Text>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={handleLogout}
                className="ms-3"
              >
                Logout
              </Button>
            </div>
          </Offcanvas.Body>
        </Navbar.Offcanvas>
      </Container>
    </Navbar>
  );
};

export default Menu;