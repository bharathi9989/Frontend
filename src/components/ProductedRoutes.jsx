import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

import React from "react";
import { Navigate } from "react-router-dom";

function ProductedRoutes({ children, roles }) {
  const { user } = useContext(AuthContext);

  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) {
    return <Navigate to="/" />;
  }

  return children;
}

export default ProductedRoutes;
