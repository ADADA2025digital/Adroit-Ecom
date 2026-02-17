import React, { useState, useEffect, useCallback, memo } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Country, State, City } from "country-state-city";
import PageHeader from "../Components/PageHeader";
import InputField from "../Components/InputField";
import api from "../Config/api";
import GlobalButton from "../Components/Button";
import Swal from "sweetalert2";

// Password strength indicator component
const PasswordStrengthIndicator = ({ password }) => {
  const getStrength = (pass) => {
    let strength = 0;
    if (pass.length >= 6) strength += 1;
    if (pass.length >= 8) strength += 1;
    if (/[A-Z]/.test(pass)) strength += 1;
    if (/[0-9]/.test(pass)) strength += 1;
    if (/[!@#$%^&*]/.test(pass)) strength += 1;
    return strength;
  };

  const getStrengthText = (strength) => {
    switch(strength) {
      case 0: return { text: "Very Weak", color: "#dc3545", width: "20%" };
      case 1: return { text: "Weak", color: "#ffc107", width: "40%" };
      case 2: return { text: "Fair", color: "#fd7e14", width: "60%" };
      case 3: return { text: "Good", color: "#20c997", width: "80%" };
      case 4: return { text: "Strong", color: "#198754", width: "90%" };
      case 5: return { text: "Very Strong", color: "#0f5132", width: "100%" };
      default: return { text: "", color: "#e9ecef", width: "0%" };
    }
  };

  if (!password) return null;

  const strength = getStrength(password);
  const strengthInfo = getStrengthText(strength);

  return (
    <div className="mt-2">
      <div className="d-flex justify-content-between mb-1">
        <small>Password Strength:</small>
        <small style={{ color: strengthInfo.color }}>{strengthInfo.text}</small>
      </div>
      <div className="progress" style={{ height: "5px" }}>
        <div
          className="progress-bar"
          role="progressbar"
          style={{
            width: strengthInfo.width,
            backgroundColor: strengthInfo.color,
            transition: "width 0.3s ease"
          }}
          aria-valuenow={parseInt(strengthInfo.width)}
          aria-valuemin="0"
          aria-valuemax="100"
        />
      </div>
      {strength < 3 && password.length > 0 && (
        <small className="text-muted mt-1 d-block">
          Password should contain at least 6 characters, one uppercase letter, 
          one number, and one special character (!@#$%^&*)
        </small>
      )}
    </div>
  );
};

// Validation functions
const validateField = (fieldName, value) => {
  const patterns = {
    firstname: /^[A-Za-z]+$/,
    lastname: /^[A-Za-z]+$/,
    phone: /^\d+$/,
    email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
    password: /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/,
    address: /.+/,
    suburb: /.+/,
    postcode: /^\d+$/,
    state: /.+/
  };

  const messages = {
    firstname: "First name can only contain letters",
    lastname: "Last name can only contain letters",
    phone: "Phone number can only contain digits",
    email: "Please enter a valid email address",
    password: "Password must be at least 6 characters with one uppercase letter, one number, and one special character (!@#$%^&*)",
    address: "Street address is required",
    suburb: "City/Suburb is required",
    postcode: "Postcode can only contain digits",
    state: "State is required"
  };

  if (!value && fieldName !== 'password' && fieldName !== 'new_password' && fieldName !== 'current_password') {
    return { isValid: false, message: `${fieldName} is required` };
  }

  if (value && patterns[fieldName] && !patterns[fieldName].test(value)) {
    return { isValid: false, message: messages[fieldName] };
  }

  return { isValid: true, message: "" };
};

// PasswordInput component with validation
const PasswordInput = memo(({ 
  label, 
  id, 
  placeholder, 
  value, 
  onChange, 
  showPassword, 
  setShowPassword,
  error,
  onBlur,
  showStrength = false
}) => {
  const handleToggle = useCallback(() => {
    setShowPassword(!showPassword);
  }, [showPassword, setShowPassword]);

  const handleInputChange = useCallback((e) => {
    onChange(e);
  }, [onChange]);

  const handleBlur = useCallback((e) => {
    if (onBlur) onBlur(e);
  }, [onBlur]);

  return (
    <div className="form-group">
      <label htmlFor={id} className="form-label fw-bold">
        {label}
      </label>
      <div className="input-group">
        <input
          type={showPassword ? "text" : "password"}
          className={`form-control rounded-0 ${error ? 'is-invalid' : ''}`}
          id={id}
          name={id}
          placeholder={placeholder}
          value={value}
          onChange={handleInputChange}
          onBlur={handleBlur}
          autoComplete="off"
        />
        <button
          className="btn btn-outline-secondary rounded-0"
          type="button"
          onClick={handleToggle}
          style={{ borderColor: "#ced4da" }}
        >
          <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
        </button>
      </div>
      {error && <div className="invalid-feedback d-block">{error}</div>}
      {showStrength && value && <PasswordStrengthIndicator password={value} />}
    </div>
  );
});

// InputField wrapper with validation
const ValidatedInputField = memo(({ 
  label, 
  type, 
  id, 
  placeholder, 
  value, 
  onChange, 
  onBlur,
  required,
  disabled,
  error
}) => {
  const handleInputChange = useCallback((e) => {
    onChange(e);
  }, [onChange]);

  const handleBlur = useCallback((e) => {
    if (onBlur) onBlur(e);
  }, [onBlur]);

  return (
    <div className="form-group">
      <label htmlFor={id} className="form-label fw-bold">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      <input
        type={type}
        className={`form-control rounded-0 ${error ? 'is-invalid' : ''}`}
        id={id}
        name={id}
        placeholder={placeholder}
        value={value}
        onChange={handleInputChange}
        onBlur={handleBlur}
        disabled={disabled}
        required={required}
      />
      {error && <div className="invalid-feedback d-block">{error}</div>}
    </div>
  );
});

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

  // Validation errors state
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [addressData, setAddressData] = useState({
    address: "",
    suburb: "",
    postcode: "",
    state: "",
    address_type: "delivery",
  });

  // Address validation errors
  const [addressErrors, setAddressErrors] = useState({});
  const [addressTouched, setAddressTouched] = useState({});

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddressLoading, setIsAddressLoading] = useState(false);
  const [australianStates, setAustralianStates] = useState([]);
  const [suburbs, setSuburbs] = useState([]);
  const [selectedStateCode, setSelectedStateCode] = useState("");
  const [loadingSuburbs, setLoadingSuburbs] = useState(false);

  const navigate = useNavigate();
  const AUSTRALIA_ISO_CODE = "AU";

  // Fetch user data and addresses on component mount
  useEffect(() => {
    fetchUserProfile();
    fetchUserAddresses();

    // Load Australian states
    const states = State.getStatesOfCountry(AUSTRALIA_ISO_CODE);
    setAustralianStates(states);
  }, []);

  // Validation on blur
  const handleBlur = (fieldName) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
    const validation = validateField(fieldName, formData[fieldName]);
    setErrors(prev => ({ ...prev, [fieldName]: validation.message }));
  };

  const handleAddressBlur = (fieldName) => {
    setAddressTouched(prev => ({ ...prev, [fieldName]: true }));
    const validation = validateField(fieldName, addressData[fieldName]);
    setAddressErrors(prev => ({ ...prev, [fieldName]: validation.message }));
  };

  // Validate password confirmation
  const validatePasswordConfirmation = () => {
    if (formData.new_password && formData.new_password !== formData.new_password_confirmation) {
      setErrors(prev => ({ 
        ...prev, 
        new_password_confirmation: "Passwords do not match" 
      }));
      return false;
    }
    setErrors(prev => ({ ...prev, new_password_confirmation: "" }));
    return true;
  };

  const fetchUserProfile = async () => {
    try {
      const response = await api.get("/auth/user");

      if (response.data && response.data.user) {
        const user = response.data.user;
        setFormData({
          firstname: user.firstname || "",
          lastname: user.lastname || "",
          phone: user.phone || "",
          email: user.email || "",
          current_password: "",
          new_password: "",
          new_password_confirmation: "",
        });
      }
    } catch (error) {
      // console.error("Error fetching user profile:", error);

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

  const fetchUserAddresses = async () => {
    try {
      const response = await api.get("/addresses");

      if (response.data && response.data.data) {
        setSavedAddresses(response.data.data);
      }
    } catch (error) {
      // console.error("Error fetching addresses:", error);
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: value,
    }));

    // Clear error when user starts typing
    if (errors[id]) {
      setErrors(prev => ({ ...prev, [id]: "" }));
    }

    // Validate password confirmation when either password field changes
    if (id === 'new_password' || id === 'new_password_confirmation') {
      validatePasswordConfirmation();
    }
  };

  const handleAddressInputChange = (e) => {
    const { id, value } = e.target;

    if (id !== "state" && id !== "suburb") {
      setAddressData((prevData) => ({
        ...prevData,
        [id]: value,
      }));
      
      if (addressErrors[id]) {
        setAddressErrors(prev => ({ ...prev, [id]: "" }));
      }
    }
  };

  // Handle state selection change
  const handleStateChange = (e) => {
    const selectedState = e.target.value;
    setAddressData((prevData) => ({
      ...prevData,
      state: selectedState,
      suburb: "", // Reset suburb when state changes
    }));

    if (addressErrors.state) {
      setAddressErrors(prev => ({ ...prev, state: "" }));
    }

    // Find the state code
    const stateObj = australianStates.find(
      (state) => state.name === selectedState,
    );
    if (stateObj) {
      setSelectedStateCode(stateObj.isoCode);
      fetchSuburbs(stateObj.isoCode);
    } else {
      setSelectedStateCode("");
      setSuburbs([]);
    }
  };

  // Fetch suburbs/cities for selected state
  const fetchSuburbs = async (stateCode) => {
    if (!stateCode) return;

    setLoadingSuburbs(true);
    try {
      const cities = City.getCitiesOfState(AUSTRALIA_ISO_CODE, stateCode);

      const suburbOptions = cities.map((city) => ({
        name: city.name,
        fullName: city.name,
        stateCode: city.stateCode,
        countryCode: city.countryCode,
        displayName: city.name,
      }));

      const uniqueSuburbs = Array.from(
        new Map(suburbOptions.map((item) => [item.name, item])).values(),
      ).sort((a, b) => a.name.localeCompare(b.name));

      setSuburbs(uniqueSuburbs);
    } catch (error) {
      // console.error("Error fetching suburbs:", error);
      setSuburbs([]);
    } finally {
      setLoadingSuburbs(false);
    }
  };

  // Handle suburb selection
  const handleSuburbChange = (e) => {
    const selectedSuburbName = e.target.value;
    setAddressData((prevData) => ({
      ...prevData,
      suburb: selectedSuburbName,
    }));

    if (addressErrors.suburb) {
      setAddressErrors(prev => ({ ...prev, suburb: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const fields = ['firstname', 'lastname', 'phone', 'email'];
    
    fields.forEach(field => {
      const validation = validateField(field, formData[field]);
      if (!validation.isValid) {
        newErrors[field] = validation.message;
      }
    });

    // Validate password if trying to change
    if (formData.new_password) {
      const passwordValidation = validateField('password', formData.new_password);
      if (!passwordValidation.isValid) {
        newErrors.new_password = passwordValidation.message;
      }

      if (formData.new_password !== formData.new_password_confirmation) {
        newErrors.new_password_confirmation = "Passwords do not match";
      }

      if (!formData.current_password) {
        newErrors.current_password = "Current password is required to set new password";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAddressForm = () => {
    const newErrors = {};
    const fields = ['address', 'suburb', 'postcode', 'state'];
    
    fields.forEach(field => {
      const validation = validateField(field, addressData[field]);
      if (!validation.isValid) {
        newErrors[field] = validation.message;
      }
    });

    setAddressErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please fix the errors before submitting.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    setIsLoading(true);

    try {
      const dataToSend = { ...formData };

      if (!dataToSend.new_password) {
        delete dataToSend.current_password;
        delete dataToSend.new_password;
        delete dataToSend.new_password_confirmation;
      }

      const response = await api.post("/profile/edit", dataToSend);

      let timerInterval;
      await Swal.fire({
        title: "Success!",
        html: response.data?.message || "Profile updated successfully!",
        icon: "success",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
        willClose: () => {
          clearInterval(timerInterval);
        },
      });

      setFormData((prev) => ({
        ...prev,
        current_password: "",
        new_password: "",
        new_password_confirmation: "",
      }));

      // Clear touched states
      setTouched({});
    } catch (error) {
      // console.error("Error updating profile:", error);

      let errorMessage = "An error occurred while updating the profile.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMessage = "Authentication failed. Please log in again.";
      } else if (error.response?.status === 422) {
        const validationErrors = error.response.data.errors;
        if (validationErrors) {
          errorMessage = Object.values(validationErrors).flat().join(", ");
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

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    
    if (!validateAddressForm()) {
      Swal.fire({
        icon: "error",
        title: "Validation Error",
        text: "Please fill in all address fields correctly.",
        confirmButtonColor: "#3085d6",
      });
      return;
    }

    setIsAddressLoading(true);

    try {
      const response = await api.post("/storeAddress", addressData);

      let timerInterval;
      await Swal.fire({
        title: "Success!",
        html: response.data?.message || "Address saved successfully!",
        icon: "success",
        timer: 2000,
        timerProgressBar: true,
        showConfirmButton: false,
        didOpen: () => {
          Swal.showLoading();
        },
        willClose: () => {
          clearInterval(timerInterval);
        },
      });

      setAddressData({
        address: "",
        suburb: "",
        postcode: "",
        state: "",
        address_type: "delivery",
      });

      setSelectedStateCode("");
      setSuburbs([]);
      setAddressErrors({});
      setAddressTouched({});

      fetchUserAddresses();
    } catch (error) {
      // console.error("Error saving address:", error);

      let errorMessage = "An error occurred while saving the address.";

      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 401) {
        errorMessage = "Authentication failed. Please log in again.";
      } else if (error.response?.status === 422) {
        const validationErrors = error.response.data.errors;
        if (validationErrors) {
          errorMessage = Object.values(validationErrors).flat().join(", ");
        }
      }

      Swal.fire({
        icon: "error",
        title: "Error",
        text: errorMessage,
        confirmButtonColor: "#3085d6",
      });
    } finally {
      setIsAddressLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (result.isConfirmed) {
      try {
        await api.delete(`/address/${addressId}`);

        Swal.fire({
          icon: "success",
          title: "Deleted!",
          text: "Address has been deleted.",
          confirmButtonColor: "#3085d6",
        });

        fetchUserAddresses();
      } catch (error) {
        // console.error("Error deleting address:", error);

        Swal.fire({
          icon: "error",
          title: "Error",
          text: "Failed to delete address.",
          confirmButtonColor: "#3085d6",
        });
      }
    }
  };

  return (
    <>
          <Helmet>
            {/* Basic SEO */}
            <title>
              Edit Profile | Adroit Alarm Systems 
              Australia
            </title>
            <meta
              name="description"
              content="ADROIT is a premier Australian security company specializing in Electronic Security, Home Automation, Audio Visual, Data Cabling, and Ducted Vacuum systems. ASIAL accredited with 20+ years of experience delivering integrated, hassle-free solutions."
            />
            <meta
              name="keywords"
              content="ADROIT, Adroit Alarm System, security companies Australia, electronic security Sydney, home automation Australia, audio visual installation, data cabling contractors, ducted vacuum systems, ASIAL Silver Member, security license holders, integrated security solutions, Dynalite certified, commercial security, residential automation, access control, CCTV installation Australia"
            />
            <meta name="author" content="ADROIT Alarm Systems Australia" />
            <meta name="robots" content="index, follow" />
            <link rel="canonical" href="https://shop.adroitalarm.com.au/" />
    
            {/* Open Graph */}
            <meta
              property="og:title"
              content="ADROIT Alarm Systems | Electronic Security & Automation Experts"
            />
            <meta
              property="og:description"
              content="Since 2008, ADROIT has delivered premium integrated solutions including security, automation, and AV. Fully licensed (Master License No: 000101930) and ASIAL accredited."
            />
            <meta property="og:type" content="website" />
            <meta property="og:url" content="https://shop.adroitalarm.com.au/" />
            <meta property="og:site_name" content="ADROIT Alarm Systems" />
    
            {/* Social Links */}
            <meta
              property="og:see_also"
              content="https://www.instagram.com/adroitalarm/"
            />
            <meta
              property="og:see_also"
              content="https://www.facebook.com/p/Adroit-alarms-100071267801808/"
            />
    
            {/* Facebook  */}
            <meta property="fb:app_id" content="#" />
            <meta
              property="fb:admins"
              content="https://www.facebook.com/p/Adroit-alarms-100071267801808/"
            />
    
            {/* Instagram */}
            <meta name="instagram:title" content="ADROIT Alarm Systems Australia" />
            <meta
              name="instagram:description"
              content="Integrated solutions in electronic security, automation, audio visual and data cabling. Trusted Australian security specialists since 2008."
            />
            <meta name="instagram:site" content="@adroitalarm" />
          </Helmet>

      <section>
        <PageHeader title="User Profile" path="Home / Edit User Profile" />
        <div className="container py-5">
          <div className="p-4 border-0">
            {/* Personal Details Section */}
            <h2 className="fw-bold heading py-2">PERSONAL DETAILS</h2>

            <form onSubmit={handleSubmit}>
              <div className="row mb-3">
                <div className="col-md-6">
                  <ValidatedInputField
                    label="First Name"
                    type="text"
                    id="firstname"
                    placeholder="Enter Your First Name"
                    value={formData.firstname}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur('firstname')}
                    error={touched.firstname ? errors.firstname : ''}
                  />
                </div>
                <div className="col-md-6">
                  <ValidatedInputField
                    label="Last Name"
                    type="text"
                    id="lastname"
                    placeholder="Enter Your Last Name"
                    value={formData.lastname}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur('lastname')}
                    error={touched.lastname ? errors.lastname : ''}
                  />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <ValidatedInputField
                    label="Phone Number"
                    type="text"
                    id="phone"
                    placeholder="Enter Your Phone Number"
                    value={formData.phone}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur('phone')}
                    error={touched.phone ? errors.phone : ''}
                  />
                </div>
                <div className="col-md-6">
                  <ValidatedInputField
                    label="Email"
                    type="email"
                    id="email"
                    placeholder="Enter Your Email"
                    value={formData.email}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur('email')}
                    disabled
                    error={touched.email ? errors.email : ''}
                  />
                </div>
              </div>

              <h3 className="fw-bold mt-4 mb-3">Change Password</h3>

              <div className="row mb-3">
                <div className="col-md-6">
                  <PasswordInput
                    label="Current Password"
                    id="current_password"
                    placeholder="Enter Your Current Password"
                    value={formData.current_password}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur('current_password')}
                    showPassword={showCurrentPassword}
                    setShowPassword={setShowCurrentPassword}
                    error={touched.current_password ? errors.current_password : ''}
                  />
                </div>
                <div className="col-md-6">
                  <PasswordInput
                    label="New Password"
                    id="new_password"
                    placeholder="Enter Your New Password"
                    value={formData.new_password}
                    onChange={handleInputChange}
                    onBlur={() => handleBlur('new_password')}
                    showPassword={showNewPassword}
                    setShowPassword={setShowNewPassword}
                    error={touched.new_password ? errors.new_password : ''}
                    showStrength={true}
                  />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <PasswordInput
                    label="Confirm New Password"
                    id="new_password_confirmation"
                    placeholder="Confirm Your New Password"
                    value={formData.new_password_confirmation}
                    onChange={handleInputChange}
                    onBlur={() => {
                      handleBlur('new_password_confirmation');
                      validatePasswordConfirmation();
                    }}
                    showPassword={showConfirmPassword}
                    setShowPassword={setShowConfirmPassword}
                    error={touched.new_password_confirmation ? errors.new_password_confirmation : ''}
                  />
                </div>
              </div>

              <div className="d-flex justify-content-center justify-content-md-start">
                <GlobalButton disabled={isLoading}>
                  {isLoading ? "Updating..." : "Update Profile"}
                </GlobalButton>
              </div>
            </form>

            {/* Address Section */}
            <div className="mt-5 pt-4 border-top">
              <h2 className="fw-bold heading py-2">DELIVERY ADDRESSES</h2>

              {/* Add New Address Form */}
              <div className="bg-light p-4 mb-4">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <ValidatedInputField
                      label="Street Name"
                      type="text"
                      id="address"
                      placeholder="Enter Street Number and Street Name"
                      value={addressData.address}
                      onChange={handleAddressInputChange}
                      onBlur={() => handleAddressBlur('address')}
                      required
                      error={addressTouched.address ? addressErrors.address : ''}
                    />
                  </div>
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="state" className="form-label fw-bold">
                        Select State <span className="text-danger">*</span>
                      </label>
                      <select
                        className={`form-control rounded-0 ${addressTouched.state && addressErrors.state ? 'is-invalid' : ''}`}
                        id="state"
                        value={addressData.state}
                        onChange={handleStateChange}
                        onBlur={() => handleAddressBlur('state')}
                        required
                        style={{ maxWidth: "100%" }}
                      >
                        <option value="">Select State</option>
                        {australianStates.map((state) => (
                          <option key={state.isoCode} value={state.name}>
                            {state.name}
                          </option>
                        ))}
                      </select>
                      {addressTouched.state && addressErrors.state && (
                        <div className="invalid-feedback d-block">{addressErrors.state}</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <div className="form-group">
                      <label htmlFor="suburb" className="form-label fw-bold">
                        Select City <span className="text-danger">*</span>
                      </label>
                      <select
                        className={`form-control rounded-0 ${addressTouched.suburb && addressErrors.suburb ? 'is-invalid' : ''}`}
                        id="suburb"
                        value={addressData.suburb}
                        onChange={handleSuburbChange}
                        onBlur={() => handleAddressBlur('suburb')}
                        required
                        disabled={!selectedStateCode || loadingSuburbs}
                      >
                        <option value="">
                          {!selectedStateCode
                            ? "Select State first"
                            : loadingSuburbs
                              ? "Loading cities..."
                              : suburbs.length === 0
                                ? "No cities found"
                                : "Select City"}
                        </option>
                        {suburbs.map((suburb) => (
                          <option key={suburb.name} value={suburb.name}>
                            {suburb.displayName}
                          </option>
                        ))}
                      </select>
                      {addressTouched.suburb && addressErrors.suburb && (
                        <div className="invalid-feedback d-block">{addressErrors.suburb}</div>
                      )}
                    </div>
                  </div>

                  <div className="col-md-6">
                    <ValidatedInputField
                      label="Postcode"
                      type="text"
                      id="postcode"
                      placeholder="Enter Postcode"
                      value={addressData.postcode}
                      onChange={handleAddressInputChange}
                      onBlur={() => handleAddressBlur('postcode')}
                      required
                      error={addressTouched.postcode ? addressErrors.postcode : ''}
                    />
                  </div>
                </div>

                <div className="d-flex justify-content-end">
                  <GlobalButton
                    onClick={handleSaveAddress}
                    disabled={isAddressLoading}
                  >
                    {isAddressLoading ? "Saving..." : "Save Address"}
                  </GlobalButton>
                </div>
              </div>

              {/* Display Saved Addresses */}
              {savedAddresses.length > 0 && (
                <div className="mt-4">
                  <h4 className="fw-bold mb-3">Saved Addresses</h4>
                  <div className="row">
                    {savedAddresses.map((address) => (
                      <div key={address.id} className="col-md-6 mb-3">
                        <div className="card">
                          <div className="card-body">
                            <h6 className="card-subtitle mb-2 text-muted">
                              {address.address_type.toUpperCase()}
                            </h6>
                            <p className="card-text">
                              {address.address}<br />
                              {address.suburb}, {address.state} {address.postcode}
                            </p>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeleteAddress(address.id)}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default UserProfile;