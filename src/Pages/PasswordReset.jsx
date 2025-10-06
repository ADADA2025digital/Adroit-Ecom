import React, { useState } from "react";
import axios from "axios";
import emailjs from "@emailjs/browser";
import { useNavigate } from "react-router-dom";

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

  // EmailJS configuration
  const EMAILJS_CONFIG = {
    SERVICE_ID: "service_icsecqd",
    TEMPLATE_ID: "template_2azoziq",
    PUBLIC_KEY: "x81NpKL7Q438yTjZK",
  };

  // Function to send email using EmailJS
  const sendEmailWithEmailJS = async (email, otpCode, resetToken) => {
    try {
      // console.log("Sending email via EmailJS to:", email);
      
      // Prepare the template parameters
      const templateParams = {
        to_email: email,
        to_name: email.split('@')[0], // Use the part before @ as name
        otp: otpCode,
        reset_link: `${window.location.origin}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`,
        year: new Date().getFullYear()
      };

      // console.log("EmailJS template params:", templateParams);
      
      // Send the email
      const response = await emailjs.send(
        EMAILJS_CONFIG.SERVICE_ID,
        EMAILJS_CONFIG.TEMPLATE_ID,
        templateParams,
        EMAILJS_CONFIG.PUBLIC_KEY
      );
      
      // console.log("EmailJS response:", response);
      return { success: true, message: "Email sent successfully" };
    } catch (error) {
      // console.error("EmailJS error:", error);
      return { 
        success: false, 
        message: error.text || "Failed to send email. Please try again." 
      };
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setSuccess("");

    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      setError("Please enter a valid email address");
      setIsLoading(false);
      return;
    }

    try {
      // console.log("Making API call to /api/forgot-password");
      const response = await axios.post(
        "https://shop.adroitalarm.com.au/api/forgot-password",
        { email }
      );

      // console.log("API Response:", response.data);

      if (response.data.status === 200) {
        setToken(response.data.token);
        
        // Send email using EmailJS with the OTP and token
        const emailResult = await sendEmailWithEmailJS(
          email, 
          response.data.otp, 
          response.data.token
        );
        
        if (emailResult.success) {
          setStep(2);
          setSuccess("OTP sent to your email address. Check your spam folder if not received.");
          // console.log("OTP sent successfully via EmailJS");
        } else {
          setError(emailResult.message);
        }
      } else {
        setError(response.data.message || "Failed to send OTP");
      }
    } catch (error) {
      // console.error("API Error:", error);
      setError(error.response?.data?.message || "Failed to process your request. Please try again.");
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
    setSuccess("Please set your new password");
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");

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
      // console.log("Making API call to /api/reset-password");
      const response = await axios.post(
        "https://shop.adroitalarm.com.au/api/reset-password",
        {
          email,
          otp,
          token,
          password: newPassword,
          password_confirmation: confirmPassword,
        }
      );

      // console.log("API Response:", response.data);

      if (response.data.status === 200) {
        setSuccess("Password reset successfully!");
        setTimeout(() => {
          navigate("/login");
        }, 2000);
      } else {
        setError(response.data.message || "Failed to reset password");
      }
    } catch (error) {
      // console.error("API Error:", error);
      setError(error.response?.data?.message || "Failed to reset password");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container my-5">
      <div className="row justify-content-center">
        <div className="col-md-6 col-lg-5">
          <div className="card shadow rounded-0">
            <div className="card-body p-4">
              <h2 className="mb-4 text-start heading">
                {step === 1 && "Reset Password"}
                {step === 2 && "Verify OTP"}
                {step === 3 && "Set New Password"}
              </h2>

              {error && (
                <div className="alert alert-danger rounded-0">{error}</div>
              )}

              {success && (
                <div className="alert alert-success rounded-0">{success}</div>
              )}

              {step === 1 && (
                <form onSubmit={handleEmailSubmit}>
                  <div className="form-group mb-3">
                    <label htmlFor="email" className="form-label">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      className="form-control rounded-0"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100 rounded-0"
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending..." : "Send OTP"}
                  </button>

                  <div className="mt-3 text-center">
                    <small className="text-muted">
                      Note: If you don't receive the email, check your spam folder.
                    </small>
                  </div>
                </form>
              )}

              {step === 2 && (
                <form onSubmit={handleOtpSubmit}>
                  <div className="form-group mb-3">
                    <label htmlFor="otp" className="form-label">
                      Enter OTP
                    </label>
                    <input
                      type="text"
                      id="otp"
                      className="form-control rounded-0"
                      value={otp}
                      onChange={(e) =>
                        setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      placeholder="6-digit code"
                      required
                    />
                    <small className="text-muted mt-1 d-block">
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
                      Back
                    </button>

                    <button
                      type="submit"
                      className="btn btn-primary rounded-0"
                      disabled={isLoading || otp.length !== 6}
                    >
                      Verify OTP
                    </button>
                  </div>
                </form>
              )}

              {step === 3 && (
                <form onSubmit={handlePasswordSubmit}>
                  <div className="form-group mb-3">
                    <label htmlFor="newPassword" className="form-label">
                      New Password
                    </label>
                    <input
                      type="password"
                      id="newPassword"
                      className="form-control rounded-0"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={8}
                      disabled={isLoading}
                    />
                  </div>

                  <div className="form-group mb-3">
                    <label htmlFor="confirmPassword" className="form-label">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      className="form-control rounded-0"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      disabled={isLoading}
                    />
                  </div>

                  <div className="d-flex justify-content-between">
                    <button
                      type="button"
                      className="btn btn-outline-secondary rounded-0"
                      onClick={() => setStep(2)}
                      disabled={isLoading}
                    >
                      Back
                    </button>

                    <button
                      type="submit"
                      className="btn btn-primary rounded-0"
                      disabled={
                        isLoading ||
                        newPassword.length < 8 ||
                        newPassword !== confirmPassword
                      }
                    >
                      {isLoading ? "Resetting..." : "Reset Password"}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PasswordReset;