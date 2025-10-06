import React, { useEffect, useState } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import axios from "axios";
import Dashboard from "./Pages/UserDashboard";

function AdminPrivateRoute({ handleLogout }) {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(true); // assume true initially

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    if (!token) {
      setAuthenticated(false);
      return;
    }

    const checkAuth = async () => {
      try {
        const res = await axios.get("/api/checkingAuthenticated", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.status !== 200) {
          setAuthenticated(false);
          navigate("/login", { replace: true });
        }
      } catch (error) {
        setAuthenticated(false);
        navigate("/login", { replace: true });
      }
    };

    checkAuth();
  }, [navigate]);

  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      (response) => response,
      (err) => {
        if (err.response && err.response.status === 401) {
          localStorage.removeItem("auth_token");
          navigate("/login", { replace: true });
        }
        return Promise.reject(err);
      }
    );
    return () => axios.interceptors.response.eject(interceptor);
  }, [navigate]);

  // instantly render dashboard
  return authenticated ? (
    <Dashboard handleLogout={handleLogout}>
      <Outlet />
    </Dashboard>
  ) : (
    <Navigate to="/login" replace />
  );
}

export default AdminPrivateRoute;