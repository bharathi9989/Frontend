import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./Pages/Home";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import NavBar from "./components/NavBar";
import SellerDashboard from "./Pages/SellerDashBoard";
import ProductedRoute from "./components/ProductedRoutes";
import CreateAuction from "./Pages/CreateAuction";

function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/seller/dashboard"
          element={
            <ProductedRoute roles={["seller"]}>
              <SellerDashboard />
            </ProductedRoute>
          }
        />
        <Route path="/seller/create-auction" element={<CreateAuction />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
