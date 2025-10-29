import { createContext, useEffect, useState } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("token") || "");

  useEffect(() => {
    if (token) {
      const userData = JSON.parse(localStorage.getItem("user"));
      setUser(userData);
    }
  }, [token]);

  const login = (data) => {
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
  };

  const logout = () => {
    setUser(null);
    setToken("");
    localStorage.clear();
  };

  return (
    <>
      <AuthContext.Provider value={{ user, token, login, logout }}>
        {children}
      </AuthContext.Provider>
    </>
  );
}
