import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import PageHeader from "../Components/PageHeader";
import api from '../Config/api';
import GlobalButton from "../Components/Button";

const Login = ({ setIsLoggedIn }) => {
  const [loginInput, setLogin] = useState({
    email: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/dashboard";

  const handleInput = (e) => {
    setLogin({ ...loginInput, [e.target.name]: e.target.value });
    setError(""); // Clear error when user types
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const loginSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setError("");

    try {
      // Direct login call without CSRF - just like Postman
      // console.log("Sending login request:", { email: loginInput.email, password: loginInput.password });
      
      const res = await api.post(`/login`, {
        email: loginInput.email,
        password: loginInput.password,
      });

      // console.log("Login response:", res.data);

      if (res.data.token) {
        // Store auth data based on your Postman response
        localStorage.setItem("auth_token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data.data));
        localStorage.setItem("role", res.data.data.role_id);
        
        setIsLoggedIn(true);
        // console.log("Login successful, navigating to:", from);
        navigate(from, { replace: true });
      }
    } catch (error) {
      console.error("Login error:", error);
      
      // Set user-friendly error message
      if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else if (error.response?.status === 401) {
        setError("Invalid email or password");
      } else if (error.response?.status === 404) {
        setError("Service not available. Please try again later.");
      } else {
        setError("Login failed. Please check your credentials and try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader title="Login" path="Home / Login" />
      <div className="container py-5">
        <div className="row py-5 align-items-stretch">
          {/* Login Column */}
          <div className="col-md-6 mb-4 mb-md-0">
            <h2 className="mb-4 text-uppercase heading">LOGIN</h2> {/* Heading outside box */}
            <div className="p-4 border bg-light shadow-sm h-100 d-flex flex-column">
              {/* Error Message */}
              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={loginSubmit} className="flex-grow-1 d-flex flex-column">
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="form-control rounded-0"
                    placeholder="Enter your email"
                    value={loginInput.email}
                    onChange={handleInput}
                    required
                  />
                </div>
                
                <div className="position-relative">
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>
                  <div className="input-group">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      className="form-control rounded-0 border-end-0"
                      placeholder="Enter your password"
                      value={loginInput.password}
                      onChange={handleInput}
                      required
                    />
                    <button
                      type="button"
                      className="btn border bg-white rounded-0 border-start-0"
                      onClick={togglePasswordVisibility}
                    >
                      <i
                        className={
                          showPassword
                            ? "bi bi-eye-slash text-primary"
                            : "bi bi-eye text-primary"
                        }
                      ></i>
                    </button>
                  </div>
                </div>
                
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-end mt-auto">
                  <GlobalButton
                    children={isSubmitting ? "Logging in..." : "Login"}
                    disabled={isSubmitting}
                  />
                  <p className="text-muted m-0 heading mt-3 mt-md-0">
                    Forgot your password?{" "}
                    <a
                      className="text-primary text-decoration-underline"
                      href="/reset-password"
                    >
                      Reset it here
                    </a>
                  </p>
                </div>
              </form>
            </div>
          </div>

          {/* New Customer Column */}
          <div className="col-md-6">
            <h2 className="mb-4 heading">NEW CUSTOMER</h2> {/* Heading outside box */}
            <div className="p-4 border bg-light shadow-sm h-100 d-flex flex-column">
              <div className="d-flex flex-column">
                <h3 className="h5 mb-3 heading">Create an account</h3>
                <p className="text-muted">Sign up for a free account at our store. Registration is quick and easy. It allows you to be able to order from our shop. To start shopping click register.</p>
                <div className="d-flex mt-auto">
                  <GlobalButton children="Create An Account" to="/register" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;