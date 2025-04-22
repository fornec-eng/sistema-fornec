"use client"
import React from "react"
import { Helmet } from "react-helmet"
import PagamentoCard from "../components/CardFuncionario"

const Pagamento_semanal = () => {
  return (
    <>
      <Helmet>
        <title>Gestão de Pagamentos - Fornec Engenharia</title>
      </Helmet>
      <PagamentoCard />
    </>
  )
}

export default Pagamento_semanal
