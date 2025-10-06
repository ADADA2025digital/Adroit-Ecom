import React, { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import PageHeader from "../Components/PageHeader";
import axios from "axios";
import { useCart } from "../Components/CartContext";
import GlobalButton from "../Components/Button";
import PasswordResetModal from "./PasswordReset";

const Login = ({ setIsLoggedIn }) => {
  const [loginInput, setLogin] = useState({
    email: "",
    password: "",
    error_list: {},
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSynced, setHasSynced] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // State for password visibility
  const [showResetModal, setShowResetModal] = useState(false);

  const { syncGuestCartAfterLogin } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/dashboard";

  const handleInput = (e) => {
    setLogin({ ...loginInput, [e.target.name]: e.target.value });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const loginSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      await axios.get("/sanctum/csrf-cookie");
      const res = await axios.post(`/api/login`, {
        email: loginInput.email,
        password: loginInput.password,
      });

      if (res.status === 200) {
        localStorage.setItem("auth_token", res.data.token);
        localStorage.setItem("role", res.data.role);
        localStorage.setItem("user", JSON.stringify(res.data));
        setIsLoggedIn(true);
        // console.log("✅ Logged in successfully");

        if (!hasSynced) {
          await syncGuestCartAfterLogin();
          setHasSynced(true);
          // console.log("✅ Guest cart synced.");
        }

        navigate(from, { replace: true });
      } else if (res.status === 401) {
        alert("Invalid credentials. Please try again.");
      } else {
        setLogin({ ...loginInput, error_list: res.data.errors || {} });
      }
    } catch (error) {
      // console.error("❌ Login error:", error);
      setLogin({
        ...loginInput,
        error_list: error.response?.data?.errors || {},
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <PageHeader title="Login" path="Home / Login" />
      <div className="container py-5">
        <div className="row py-5">
          <div className="col-md-6">
            <h2 className="mb-4 text-uppercase heading">LOGIN</h2>
            <div className="p-4 border bg-light shadow-sm">
              <form onSubmit={loginSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="form-control rounded-0"
                    placeholder="Email"
                    value={loginInput.email}
                    onChange={handleInput}
                    required
                  />
                  <span className="text-danger">
                    {loginInput.error_list.email?.[0] || ""}
                  </span>
                </div>
                <div className="mb-3 position-relative">
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>
                  <div className="input-group">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      className="form-control rounded-0 border-end-0"
                      placeholder="Password"
                      value={loginInput.password}
                      onChange={handleInput}
                      required
                    />
                    <button
                      type="button"
                      className="btn border bg-white rounded-0 border-start-0"
                      onClick={togglePasswordVisibility}
                      style={{
                        borderTopLeftRadius: 0,
                        borderBottomLeftRadius: 0,
                      }}
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
                  <span className="text-danger">
                    {loginInput.error_list.password?.[0] || ""}
                  </span>
                </div>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-end">
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

          <div className="col-md-6 mt-4 mt-md-0">
            <h2 className="mb-4 heading">NEW CUSTOMER</h2>
            <div className="p-4 border bg-light shadow-sm">
              <h3 className="h5 mb-3 heading">Create an account</h3>
              <p className="text-muted">Register quickly and start shopping.</p>
              <div className="d-flex">
                <GlobalButton children="Create An Account" to="/register" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
