import React, { useState } from "react";
import PageBanner from "../Components/PageBanner";
import Banner from "../Assets/Images/banner.png";
import Profile from "../Assets/Images/profile.jpg";
import PageHeader from "../Components/PageHeader";

const About = () => {

  return (
    <div className="container-fluid p-0">
      <PageHeader title="About Us" path="Home / About Us" />

      <div className="container mt-5">
        <PageBanner src={Banner} alt="Home Page Banner" />

        <div className="pt-4">
          <h4 className="fw-bold text-dark heading text-center text-md-start">
            We believe all our customers should receive quality, value service
            and products for the money they spend.
          </h4>
        </div>

        {/* Content */}
        <div className="mb-4">
          <p className="lead text-center text-md-start" style={{ fontSize: "1rem" }}>
            We started in 2008 as privately owned Security Alarm company, and
            now we have grown to provide integrated solutions with Electronic
            Security, Automation, Audio/ Visual, Data Cabling and Ducted Vacuum.
          </p>
        </div>
      </div>

      <div className="py-4 bg-light">
        <p className="text-center">Latest Testimonials</p>
        <h2 className="text-center heading">WHAT PEOPLE SAY</h2>
        <div className="container">
          <div className="row justify-content-center">
            {[1, 2].map((index) => (
              <div
                className="col-md-6 col-sm-12 d-flex justify-content-center"
                key={index}
              >
                <div className="card rounded-0 border-0 bg-light d-flex flex-row align-items-center p-3">
                  <div className="text-center">
                    <img
                      src={Profile}
                      alt="Profile"
                      className="rounded-circle border p-1"
                      style={{
                        width: "120px",
                        height: "120px",
                        objectFit: "cover",
                      }}
                    />
                    <h6 className="heading fw-bold m-0 text-primary mt-2">
                      Mark Junco
                    </h6>
                    <p className="text-muted">Designer</p>
                  </div>
                  <div className="ms-3 text-start">
                    <p
                      className="card-text"
                      style={{ fontSize: "0.9rem", color: "#555" }}
                    >
                      "you how all this mistaken idea of denouncing pleasure and
                      praising pain was born and I will give you a complete
                      account of the system, and expound the actual teachings."
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container py-5">
        <div className="row border-top border-bottom py-4">
          <div className="col-md-4 border-end d-flex align-items-center justify-content-center py-2">
            <i className="bi bi-truck px-4 fs-1 text-primary"></i>
            <div>
              <h5 className="fw-bold heading">Home Delivery</h5>
              <p className="text-muted small">Delivery to your door step</p>
            </div>
          </div>

          <div className="col-md-4 border-end d-flex align-items-center justify-content-center py-2">
            <i className="bi bi-clock px-4 fs-1 text-primary"></i>
            <div>
              <h5 className="fw-bold heading">24 X 7 Service</h5>
              <p className="text-muted small">
                24 Online Service For New Customer
              </p>
            </div>
          </div>

          <div className="col-md-4 d-flex align-items-center justify-content-center py-2">
            <i className="bi bi-megaphone px-4 fs-1 text-primary"></i>
            <div>
              <h5 className="fw-bold heading">Festival Offer</h5>
              <p className="text-muted small">
                New Online Special Festival Offer
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
