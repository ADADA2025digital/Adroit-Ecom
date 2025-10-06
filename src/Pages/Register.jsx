import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "../Components/PageHeader";
import axios from "axios";
import GlobalButton from "../Components/Button";

const Register = () => {
  const navigate = useNavigate();
  const [registerInput, setRegisterInput] = useState({
    firstname: "",
    lastname: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    error_list: {},
  });
  
  // State for toggling password visibility
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleInput = (e) => {
    e.persist();
    setRegisterInput({ ...registerInput, [e.target.name]: e.target.value });
  };

  const registerSubmit = (e) => {
    e.preventDefault();

    const data = {
      firstname: registerInput.firstname,
      lastname: registerInput.lastname,
      email: registerInput.email,
      phone: registerInput.phone,
      password: registerInput.password,
      password_confirmation: registerInput.confirm_password,
      role_id: 2,
    };

    axios.get("/sanctum/csrf-cookie").then(() => {
      axios
        .post(`/api/register`, data)
        .then((res) => {
          // console.log("Response data:", res.data); // Log response data

          if (res.status === 200) {
            // Use res.data.status instead of res.status
            localStorage.setItem("auth_token", res.data.token);
            localStorage.setItem("auth_name", res.data.name);
            alert("Register Successfully"); // Use a temporary // console.log here if alert is not working
            navigate("/dashboard");
          } else {
            setRegisterInput({
              ...registerInput,
              error_list: res.data.errors || {},
            });
          }
        })
        .catch((error) => {
          if (error.response) {
            setRegisterInput({
              ...registerInput,
              error_list: error.response.data.errors || {},
            });
            // console.error("Server responded with:", error.response.data);
          } else if (error.request) {
            // console.error("Request made but no response:", error.request);
          } else {
            // console.error("Error setting up the request:", error.message);
          }
        });
    });
  };

  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validateName = (name) => {
    return /^[A-Za-z]+$/.test(name);
  };

  const validatePassword = (password) => {
    return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/.test(
      password
    );
  };

  const handleChange = (e) => {
    const { id, value } = e.target;
    setRegisterInput({ ...registerInput, [id]: value });

    let errorMsg = "";
    if (id === "firstName" || id === "lastName") {
      if (!validateName(value)) errorMsg = "Only letters are allowed";
    }
    if (id === "email") {
      if (!validateEmail(value)) errorMsg = "Invalid email format";
    }
    if (id === "password") {
      if (!validatePassword(value)) {
        errorMsg =
          "Password must be at least 8 characters and include uppercase, lowercase, number, and symbol";
      }
    }
    setErrors({ ...errors, [id]: errorMsg });
  };

  const isFormValid =
    Object.values(errors).every((err) => err === "") &&
    Object.values(registerInput).every((val) => val !== "");

  return (
    <>
      <PageHeader title="Register" path="Home / Register" />
      <div className="container py-5">
        <div className="row mt-4 justify-content-center">
          <h2 className="mb-4 text-uppercase heading">CREATE AN ACCOUNT</h2>
          <div className="p-4 border bg-light shadow-sm">
            <form onSubmit={registerSubmit}>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label htmlFor="firstname" className="form-label">
                    First Name
                  </label>
                  <input
                    type="text"
                    className={`form-control rounded-0 ${
                      errors.firstName ? "is-invalid" : ""
                    }`}
                    id="firstname"
                    name="firstname"
                    placeholder="First Name"
                    value={registerInput.firstname}
                    onChange={handleInput}
                  />
                  {/* {errors.firstName && (
                    <div className="invalid-feedback">{errors.firstName}</div>
                  )} */}
                  <span className="text-danger">
                    {registerInput.error_list.firstname
                      ? registerInput.error_list.firstname[0]
                      : ""}
                  </span>
                </div>
                <div className="col-md-6">
                  <label htmlFor="lastname" className="form-label">
                    Last Name
                  </label>
                  <input
                    type="text"
                    className={`form-control rounded-0 ${
                      errors.lastName ? "is-invalid" : ""
                    }`}
                    id="lastname"
                    name="lastname"
                    placeholder="Last Name"
                    value={registerInput.lastname}
                    onChange={handleInput}
                  />
                  <span className="text-danger">
                    {registerInput.error_list.lastname
                      ? registerInput.error_list.lastname[0]
                      : ""}
                  </span>
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>
                  <input
                    type="email"
                    className={`form-control rounded-0 ${
                      errors.email ? "is-invalid" : ""
                    }`}
                    id="email"
                    name="email"
                    placeholder="Email"
                    value={registerInput.email}
                    onChange={handleInput}
                  />
                  {/* {errors.email && (
                    <div className="invalid-feedback">{errors.email}</div>
                  )} */}
                  <span className="text-danger">
                    {registerInput.error_list.email
                      ? registerInput.error_list.email[0]
                      : ""}
                  </span>
                </div>
                <div className="col-md-6">
                  <label htmlFor="phone" className="form-label">
                    phone
                  </label>
                  <input
                    type="phone"
                    className={`form-control rounded-0 ${
                      errors.phone ? "is-invalid" : ""
                    }`}
                    id="phone"
                    name="phone"
                    placeholder="Enter your phone"
                    value={registerInput.phone}
                    onChange={handleInput}
                  />
                  {/* {errors.password && (
                    <div className="invalid-feedback">{errors.password}</div>
                  )} */}
                  <span className="text-danger">
                    {registerInput.error_list.phone
                      ? registerInput.error_list.phone[0]
                      : ""}
                  </span>
                </div>
              </div>
              <div className="row mb-3">
                <div className="col-md-6">
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>
                  <div className="position-relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      className={`form-control rounded-0 ${
                        errors.password ? "is-invalid" : ""
                      }`}
                      id="password"
                      name="password"
                      placeholder="Enter your password"
                      value={registerInput.password}
                      onChange={handleInput}
                    />
                    <button
                      type="button"
                      className="btn btn-link position-absolute end-0 top-50 translate-middle-y"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ zIndex: 5 }}
                    >
                      <i className={`bi ${showPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                    </button>
                  </div>
                  {/* {errors.password && (
                    <div className="invalid-feedback">{errors.password}</div>
                  )} */}
                  <span className="text-danger">
                    {registerInput.error_list.password
                      ? registerInput.error_list.password[0]
                      : ""}
                  </span>
                </div>
                <div className="col-md-6">
                  <label htmlFor="confirm_password" className="form-label">
                    Confirm Password
                  </label>
                  <div className="position-relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      className={`form-control rounded-0 ${
                        registerInput.error_list.password_confirmation
                          ? "is-invalid"
                          : ""
                      }`}
                      id="confirm_password"
                      name="confirm_password"
                      placeholder="Re-enter your password"
                      value={registerInput.confirm_password}
                      onChange={handleInput}
                    />
                    <button
                      type="button"
                      className="btn btn-link position-absolute end-0 top-50 translate-middle-y"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      style={{ zIndex: 5 }}
                    >
                      <i className={`bi ${showConfirmPassword ? "bi-eye-slash" : "bi-eye"}`}></i>
                    </button>
                  </div>
                  <span className="text-danger">
                    {registerInput.error_list.password_confirmation
                      ? registerInput.error_list.password_confirmation[0]
                      : ""}
                  </span>
                </div>
              </div>

              <GlobalButton
                children="Create An Account"
              />
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default Register;