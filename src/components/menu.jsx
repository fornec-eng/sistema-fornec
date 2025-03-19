import React from 'react';
import { Container, Nav, Navbar, Offcanvas, Button } from 'react-bootstrap';
import logo_mini from '../images/logo_min_fornec.svg';
import { useNavigate } from 'react-router-dom';

const Menu = () => {
  const navigate = useNavigate();

  // Tenta pegar do localStorage primeiro; se não existir, pega do sessionStorage
  const storedEmail = localStorage.getItem('email') || sessionStorage.getItem('email');

  const handleLogout = () => {
    // Remove credenciais do localStorage
    localStorage.removeItem('_id');
    localStorage.removeItem('token');
    localStorage.removeItem('_role');
    localStorage.removeItem('email');

    // Remove credenciais do sessionStorage
    sessionStorage.removeItem('_id');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('_role');
    sessionStorage.removeItem('email');

    // Redireciona para a página de login
    navigate('/login');
  };

  return (
    <Navbar
      key="lg"
      expand="lg"             // <= Ajuste o breakpoint aqui se quiser que o Offcanvas apareça em telas maiores
      bg="dark"
      data-bs-theme="dark"
      variant="dark"
      className="mb-3"
    >
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

        {/* Botão que aparece em telas menores para abrir o Offcanvas */}
        <Navbar.Toggle aria-controls="offcanvasNavbar-expand-lg" />

        <Navbar.Offcanvas
          id="offcanvasNavbar-expand-lg"
          aria-labelledby="offcanvasNavbarLabel-expand-lg"
          placement="end"
        >
          <Offcanvas.Header closeButton>
            <Offcanvas.Title id="offcanvasNavbarLabel-expand-lg">
              Obra UTI Santa Lúcia
            </Offcanvas.Title>
          </Offcanvas.Header>

          <Offcanvas.Body>
            {/*
              'ms-auto' faz o conteúdo da Nav alinhar à direita.
              'd-flex align-items-center' alinha tudo verticalmente ao centro.
            */}
            <Nav className="ms-auto d-flex align-items-center">
              <Nav.Link href="/home">Resumo</Nav.Link>
              <Nav.Link href="/cronograma">Inventário</Nav.Link>

              {/* Se existir usuário logado, exibe o email */}
              {storedEmail && (
                <Navbar.Text className="ms-3">
                  Logado como: <strong>{storedEmail}</strong>
                </Navbar.Text>
              )}

              {/* Botão de Logout */}
              <Button
                variant="outline-danger"
                size="sm"
                onClick={handleLogout}
                className="ms-3"
              >
                Logout
              </Button>
            </Nav>
          </Offcanvas.Body>
        </Navbar.Offcanvas>
      </Container>
    </Navbar>
  );
};

export default Menu;