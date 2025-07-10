import { Route, Routes } from "react-router-dom"
import PrivateRoute from "../routes/PrivateRoute"

// Pages
import Login from "../pages/login"
import Home from "../pages/home"
import Cadastro from "../pages/cadastro"
import Financeiro from "../pages/financeiro"
import Inventario from "../pages/inventario"
import Usuarios from "../pages/usuarios"
import Pagamento_semanal from "../pages/pagamento_semanal"
import ObrasAtivas from "../pages/obras_ativas"
import AdicionarPagamentos from "../pages/adicionar-pagamentos"
import ObraDashboard from "../pages/obra-dashboard"

const Routers = () => {
  return (
    <Routes>
      {/* Rotas Públicas */}
      <Route path="/login" element={<Login />} />
      <Route path="/cadastro" element={<Cadastro />} />

      {/* Rotas Privadas */}
      <Route path="/" element={<PrivateRoute />}>
        <Route index element={<Home />} />
        <Route path="home" element={<Home />} />
        <Route path="obras_ativas" element={<ObrasAtivas />} />
        <Route path="obras/:id" element={<ObraDashboard />} /> {/* Rota atualizada */}
        <Route path="financeiro" element={<Financeiro />} />
        <Route path="usuarios" element={<Usuarios />} />
        <Route path="pagamento_semanal" element={<Pagamento_semanal />} />
        <Route path="adicionar-pagamentos" element={<AdicionarPagamentos />} />
        <Route path="inventario" element={<Inventario />} />
      </Route>
    </Routes>
  )
}

export default Routers
