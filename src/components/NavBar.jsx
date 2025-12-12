// src/components/NavBar.jsx
import React, { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { HiMenu, HiX } from "react-icons/hi";

export default function NavBar() {
  const { user, logout } = useContext(AuthContext);
  const [open, setOpen] = useState(false);

  const toggleMenu = () => setOpen((prev) => !prev);

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

          {/* BUYER MENU */}
          {user?.role === "buyer" && (
            <>
              <NavItem to="/auctions" label="Marketplace" />
              <NavItem to="/buyer/profile" label="Profile" />
              <NavItem to="/bids/history" label="Bid History" />
            </>
          )}

          {/* SELLER MENU */}
          {user?.role === "seller" && (
            <>
              <NavItem to="/seller/dashboard" label="Dashboard" />
              <NavItem to="/seller/products" label="My Products" />
              <NavItem to="/seller/create-auction" label="Create Auction" />

              {/* Marketplace is SAME for seller → buyer view */}
              <NavItem to="/auctions" label="Marketplace" />

              <NavItem to="/seller/auctions" label="My Auctions" />
            </>
          )}

          {user && (
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-500/80 rounded-lg hover:bg-red-600 transition"
            >
              Logout
            </button>
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

      {/* Mobile Menu */}
      {open && (
        <div className="md:hidden bg-white/10 backdrop-blur-xl border-t border-white/20 px-6 py-4 animate-fadeInDown">
          <div className="flex flex-col gap-4 text-white text-lg">
            {!user && (
              <>
                <NavItem to="/login" label="Login" onClick={toggleMenu} />
                <NavItem to="/register" label="Register" onClick={toggleMenu} />
              </>
            )}

            {/* BUYER MOBILE MENU */}
            {user?.role === "buyer" && (
              <>
                <NavItem
                  to="/auctions"
                  label="Marketplace"
                  onClick={toggleMenu}
                />
                <NavItem
                  to="/buyer/profile"
                  label="Profile"
                  onClick={toggleMenu}
                />
                <NavItem
                  to="/bids/history"
                  label="Bid History"
                  onClick={toggleMenu}
                />
              </>
            )}

            {/* SELLER MOBILE MENU */}
            {user?.role === "seller" && (
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

                {/* Marketplace always points to /auctions */}
                <NavItem
                  to="/auctions"
                  label="Marketplace"
                  onClick={toggleMenu}
                />

                <NavItem
                  to="/seller/auctions"
                  label="My Auctions"
                  onClick={toggleMenu}
                />
              </>
            )}

            {user && (
              <button
                onClick={() => {
                  toggleMenu();
                  logout();
                }}
                className="px-4 py-2 bg-red-500/70 rounded-lg hover:bg-red-600 transition text-left"
              >
                Logout
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

/* Reusable Navigation Item */
function NavItem({ to, label, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="relative group hover:opacity-90 transition"
    >
      {label}
      <span className="absolute left-0 -bottom-1 w-0 group-hover:w-full h-0.5 bg-white transition-all duration-300"></span>
    </Link>
  );
}
