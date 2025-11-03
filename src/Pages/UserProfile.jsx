import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../Components/PageHeader";
import InputField from "../Components/InputField";
import api from "../Config/api";
import GlobalButton from "../Components/Button";
import Swal from "sweetalert2";

const UserProfile = () => {
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    phone: "",
    email: "",
    current_password: "",
    new_password: "",
    new_password_confirmation: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // Fetch user data on component mount
  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get("/auth/user");
      
      if (response.data && response.data.user) {
        const user = response.data.user;
        setFormData({
          lastname: user.lastname || "",
          phone: user.phone || "",
          email: user.email || "",
          current_password: "",
          new_password: "",
          new_password_confirmation: "",
        });
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      
      let errorMessage = "Failed to fetch user profile.";
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMessage = "Authentication failed. Please log in again.";
      }

      Swal.fire({
        icon: "error",
        title: "Error",
        text: errorMessage,
        confirmButtonColor: "#3085d6",
      });
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate password confirmation
    if (formData.new_password && formData.new_password !== formData.new_password_confirmation) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "New password and confirmation do not match.",
        confirmButtonColor: "#3085d6",
      });
      setIsLoading(false);
      return;
    }

    try {
      // Prepare the data to send (exclude empty password fields if not changing password)
      const dataToSend = { ...formData };

      // If no new password is provided, remove password fields
      if (!dataToSend.new_password) {
        delete dataToSend.current_password;
        delete dataToSend.new_password;
        delete dataToSend.new_password_confirmation;
      }

      const response = await api.post("/profile/edit", dataToSend);

      // Show success message with SweetAlert2 and then navigate to dashboard
      Swal.fire({
        icon: "success",
        title: "Success!",
        text: response.data?.message || "Profile updated successfully!",
        confirmButtonColor: "#3085d6",
      }).then((result) => {
        if (result.isConfirmed) {
          navigate("/dashboard");
        }
      });

      // Clear password fields after successful update
      setFormData((prev) => ({
        ...prev,
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
      }));
    } catch (error) {
      console.error("Error updating profile:", error);

      // Show error message with SweetAlert2
      let errorMessage = "An error occurred while updating the profile.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMessage = "Authentication failed. Please log in again.";
      } else if (error.response?.status === 422) {
        // Handle validation errors
        const validationErrors = error.response.data.errors;
        if (validationErrors) {
          errorMessage = Object.values(validationErrors).flat().join(', ');
        }
      }

      Swal.fire({
        icon: "error",
        title: "Error",
        text: errorMessage,
        confirmButtonColor: "#3085d6",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <section>
        <PageHeader title="User Profile" path="Home / Edit User Profile" />
        <div className="container py-5 justify-content-center">
          <div className="p-4 border-0 ">
            <h2 className="fw-bold heading py-2">PERSONAL DETAIL</h2>

            <form onSubmit={handleSubmit}>
              <div className="row mb-3">
                <div className="col-md-6">
                  <InputField
                    label="First Name"
                    type="text"
                    id="firstname"
                    placeholder="Enter Your First Name"
                    value={formData.firstname}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="col-md-6">
                  <InputField
                    label="Last Name"
                    type="text"
                    id="lastname"
                    placeholder="Enter Your Last Name"
                    value={formData.lastname}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <InputField
                    label="Phone Number"
                    type="text"
                    id="phone"
                    placeholder="Enter Your Phone Number"
                    value={formData.phone}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-6">
                  <InputField
                    label="Email"
                    type="email"
                    id="email"
                    placeholder="Enter Your Email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled
                  />
                </div>
              </div>

              <h3 className="fw-bold mt-4 mb-3">Change Password</h3>

              <div className="row mb-3">
                <div className="col-md-6">
                  <InputField
                    label="Current Password"
                    type="password"
                    id="current_password"
                    placeholder="Enter Your Current Password"
                    value={formData.current_password}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="col-md-6">
                  <InputField
                    label="New Password"
                    type="password"
                    id="new_password"
                    placeholder="Enter Your New Password"
                    value={formData.new_password}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <InputField
                    label="Confirm New Password"
                    type="password"
                    id="new_password_confirmation"
                    placeholder="Confirm Your New Password"
                    value={formData.new_password_confirmation}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="d-flex justify-content-center justify-content-md-start">
                <GlobalButton disabled={isLoading}>
                  {isLoading ? "Updating..." : "Update Profile"}
                </GlobalButton>
              </div>
            </form>
          </div>
        </div>
      </section>
    </>
  );
};

export default UserProfile;