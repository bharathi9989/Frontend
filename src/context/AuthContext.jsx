import { createContext, useEffect, useState } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore from localStorage on refresh
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("token");

    if (savedUser && savedToken) {
      const parsed = JSON.parse(savedUser);

      // 🔥 FIX: guarantee _id exists always
      const fixedUser = {
        ...parsed,
        _id: parsed._id || parsed.id,
      };

      setUser(fixedUser);
      setToken(savedToken);

      // rewrite corrected user back into storage
      localStorage.setItem("user", JSON.stringify(fixedUser));

      console.log("Auth Restored:", fixedUser);
    }

    setLoading(false);
  }, []);

  // LOGIN FUNCTION (MANDATORY FIX)
  const login = (data) => {
    const fixedUser = {
      ...data.user,
      _id: data.user._id || data.user.id, // 🔥 ensure _id exists
    };

    setUser(fixedUser);
    setToken(data.token);

    localStorage.setItem("user", JSON.stringify(fixedUser));
    localStorage.setItem("token", data.token);

    console.log("User saved:", fixedUser);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.clear();
  };

  if (loading) return <div className="text-center p-8">Loading...</div>;

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
