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
                Never Miss Anything From Adroit By Signing Up To Our Newsletter.
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
            <div className="col-lg-3 col-md-4 col-sm-12 pb-3 d-flex flex-column align-items-center align-items-md-start">
              <div className="d-flex align-items-center mb-3">
                <img src={Logo} alt="Logo" style={{ height: "55px" }} />
              </div>
              <p className="text-secondary fw-semibold lh-base">
                Protect what matters most with reliable security solutions
                designed for homes and businesses. From smart alarms to 24/7
                monitoring, we deliver safety, peace of mind, and dependable
                protection you can trust.
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
              <h5 className="text-uppercase mb-4 fw-bold heading">
                my account
              </h5>
              <ul className="list-unstyled small footer-links text-uppercase lh-lg">
                <li className="mb-2 fw-semibold">
                  <a
                    href="/about"
                    className="text-secondary position-relative text-decoration-none"
                  >
                    About Us
                  </a>
                </li>
                <li className="mb-2 fw-semibold">
                  <a
                    href="/categories"
                    className="text-secondary position-relative text-decoration-none"
                  >
                    Categories
                  </a>
                </li>
                <li className="mb-2 fw-semibold">
                  <a
                    href="/shop"
                    className="text-secondary position-relative text-decoration-none"
                  >
                    Shop
                  </a>
                </li>
                <li className="mb-2 fw-semibold">
                  <a
                    href="/faq"
                    className="text-secondary position-relative text-decoration-none"
                  >
                    FAQ
                  </a>
                </li>
                <li className="fw-semibold">
                  <a
                    href="/contact"
                    className="text-secondary position-relative text-decoration-none"
                  >
                    Contact Us
                  </a>
                </li>
              </ul>
            </div>

            <div className="col-lg-3 col-md-4 col-sm-12 pb-3">
              <h5 className="text-uppercase mb-4 fw-bold heading">
                why we choose
              </h5>
              <ul className="list-unstyled small footer-links text-uppercase lh-lg">
                <li className="mb-2 fw-semibold">
                  <a
                    href="/services"
                    className="text-secondary position-relative text-decoration-none"
                  >
                    24/7 Monitoring
                  </a>
                </li>
                <li className="mb-2 fw-semibold">
                  <a
                    href="/services"
                    className="text-secondary position-relative text-decoration-none"
                  >
                    Professional Installation
                  </a>
                </li>
                <li className="mb-2 fw-semibold">
                  <a
                    href="/services"
                    className="text-secondary position-relative text-decoration-none"
                  >
                    Smart Security Solutions
                  </a>
                </li>
                <li className="mb-2 fw-semibold">
                  <a
                    href="/support"
                    className="text-secondary position-relative text-decoration-none"
                  >
                    Reliable Support
                  </a>
                </li>
                <li className="fw-semibold">
                  <a
                    href="/contact"
                    className="text-secondary position-relative text-decoration-none"
                  >
                    Get a Free Quote
                  </a>
                </li>
              </ul>
            </div>

            <div className="col-lg-3 col-md-4 col-sm-12 pb-4 d-flex flex-column align-items-center align-items-md-start">
              <h5 className="text-uppercase mb-4 fw-bold heading">
                store information
              </h5>

              <div className="d-flex align-items-start fw-semibold text-secondary mb-3">
                <i className="bi bi-geo-alt-fill text-primary me-2"></i>
                <span>15/51 Meacher Street Mt. Druitt 2770, NSW</span>
              </div>

              <div className="d-flex align-items-start fw-semibold text-secondary mb-3">
                <i className="bi bi-envelope-fill text-primary me-2"></i>
                <a
                  href="mailto:info@adroitgroup.biz"
                  className="text-secondary text-decoration-none"
                >
                  info@adroitgroup.biz
                </a>
              </div>

              <div className="d-flex align-items-start fw-semibold text-secondary">
                <i className="bi bi-telephone-fill text-primary me-2"></i>
                <a
                  href="tel:0433172345"
                  className="text-secondary text-decoration-none"
                >
                  043 317 2345
                </a>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white">
          <div className="container border-top py-3">
            <div className="row align-items-center text-center text-md-start">
              <div className="col-md-6">
                <p className="mb-0">
                  All rights reserved. {new Date().getFullYear()} &copy;{" "}
                  <strong>Adroit Shop</strong>
                </p>
              </div>

              <div className="col-md-6 mt-2 mt-md-0 d-flex justify-content-center justify-content-md-end">
                <div className="social-icons d-flex gap-3">
                  <a href="https://www.facebook.com/p/Adroit-alarms-100071267801808/" className="text-dark">
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
      </div>
    </>
  );
};

export default Footer;
