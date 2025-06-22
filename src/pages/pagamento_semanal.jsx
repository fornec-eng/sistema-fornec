"use client"

import { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
} from "@mui/material"
import PagamentosApi from "../services/PagamentosApi"

function PagamentoSemanal() {
  const [obras, setObras] = useState([])
  const [selectedObra, setSelectedObra] = useState("")
  const [funcionarios, setFuncionarios] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingPagamentos, setLoadingPagamentos] = useState(false)

  useEffect(() => {
    const fetchObras = async () => {
      try {
        const response = await PagamentosApi.listarPagamentos(1, 100)
        if (!response.error) {
          setObras(
            response.pagamentos.map((p) => ({
              id: p._id,
              name: p.obra.nome,
            })),
          )

          if (response.pagamentos.length > 0) {
            setSelectedObra(response.pagamentos[0]._id)
            await fetchPagamentoData(response.pagamentos[0]._id)
          }
        }
      } catch (error) {
        console.error("Erro ao buscar obras:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchObras()
  }, [])

  const fetchPagamentoData = async (obraId) => {
    if (!obraId) return

    setLoadingPagamentos(true)

    try {
      const response = await PagamentosApi.buscarPagamento(obraId)

      if (!response.error) {
        const pagamentosSemanais = response.pagamento.pagamentosSemanais || []
        setFuncionarios(pagamentosSemanais)
      } else {
        setFuncionarios([])
      }
    } catch (error) {
      console.error("Erro ao carregar dados da obra:", error)
      setFuncionarios([])
    } finally {
      setLoadingPagamentos(false)
    }
  }

  const handleSelectObra = (e) => {
    const chosenId = e.target.value
    setSelectedObra(chosenId)
    fetchPagamentoData(chosenId)
  }

  const marcarComoEfetuado = async (funcionarioId) => {
    try {
      await PagamentosApi.marcarPagamentoEfetuado(selectedObra, funcionarioId)
      // Recarregar dados
      fetchPagamentoData(selectedObra)
    } catch (error) {
      console.error("Erro ao marcar pagamento como efetuado:", error)
    }
  }

  return (
    <div>
      <h1>Pagamento Semanal</h1>

      <FormControl fullWidth>
        <InputLabel id="obra-select-label">Selecione a Obra</InputLabel>
        <Select
          labelId="obra-select-label"
          id="obra-select"
          value={selectedObra}
          label="Selecione a Obra"
          onChange={handleSelectObra}
        >
          {obras.map((obra) => (
            <MenuItem key={obra.id} value={obra.id}>
              {obra.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {loading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: 650 }} aria-label="simple table">
            <TableHead>
              <TableRow>
                <TableCell>Nome do Funcionário</TableCell>
                <TableCell align="right">Valor a Receber</TableCell>
                <TableCell align="right">Pago</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loadingPagamentos ? (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    <CircularProgress />
                  </TableCell>
                </TableRow>
              ) : (
                funcionarios.map((funcionario) => (
                  <TableRow key={funcionario._id} sx={{ "&:last-child td, &:last-child th": { border: 0 } }}>
                    <TableCell component="th" scope="row">
                      {funcionario.nome}
                    </TableCell>
                    <TableCell align="right">{funcionario.valorAReceber}</TableCell>
                    <TableCell align="right">
                      {funcionario.pago ? "Sim" : "Não"}
                      {!funcionario.pago && (
                        <Button onClick={() => marcarComoEfetuado(funcionario._id)}>Marcar como Pago</Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </div>
  )
}

export default PagamentoSemanal
