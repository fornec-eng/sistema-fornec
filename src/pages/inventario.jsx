"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Table, Spinner, Badge, Form, InputGroup } from "react-bootstrap"
import { Package, Truck, Warehouse, Search, BarChart2, AlertTriangle } from "lucide-react"
import ApiBase from "../services/ApiBase"

const Inventario = () => {
  const [title, setTitle] = useState("")
  const [header, setHeader] = useState([])
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [totalInventoryValue, setTotalInventoryValue] = useState(0)
  const [lowStockItems, setLowStockItems] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [filterLocation, setFilterLocation] = useState("")
  const [locations, setLocations] = useState([])

  // Verifica qual é o papel (role) do usuário
  // Pode estar em localStorage ou sessionStorage, dependendo de como você salvou
  const role = localStorage.getItem("_role") || sessionStorage.getItem("_role")
  const isAdmin = role === "Admin"

  // Função para extrair apenas o número de uma string, ex.: "70 sacos" -> 70, "R$ 25,00" -> 25
  const parseNumber = (str = "") => {
    if (typeof str === "number") return str
    // Remove tudo que não for dígito, ponto ou vírgula, depois troca vírgula por ponto
    const numeric = str
      .toString()
      .replace(/[^\d,.-]/g, "")
      .replace(",", ".")
    return Number.parseFloat(numeric) || 0 // retorna 0 se não conseguir converter
  }

  // Formata número como moeda em R$ (Ex.: 1750 -> "R$ 1.750,00")
  const formatCurrency = (num) => {
    if (isNaN(num)) return "R$ 0,00"
    return num.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })
  }

  // Verifica se uma linha tem dados válidos (pelo menos nome e quantidade restante)
  const isValidRow = (row) => {
    return row[0] && row[0].trim() !== "" && row[3] && parseNumber(row[3]) > 0
  }

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const res = await ApiBase.post("/google/sheets/inventario", {
          data: {
            spreadsheetId: "1gisXYf9qckWe54c1w0EoGI222gfGvOteZ0hyJ42BtsE",
            range: "inventario",
          },
        })
        const values = res.data.values

        // Verifica se há ao menos 2 linhas: linha 0 -> título, linha 1 -> cabeçalho
        if (values && values.length > 1) {
          // A linha 0 (primeira) contém o título
          setTitle(values[0][0])

          // A linha 1 contém o cabeçalho original
          const originalHeader = values[1]

          // Filtra apenas as linhas com dados válidos
          const validRows = values.slice(2).filter(isValidRow)

          // Extrai locais de armazenamento únicos para o filtro
          const uniqueLocations = [...new Set(validRows.map((row) => row[5]).filter(Boolean))]
          setLocations(uniqueLocations)

          // Identifica itens com estoque baixo (menos de 20% da quantidade comprada)
          const lowStock = validRows.filter((row) => {
            const qtyPurchased = parseNumber(row[1])
            const qtyRemaining = parseNumber(row[3])
            return qtyPurchased > 0 && qtyRemaining / qtyPurchased < 0.2
          })
          setLowStockItems(lowStock)

          // Processa as linhas para adicionar o valor total
          let totalValue = 0
          const processedRows = validRows.map((row) => {
            const qtnRestante = parseNumber(row[3])
            const valorUnitario = parseNumber(row[6])
            const valorTotal = qtnRestante * valorUnitario

            // Acumula o valor total do inventário
            totalValue += valorTotal

            // Retorna a linha com o valor total calculado
            return [...row, formatCurrency(valorTotal)]
          })

          setTotalInventoryValue(totalValue)

          // Se for Admin, mostramos todas as colunas incluindo valores
          if (isAdmin) {
            setHeader([...originalHeader, "Valor Total"])
            setRows(processedRows)
          } else {
            // Se não for Admin, removemos as colunas de valor
            const userHeader = originalHeader.slice(0, 6)
            const userRows = processedRows.map((row) => row.slice(0, 6))
            setHeader(userHeader)
            setRows(userRows)
          }
        }
      } catch (error) {
        console.error("Erro ao buscar o inventário:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchInventory()
  }, [isAdmin])

  // Filtra as linhas com base na pesquisa e no filtro de localização
  const filteredRows = rows.filter((row) => {
    const matchesSearch = searchTerm === "" || row[0].toLowerCase().includes(searchTerm.toLowerCase())

    const matchesLocation = filterLocation === "" || (row[5] && row[5].includes(filterLocation))

    return matchesSearch && matchesLocation
  })

  if (loading) {
    return (
      <div className="d-flex justify-content-center mt-4">
        <Spinner animation="border" variant="primary" />
      </div>
    )
  }

  return (
    <Container fluid className="mt-4">
      <h1 className="text-center mb-4">{title}</h1>

      {/* Cards de resumo */}
      <Row className="mb-4">
        <Col md={4}>
          <Card className="shadow-sm h-100">
            <Card.Body className="d-flex flex-column">
              <div className="d-flex align-items-center mb-3">
                <div className="rounded-circle bg-primary bg-opacity-10 p-3 me-3">
                  <Package className="text-primary" size={24} />
                </div>
                <div>
                  <h6 className="mb-0 text-muted">Total de Itens</h6>
                  <h4 className="mb-0">{rows.length}</h4>
                </div>
              </div>
              <p className="text-muted mt-auto">{rows.length} itens diferentes no inventário</p>
            </Card.Body>
          </Card>
        </Col>

        {isAdmin && (
          <Col md={4}>
            <Card className="shadow-sm h-100">
              <Card.Body className="d-flex flex-column">
                <div className="d-flex align-items-center mb-3">
                  <div className="rounded-circle bg-success bg-opacity-10 p-3 me-3">
                    <BarChart2 className="text-success" size={24} />
                  </div>
                  <div>
                    <h6 className="mb-0 text-muted">Valor Total do Inventário</h6>
                    <h4 className="mb-0">{formatCurrency(totalInventoryValue)}</h4>
                  </div>
                </div>
                <p className="text-muted mt-auto">Valor total de todos os itens em estoque</p>
              </Card.Body>
            </Card>
          </Col>
        )}

        <Col md={isAdmin ? 4 : 8}>
          <Card className="shadow-sm h-100">
            <Card.Body className="d-flex flex-column">
              <div className="d-flex align-items-center mb-3">
                <div className="rounded-circle bg-warning bg-opacity-10 p-3 me-3">
                  <AlertTriangle className="text-warning" size={24} />
                </div>
                <div>
                  <h6 className="mb-0 text-muted">Itens com Estoque Baixo</h6>
                  <h4 className="mb-0">{lowStockItems.length}</h4>
                </div>
              </div>
              <p className="text-muted mt-auto">{lowStockItems.length} itens com menos de 20% do estoque inicial</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Filtros e pesquisa */}
      <Card className="shadow-sm mb-4">
        <Card.Body>
          <Row>
            <Col md={6}>
              <InputGroup className="mb-3">
                <InputGroup.Text>
                  <Search size={18} />
                </InputGroup.Text>
                <Form.Control
                  placeholder="Pesquisar item..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </InputGroup>
            </Col>
            <Col md={6}>
              <Form.Group>
                <Form.Select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)}>
                  <option value="">Todos os locais</option>
                  {locations.map((location, index) => (
                    <option key={index} value={location}>
                      {location}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Tabela de inventário */}
      <Card className="shadow-sm">
        <Card.Body>
          <Card.Title className="mb-4">Lista de Itens</Card.Title>

          <div className="table-responsive">
            <Table striped bordered hover>
              <thead className="bg-light">
                <tr>
                  {header.map((col, index) => (
                    <th key={index} className="text-nowrap">
                      {col}
                    </th>
                  ))}
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRows.length === 0 ? (
                  <tr>
                    <td colSpan={header.length + 1} className="text-center py-4">
                      Nenhum item encontrado.
                    </td>
                  </tr>
                ) : (
                  filteredRows.map((row, rowIndex) => {
                    // Calcula o percentual de estoque restante
                    const qtyPurchased = parseNumber(row[1])
                    const qtyRemaining = parseNumber(row[3])
                    const percentRemaining = qtyPurchased > 0 ? (qtyRemaining / qtyPurchased) * 100 : 0

                    // Define o status com base no percentual
                    let statusBadge
                    if (percentRemaining <= 20) {
                      statusBadge = <Badge bg="danger">Crítico</Badge>
                    } else if (percentRemaining <= 50) {
                      statusBadge = (
                        <Badge bg="warning" text="dark">
                          Baixo
                        </Badge>
                      )
                    } else {
                      statusBadge = <Badge bg="success">Normal</Badge>
                    }

                    return (
                      <tr key={rowIndex}>
                        {row.map((cell, cellIndex) => (
                          <td key={cellIndex}>{cell}</td>
                        ))}
                        <td>{statusBadge}</td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Seção de itens com estoque baixo */}
      {lowStockItems.length > 0 && (
        <Card className="shadow-sm mt-4">
          <Card.Header className="bg-warning bg-opacity-10">
            <div className="d-flex align-items-center">
              <AlertTriangle className="text-warning me-2" size={20} />
              <h5 className="mb-0">Itens com Estoque Baixo</h5>
            </div>
          </Card.Header>
          <Card.Body>
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead className="bg-light">
                  <tr>
                    <th>Nome do Item</th>
                    <th>Qtn. Restante</th>
                    <th>Local de armazenamento</th>
                    {isAdmin && <th>Valor Unitário</th>}
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.map((item, index) => (
                    <tr key={index}>
                      <td>{item[0]}</td>
                      <td>
                        {item[3]} {item[4]}
                      </td>
                      <td>{item[5]}</td>
                      {isAdmin && <td>{item[6]}</td>}
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* Seção de locais de armazenamento */}
      <Card className="shadow-sm mt-4">
        <Card.Header className="bg-primary bg-opacity-10">
          <div className="d-flex align-items-center">
            <Warehouse className="text-primary me-2" size={20} />
            <h5 className="mb-0">Locais de Armazenamento</h5>
          </div>
        </Card.Header>
        <Card.Body>
          <Row>
            {locations.map((location, index) => {
              const itemsInLocation = rows.filter((row) => row[5] === location)
              const itemCount = itemsInLocation.length

              return (
                <Col md={4} key={index} className="mb-3">
                  <Card className="h-100 border-0 shadow-sm">
                    <Card.Body>
                      <div className="d-flex align-items-center">
                        <div className="rounded-circle bg-light p-2 me-3">
                          {location.toLowerCase().includes("obra") ? (
                            <Truck size={20} className="text-primary" />
                          ) : (
                            <Warehouse size={20} className="text-primary" />
                          )}
                        </div>
                        <div>
                          <h6 className="mb-0">{location}</h6>
                          <small className="text-muted">{itemCount} itens</small>
                        </div>
                      </div>
                    </Card.Body>
                  </Card>
                </Col>
              )
            })}
          </Row>
        </Card.Body>
      </Card>
    </Container>
  )
}

export default Inventario
