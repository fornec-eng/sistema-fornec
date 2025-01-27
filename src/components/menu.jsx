import React from 'react'
import { Container, Nav, Navbar, Offcanvas } from 'react-bootstrap'

const Menu = () => {
  return (
    <>
        <Navbar key={'lg'} expand={'lg'} className="bg-body-tertiary mb-3" bg="dark" data-bs-theme="dark">
          <Container fluid>
            
            <Navbar.Brand href="./home">                
                Resumo Obra UTI Santa Lúcia Norte
            </Navbar.Brand>
            <Navbar.Toggle aria-controls={`offcanvasNavbar-expand-${'lg'}`} />
            <Navbar.Offcanvas
              id={`offcanvasNavbar-expand-${'lg'}`}
              aria-labelledby={`offcanvasNavbarLabel-expand-${'lg'}`}
              placement="end"
            >
              <Offcanvas.Header closeButton>
                <Offcanvas.Title id={`offcanvasNavbarLabel-expand-${'lg'}`}>
                    Obra UTI Santa Lúcia
                </Offcanvas.Title>
              </Offcanvas.Header>
              <Offcanvas.Body>
                <Nav className="justify-content-end flex-grow-1 pe-3">
                  <Nav.Link href="/home">Resumo</Nav.Link>
                  <Nav.Link href="/cronograma">Inventário</Nav.Link>
                  
                </Nav>                
              </Offcanvas.Body>
            </Navbar.Offcanvas>
          </Container>
        </Navbar>
    </>
  )
}

export default Menu