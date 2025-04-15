"use client"

import { useState, useEffect } from "react"
import { Container, Nav, Navbar, Offcanvas, Button } from "react-bootstrap"
import { NavLink, useNavigate } from "react-router-dom"
import styled from "styled-components"
import ApiBase from "../services/ApiBase"
import logo_mini from "../images/logo_min_fornec.svg"

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
`

// Modificar o estilo do Badge para usar ponto de exclamação em fundo amarelo
const Badge = styled.span`
  background-color: #FFC107; /* Amarelo */
  color: #000; /* Preto */
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 14px;
  font-weight: bold;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-left: 8px;
`

const Menu = () => {
  const navigate = useNavigate()

  // Lê o e-mail e a role do storage
  const storedEmail = localStorage.getItem("email") || sessionStorage.getItem("email")
  const storedRole = localStorage.getItem("_role") || sessionStorage.getItem("_role")

  // Controla a abertura do Offcanvas
  const [showOffcanvas, setShowOffcanvas] = useState(false)
  const handleOpenOffcanvas = () => setShowOffcanvas(true)
  const handleCloseOffcanvas = () => setShowOffcanvas(false)

  // Quantidade de usuários pendentes (só importa para Admin)
  const [pendingCount, setPendingCount] = useState(0)

  // Adicionar estado para pagamentos pendentes
  const [pagamentosPendentes, setPagamentosPendentes] = useState(0)

  // Se for Admin, busca quantos usuários precisam de aprovação
  useEffect(() => {
    if (storedRole === "Admin") {
      // Buscar usuários pendentes
      // Adicione esta função para obter o token de autenticação
      const getToken = () => {
        let token = localStorage.getItem('token');
        if (!token) {
          token = sessionStorage.getItem('token');
        }
        return token;
      }

      // Modifique a função fetchPendingUsers
      const fetchPendingUsers = async () => {
        try {
          const token = getToken();
          
          // Adicione o token de autenticação e o parâmetro limit
          const response = await ApiBase.get("/list", { 
            params: { limit: 100 },
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
          
          if (response.data && response.data.users) {
            const users = response.data.users;
            const pending = users.filter((user) => user.role === "PreAprovacao");
            setPendingCount(pending.length);
          } else {
            console.log("Resposta sem usuários:", response.data); // Log para depuração
          }
        } catch (err) {
          console.error("Erro ao buscar pendências:", err);
        }
      }

      // Buscar pagamentos pendentes
      const fetchPagamentosPendentes = async () => {
        try {
          // Buscar planilhas de pagamentos atuais
          const resAtuais = await ApiBase.get(`/google/drive/1JWqpHfPvYy9B846cXPTYotImfd3xqhRC`)
          const listaAtuais = resAtuais.data || []

          // Se houver planilhas, buscar dados da primeira (mais recente)
          if (listaAtuais.length > 0) {
            const planilhaAtual = listaAtuais.filter(
              (plan) => !["Automatização da Planilha Semanal", "Modelo", "Histórico"].includes(plan.name),
            )[0]

            if (planilhaAtual) {
              const res = await ApiBase.post("/google/sheets/data", {
                data: {
                  spreadsheetId: planilhaAtual.id,
                  range: "pagamento_semanal",
                },
              })

              const rows = res.data.values || []

              // Verificar se há pelo menos 2 linhas
              if (rows.length >= 2) {
                // Mapear cabeçalhos
                const headerRow = rows[1]
                const statusIndex = headerRow.indexOf("Status:")

                if (statusIndex !== -1) {
                  // Contar funcionários com status "Pagar"
                  const dataRows = rows.slice(2)
                  const pendentes = dataRows.filter(
                    (row) => row.length > statusIndex && row[statusIndex] === "Pagar",
                  ).length

                  setPagamentosPendentes(pendentes)
                }
              }
            }
          }
        } catch (error) {
          console.error("Erro ao buscar pagamentos pendentes:", error)
        }
      }

      // Executar as funções de busca
      fetchPendingUsers()
      fetchPagamentosPendentes()
    }
  }, [storedRole])

  // Função de logout
  const handleLogout = () => {
    localStorage.clear()
    sessionStorage.clear()
    navigate("/login")
  }

  // Se NÃO estiver logado, renderiza apenas o brand
  if (!storedEmail) {
    return (
      <Navbar bg="dark" variant="dark" className="mb-3">
        <Container fluid>
          <Navbar.Brand href="/">
            <img
              alt="Logo Fornec"
              src={logo_mini || "/placeholder.svg"}
              width="30"
              height="30"
              className="d-inline-block align-top"
            />{" "}
            Fornec Engenharia
          </Navbar.Brand>
        </Container>
      </Navbar>
    )
  }

  return (
    <Navbar bg="dark" variant="dark" expand="false" className="mb-3">
      <Container fluid>
        <Navbar.Brand href="/home">
          <img
            alt="Logo Fornec"
            src={logo_mini || "/placeholder.svg"}
            width="30"
            height="30"
            className="d-inline-block align-top"
          />{" "}
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
          style={{ width: "75%" }}
        >
          <Offcanvas.Header closeButton>
            <Offcanvas.Title id="offcanvasNavbarLabel">Menu</Offcanvas.Title>
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
              {storedRole === "Admin" && (
                <>
                  <StyledNavLink to="/pagamento_semanal" onClick={handleCloseOffcanvas}>
                    Pagamento Semanal
                    {pagamentosPendentes > 0 && <Badge>!</Badge>}
                  </StyledNavLink>
                  <StyledNavLink to="/financeiro" onClick={handleCloseOffcanvas}>
                    Financeiro
                  </StyledNavLink>
                  <StyledNavLink to="/usuarios" onClick={handleCloseOffcanvas}>
                    Gerenciar Usuários
                    {pendingCount > 0 && <Badge>!</Badge>}
                  </StyledNavLink>
                </>
              )}
            </Nav>

            <div className="d-flex flex-column align-items-start mt-3">
              <Navbar.Text className="ms-3 mb-2">
                Usuário: <strong>{storedEmail}</strong>
              </Navbar.Text>
              <Button variant="outline-danger" size="sm" onClick={handleLogout} className="ms-3">
                Logout
              </Button>
            </div>
          </Offcanvas.Body>
        </Navbar.Offcanvas>
      </Container>
    </Navbar>
  )
}

export default Menu