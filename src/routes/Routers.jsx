import React from "react";
import { Route, Routes } from "react-router-dom";
import PrivateRoute from '../routes/PrivateRoute'


//pages

import Login from "../pages/login";
import Home from "../pages/home";
import Cadastro from "../pages/cadastro";
import Cards from "../components/Cards";
import Financeiro from "../pages/financeiro";
import Inventario from "../pages/inventario";
import Usuarios from "../pages/usuarios";
import Pagamento_semanal from "../pages/pagamento_semanal";
import Obras_ativas from "../pages/obras_ativas";
import GestaoPagamentos from "../pages/GestaoPagamentos";
import AdicionarPagamentos from "../pages/adicionar-pagamentos";

const Routers = () => {
  return (
    <>
        <Routes>
            <Route path="/" element={<PrivateRoute />} >
                <Route path="/" element={<Home />} />
            </Route>
            <Route path="/home" element={<PrivateRoute />} >
                <Route path="/home" element={<Home />} />
            </Route> 
            <Route path="/obras_ativas" element={<PrivateRoute />} >
                <Route path="/obras_ativas" element={<Obras_ativas />} />
            </Route>
            <Route path="/financeiro" element={<PrivateRoute />} >
                <Route path="/financeiro" element={<Financeiro />} />
            </Route>
            <Route path="/usuarios" element={<PrivateRoute />} >
                <Route path="/usuarios" element={<Usuarios />} />
            </Route>  
            <Route path="/pagamento_semanal" element={<PrivateRoute />} >
                <Route path="/pagamento_semanal" element={<Pagamento_semanal />} />
            </Route>
            <Route path="/adicionar-pagamentos" element={<PrivateRoute />} >
                <Route path="/adicionar-pagamentos" element={<AdicionarPagamentos />} />
            </Route>          

            <Route path="/inventario" element={<Inventario />} />   
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/gestao-pagamentos" element={<GestaoPagamentos />} />

            {/* Nova rota para o dashboard, recebendo o ID da obra */}
            <Route path="/dashboard/:id" element={<PrivateRoute />}>
                <Route path="/dashboard/:id" element={<Cards />} />
            </Route>
        </Routes>
    </>
  );
};

export default Routers;