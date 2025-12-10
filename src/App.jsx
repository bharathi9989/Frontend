import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import Home from "./Pages/Home";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import NavBar from "./components/NavBar";

import SellerDashboard from "./Pages/SellerDashBoard.jsx";
import ProductedRoute from "./components/ProductedRoutes";
import CreateAuction from "./Pages/CreateAuction.jsx";

import AuctionList from "./Pages/AuctionList.jsx";
import AuctionDetails from "./Pages/AuctionDetails.jsx";

import BidHistory from "./Pages/BidHistory.jsx";
import BuyerProfile from "./Pages/BuyerProfile.jsx";
import SellerAuctions from "./Pages/SellerAuctions.jsx";

function App() {
  return (
    <BrowserRouter>
      <NavBar />

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Seller Routes */}
        <Route
          path="/seller/dashboard"
          element={
            <ProductedRoute roles={["seller"]}>
              <SellerDashboard />
            </ProductedRoute>
          }
        />

        <Route
          path="/seller/create-auction"
          element={
            <ProductedRoute roles={["seller"]}>
              <CreateAuction />
            </ProductedRoute>
          }
        />

        <Route
          path="/seller/auctions"
          element={
            <ProductedRoute roles={["seller"]}>
              <SellerAuctions />
            </ProductedRoute>
          }
        />

        {/* Buyer Routes */}
        <Route path="/buyer/auctions" element={<AuctionList />} />
        <Route path="/buyer/profile" element={<BuyerProfile />} />
        <Route path="/bids/history" element={<BidHistory />} />

        {/* Auction Details */}
        <Route path="/auction/:id" element={<AuctionDetails />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
