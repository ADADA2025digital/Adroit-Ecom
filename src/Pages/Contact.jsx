import React, { useState, useRef, useEffect } from "react";
import PageHeader from "../Components/PageHeader";

const ContactForm = () => {
  const contactDetails = [
    {
      icon: "bi bi-telephone-fill",
      title: "Contact Us",
      text: " 043 317 2345",
    },
    {
      icon: "bi bi-geo-alt-fill",
      title: "Address",
      text: "15/51 Meacher Street, Mt. Druitt 2770, NSW",
    },
    {
      icon: "bi bi-envelope-fill",
      title: "Email",
      text: "info@adroitgroup.biz",
    },
  ];

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const [errors, setErrors] = useState({});
  const [showRecaptcha, setShowRecaptcha] = useState(false);
  const [recaptchaValue, setRecaptchaValue] = useState(null);
  const messageRef = useRef(null);
  const recaptchaRef = useRef(null);

  // Validation patterns with error messages
  const validationRules = {
    fullName: {
      pattern: /^[a-zA-Z\s]{3,50}$/,
      message: "Name should be 3-50 letters and spaces only",
    },
    email: {
      pattern: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
      message: "Please enter a valid email address",
    },
    phone: {
      pattern: /^\d{10}$/,
      message: "Phone number must be 10 digits",
    },
    subject: {
      pattern: /^.{3,100}$/,
      message: "Subject must be 3-100 characters",
    },
    message: {
      pattern: /^.{10,500}$/,
      message: "Message must be 10-500 characters",
    },
  };

  // Handle input change and validation
  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData({ ...formData, [id]: value });

    // Validate input dynamically
    if (validationRules[id] && !validationRules[id].pattern.test(value)) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [id]: validationRules[id].message,
      }));
    } else {
      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        delete newErrors[id];
        return newErrors;
      });
    }
  };

  // Handle recaptcha change
  const handleRecaptchaChange = (value) => {
    setRecaptchaValue(value);
    // Clear recaptcha error if any
    if (errors.recaptcha) {
      setErrors((prevErrors) => {
        const newErrors = { ...prevErrors };
        delete newErrors.recaptcha;
        return newErrors;
      });
    }
  };

  // Show recaptcha when message field is focused
  const handleMessageFocus = () => {
    setShowRecaptcha(true);
    // Wait for the next render cycle to ensure the recaptcha container is rendered
    setTimeout(() => {
      if (window.grecaptcha && recaptchaRef.current) {
        window.grecaptcha.render(recaptchaRef.current, {
          sitekey: "6LdsrrYrAAAAANlNnYAS0kC-tWgHlRBKF97lDgyx",
          callback: handleRecaptchaChange,
        });
      }
    }, 0);
  };

  // Validate all fields
  const validateForm = () => {
    const newErrors = {};

    Object.keys(formData).forEach((key) => {
      if (!formData[key].trim()) {
        newErrors[key] = "This field is required";
      } else if (
        validationRules[key] &&
        !validationRules[key].pattern.test(formData[key])
      ) {
        newErrors[key] = validationRules[key].message;
      }
    });

    // Validate recaptcha if shown
    if (showRecaptcha && !recaptchaValue) {
      newErrors.recaptcha = "Please complete the reCAPTCHA";
    }

    return newErrors;
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate all fields
    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // If everything is valid, submit the form
    // console.log("Form submitted:", formData);
    alert("Form submitted successfully!");

    // Reset form
    setFormData({
      fullName: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    });
    setRecaptchaValue(null);
    setShowRecaptcha(false);
    setErrors({});
  };

  // Add event listener to message field
  useEffect(() => {
    const messageElement = messageRef.current;
    if (messageElement) {
      messageElement.addEventListener("focus", handleMessageFocus);
    }

    return () => {
      if (messageElement) {
        messageElement.removeEventListener("focus", handleMessageFocus);
      }
    };
  }, []);

  // Load reCAPTCHA script
  useEffect(() => {
    // Check if recaptcha is already loaded
    if (window.grecaptcha) {
      return;
    }

    const script = document.createElement("script");
    script.src = "https://www.google.com/recaptcha/api.js";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      // console.log("reCAPTCHA script loaded");
    };
    document.head.appendChild(script);

    return () => {
      // Clean up if needed
    };
  }, []);

  return (
    <>
      <div className="container-fluid p-0">
        <PageHeader title="Contact Us" path="Home / Contact Us" />

        <div className="container">
          <div className="row py-5 justify-content-center">
            <div className="col-md-12">
              <div className="d-flex flex-column flex-lg-row">
                <div className="col-12 col-lg-5 pe-lg-5">
                  <div>
                    <h1 className="mb-3 fw-bold heading">Get In Touch</h1>
                    <p>
                      We're here to help! Reach out to us with any questions,
                      feedback, or inquiries, and we'll get back to you as soon
                      as possible.
                    </p>
                  </div>

                  <div className="d-flex flex-column gap-3">
                    {contactDetails.map((item, index) => (
                      <div
                        className="d-flex border bg-light p-3 align-items-center mb-3"
                        key={index}
                      >
                        <div
                          className="bg-white d-flex align-items-center justify-content-center"
                          style={{ padding: "10px 15px" }}
                        >
                          <i className={`${item.icon} fs-5 text-primary`}></i>
                        </div>
                        <div className="ms-3 text-start">
                          <h5 className="heading">{item.title}</h5>
                          <p className="mb-0">{item.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Contact Form - Right Column */}
                <div className="col-12 col-lg-7">
                  <form
                    className="bg-light p-3 p-md-4 p-lg-5 rounded-0 shadow-sm"
                    onSubmit={handleSubmit}
                  >
                    <div className="mb-3">
                      <label htmlFor="fullName" className="form-label">
                        Full Name
                      </label>
                      <input
                        type="text"
                        className={`form-control rounded-0 ${
                          errors.fullName ? "is-invalid" : ""
                        }`}
                        id="fullName"
                        placeholder="Full Name"
                        value={formData.fullName}
                        onChange={handleChange}
                      />
                      {errors.fullName && (
                        <div className="text-danger mt-1">
                          {errors.fullName}
                        </div>
                      )}
                    </div>

                    <div className="row">
                      <div className="col-12 col-md-6 mb-3">
                        <label htmlFor="email" className="form-label">
                          Email
                        </label>
                        <input
                          type="text"
                          className={`form-control rounded-0 ${
                            errors.email ? "is-invalid" : ""
                          }`}
                          id="email"
                          placeholder="Email"
                          value={formData.email}
                          onChange={handleChange}
                        />
                        {errors.email && (
                          <div className="text-danger mt-1">{errors.email}</div>
                        )}
                      </div>
                      <div className="col-12 col-md-6 mb-3">
                        <label htmlFor="phone" className="form-label">
                          Phone
                        </label>
                        <input
                          type="text"
                          className={`form-control rounded-0 ${
                            errors.phone ? "is-invalid" : ""
                          }`}
                          id="phone"
                          placeholder="Enter Your Phone Number"
                          value={formData.phone}
                          onChange={handleChange}
                        />
                        {errors.phone && (
                          <div className="text-danger mt-1">{errors.phone}</div>
                        )}
                      </div>
                    </div>

                    <div className="mb-3">
                      <label htmlFor="subject" className="form-label">
                        Subject
                      </label>
                      <input
                        type="text"
                        className={`form-control rounded-0 ${
                          errors.subject ? "is-invalid" : ""
                        }`}
                        id="subject"
                        placeholder="Subject"
                        value={formData.subject}
                        onChange={handleChange}
                      />
                      {errors.subject && (
                        <div className="text-danger mt-1">{errors.subject}</div>
                      )}
                    </div>

                    <div className="mb-3">
                      <label htmlFor="message" className="form-label">
                        Write Your Message
                      </label>
                      <textarea
                        className={`form-control rounded-0 ${
                          errors.message ? "is-invalid" : ""
                        }`}
                        id="message"
                        rows="4"
                        placeholder="Write Your Message"
                        value={formData.message}
                        onChange={handleChange}
                        ref={messageRef}
                      />
                      {errors.message && (
                        <div className="text-danger mt-1">{errors.message}</div>
                      )}
                    </div>

                    {/* reCAPTCHA */}
                    {showRecaptcha && (
                      <div className="mb-3">
                        <div ref={recaptchaRef} id="recaptcha-container"></div>
                        {errors.recaptcha && (
                          <div className="text-danger mt-1">
                            {errors.recaptcha}
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      type="submit"
                      className="btn btn-primary rounded-0 w-100"
                    >
                      Send Your Message
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <div className="col-12 ">
            <iframe
              title="map"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3153.835434509362!2d144.95565141589513!3d-37.81732717975188!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6ad642af0f11fd81%3A0xf577f7843dfd2dfd!2sVictoria%20Market!5e0!3m2!1sen!2sus!4v1614649485613!5m2!1sen!2sus"
              width="100%"
              height="400"
              allowFullScreen=""
              loading="lazy"
            ></iframe>
          </div>
        </div>
      </div>
    </>
  );
};

export default ContactForm;
