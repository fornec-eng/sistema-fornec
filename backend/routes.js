// routes.js
const { Router } = require("express")
const authMidd = require("../middlewares/auth.js")

const LoginController = require("../controllers/loginController")
const userController = require("../controllers/userController.js")
const googleController = require("../controllers/googleController")

// Importar os novos controllers
const obraController = require("../controllers/obraController")
const maoObraController = require("../controllers/maoObraController")
const contratosController = require("../controllers/contratosController")
const materialController = require("../controllers/materialController")
const equipamentosController = require("../controllers/equipamentosController")
const outrosGastosController = require("../controllers/outrosGastosController")
const entradaController = require("../controllers/entradaController")

const routes = new Router()

// ==================== ROTAS DE AUTENTICAÇÃO ====================
routes.post("/login", LoginController.login)

// ==================== ROTAS DE USUÁRIO ====================
routes.get("/list", userController.list)
routes.post("/user", userController.create)

// Rotas protegidas para Admin (gerenciamento geral)
routes.get("/user/:id", authMidd(["Admin"]), userController.listOne)
routes.put("/user/:id", authMidd(["Admin"]), userController.update)
routes.delete("/user/:id", authMidd(["Admin"]), userController.delete)
routes.get("/user/pending", authMidd(["Admin"]), userController.listPendingApprovals)

routes.put("/user/:userId/obras-permitidas", authMidd(["Admin"]), userController.updateObrasPermitidas)
routes.get("/user/:userId/obras-permitidas", authMidd(["Admin", "User"]), userController.getObrasPermitidas)

// Rotas para que o próprio usuário atualize ou delete seu registro
routes.put("/user/self", authMidd(["User", "Admin"]), userController.updateSelf)
routes.delete("/user/self", authMidd(["User", "Admin"]), userController.deleteSelf)

// ==================== ROTAS DO GOOGLE DRIVE E SHEETS ====================
routes.get("/google/drive/folders", authMidd(["User", "Admin"]), googleController.listFolders)
routes.get("/google/drive/:folderId", authMidd(["User", "Admin"]), googleController.listFiles)
routes.post("/google/sheets/create", authMidd(["Admin"]), googleController.createSpreadsheet)
routes.post("/google/sheets/data", authMidd(["User", "Admin"]), googleController.getSpreadsheetData)
routes.post("/google/sheets/inventario", googleController.getSpreadsheetData)
routes.get("/google/sheets/fullData", authMidd(["User", "Admin"]), googleController.getFullSpreadsheetData)
routes.post("/google/sheets/copy", authMidd(["User", "Admin"]), googleController.copySpreadsheet)
routes.put("/google/sheets/update", authMidd(["User", "Admin"]), googleController.updateSpreadsheetData) // Nova rota
routes.post("/google/sheets/add-sheet", authMidd(["User", "Admin"]), googleController.addSheet) // Nova rota
routes.delete("/google/drive/files/:fileId", authMidd(["Admin"]), googleController.deleteFile)

// ==================== ROTAS DE OBRAS ====================
routes.get("/obras", authMidd(["User", "Admin"]), (req, res) => obraController.readAll(req, res))
routes.post("/obras", authMidd(["User", "Admin"]), (req, res) => obraController.create(req, res))
routes.get("/obras/:id", authMidd(["User", "Admin"]), (req, res) => obraController.readById(req, res))
routes.put("/obras/:id", authMidd(["User", "Admin"]), (req, res) => obraController.update(req, res))
routes.delete("/obras/:id", authMidd(["Admin"]), (req, res) => obraController.delete(req, res))
routes.get("/obras-ativas", authMidd(["Admin"]), (req, res) => obraController.getObrasAtivas(req, res))
routes.get("/obras/:id/relatorio-gastos", authMidd(["User", "Admin"]), (req, res) =>
  obraController.relatorioGastos(req, res),
)
routes.put("/obras/:id/spreadsheet", authMidd(["User", "Admin"]), (req, res) =>
  obraController.updateSpreadsheetId(req, res),
)
routes.get("/obras/spreadsheet/:spreadsheetId", authMidd(["User", "Admin"]), (req, res) =>
  obraController.getBySpreadsheetId(req, res),
)

// ==================== ROTAS DE MÃO DE OBRA ====================
routes.get("/mao-obra", authMidd(["User", "Admin"]), (req, res) => maoObraController.readAll(req, res))
routes.post("/mao-obra", authMidd(["User", "Admin"]), (req, res) => maoObraController.create(req, res))
routes.get("/mao-obra/:id", authMidd(["User", "Admin"]), (req, res) => maoObraController.readById(req, res))
routes.put("/mao-obra/:id", authMidd(["User", "Admin"]), (req, res) => maoObraController.update(req, res))
routes.delete("/mao-obra/:id", authMidd(["Admin"]), (req, res) => maoObraController.delete(req, res))

// ==================== ROTAS DE CONTRATOS ATUALIZADAS ====================

routes.get("/contratos/relatorio/pagamentos", authMidd(["User", "Admin"]), (req, res) =>
  contratosController.relatorioPagamentos(req, res),
)

// CRUD básico de contratos
routes.get("/contratos", authMidd(["User", "Admin"]), (req, res) => contratosController.readAll(req, res))
routes.post("/contratos", authMidd(["User", "Admin"]), (req, res) => contratosController.create(req, res))
routes.get("/contratos/:id", authMidd(["User", "Admin"]), (req, res) => contratosController.readById(req, res))
routes.put("/contratos/:id", authMidd(["User", "Admin"]), (req, res) => contratosController.update(req, res))
routes.delete("/contratos/:id", authMidd(["Admin"]), (req, res) => contratosController.delete(req, res))

// CRUD de pagamentos dentro dos contratos
routes.get("/contratos/:id/pagamentos", authMidd(["User", "Admin"]), (req, res) =>
  contratosController.listarPagamentos(req, res),
)
routes.post("/contratos/:id/pagamentos", authMidd(["User", "Admin"]), (req, res) =>
  contratosController.adicionarPagamento(req, res),
)
routes.get("/contratos/:id/pagamentos/:pagamentoId", authMidd(["User", "Admin"]), (req, res) =>
  contratosController.buscarPagamento(req, res),
)
routes.put("/contratos/:id/pagamentos/:pagamentoId", authMidd(["User", "Admin"]), (req, res) =>
  contratosController.atualizarPagamento(req, res),
)
routes.delete("/contratos/:id/pagamentos/:pagamentoId", authMidd(["User", "Admin"]), (req, res) =>
  contratosController.removerPagamento(req, res),
)

// ==================== ROTAS DE MATERIAIS ====================
routes.get("/materiais/relatorio/pagamentos", authMidd(["User", "Admin"]), (req, res) =>
  materialController.relatorioPagamentos(req, res),
)

// CRUD básico de materiais
routes.get("/materiais", authMidd(["User", "Admin"]), (req, res) => materialController.readAll(req, res))
routes.post("/materiais", authMidd(["User", "Admin"]), (req, res) => materialController.create(req, res))
routes.get("/materiais/:id", authMidd(["User", "Admin"]), (req, res) => materialController.readById(req, res))
routes.put("/materiais/:id", authMidd(["User", "Admin"]), (req, res) => materialController.update(req, res))
routes.delete("/materiais/:id", authMidd(["Admin"]), (req, res) => materialController.delete(req, res))

// CRUD de pagamentos dentro dos materiais
routes.get("/materiais/:id/pagamentos", authMidd(["User", "Admin"]), (req, res) =>
  materialController.listarPagamentos(req, res),
)
routes.post("/materiais/:id/pagamentos", authMidd(["User", "Admin"]), (req, res) =>
  materialController.adicionarPagamento(req, res),
)
routes.get("/materiais/:id/pagamentos/:pagamentoId", authMidd(["User", "Admin"]), (req, res) =>
  materialController.buscarPagamento(req, res),
)
routes.put("/materiais/:id/pagamentos/:pagamentoId", authMidd(["User", "Admin"]), (req, res) =>
  materialController.atualizarPagamento(req, res),
)
routes.delete("/materiais/:id/pagamentos/:pagamentoId", authMidd(["User", "Admin"]), (req, res) =>
  materialController.removerPagamento(req, res),
)

// ==================== ROTAS DE EQUIPAMENTOS ====================
routes.get("/equipamentos", authMidd(["User", "Admin"]), (req, res) => equipamentosController.readAll(req, res))
routes.post("/equipamentos", authMidd(["User", "Admin"]), (req, res) => equipamentosController.create(req, res))
routes.get("/equipamentos/:id", authMidd(["User", "Admin"]), (req, res) => equipamentosController.readById(req, res))
routes.put("/equipamentos/:id", authMidd(["User", "Admin"]), (req, res) => equipamentosController.update(req, res))
routes.delete("/equipamentos/:id", authMidd(["Admin"]), (req, res) => equipamentosController.delete(req, res))

// ==================== ROTAS DE OUTROS GASTOS ====================
routes.get("/outros-gastos", authMidd(["User", "Admin"]), (req, res) => outrosGastosController.readAll(req, res))
routes.post("/outros-gastos", authMidd(["User", "Admin"]), (req, res) => outrosGastosController.create(req, res))
routes.get("/outros-gastos/:id", authMidd(["User", "Admin"]), (req, res) => outrosGastosController.readById(req, res))
routes.put("/outros-gastos/:id", authMidd(["User", "Admin"]), (req, res) => outrosGastosController.update(req, res))
routes.delete("/outros-gastos/:id", authMidd(["Admin"]), (req, res) => outrosGastosController.delete(req, res))
routes.get("/outros-gastos/relatorio/categoria", authMidd(["User", "Admin"]), (req, res) =>
  outrosGastosController.relatorioPorCategoria(req, res),
)

// ==================== ROTAS DE ENTRADAS ====================
routes.get("/entradas", authMidd(["User", "Admin"]), (req, res) => entradaController.readAll(req, res))
routes.post("/entradas", authMidd(["User", "Admin"]), (req, res) => entradaController.create(req, res))
routes.get("/entradas/:id", authMidd(["User", "Admin"]), (req, res) => entradaController.readById(req, res))
routes.put("/entradas/:id", authMidd(["User", "Admin"]), (req, res) => entradaController.update(req, res))
routes.delete("/entradas/:id", authMidd(["Admin"]), (req, res) => entradaController.delete(req, res))

// ==================== ROTA RAIZ ====================
routes.get("/", (req, res) => {
  res.status(200).json({
    status: "Success",
    msg: "API Fornec - Sistema de Gerenciamento de Gastos rodando!",
    version: "2.0.0",
    endpoints: {
      obras: "/obras",
      maoObra: "/mao-obra",
      contratos: "/contratos",
      materiais: "/materiais",
      equipamentos: "/equipamentos",
      outrosGastos: "/outros-gastos",
      entradas: "/entradas",
      googleSheets: {
        listFolders: "/google/drive/folders",
        listFiles: "/google/drive/:folderId",
        createSpreadsheet: "/google/sheets/create",
        copySpreadsheet: "/google/sheets/copy",
        getSpreadsheetData: "/google/sheets/data",
        getFullSpreadsheetData: "/google/sheets/fullData",
        updateSpreadsheetData: "/google/sheets/update", // Nova
        addSheet: "/google/sheets/add-sheet", // Nova
      },
    },
  })
})

// ==================== TRATAMENTO DE ERROS ====================
// Tratamento de rotas não encontradas
routes.use((req, res, next) => {
  res.status(404).json({
    error: true,
    msg: "Endpoint não encontrado",
    availableEndpoints: [
      "GET /obras",
      "POST /obras",
      "GET /obras/:id",
      "PUT /obras/:id",
      "DELETE /obras/:id",
      "GET /mao-obra",
      "POST /mao-obra",
      "GET /mao-obra/:id",
      "PUT /mao-obra/:id",
      "DELETE /mao-obra/:id",
      "GET /contratos",
      "POST /contratos",
      "GET /contratos/:id",
      "PUT /contratos/:id",
      "DELETE /contratos/:id",
      "GET /materiais",
      "POST /materiais",
      "GET /materiais/:id",
      "PUT /materiais/:id",
      "DELETE /materiais/:id",
      "GET /materiais/relatorio/pagamentos",
      "GET /materiais/:id/pagamentos",
      "POST /materiais/:id/pagamentos",
      "GET /materiais/:id/pagamentos/:pagamentoId",
      "PUT /materiais/:id/pagamentos/:pagamentoId",
      "DELETE /materiais/:id/pagamentos/:pagamentoId",
      "GET /equipamentos",
      "POST /equipamentos",
      "GET /equipamentos/:id",
      "PUT /equipamentos/:id",
      "DELETE /equipamentos/:id",
      "GET /outros-gastos",
      "POST /outros-gastos",
      "GET /outros-gastos/:id",
      "PUT /outros-gastos/:id",
      "DELETE /outros-gastos/:id",
      "GET /outros-gastos/relatorio/categoria",
      "GET /entradas",
      "POST /entradas",
      "GET /entradas/:id",
      "PUT /entradas/:id",
      "DELETE /entradas/:id",
      "GET /entradas/relatorio/categoria",
      "GET /entradas/relatorio/periodo",
      "GET /google/drive/folders",
      "GET /google/drive/:folderId",
      "POST /google/sheets/create",
      "POST /google/sheets/data",
      "POST /google/sheets/inventario",
      "GET /google/sheets/fullData",
      "POST /google/sheets/copy",
      "PUT /google/sheets/update", // Nova
      "POST /google/sheets/add-sheet", // Nova,
      "PUT /obras/:id/spreadsheet",
      "GET /obras/spreadsheet/:spreadsheetId",
      "GET /obras-ativas",
      "PUT /user/:userId/obras-permitidas",
      "GET /user/:userId/obras-permitidas",
    ],
  })
})

// Tratamento de erros internos
routes.use((error, req, res, next) => {
  console.error("Erro interno:", error)
  return res.status(500).json({
    error: true,
    message: "Erro interno do servidor",
    details: process.env.NODE_ENV === "development" ? error.message : "Contate o administrador",
  })
})

module.exports = routes
