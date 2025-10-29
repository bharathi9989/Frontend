import React from "react";
import { AuthProvider } from "./context/AuthContext";
import NavBar from "./components/NavBar";
import SellerDashBoard from "./pages/SellerDashBoard";
import AuctionDetails from "./pages/AuctionDetails";
import CreateAuction from "./pages/CreateAuction";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

function App() {
  return (
    <AuthProvider>
      <NavBar />
      <div className="p-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/seller/dashboard" element={<SellerDashBoard />} />
          <Route path="/auction/:id" element={<AuctionDetails />} />
          <Route path="/auction/create" element={<CreateAuction />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
