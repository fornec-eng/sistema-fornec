import ApiBase from "./ApiBase"

class GoogleSheetsService {
  // ID da pasta "Obras" no Google Drive onde as planilhas serão criadas
  static OBRAS_FOLDER_ID = "1ALOCpJyPNQe51HC0TSNX68oa8SIkZqcW"

  // ID do template de planilha - SUBSTITUA pelo ID da sua planilha modelo
  static TEMPLATE_SPREADSHEET_ID = "1tnLeEwbrDgpE8p26zcUe3fhWpmmKnxifyiymxgsX8aU"

  /**
   * Listar arquivos da pasta Obras
   */
  async listarArquivosObras() {
    try {
      const response = await ApiBase.get(`/google/drive/${GoogleSheetsService.OBRAS_FOLDER_ID}`)
      return response.data
    } catch (error) {
      console.error("Erro ao listar arquivos da pasta Obras:", error)
      throw error
    }
  }

  /**
   * Criar nova planilha baseada em template
   */
  async criarPlanilhaObra(nomeObra, dadosObra = {}) {
    try {
      if (!GoogleSheetsService.TEMPLATE_SPREADSHEET_ID) {
        throw new Error("TEMPLATE_SPREADSHEET_ID não configurado. Por favor, insira o ID da sua planilha modelo.")
      }

      const requestData = {
        data: {
          templateId: GoogleSheetsService.TEMPLATE_SPREADSHEET_ID,
          newTitle: `Obra - ${nomeObra}`,
          folderId: GoogleSheetsService.OBRAS_FOLDER_ID,
        },
      }

      const response = await ApiBase.post("/google/sheets/copy", requestData)
      const novaPlanilaId = response.data.spreadsheetId

      // Após criar a planilha, popular com dados iniciais da obra
      if (novaPlanilaId && dadosObra) {
        try {
          await this.popularDadosIniciais(novaPlanilaId, dadosObra)
        } catch (populateError) {
          console.warn("Erro ao popular dados iniciais, mas planilha foi criada:", populateError)
        }
      }

      return {
        ...response.data,
        spreadsheetId: novaPlanilaId,
        url: `https://docs.google.com/spreadsheets/d/${novaPlanilaId}/edit`,
      }
    } catch (error) {
      console.error("Erro ao criar planilha da obra:", error)
      throw error
    }
  }

  /**
   * Excluir planilha do Google Drive
   */
  async excluirPlanilha(spreadsheetId) {
    try {
      if (!spreadsheetId) {
        throw new Error("ID da planilha é obrigatório para exclusão")
      }

      const response = await ApiBase.delete(`/google/drive/files/${spreadsheetId}`)
      return {
        success: true,
        message: "Planilha excluída com sucesso",
        data: response.data,
      }
    } catch (error) {
      console.error("Erro ao excluir planilha:", error)
      throw error
    }
  }

  /**
   * Popular planilha com dados iniciais da obra
   */
  async popularDadosIniciais(spreadsheetId, dadosObra) {
    try {
      // Primeiro, buscar informações da planilha para descobrir os nomes das abas
      let primeiraAba = "Sheet1" // Valor padrão

      try {
        const infoResponse = await ApiBase.get("/google/sheets/fullData", {
          params: {
            spreadsheetId,
            includeData: "false"
          }
        })

        if (infoResponse.data?.sheets && infoResponse.data.sheets.length > 0) {
          primeiraAba = infoResponse.data.sheets[0].properties.title
          console.log("Primeira aba encontrada:", primeiraAba)
        }
      } catch (infoError) {
        console.warn("Não foi possível obter informações da planilha, usando 'Sheet1' como padrão:", infoError.message)
      }

      const dadosParaInserir = [
        [
          "Nome",
          "Cliente",
          "Endereço",
          "Valor Contrato",
          "Data Início",
          "Data Previsão Término",
          "Status",
          "Descrição",
        ],
        [
          dadosObra.nome || "",
          dadosObra.cliente || "",
          dadosObra.endereco || "",
          dadosObra.valorContrato || 0,
          dadosObra.dataInicio ? new Date(dadosObra.dataInicio).toLocaleDateString("pt-BR") : "",
          dadosObra.dataPrevisaoTermino ? new Date(dadosObra.dataPrevisaoTermino).toLocaleDateString("pt-BR") : "",
          dadosObra.status || "planejamento",
          dadosObra.descricao || "",
        ],
      ]

      const updateData = {
        spreadsheetId,
        range: `${primeiraAba}!A1:H2`,
        values: dadosParaInserir,
      }

      // Atualizar dados na primeira aba
      await ApiBase.put("/google/sheets/update", updateData)

      // Criar aba de Cronograma
      try {
        await this.criarAbaCronograma(spreadsheetId)
      } catch (abasError) {
        console.warn("Erro ao criar aba de Cronograma:", abasError)
      }
    } catch (error) {
      console.error("Erro ao popular dados iniciais:", error)
      throw error
    }
  }

  /**
   * Criar aba para o Cronograma
   */
  async criarAbaCronograma(spreadsheetId) {
    try {
      const aba = {
        nome: "Cronograma",
        cabecalhos: ["Etapa", "Data de Início", "Data de Término", "Status", "Responsável", "Observações"],
      }

      await ApiBase.post("/google/sheets/add-sheet", {
        spreadsheetId,
        newSheetTitle: aba.nome,
      })

      await ApiBase.put("/google/sheets/update", {
        spreadsheetId,
        range: `${aba.nome}!A1:${String.fromCharCode(64 + aba.cabecalhos.length)}1`,
        values: [aba.cabecalhos],
      })
    } catch (error) {
      console.error("Erro ao criar aba de cronograma:", error)
    }
  }

  /**
   * Buscar dados do cronograma de uma planilha
   */
  async buscarCronograma(spreadsheetId) {
    try {
      console.log("Buscando cronograma para spreadsheetId:", spreadsheetId)
      if (!spreadsheetId) {
        console.log("SpreadsheetId não fornecido")
        return { values: [] }
      }

      const requestData = {
        data: {
          spreadsheetId,
          range: "Cronograma!A1:F100",
        },
      }

      console.log("Request data:", requestData)
      const response = await ApiBase.post("/google/sheets/data", requestData)
      console.log("Response data:", response.data)
      return response.data
    } catch (error) {
      console.error("Erro ao buscar cronograma da planilha:", error)
      console.error("Error response:", error.response?.data)
      if (error.response?.status === 404 || error.message?.includes("not found")) {
        return { values: [] }
      }
      throw error
    }
  }

  /**
   * Buscar dados de uma planilha específica
   */
  async buscarDadosPlanilha(spreadsheetId, range = "A1:Z1000") {
    try {
      if (!spreadsheetId) {
        throw new Error("ID da planilha é obrigatório")
      }

      const requestData = {
        data: {
          spreadsheetId: spreadsheetId,
          range: range,
        },
      }

      console.log("Buscando dados da planilha:", requestData)

      const response = await ApiBase.post("/google/sheets/data", requestData)
      return response.data
    } catch (error) {
      console.error("Erro ao buscar dados da planilha:", error)

      // Se o erro for 404 ou relacionado à aba não encontrada, retornar dados vazios
      if (error.response?.status === 404 || error.message?.includes("not found")) {
        return { values: [] }
      }

      throw error
    }
  }

  /**
   * Buscar dados completos da obra incluindo todas as abas
   */
  async buscarDadosCompletosObra(spreadsheetId) {
    try {
      console.log("Buscando dados completos da obra:", spreadsheetId)

      // Primeiro tentar buscar dados básicos da obra
      let obraData = { values: [] }
      try {
        obraData = await this.buscarDadosPlanilha(spreadsheetId, "Sheet1!A1:H100")
      } catch (error) {
        console.warn("Erro ao buscar dados da obra:", error)
        try {
          obraData = await this.buscarDadosPlanilha(spreadsheetId, "A1:H100")
        } catch (error2) {
          console.warn("Erro ao buscar dados com range simples:", error2)
        }
      }

      // Buscar dados das outras abas
      const [materiaisData, maoObraData, equipamentosData, contratosData, outrosGastosData] = await Promise.allSettled([
        this.buscarDadosPlanilha(spreadsheetId, "Materiais!A1:F1000").catch(() => ({ values: [] })),
        this.buscarDadosPlanilha(spreadsheetId, "Mão de Obra!A1:F1000").catch(() => ({ values: [] })),
        this.buscarDadosPlanilha(spreadsheetId, "Equipamentos!A1:F1000").catch(() => ({ values: [] })),
        this.buscarDadosPlanilha(spreadsheetId, "Contratos!A1:F1000").catch(() => ({ values: [] })),
        this.buscarDadosPlanilha(spreadsheetId, "Outros Gastos!A1:F1000").catch(() => ({ values: [] })),
      ])

      return {
        obra: obraData,
        materiais: materiaisData.status === "fulfilled" ? materiaisData.value : { values: [] },
        maoObra: maoObraData.status === "fulfilled" ? maoObraData.value : { values: [] },
        equipamentos: equipamentosData.status === "fulfilled" ? equipamentosData.value : { values: [] },
        contratos: contratosData.status === "fulfilled" ? contratosData.value : { values: [] },
        outrosGastos: outrosGastosData.status === "fulfilled" ? outrosGastosData.value : { values: [] },
      }
    } catch (error) {
      console.error("Erro ao buscar dados completos da obra:", error)

      return {
        obra: { values: [] },
        materiais: { values: [] },
        maoObra: { values: [] },
        equipamentos: { values: [] },
        contratos: { values: [] },
        outrosGastos: { values: [] },
      }
    }
  }

  /**
   * Buscar informações completas da planilha
   */
  async buscarInformacoesPlanilha(spreadsheetId) {
    try {
      const response = await ApiBase.get("/google/sheets/fullData", {
        params: {
          data: {
            spreadsheetId,
            includeData: "true",
          },
        },
      })
      return response.data
    } catch (error) {
      console.error("Erro ao buscar informações da planilha:", error)
      throw error
    }
  }

  /**
   * Converter dados da planilha para formato de obra
   */
  converterDadosPlanilhaParaObra(dadosPlanilha, spreadsheetId) {
    try {
      const valores = dadosPlanilha.values || []
      if (valores.length < 2) {
        return {
          _id: `sheets_${spreadsheetId}`,
          nome: `Obra ${spreadsheetId.substring(0, 8)}`,
          cliente: "",
          endereco: "",
          valorContrato: 0,
          dataInicio: new Date().toISOString(),
          dataPrevisaoTermino: new Date().toISOString(),
          status: "planejamento",
          descricao: "",
          source: "spreadsheet",
          spreadsheetId,
          spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
        }
      }

      const cabecalhos = valores[0]
      const primeiraLinha = valores[1]

      const getValueByHeader = (header) => {
        const index = cabecalhos.findIndex((h) => h && h.toLowerCase().includes(header.toLowerCase()))
        return index >= 0 ? primeiraLinha[index] : ""
      }

      const obra = {
        _id: `sheets_${spreadsheetId}`,
        nome: getValueByHeader("nome") || dadosPlanilha.properties?.title || `Obra ${spreadsheetId.substring(0, 8)}`,
        cliente: getValueByHeader("cliente") || "",
        endereco: getValueByHeader("endereço") || getValueByHeader("endereco") || "",
        valorContrato: this.parseValor(getValueByHeader("valor")) || 0,
        dataInicio: getValueByHeader("início") || getValueByHeader("inicio") || new Date().toISOString(),
        dataPrevisaoTermino:
          getValueByHeader("término") ||
          getValueByHeader("termino") ||
          getValueByHeader("previsão") ||
          new Date().toISOString(),
        status: getValueByHeader("status") || "planejamento",
        descricao: getValueByHeader("descrição") || getValueByHeader("descricao") || "",
        source: "spreadsheet",
        spreadsheetId,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
      }

      return obra
    } catch (error) {
      console.error("Erro ao converter dados da planilha:", error)

      return {
        _id: `sheets_${spreadsheetId}`,
        nome: `Obra ${spreadsheetId.substring(0, 8)}`,
        cliente: "",
        endereco: "",
        valorContrato: 0,
        dataInicio: new Date().toISOString(),
        dataPrevisaoTermino: new Date().toISOString(),
        status: "planejamento",
        descricao: "",
        source: "spreadsheet",
        spreadsheetId,
        spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`,
      }
    }
  }

  /**
   * Converter dados de gastos da planilha
   */
  converterDadosGastos(dadosAba, tipo) {
    try {
      const valores = dadosAba.values || []
      if (valores.length < 2) return []

      const cabecalhos = valores[0]
      const gastos = []

      const getIndexByHeader = (header) => {
        return cabecalhos.findIndex((h) => h && h.toLowerCase().includes(header.toLowerCase()))
      }

      for (let i = 1; i < valores.length; i++) {
        const linha = valores[i]
        if (linha.length === 0 || !linha[0]) continue

        let gasto = { _id: `sheet_${tipo}_${i}` }

        switch (tipo) {
          case "materiais":
            gasto = {
              ...gasto,
              data: linha[getIndexByHeader("data")] || "",
              descricao: linha[getIndexByHeader("descrição") >= 0 ? getIndexByHeader("descrição") : 1] || "",
              numeroNota: linha[getIndexByHeader("nota")] || "",
              localCompra: linha[getIndexByHeader("local")] || "",
              valor: this.parseValor(linha[getIndexByHeader("valor")]) || 0,
              observacoes: linha[getIndexByHeader("observ")] || "",
            }
            break
          case "maoObra":
            gasto = {
              ...gasto,
              nome: linha[getIndexByHeader("nome") >= 0 ? getIndexByHeader("nome") : 0] || "",
              funcao: linha[getIndexByHeader("função") >= 0 ? getIndexByHeader("função") : 1] || "",
              valor: this.parseValor(linha[getIndexByHeader("valor")]) || 0,
              dataInicio: linha[getIndexByHeader("início")] || "",
              dataFim: linha[getIndexByHeader("fim")] || "",
              status: linha[getIndexByHeader("status")] || "ativo",
            }
            break
          case "equipamentos":
            gasto = {
              ...gasto,
              item: linha[getIndexByHeader("item") >= 0 ? getIndexByHeader("item") : 0] || "",
              tipoContratacao: linha[getIndexByHeader("tipo")] || "",
              valor: this.parseValor(linha[getIndexByHeader("valor")]) || 0,
              data: linha[getIndexByHeader("data")] || "",
              fornecedor: linha[getIndexByHeader("fornecedor")] || "",
              observacoes: linha[getIndexByHeader("observ")] || "",
            }
            break
          case "contratos":
            gasto = {
              ...gasto,
              nome: linha[getIndexByHeader("nome") >= 0 ? getIndexByHeader("nome") : 0] || "",
              tipoPagamento: linha[getIndexByHeader("pagamento")] || "",
              valor: this.parseValor(linha[getIndexByHeader("valor")]) || 0,
              dataInicio: linha[getIndexByHeader("início")] || "",
              status: linha[getIndexByHeader("status")] || "ativo",
              observacoes: linha[getIndexByHeader("observ")] || "",
            }
            break
          case "outrosGastos":
            gasto = {
              ...gasto,
              descricao: linha[getIndexByHeader("descrição") >= 0 ? getIndexByHeader("descrição") : 0] || "",
              categoriaLivre: linha[getIndexByHeader("categoria")] || "",
              valor: this.parseValor(linha[getIndexByHeader("valor")]) || 0,
              data: linha[getIndexByHeader("data")] || "",
              formaPagamento: linha[getIndexByHeader("forma")] || "",
              observacoes: linha[getIndexByHeader("observ")] || "",
            }
            break
        }

        gastos.push(gasto)
      }

      return gastos
    } catch (error) {
      console.error(`Erro ao converter dados de ${tipo}:`, error)
      return []
    }
  }

  /**
   * Adicionar novo gasto à planilha
   */
  async adicionarGasto(spreadsheetId, tipo, dadosGasto) {
    try {
      const nomeAba = this.getNomeAba(tipo)
      const proximaLinha = await this.getProximaLinhaVazia(spreadsheetId, nomeAba)
      const valores = this.formatarDadosParaPlanilha(tipo, dadosGasto)

      const updateData = {
        spreadsheetId,
        range: `${nomeAba}!A${proximaLinha}:${String.fromCharCode(64 + valores.length)}${proximaLinha}`,
        values: [valores],
      }

      await ApiBase.put("/google/sheets/update", updateData)

      return { success: true, linha: proximaLinha }
    } catch (error) {
      console.error("Erro ao adicionar gasto à planilha:", error)
      throw error
    }
  }

  /**
   * Obter nome da aba baseado no tipo
   */
  getNomeAba(tipo) {
    const mapeamento = {
      materiais: "Materiais",
      maoObra: "Mão de Obra",
      equipamentos: "Equipamentos",
      contratos: "Contratos",
      outrosGastos: "Outros Gastos",
    }
    return mapeamento[tipo] || "Outros Gastos"
  }

  /**
   * Obter próxima linha vazia na planilha
   */
  async getProximaLinhaVazia(spreadsheetId, nomeAba) {
    try {
      const dados = await this.buscarDadosPlanilha(spreadsheetId, `${nomeAba}!A:A`)
      const valores = dados.values || []
      return valores.length + 1
    } catch (error) {
      console.error("Erro ao obter próxima linha:", error)
      return 2
    }
  }

  /**
   * Formatar dados para inserção na planilha
   */
  formatarDadosParaPlanilha(tipo, dados) {
    switch (tipo) {
      case "materiais":
        return [
          dados.data || new Date().toLocaleDateString("pt-BR"),
          dados.descricao || "",
          dados.numeroNota || "",
          dados.localCompra || "",
          dados.valor || 0,
          dados.observacoes || "",
        ]
      case "maoObra":
        return [
          dados.nome || "",
          dados.funcao || "",
          dados.valor || 0,
          dados.dataInicio || "",
          dados.dataFim || "",
          dados.status || "ativo",
        ]
      case "equipamentos":
        return [
          dados.item || "",
          dados.tipoContratacao || "",
          dados.valor || 0,
          dados.data || new Date().toLocaleDateString("pt-BR"),
          dados.fornecedor || "",
          dados.observacoes || "",
        ]
      case "contratos":
        return [
          dados.nome || "",
          dados.tipoPagamento || "",
          dados.valor || 0,
          dados.dataInicio || "",
          dados.status || "ativo",
          dados.observacoes || "",
        ]
      case "outrosGastos":
        return [
          dados.descricao || "",
          dados.categoriaLivre || "",
          dados.valor || 0,
          dados.data || new Date().toLocaleDateString("pt-BR"),
          dados.formaPagamento || "",
          dados.observacoes || "",
        ]
      default:
        return []
    }
  }

  /**
   * Converter string de valor para número
   */
  parseValor(valorString) {
    if (!valorString) return 0
    if (typeof valorString === "number") return valorString
    if (typeof valorString !== "string") return 0

    const valorLimpo = valorString.replace(/[R$\s]/g, "")
    const valorNumerico = Number.parseFloat(valorLimpo.replace(",", "."))

    return isNaN(valorNumerico) ? 0 : valorNumerico
  }

  /**
   * Calcular totais dos gastos
   */
  calcularTotaisGastos(dadosCompletos) {
    let totalGeral = 0
    const totaisPorTipo = {}

    Object.keys(dadosCompletos).forEach((tipo) => {
      if (tipo === "obra") return

      const gastos = dadosCompletos[tipo]
      if (!gastos || !gastos.values || gastos.values.length < 2) {
        totaisPorTipo[tipo] = 0
        return
      }

      const valores = gastos.values.slice(1)
      let totalTipo = 0

      valores.forEach((linha) => {
        const valorIndex = this.getValorIndex(tipo)
        if (linha[valorIndex]) {
          const valor = this.parseValor(linha[valorIndex])
          totalTipo += valor
        }
      })

      totaisPorTipo[tipo] = totalTipo
      totalGeral += totalTipo
    })

    return {
      totalGeral,
      totaisPorTipo,
      saldo: 0,
    }
  }

  /**
   * Obter índice da coluna de valor baseado no tipo
   */
  getValorIndex(tipo) {
    const indices = {
      materiais: 4,
      maoObra: 2,
      equipamentos: 2,
      contratos: 2,
      outrosGastos: 2,
    }
    return indices[tipo] || 2
  }
}

export default new GoogleSheetsService()
