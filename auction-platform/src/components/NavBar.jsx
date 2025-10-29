import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";

function NavBar() {
  const { user, logout } = useContext(AuthContext);

  return (
    <div>
      <nav className="bg-blue-800 text-white p-4 flex justify-between items-center rounded-lg shadow-md">
        <h1 className="text-xl font-bold"> 🎯 Auction Platform</h1>
        <div>
          <Link to="/">Home</Link>
          {user ? (
            <>
              {user.role === "seller" && (
                <Link to="/seller/dashboard">Dashboard</Link>
              )}
              <button
                onClick={logout}
                className="bg-red-500 px-3 py-1 rounded-lg "
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link to="/register">Register</Link>
              <Link to="/login">Login</Link>
            </>
          )}
        </div>
      </nav>
    </div>
  );
}

export default NavBar;
