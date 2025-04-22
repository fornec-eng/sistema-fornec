"use client"
import { useParams, useLocation } from "react-router-dom"
import { Container, Row, Col, Nav, Tab } from "react-bootstrap"
import TempoTranscorrido from "./CardTempo"
import CardInvestimentos from "./Cards_investimentos"
import Cronograma from "./CardCronograma"
import GraficoMensal from "./GraficoMensal"
import GraficoInvestimentos from "./GraficoInvestimento"
import CardContratos from "./CardContratos"
import CardRiscos from "./CardRiscos"
import CardEquipe from "./CardEquipe"

const Cards = () => {
  const { id } = useParams()
  // Recupera o nome da obra que foi passado via state na navegação
  const location = useLocation()
  const obraName = location.state?.name || "Dashboard"

  // Cria o objeto obra para ser repassado aos componentes filhos
  const obra = { id, name: obraName }

  return (
    <Container fluid className="mt-4 px-4">
      <h1 className="text-center mb-4">{obra.name}</h1>

      {/* Cards de resumo principais */}
      <Row className="g-4 mb-4">
        <CardInvestimentos obra={obra} />
        <TempoTranscorrido obra={obra} />
      </Row>

      {/* Abas para diferentes seções */}
      <Tab.Container defaultActiveKey="visao-geral">
        <Nav variant="tabs" className="mb-4">
          <Nav.Item>
            <Nav.Link eventKey="visao-geral">Visão Geral</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="contratos">Contratos</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="cronograma">Cronograma</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="equipe">Equipe</Nav.Link>
          </Nav.Item>
          <Nav.Item>
            <Nav.Link eventKey="riscos">Riscos</Nav.Link>
          </Nav.Item>
        </Nav>

        <Tab.Content>
          {/* Aba de Visão Geral */}
          <Tab.Pane eventKey="visao-geral">
            <Row className="g-4">
              {/* Removido Col md={6} para que os gráficos ocupem 100% da largura */}
              <GraficoMensal obra={obra} />
              <GraficoInvestimentos obra={obra} />
            </Row>
          </Tab.Pane>

          {/* Aba de Contratos */}
          <Tab.Pane eventKey="contratos">
            <Row className="g-4">
              <CardContratos obra={obra} />
            </Row>
          </Tab.Pane>

          {/* Aba de Cronograma */}
          <Tab.Pane eventKey="cronograma">
            <Row className="g-4">
              <Cronograma obra={obra} />
            </Row>
          </Tab.Pane>

          {/* Aba de Equipe */}
          <Tab.Pane eventKey="equipe">
            <Row className="g-4">
              <CardEquipe obra={obra} />
            </Row>
          </Tab.Pane>

          {/* Aba de Riscos */}
          <Tab.Pane eventKey="riscos">
            <Row className="g-4">
              <CardRiscos obra={obra} />
            </Row>
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>
    </Container>
  )
}

export default Cards