import React, { useState } from "react";
import api from "../Config/api";
import { useNavigate } from "react-router-dom";
import PageHeader from "../Components/PageHeader";
import GlobalButton from "../Components/Button";

const PasswordReset = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Track if form has been submitted to show validation errors
  const [formSubmitted, setFormSubmitted] = useState(false);

  // State for password visibility
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Dynamic email validation regex
  const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };

  // Get email validation message
  const getEmailValidationMessage = (email) => {
    if (!email) return "Email is required";

    const parts = email.split("@");

    if (parts.length !== 2) {
      return "Email must contain exactly one @ symbol";
    }

    const [localPart, domain] = parts;

    if (!localPart) {
      return "Email must have characters before @";
    }

    if (!/^[a-zA-Z0-9._%+-]+$/.test(localPart)) {
      return "Username part can only contain letters, numbers, dots, underscores, %, +, and -";
    }

    if (!domain) {
      return "Email must have a domain after @";
    }

    const domainParts = domain.split(".");
    if (domainParts.length < 2) {
      return "Domain must have at least one dot (.)";
    }

    const tld = domainParts[domainParts.length - 1];
    if (tld.length < 2) {
      return "Top-level domain (TLD) must be at least 2 characters";
    }

    if (!/^[a-zA-Z]{2,}$/.test(tld)) {
      return "Top-level domain (TLD) must contain only letters";
    }

    const domainName = domainParts.slice(0, -1).join(".");
    if (domainName && !/^[a-zA-Z0-9.-]+$/.test(domainName)) {
      return "Domain name can only contain letters, numbers, dots, and hyphens";
    }

    return "";
  };

  // Function to hide success message after 5 seconds
  const showSuccessMessage = (message) => {
    setSuccess(message);
    setTimeout(() => {
      setSuccess("");
    }, 5000);
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setFormSubmitted(true);
    setIsLoading(true);
    setError("");
    setSuccess("");

    // Validate email only when form is submitted
    if (!email) {
      setError("Email is required");
      setIsLoading(false);
      return;
    }

    if (!validateEmail(email)) {
      setError(getEmailValidationMessage(email));
      setIsLoading(false);
      return;
    }

    try {
      const response = await api.post("/forgot-password", { email });

      if (response.data.status === 200) {
        setToken(response.data.token);
        setFormSubmitted(false); // Reset form submitted state on success
        setStep(2);
        showSuccessMessage(
          "OTP sent to your email address. Check your spam folder if not received.",
        );
      } else {
        setError(response.data.message || "Failed to send OTP");
      }
    } catch (error) {
      let errorMessage = "Failed to process your request. Please try again.";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 404) {
        errorMessage = "Email not found. Please check your email address.";
      } else if (error.response?.status === 422) {
        errorMessage =
          "Invalid email format. Please enter a valid email address.";
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (otp.length !== 6) {
      setError("Please enter a valid 6-digit OTP");
      return;
    }

    setStep(3);
    showSuccessMessage("OTP verified! Please set your new password.");
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters long");
      return;
    }

    setIsLoading(true);

    try {
      const response = await api.post("/reset-password", {
        email,
        otp,
        token,
        password: newPassword,
        password_confirmation: confirmPassword,
      });

      if (response.data.status === 200) {
        showSuccessMessage(
          "Password reset successfully! Redirecting to login...",
        );
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setError(response.data.message || "Failed to reset password");
      }
    } catch (error) {
      let errorMessage = "Failed to reset password";

      if (error.response?.data) {
        if (error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.errors) {
          const validationErrors = error.response.data.errors;
          errorMessage = Object.values(validationErrors).flat().join(", ");
        }
      }

      if (error.response?.status === 400) {
        errorMessage = "Invalid OTP or token. Please try again.";
      } else if (error.response?.status === 422) {
        errorMessage =
          errorMessage || "Validation failed. Please check your input.";
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to resend OTP
  const handleResendOTP = async () => {
    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const response = await api.post("/forgot-password", { email });

      if (response.data.status === 200) {
        setToken(response.data.token);
        showSuccessMessage("OTP resent successfully. Check your email.");
      }
    } catch (error) {
      setError("Failed to resend OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle password visibility
  const toggleNewPasswordVisibility = () => {
    setShowNewPassword(!showNewPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  // Custom error display component
  const ValidationError = ({ message }) => {
    if (!message) return null;
    return <div className="text-danger text-center small mt-1">{message}</div>;
  };

  return (
    <div className="container-fluid px-0">
      <PageHeader title="Password Reset" path="Home / Password Reset" />

      <div className="container my-5">
        <div className="row justify-content-center">
          <div className="col-md-6">
            <div className="card rounded-0 border-0">
              <div className="card-body p-4">
                {step === 1 && (
                  <form onSubmit={handleEmailSubmit} noValidate>
                    <div className="form-group mb-3">
                      <h2 className="mb-5 text-center heading">
                        Reset Password
                      </h2>
                      <input
                        type="email"
                        id="email"
                        className="form-control rounded-0 p-3 text-center"
                        placeholder="Enter Your Email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          // Clear error when user starts typing after submission
                          if (formSubmitted) {
                            setFormSubmitted(false);
                            setError("");
                          }
                        }}
                        disabled={isLoading}
                        style={{
                          borderColor: error ? "#dc3545" : "",
                          borderWidth: error ? "2px" : "1px",
                        }}
                      />
                      {/* Custom validation error message */}
                      {error && formSubmitted && (
                        <ValidationError message={error} />
                      )}
                    </div>

                    <div className="d-flex align-items-center justify-content-center">
                      <GlobalButton
                        type="submit"
                        className="btn btn-primary rounded-0"
                        disabled={isLoading}
                      >
                        {isLoading ? "Sending..." : "Send OTP"}
                      </GlobalButton>
                    </div>
                    <div className="mt-3 text-center">
                      <small className="text-muted">
                        Note: If you don't receive the email, check your spam
                        folder.
                      </small>
                    </div>
                  </form>
                )}

                {step === 2 && (
                  <form onSubmit={handleOtpSubmit} noValidate>
                    <h2 className="mb-5 text-center heading">Verify OTP</h2>
                    <div className="form-group mb-3">
                      <input
                        type="text"
                        id="otp"
                        className="form-control p-3 text-center rounded-0"
                        value={otp}
                        onChange={(e) => {
                          setOtp(e.target.value.replace(/\D/g, "").slice(0, 6));
                          setError("");
                        }}
                        placeholder="Enter your 6-digit code"
                        required
                        disabled={isLoading}
                        style={{
                          borderColor: error ? "#dc3545" : "",
                          borderWidth: error ? "2px" : "1px",
                        }}
                      />
                      {error && <ValidationError message={error} />}
                      <small className="text-muted mt-2 d-block text-center">
                        Check your email for the OTP code
                      </small>
                    </div>

                    <div className="d-flex justify-content-between">
                      <button
                        type="button"
                        className="btn btn-outline-secondary rounded-0"
                        onClick={() => setStep(1)}
                        disabled={isLoading}
                      >
                        <i className="bi bi-chevron-left"></i> Back
                      </button>

                      <GlobalButton
                        type="submit"
                        className="btn btn-primary rounded-0"
                        disabled={isLoading || otp.length !== 6}
                      >
                        Next
                      </GlobalButton>
                    </div>

                    <div className="mt-3 text-center">
                      <button
                        type="button"
                        className="btn btn-link"
                        onClick={handleResendOTP}
                        disabled={isLoading}
                      >
                        Didn't receive OTP? Resend
                      </button>
                    </div>
                  </form>
                )}

                {step === 3 && (
                  <form onSubmit={handlePasswordSubmit} noValidate>
                    <h2 className="mb-5 text-center heading">
                      Set New Password
                    </h2>

                    {/* New Password Field with Eye Icon */}
                    <div className="form-group mb-3 position-relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        id="newPassword"
                        className="form-control rounded-0 p-3 text-center"
                        placeholder="Enter your new password"
                        value={newPassword}
                        onChange={(e) => {
                          setNewPassword(e.target.value);
                          setError("");
                        }}
                        required
                        minLength={8}
                        disabled={isLoading}
                        style={{
                          paddingRight: "40px",
                          borderColor: error ? "#dc3545" : "",
                          borderWidth: error ? "2px" : "1px",
                        }}
                      />
                      <span
                        onClick={toggleNewPasswordVisibility}
                        style={{
                          position: "absolute",
                          right: "10px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          cursor: "pointer",
                          zIndex: 10,
                          fontSize: "1.2rem",
                        }}
                      >
                        {showNewPassword ? (
                          <i className="bi bi-eye-slash"></i>
                        ) : (
                          <i className="bi bi-eye"></i>
                        )}
                      </span>
                    </div>

                    {/* Confirm Password Field with Eye Icon */}
                    <div className="form-group mb-3 position-relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        id="confirmPassword"
                        className="form-control rounded-0 p-3 text-center"
                        placeholder="Confirm your new password"
                        value={confirmPassword}
                        onChange={(e) => {
                          setConfirmPassword(e.target.value);
                          setError("");
                        }}
                        required
                        disabled={isLoading}
                        style={{
                          paddingRight: "40px",
                          borderColor: error ? "#dc3545" : "",
                          borderWidth: error ? "2px" : "1px",
                        }}
                      />
                      <span
                        onClick={toggleConfirmPasswordVisibility}
                        style={{
                          position: "absolute",
                          right: "10px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          cursor: "pointer",
                          zIndex: 10,
                          fontSize: "1.2rem",
                        }}
                      >
                        {showConfirmPassword ? (
                          <i className="bi bi-eye-slash"></i>
                        ) : (
                          <i className="bi bi-eye"></i>
                        )}
                      </span>
                    </div>

                    {/* Custom validation error for password */}
                    {error && <ValidationError message={error} />}

                    <div className="d-flex justify-content-between">
                      <button
                        type="button"
                        className="btn btn-outline-secondary rounded-0"
                        onClick={() => setStep(2)}
                        disabled={isLoading}
                      >
                        <i className="bi bi-chevron-left"></i> Back
                      </button>

                      <GlobalButton
                        type="submit"
                        className="btn btn-primary rounded-0"
                        disabled={
                          isLoading ||
                          newPassword.length < 8 ||
                          newPassword !== confirmPassword
                        }
                      >
                        {isLoading ? "Resetting..." : "Reset Password"}
                      </GlobalButton>
                    </div>
                  </form>
                )}

                {/* Success message - keep Bootstrap alert as it's a notification, not validation */}
                {success && (
                  <div className="alert alert-success rounded-0 text-center mt-3">
                    {success}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordReset;