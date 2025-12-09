import React, { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";

function NavBar() {
  const { user, logout } = useContext(AuthContext);

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white/10 backdrop-blur-xl border-b border-white/20 shadow-lg animate-fadeIn">
      <div className=" max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* LOGO */}

        <Link
          to="/"
          className="text-xl font-bold text-white tracking-wide hover:opacity-80 transition"
        >
          🎯 Auction Platform
        </Link>

        {/* MENU */}

        <div className="flex items-center gap-6 text-white font-medium">
          {/* Public Link */}

          {!user && (
            <>
              <Link className="hover:underline" to="/login">
                Login
              </Link>
              <Link className="hover:underline" to="/register">
                Register
              </Link>
            </>
          )}

          {/* Logged in Links */}

          {user && (
            <>
              {/* Buyer Menu */}
              {user.role === "buyer" && (
                <Link to="/buyer/auctions" className="hover:underline">
                  Auctions
                </Link>
              )}

              {/* seller menu */}

              {user.role === "seller" && (
                <>
                  <Link to="/seller/dashboard" className="hover:underline">
                    Dashboard
                  </Link>
                  <Link to="/seller/create-auction" className="hover:underline">
                    Create Auction
                  </Link>
                  <Link to="/auctions" className="hover:underline">
                    Auctions
                  </Link>
                </>
              )}
              {/* Logout Button */}
              <button
                onClick={logout}
                className="px-4 py-1 bg-red-500/60 rounded-lg hover:bg-red-600 transition"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
