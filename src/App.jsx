import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

import NavBar from "./components/NavBar";

// PUBLIC PAGES
import Home from "./Pages/Home";
import Login from "./Pages/Login";
import Register from "./Pages/Register";

// SELLER PROTECTED ROUTES
import ProductedRoutes from "./components/ProductedRoutes";
import SellerDashboard from "./Pages/SellerDashBoard.jsx";
import CreateAuction from "./Pages/CreateAuction.jsx";
import SellerAuctions from "./Pages/SellerAuctions.jsx";

// PRODUCT MANAGEMENT (Seller)
import MyProducts from "./Pages/MyProducts.jsx";
import EditProduct from "./Pages/EditeProducts.jsx";
import CreateProduct from "./Pages/CreateProduct.jsx";

// BUYER ROUTES
import AuctionList from "./Pages/AuctionList.jsx";
import AuctionDetails from "./Pages/AuctionDetails.jsx";
import BuyerProfile from "./Pages/BuyerProfile.jsx";
import BidHistory from "./Pages/BidHistory.jsx";

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
            <ProductedRoutes roles={["seller"]}>
              <SellerDashboard />
            </ProductedRoutes>
          }
        />

        <Route
          path="/seller/create-auction"
          element={
            <ProductedRoutes roles={["seller"]}>
              <CreateAuction />
            </ProductedRoutes>
          }
        />

        <Route
          path="/seller/auctions"
          element={
            <ProductedRoutes roles={["seller"]}>
              <SellerAuctions />
            </ProductedRoutes>
          }
        />

        {/* ----------- PRODUCT MANAGEMENT ROUTES ------------ */}
        <Route
          path="/seller/products"
          element={
            <ProductedRoutes roles={["seller"]}>
              <MyProducts />
            </ProductedRoutes>
          }
        />

        <Route
          path="/seller/create-product"
          element={
            <ProductedRoutes roles={["seller"]}>
              <CreateProduct />
            </ProductedRoutes>
          }
        />

        <Route
          path="/seller/edit-product/:id"
          element={
            <ProductedRoutes roles={["seller"]}>
              <EditProduct />
            </ProductedRoutes>
          }
        />

        {/* ---------------- BUYER ROUTES ---------------- */}
        <Route path="/auctions" element={<AuctionList />} />

        <Route
          path="/buyer/profile"
          element={
            <ProductedRoutes roles={["buyer"]}>
              <BuyerProfile />
            </ProductedRoutes>
          }
        />

        <Route
          path="/bids/history"
          element={
            <ProductedRoutes roles={["buyer"]}>
              <BidHistory />
            </ProductedRoutes>
          }
        />

        {/* ---------------- AUCTION DETAILS ---------------- */}
        <Route path="/auction/:id" element={<AuctionDetails />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
