// src/components/NavBar.jsx
import React, { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { HiMenu, HiX } from "react-icons/hi";

export default function NavBar() {
  const { user, logout } = useContext(AuthContext);
  const [open, setOpen] = useState(false);

  const toggleMenu = () => setOpen(!open);

  return (
    <nav className="fixed top-0 left-0 w-full z-50 bg-white/10 backdrop-blur-xl border-b border-white/20 shadow-lg animate-fadeIn">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* LOGO */}
        <Link
          to="/"
          className="text-2xl font-bold text-white tracking-wide hover:opacity-80 transition"
        >
          🎯 Auction Pro
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-8 text-white font-medium">
          {!user && (
            <>
              <NavItem to="/login" label="Login" />
              <NavItem to="/register" label="Register" />
            </>
          )}

          {user && (
            <>
              {user.role === "buyer" && (<>
                <NavItem to="/buyer/auctions" label="Auctions" />
                <NavItem to="/buyer/profile" label="Profile" />
              </>)}

              {user.role === "seller" && (
                <>
                  <NavItem to="/seller/dashboard" label="Dashboard" />
                  <NavItem to="/seller/create-auction" label="Create Auction" />
                  <NavItem to="/buyer/auctions" label="Marketplace" />
                </>
              )}

              <button
                onClick={logout}
                className="px-4 py-1 bg-red-500/70 rounded-lg hover:bg-red-600 transition"
              >
                Logout
              </button>
            </>
          )}
        </div>

        {/* Mobile Hamburger */}
        <button
          onClick={toggleMenu}
          className="md:hidden text-white text-3xl hover:opacity-70"
        >
          {open ? <HiX /> : <HiMenu />}
        </button>
      </div>

      {/* Mobile Slide-Down Menu */}
      {open && (
        <div className="md:hidden bg-white/10 backdrop-blur-xl border-t border-white/20 px-6 py-4 animate-fadeInDown">
          <div className="flex flex-col gap-4 text-white text-lg">
            {!user && (
              <>
                <NavItem to="/login" label="Login" onClick={toggleMenu} />
                <NavItem to="/register" label="Register" onClick={toggleMenu} />
              </>
            )}

            {user && (
              <>
                {user.role === "buyer" && (
                  <>
                    <NavItem
                      to="/buyer/auctions"
                      label="Auctions"
                      onClick={toggleMenu}
                    />
                    <NavItem
                      to="/buyer/profile"
                      label="Profile"
                      onClick={toggleMenu}
                    />
                  </>
                )}

                {user.role === "seller" && (
                  <>
                    <NavItem
                      to="/seller/dashboard"
                      label="Dashboard"
                      onClick={toggleMenu}
                    />
                    <NavItem
                      to="/seller/create-auction"
                      label="Create Auction"
                      onClick={toggleMenu}
                    />
                    <NavItem
                      to="/buyer/auctions"
                      label="Marketplace"
                      onClick={toggleMenu}
                    />
                  </>
                )}

                <button
                  onClick={() => {
                    toggleMenu();
                    logout();
                  }}
                  className="px-4 py-2 bg-red-500/70 rounded-lg hover:bg-red-600 transition text-left"
                >
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

/* Reusable NavItem Component */
function NavItem({ to, label, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="relative group hover:opacity-90 transition"
    >
      {label}
      {/* Animated Underline */}
      <span className="absolute left-0 -bottom-1 w-0 group-hover:w-full h-0.5 bg-white transition-all duration-300"></span>
    </Link>
  );
}
