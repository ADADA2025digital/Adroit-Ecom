import React from "react";
import Logo from "../Assets/Images/image.jpeg";
import GlobalButton from "./Button";

const Footer = () => {
  return (
    <>
      <div className="footer bg-light">
        <div className="container">
          <div className="row align-items-center pt-4">
            <div className="col-md-6 text-center text-md-start">
              <h5 className="fw-bold heading">KNOW IT ALL FIRST!</h5>
              <p className="text-muted">
                Never Miss Anything From Adroit By Signing Up To Our
                Newsletter.
              </p>
            </div>

            <div className="col-md-6">
              <div className="input-group gap-3">
                <input
                  type="email"
                  className="form-control rounded-0"
                  placeholder="Enter your email"
                />
                <GlobalButton children="Subscribe" />
              </div>
            </div>
          </div>

          <hr />

          <div className="row py-5 d-flex align-items-center justify-content-center text-center text-md-start">
            <div className="col-lg-4 col-md-4 col-sm-12 pb-3 d-flex flex-column align-items-center align-items-md-start">
              <div className="d-flex align-items-center mb-3">
                <img
                  src={Logo}
                  alt="Logo"
                  style={{ height: "55px" }}
                />
              </div>
              <p className="text-secondary small lh-lg">
                Discover the latest fashion trends, explore unique styles, and
                enjoy seamless shopping with our carefully curated exclusive
                collections, designed to elevate your wardrobe.
              </p>
              {/* <div className="social-icons d-flex gap-3">
                <a href="#" className="text-dark">
                  <i className="bi bi-facebook fs-5"></i>
                </a>
                <a href="#" className="text-dark">
                  <i className="bi bi-google fs-5"></i>
                </a>
                <a href="#" className="text-dark">
                  <i className="bi bi-twitter-x fs-5"></i>
                </a>
                <a href="#" className="text-dark">
                  <i className="bi bi-instagram fs-5"></i>
                </a>
                <a href="#" className="text-dark">
                  <i className="bi bi-tiktok fs-5"></i>
                </a>
              </div> */}
            </div>

            <div className="col-lg-3 col-md-4 col-sm-12 pb-3">
              <h5 className="text-uppercase mb-3 heading">my account</h5>
              <ul className="list-unstyled small text-uppercase lh-lg">
                <li>
                  <a href="/about" className="text-secondary text-decoration-none">
                    <i className="bi bi-chevron-right text-primary"></i>About Us
                  </a>
                </li>
                <li>
                  <a href="/shop" className="text-secondary text-decoration-none">
                    <i className="bi bi-chevron-right text-primary"></i>Shop
                  </a>
                </li>
                <li>
                  <a href="/faq" className="text-secondary text-decoration-none">
                    <i className="bi bi-chevron-right text-primary"></i>FAQ
                  </a>
                </li>
                <li>
                  <a href="/contact" className="text-secondary text-decoration-none">
                    <i className="bi bi-chevron-right text-primary"></i>Contact Us
                  </a>
                </li>
              </ul>
            </div>

            <div className="col-lg-5 col-md-4 col-sm-12 small d-flex flex-column align-items-center align-items-md-start">
              <h5 className="text-uppercase mb-3 heading">store information</h5>
              <p className="text-secondary">
                <i className="bi bi-geo-alt-fill me-1"></i>15/51 Meacher Street{" "}
                Mt. Druitt 2770, NSW
              </p>
              <p className="text-secondary">
                <i className="bi bi-envelope-fill me-1"></i>
                <a
                  href="mailto:info@adroitgroup.biz"
                  className="text-secondary text-decoration-none"
                >
                  {" "}
                  info@adroitgroup.biz
                </a>
              </p>
              <p className="text-secondary">
                <i className="bi bi-telephone-fill me-1"></i>
                <a
                  href="tel:0433172345"
                  className="text-secondary text-decoration-none"
                >
                  043 317 2345
                </a>
              </p>
            </div>
          </div>

          <div className="row border-top py-3 align-items-center text-center text-md-start">
            <div className="col-md-6">
              <p className="mb-0 small">
                All rights reserved. {new Date().getFullYear()} &copy;{" "}
                <strong>Adroit Shop</strong>
              </p>
            </div>

            <div className="col-md-6 mt-2 mt-md-0 d-flex justify-content-center justify-content-md-end">
              <div className="social-icons d-flex gap-3">
                <a href="#" className="text-dark">
                  <i className="bi bi-facebook fs-5"></i>
                </a>
                <a href="#" className="text-dark">
                  <i className="bi bi-google fs-5"></i>
                </a>
                <a href="#" className="text-dark">
                  <i className="bi bi-twitter-x fs-5"></i>
                </a>
                <a href="#" className="text-dark">
                  <i className="bi bi-instagram fs-5"></i>
                </a>
                <a href="#" className="text-dark">
                  <i className="bi bi-tiktok fs-5"></i>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Footer;
