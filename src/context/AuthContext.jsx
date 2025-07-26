import React, { createContext, useState, useContext, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('bingo_user')));
  const [token, setToken] = useState(() => localStorage.getItem('bingo_token'));
  const navigate = useNavigate();

  const login = (userData, userToken) => {
    setUser(userData);
    setToken(userToken);
    localStorage.setItem('bingo_user', JSON.stringify(userData));
    localStorage.setItem('bingo_token', userToken);
    navigate('/dashboard');
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('bingo_user');
    localStorage.removeItem('bingo_token');
    navigate('/login');
  };

  const value = { user, token, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};