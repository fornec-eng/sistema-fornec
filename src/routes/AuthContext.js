import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Verifica no sessionStorage
    let role = sessionStorage.getItem('_role');
    let token = sessionStorage.getItem('token');

    // Se não encontrar, verifica no localStorage
    if (!role || !token) {
      role = localStorage.getItem('_role');
      token = localStorage.getItem('token');
    }

    setIsAuthenticated(!!role && !!token);
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
