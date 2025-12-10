import { createContext, useEffect, useState } from "react";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore from localStorage
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("token");

    if (savedUser && savedToken) {
      const parsed = JSON.parse(savedUser);

      const fixedUser = {
        ...parsed,
        _id: parsed._id || parsed.id,

        // DEFAULT NOTIFICATION SETTINGS
        notificationSettings: {
          auctionEnd: parsed.notificationSettings?.auctionEnd ?? true,
          newBid: parsed.notificationSettings?.newBid ?? true,
        },
      };

      setUser(fixedUser);
      setToken(savedToken);

      localStorage.setItem("user", JSON.stringify(fixedUser));

      console.log("Auth Restored:", fixedUser);
    }

    setLoading(false);
  }, []);

  // LOGIN FUNCTION
  const login = (data) => {
    const fixedUser = {
      ...data.user,
      _id: data.user._id || data.user.id,

      // DEFAULT NOTIFICATION SETTINGS
      notificationSettings: {
        auctionEnd: data.user.notificationSettings?.auctionEnd ?? true,
        newBid: data.user.notificationSettings?.newBid ?? true,
      },
    };

    setUser(fixedUser);
    setToken(data.token);

    localStorage.setItem("user", JSON.stringify(fixedUser));
    localStorage.setItem("token", data.token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.clear();

    // FORCE refresh to update NavBar correctly
    window.location.href = "/";
  };

  if (loading) return <div className="text-center p-8">Loading...</div>;

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
