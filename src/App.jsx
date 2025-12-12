import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import NavBar from "./components/NavBar";

// PUBLIC PAGES
import Home from "./Pages/Home";
import Login from "./Pages/Login";
import Register from "./Pages/Register";

// SELLER PROTECTED ROUTES
import ProductedRoute from "./components/ProductedRoutes";
import SellerDashboard from "./Pages/SellerDashBoard.jsx";
import CreateAuction from "./Pages/CreateAuction.jsx";
import SellerAuctions from "./Pages/SellerAuctions.jsx";

// PRODUCT MANAGEMENT (Seller)
import MyProducts from "./Pages/MyProducts.jsx";
import EditProduct from "./Pages/EditeProducts.jsx";

// BUYER ROUTES
import AuctionList from "./Pages/AuctionList.jsx";
import AuctionDetails from "./Pages/AuctionDetails.jsx";
import BuyerProfile from "./Pages/BuyerProfile.jsx";
import BidHistory from "./Pages/BidHistory.jsx";
import CreateProduct from "./Pages/createProduct.jsx";

function App() {
  return (
    <BrowserRouter>
      <NavBar />

      <Routes>
        {/* ---------------- PUBLIC ROUTES ---------------- */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* ---------------- SELLER ROUTES ---------------- */}
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

        {/* ----------- PRODUCT MANAGEMENT ROUTES ------------ */}
        <Route
          path="/seller/products"
          element={
            <ProductedRoute roles={["seller"]}>
              <MyProducts />
            </ProductedRoute>
          }
        />

        <Route
          path="/seller/create-product"
          element={
            <ProductedRoute roles={["seller"]}>
              <CreateProduct />
            </ProductedRoute>
          }
        />
        

        <Route
          path="/seller/edit-product/:id"
          element={
            <ProductedRoute roles={["seller"]}>
              <EditProduct />
            </ProductedRoute>
          }
        />

        {/* ---------------- BUYER ROUTES ---------------- */}
        <Route path="/auctions" element={<AuctionList />} />

        <Route
          path="/buyer/profile"
          element={
            <ProductedRoute roles={["buyer"]}>
              <BuyerProfile />
            </ProductedRoute>
          }
        />

        <Route
          path="/bids/history"
          element={
            <ProductedRoute roles={["buyer"]}>
              <BidHistory />
            </ProductedRoute>
          }
        />

        {/* ---------------- AUCTION DETAILS ---------------- */}
        <Route path="/auction/:id" element={<AuctionDetails />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
