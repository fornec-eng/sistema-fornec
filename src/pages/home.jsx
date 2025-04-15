"use client"

import { useEffect, useState } from "react"
import { Col, Row, Container } from "react-bootstrap"
import { Link } from "react-router-dom"
import ApiBase from "../services/ApiBase"

import campanhasImg from "../images/campanhas.png"
import dashboardImg from "../images/dashboard.png"
import trendingTopicsImg from "../images/trending-topics.png"
import StilingueImg from "../images/stilingue.png"
import DemograficoImg from "../images/demografico.png"

const Home = () => {
  const [pendingCount, setPendingCount] = useState(0)
  const [totalPagamentosPendentes, setTotalPagamentosPendentes] = useState(0)

  // Lê a role do localStorage ou sessionStorage
  const role = localStorage.getItem("_role") || sessionStorage.getItem("_role")

  // Se for Admin, buscamos a lista de usuários pendentes para contar
  useEffect(() => {
    if (role === "Admin") {
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

      // Buscar pagamentos pendentes da semana atual
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

                  setTotalPagamentosPendentes(pendentes)
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
  }, [role])

  // Cards para o usuário ADMIN
  const adminCards = [
    { link: "/usuarios", img: campanhasImg, text: "Usuários Sistema", showBadge: pendingCount > 0 },
    { link: "/inventario", img: DemograficoImg, text: "Inventário" },
    {
      link: "/pagamento_semanal",
      img: trendingTopicsImg,
      text: "Pagamentos Semanais",
      showBadge: totalPagamentosPendentes > 0,
    },
    { link: "/obras_ativas", img: dashboardImg, text: "Obras Ativas" },
    { link: "/financeiro", img: StilingueImg, text: "Controle Financeiro" },
  ]

  // Cards para o usuário COMUM (User)
  const userCards = [
    { link: "/obras_ativas", img: dashboardImg, text: "Obras Ativas" },
    { link: "/inventario", img: DemograficoImg, text: "Inventário" },
  ]

  // Escolhe qual lista de cards exibir de acordo com a role
  const cardsToRender = role === "Admin" ? adminCards : userCards

  // Estilo do "badge" (bolinha amarela com ponto de exclamação)
  const badgeStyle = {
    position: "absolute",
    top: "10px",
    right: "10px",
    backgroundColor: "#FFC107", // Amarelo
    color: "#000", // Preto
    borderRadius: "50%",
    width: "24px",
    height: "24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "16px",
    zIndex: 3,
  }

  return (
    <Container>
      <div className="d-flex justify-content-between align-items-center mb-5">
        <h1
          style={{
            fontSize: "2rem",
            fontFamily: "Rawline",
            fontWeight: "600",
            textAlign: "center",
            width: "100%",
          }}
        >
          PAINEL DIRECIONAMENTO
        </h1>
      </div>
      <Row className="g-4 justify-content-center" style={{ fontFamily: "Rawline" }}>
        {cardsToRender.map((item, index) => (
          <Col key={index} xs={12} sm={6} lg={4} className="mb-4">
            <Link to={item.link} style={{ textDecoration: "none" }}>
              <div
                className="card h-100"
                style={{
                  borderRadius: "14px",
                  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.08)",
                  overflow: "hidden",
                  transition: "all 0.3s ease",
                  cursor: "pointer",
                  position: "relative", // Importante para posicionamento absoluto do badge
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "translateY(-5px)"
                  e.currentTarget.style.boxShadow = "0 6px 12px rgba(0, 0, 0, 0.15)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "translateY(0)"
                  e.currentTarget.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.05), 0 1px 3px rgba(0, 0, 0, 0.08)"
                }}
              >
                {/* Exibir o badge se showBadge for true */}
                {item.showBadge && <span style={badgeStyle}>!</span>}

                {/* Cabeçalho do card */}
                <div
                  style={{
                    background: "rgba(24, 62, 255, 0.9)",
                    color: "white",
                    padding: "12px 20px",
                    fontFamily: "Rawline",
                    fontSize: "1.5rem",
                    fontWeight: "600",
                    textAlign: "center",
                  }}
                >
                  {item.text}
                </div>

                {/* Corpo do card com a imagem */}
                <div style={{ height: "200px", overflow: "hidden" }}>
                  <img
                    src={item.img || "/placeholder.svg"}
                    alt={item.text}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      opacity: 0.6,
                    }}
                  />
                </div>
              </div>
            </Link>
          </Col>
        ))}
      </Row>
    </Container>
  )
}

export default Home