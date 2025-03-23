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

            <Route path="/inventario" element={<Inventario />} />   
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
        </Routes>
    </>
  );
};

export default Routers;