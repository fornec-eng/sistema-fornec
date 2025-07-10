import ApiBase from "./ApiBase"
import NovaPagamentosApi from "./NovaPagamentosApi"

class ObrasService {
  // Buscar apenas lista simples de obras para seleção
  static async buscarObrasParaSelecao() {
    try {
      // Primeiro tenta buscar da nova API para pegar obras que já têm pagamentos
      const responsePagamentos = await NovaPagamentosApi.listarPagamentos({
        page: 1,
        limit: 1000,
        status: "associado",
      })

      const obrasComPagamentos = new Set()

      if (responsePagamentos.pagamentos) {
        responsePagamentos.pagamentos.forEach((pagamento) => {
          if (pagamento.obraId) {
            obrasComPagamentos.add(pagamento.obraId)
          }
        })
      }

      // Buscar da API antiga para ter mais opções
      let obrasAPI = []
      try {
        const responseAntiga = await ApiBase.get("/pagamentos")
        obrasAPI = responseAntiga.data.pagamentos || []
      } catch (error) {
        console.warn("Erro ao buscar da API antiga:", error)
      }

      // Combinar obras
      const obrasFormatadas = []

      // Adicionar obras da API antiga
      obrasAPI.forEach((obra) => {
        obrasFormatadas.push({
          id: obra._id,
          name: obra.obra.nome,
          fonte: "api_antiga",
        })
      })

      // Adicionar obras que só existem na nova API
      obrasComPagamentos.forEach((obraId) => {
        const jaExiste = obrasFormatadas.some((obra) => obra.id === obraId)
        if (!jaExiste) {
          obrasFormatadas.push({
            id: obraId,
            name: `Obra ${obraId}`,
            fonte: "nova_api",
          })
        }
      })

      // Se não encontrou nenhuma obra, criar algumas de exemplo
      if (obrasFormatadas.length === 0) {
        obrasFormatadas.push(
          {
            id: "obra-exemplo-1",
            name: "Obra Exemplo 1",
            fonte: "exemplo",
          },
          {
            id: "obra-exemplo-2",
            name: "Obra Exemplo 2",
            fonte: "exemplo",
          },
        )
      }

      return obrasFormatadas
    } catch (error) {
      console.error("Erro ao buscar obras para seleção:", error)

      // Fallback com obras de exemplo
      return [
        {
          id: "obra-exemplo-1",
          name: "Obra Exemplo 1",
          fonte: "exemplo",
        },
        {
          id: "obra-exemplo-2",
          name: "Obra Exemplo 2",
          fonte: "exemplo",
        },
      ]
    }
  }

  // Buscar obra completa (planilha + pagamentos) - para usar na página /obra
  static async buscarObraCompleta(obraId) {
    try {
      // Buscar dados da planilha (API antiga)
      let dadosPlanilha = null
      try {
        const responseAntiga = await ApiBase.get("/pagamentos")
        const obraAPI = responseAntiga.data.pagamentos?.find((p) => p._id === obraId)
        if (obraAPI) {
          dadosPlanilha = {
            id: obraAPI._id,
            name: obraAPI.obra.nome,
            orcamento: obraAPI.obra.orcamento || 0,
            gastoTotalPlanilha: obraAPI.valorTotalGasto || 0,
            dataInicio: obraAPI.obra.dataInicio,
            temDadosPlanilha: true,
          }
        }
      } catch (error) {
        console.warn("Erro ao buscar dados da planilha:", error)
      }

      // Buscar pagamentos da nova API
      const responsePagamentos = await NovaPagamentosApi.listarPagamentos({
        obraId: obraId,
        page: 1,
        limit: 1000,
        status: "associado",
      })

      const dadosPagamentos = {
        quantidadePagamentos: 0,
        gastoTotal: 0,
        gastoMateriais: 0,
        gastoMaoObra: 0,
        gastoPagamentosSemanais: 0,
        pagamentosPorTipo: {
          material: 0,
          mao_obra: 0,
          pagamento_semanal: 0,
        },
      }

      if (responsePagamentos.pagamentos) {
        dadosPagamentos.quantidadePagamentos = responsePagamentos.pagamentos.length

        responsePagamentos.pagamentos.forEach((pagamento) => {
          switch (pagamento.tipo) {
            case "material":
              dadosPagamentos.gastoMateriais += pagamento.valor || 0
              dadosPagamentos.pagamentosPorTipo.material++
              break
            case "mao_obra":
              dadosPagamentos.gastoMaoObra += pagamento.valorTotal || 0
              dadosPagamentos.pagamentosPorTipo.mao_obra++
              break
            case "pagamento_semanal":
              dadosPagamentos.gastoPagamentosSemanais += pagamento.totalReceber || pagamento.valorPagar || 0
              dadosPagamentos.pagamentosPorTipo.pagamento_semanal++
              break
          }
        })

        dadosPagamentos.gastoTotal =
          dadosPagamentos.gastoMateriais + dadosPagamentos.gastoMaoObra + dadosPagamentos.gastoPagamentosSemanais
      }

      // Mesclar dados
      const obraCompleta = {
        id: obraId,
        name: dadosPlanilha?.name || `Obra ${obraId}`,
        orcamento: dadosPlanilha?.orcamento || 0,
        gastoTotal: dadosPagamentos.gastoTotal,
        gastoTotalPlanilha: dadosPlanilha?.gastoTotalPlanilha || 0,
        gastoTotalPagamentos: dadosPagamentos.gastoTotal,
        saldoRestante: (dadosPlanilha?.orcamento || 0) - dadosPagamentos.gastoTotal,
        percentualGasto:
          dadosPlanilha?.orcamento > 0 ? (dadosPagamentos.gastoTotal / dadosPlanilha.orcamento) * 100 : 0,
        dataInicio: dadosPlanilha?.dataInicio,
        temDadosPlanilha: !!dadosPlanilha,
        quantidadePagamentos: dadosPagamentos.quantidadePagamentos,
        gastoMateriais: dadosPagamentos.gastoMateriais,
        gastoMaoObra: dadosPagamentos.gastoMaoObra,
        gastoPagamentosSemanais: dadosPagamentos.gastoPagamentosSemanais,
        pagamentosPorTipo: dadosPagamentos.pagamentosPorTipo,
        erro: false,
      }

      return obraCompleta
    } catch (error) {
      console.error("Erro ao buscar obra completa:", error)
      return {
        id: obraId,
        name: `Obra ${obraId}`,
        erro: true,
        mensagemErro: error.message,
      }
    }
  }

  // Buscar todas as obras completas - para usar na página /obra
  static async buscarObrasCompletas() {
    try {
      const obrasParaSelecao = await this.buscarObrasParaSelecao()
      const obrasCompletas = []

      for (const obra of obrasParaSelecao) {
        const obraCompleta = await this.buscarObraCompleta(obra.id)
        obrasCompletas.push(obraCompleta)
      }

      return obrasCompletas
    } catch (error) {
      console.error("Erro ao buscar obras completas:", error)
      throw error
    }
  }

  // Utilitários
  static formatarValorMonetario(valor) {
    return (valor || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    })
  }

  static formatarData(data) {
    if (!data) return ""
    return new Date(data).toLocaleDateString("pt-BR")
  }
}

export default ObrasService
