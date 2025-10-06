import React, { useState, useEffect, useRef } from "react";
import { Container } from "react-bootstrap";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "./CartContext";
import { useCompare } from "./CompareContext";
import Logo from "../Assets/Images/image.jpeg";
import GlobalButton from "./Button";
// ✅ Use Bootstrap APIs directly (no window.bootstrap)
import { Offcanvas, Modal } from "bootstrap";

const Header = ({ isLoggedIn }) => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [navbarFixed, setNavbarFixed] = useState(false);
  const cartRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Compare
  const { items: compareItems } = useCompare();
  const compareCount = compareItems?.length || 0;

  // Cart
  const {
    cart,
    isLoading,
    error,
    updateCartQuantity,
    removeFromCart,
    cartTotal,
    cartCount,
    formatImageUrl,
    forceRefreshCart,
  } = useCart();

  // --- Bootstrap helpers ---
  const getOffcanvasInstance = () => {
    const el = document.getElementById("mobileMenu");
    if (!el) return null;
    return Offcanvas.getInstance(el) || new Offcanvas(el);
  };

  const closeMobileMenu = () => {
    const inst = getOffcanvasInstance();
    if (inst) {
      inst.hide();
    } else {
      // Fallback: force-close if no instance (rare bundler edge cases)
      const el = document.getElementById("mobileMenu");
      if (!el) return;
      el.classList.remove("show");
      el.style.visibility = "hidden";
      document.body.style.overflow = "";
      document
        .querySelectorAll(".offcanvas-backdrop")
        .forEach((b) => b.remove());
    }
  };

  const openCompareModal = () => {
    const el = document.getElementById("compareModal");
    if (!el) return;
    const inst = Modal.getOrCreateInstance(el);
    inst.show();
  };

  // ✅ Event delegation: close offcanvas on ANY link/button inside it
  const handleOffcanvasClick = (e) => {
    const target = e.target.closest("a, button, [data-close-offcanvas]");
    if (!target) return;

    // Don't close when opening the account dropdown
    if (target.matches("[data-bs-toggle='dropdown']")) return;

    // Don’t close if it’s a purely toggling control without navigation
    // (we still close for Compare/Cart since we handle them below)
    closeMobileMenu();
  };

  useEffect(() => {
    const isReturningFromCheckout =
      document.referrer.includes("/checkout") ||
      document.referrer.includes("/success");
    if (isReturningFromCheckout && location.pathname === "/") {
      forceRefreshCart();
    }
  }, [location, forceRefreshCart]);

  const formatCartTotal = () => {
    const total =
      typeof cartTotal === "string" ? parseFloat(cartTotal) : Number(cartTotal);
    if (isNaN(total)) return "0";
    if (total % 1 === 0) {
      return new Intl.NumberFormat("en-US").format(total);
    } else {
      return new Intl.NumberFormat("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(total);
    }
  };

  const toggleCart = () => setShowCart((s) => !s);

  useEffect(() => {
    const handleScroll = () => setNavbarFixed(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (cartRef.current && !cartRef.current.contains(event.target)) {
        setShowCart(false);
      }
    };
    if (showCart) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showCart]);

  const handleUpdateQuantity = (productId, change) =>
    updateCartQuantity(productId, change);

  const handleRemoveFromCart = (productId) => removeFromCart(productId);

  const getCartItemImage = (item) => {
    const imageSources = [
      item.formattedImage,
      item.images?.[0]?.imgurl,
      item.imgurl,
      item.images?.[0],
      item.images,
    ];
    for (const source of imageSources) {
      const formatted = formatImageUrl(source);
      if (formatted && formatted !== "/placeholder.jpg") return formatted;
    }
    return "/placeholder.jpg";
  };

  const handleCheckoutClick = () => {
    toggleCart();
    navigate("/checkout");
  };

  return (
    <>
      <Container fluid className="p-0">
        {/* Top Header Bar */}
        <div className="header d-none d-lg-flex align-items-center justify-content-center bg-dark py-3 transition">
          <div className="container">
            <div className="row">
              <div className="col-12 d-flex align-items-center justify-content-between text-white">
                <div className="d-flex align-items-center heading gap-5">
                  <p className="mb-0 small">Welcome to Our Adroit Shop!</p>
                  <span className="d-flex align-items-center gap-2">
                    <i className="bi bi-telephone-fill text-primary"></i>
                    <a
                      href="tel:1234567890"
                      className="text-decoration-none text-white small"
                    >
                      Call Us: 043 - 317 - 2345
                    </a>
                  </span>
                </div>

                <div className="d-flex align-items-center heading">
                  <div
                    className="dropdown"
                    onMouseEnter={() => setShowDropdown(true)}
                    onMouseLeave={() => setShowDropdown(false)}
                  >
                    <div
                      className="d-flex align-items-center gap-2"
                      style={{ cursor: "pointer" }}
                      data-bs-toggle="dropdown"
                      aria-expanded={showDropdown}
                    >
                      <i className="bi bi-person-fill text-primary"></i>
                      <p className="mb-0 small">My Account</p>
                    </div>

                    <ul
                      className={`dropdown-menu rounded-0 ${
                        showDropdown ? "show" : ""
                      }`}
                      style={{ minWidth: "150px" }}
                    >
                      {isLoggedIn ? (
                        <>
                          <li>
                            <Link className="dropdown-item" to="/dashboard">
                              Dashboard
                            </Link>
                          </li>
                          <li>
                            <Link className="dropdown-item" to="/user-profile">
                              Edit Profile
                            </Link>
                          </li>
                        </>
                      ) : (
                        <>
                          <li>
                            <Link className="dropdown-item" to="/login">
                              Login
                            </Link>
                          </li>
                          <li>
                            <Link className="dropdown-item" to="/register">
                              Register
                            </Link>
                          </li>
                        </>
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Navigation */}
        <nav
          className={`navbar navbar-expand-lg bg-white ${
            navbarFixed ? "fixed-top shadow-sm" : ""
          }`}
        >
          <div className="container">
            <div className="d-flex align-items-center">
              <Link className="navbar-brand p-0 d-flex align-items-center" to="/">
                <img src={Logo} alt="Logo" className="logo" />
              </Link>
            </div>

            {/* Mobile: left block */}
            <div className="d-flex d-md-none gap-2">
              <div className="d-flex px-2 d-md-none align-items-center gap-3">
                {/* Compare (mobile) */}
                <button
                  className="btn p-0 position-relative"
                  data-bs-toggle="modal"
                  data-bs-target="#compareModal"
                  onClick={() => {
                    closeMobileMenu();
                    openCompareModal();
                  }}
                  aria-label="Open compare"
                >
                  <i className="bi bi-repeat fs-5"></i>
                  {compareCount > 0 && (
                    <span
                      className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-primary"
                      style={{ fontSize: "10px", padding: "3px 5px" }}
                    >
                      {compareCount}
                    </span>
                  )}
                </button>

                {/* Cart (mobile) */}
                <span
                  onClick={() => {
                    closeMobileMenu();
                    toggleCart();
                  }}
                  style={{ position: "relative", cursor: "pointer" }}
                  className="d-flex align-items-center"
                >
                  <i className="bi bi-cart-fill fs-5 me-1"></i>
                  <span className="small fw-semibold">
                    ${formatCartTotal()}
                  </span>
                  {cartCount > 0 && (
                    <span
                      className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-primary"
                      style={{ fontSize: "10px", padding: "3px 5px" }}
                    >
                      {cartCount}
                    </span>
                  )}
                </span>
              </div>

              <div className="d-flex align-items-center justify-content-center">
                <div
                  className="dropdown"
                  onMouseEnter={() => setShowDropdown(true)}
                  onMouseLeave={() => setShowDropdown(false)}
                >
                  <div
                    className="d-flex align-items-center gap-2"
                    style={{ cursor: "pointer" }}
                    data-bs-toggle="dropdown"
                    aria-expanded={showDropdown}
                  >
                    <i className="bi bi-person-fill fs-5"></i>
                  </div>

                  <ul
                    className={`dropdown-menu rounded-0 position-absolute start-50 translate-middle-x ${
                      showDropdown ? "show" : ""
                    }`}
                    style={{ minWidth: "90px" }}
                  >
                    {isLoggedIn ? (
                      <>
                        <li>
                          <Link className="dropdown-item" to="/dashboard">
                            Dashboard
                          </Link>
                        </li>
                        <li>
                          <Link className="dropdown-item" to="/user-profile">
                            Edit Profile
                          </Link>
                        </li>
                      </>
                    ) : (
                      <>
                        <li>
                          <Link className="dropdown-item" to="/login">
                            Login
                          </Link>
                        </li>
                        <li>
                          <Link className="dropdown-item" to="/register">
                            Register
                          </Link>
                        </li>
                      </>
                    )}
                  </ul>
                </div>
              </div>

              <button
                className="navbar-toggler border-0"
                type="button"
                data-bs-toggle="offcanvas"
                data-bs-target="#mobileMenu"
                aria-controls="mobileMenu"
                aria-expanded="false"
                aria-label="Toggle navigation"
              >
                <span className="navbar-toggler-icon"></span>
              </button>
            </div>

            {/* Desktop nav */}
            <div className="collapse navbar-collapse justify-content-end gap-3" id="navbarNav">
              <ul className="navbar-nav heading gap-3">
                <li className="nav-item fw-semibold">
                  <Link className="nav-link" to="/">Home</Link>
                </li>
                <li className="nav-item fw-semibold">
                  <Link className="nav-link" to="/about">About Us</Link>
                </li>
                <li className="nav-item fw-semibold">
                  <Link className="nav-link" to="/shop">Shop</Link>
                </li>
                <li className="nav-item fw-semibold">
                  <Link className="nav-link" to="/contact">Contact Us</Link>
                </li>
                <li className="nav-item fw-semibold">
                  <Link className="nav-link" to="/faq">FAQ</Link>
                </li>
              </ul>

              {/* Compare (desktop) */}
              <button
                className="nav-link btn p-0 position-relative"
                data-bs-toggle="modal"
                data-bs-target="#compareModal"
                onClick={openCompareModal}
                aria-label="Open compare"
              >
                <i className="bi bi-repeat fs-4"></i>
                {compareCount > 0 && (
                  <span
                    className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-primary compare-icon"
                    style={{ fontSize: "11px", padding: "4px 6px", top: "28px" }}
                  >
                    {compareCount}
                  </span>
                )}
              </button>

              <div className="d-flex align-items-center gap-2">
                <span
                  className="nav-link d-flex align-items-center"
                  onClick={toggleCart}
                  style={{ position: "relative", cursor: "pointer" }}
                >
                  <i className="bi bi-bag-plus fs-4"></i>
                  {cartCount > 0 && (
                    <span
                      className="position-absolute start-100 translate-middle badge rounded-pill bg-primary"
                      style={{ fontSize: "11px", padding: "4px 6px", top: "28px" }}
                    >
                      {cartCount}
                    </span>
                  )}
                </span>
                <span className="fw-semibold heading">
                  ${formatCartTotal()}
                </span>
              </div>
            </div>
          </div>
        </nav>

        {/* Cart Sidebar */}
        <div
          className={`offcanvas offcanvas-end ${showCart ? "show" : ""}`}
          ref={cartRef}
          tabIndex="-1"
          style={{ visibility: showCart ? "visible" : "hidden" }}
        >
          <div className="offcanvas-header bg-white border-bottom">
            <h5 className="offcanvas-title heading">My Cart ({cartCount})</h5>
            <button
              type="button"
              className="btn-close bg-light text-dark"
              aria-label="Close"
              onClick={toggleCart}
            ></button>
          </div>

          <div className="offcanvas-body">
            {isLoading ? (
              <div className="text-center py-3">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : error ? (
              <div className="alert alert-danger">{error}</div>
            ) : cartCount === 0 ? (
              <p className="text-center">Your cart is empty.</p>
            ) : (
              <>
                {cart.map((item) => {
                  const imageUrl = getCartItemImage(item);
                  return (
                    <div
                      key={item.product_id}
                      className="d-flex justify-content-between align-items-center border-bottom py-2"
                    >
                      <img
                        src={imageUrl}
                        alt={item.productname}
                        width="70"
                        height="70"
                        style={{
                          objectFit: "cover",
                          borderRadius: "4px",
                          border: "1px solid #eee",
                        }}
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.jpg";
                        }}
                      />

                      <div className="flex-grow-1 ms-3">
                        <p className="mb-0 fw-semibold heading">
                          {item.productname}
                        </p>
                        <p className="mb-0 text-muted small">
                          Size: {item.size || "M"} | Qty:{" "}
                          {item.pro_quantity || item.quantity}
                        </p>
                        <p className="mb-0 text-primary fw-semibold">
                          $
                          {(
                            parseFloat(item.pro_price || 0) *
                            (item.pro_quantity || item.quantity || 0)
                          ).toFixed(2)}
                        </p>
                      </div>

                      <div className="d-flex align-items-center">
                        <div className="d-flex align-items-center border p-1">
                          <button
                            className="btn btn-sm btn-light border-0 rounded-0"
                            onClick={() =>
                              handleUpdateQuantity(item.product_id, -1)
                            }
                            disabled={(item.pro_quantity || item.quantity) <= 1}
                          >
                            -
                          </button>
                          <span className="mx-2">
                            {item.pro_quantity || item.quantity}
                          </span>
                          <button
                            className="btn btn-sm btn-light border-0 rounded-0"
                            onClick={() =>
                              handleUpdateQuantity(item.product_id, 1)
                            }
                          >
                            +
                          </button>
                        </div>
                        <button
                          className="btn btn-sm text-danger ms-2"
                          onClick={() => handleRemoveFromCart(item.product_id)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  );
                })}

                <div className="d-flex gap-2 py-3 border-bottom justify-content-between heading">
                  <h6 className="m-0">Sub Total:</h6>
                  <span className="text-primary fw-bold">
                    ${formatCartTotal()}
                  </span>
                </div>

                <div className="d-flex gap-3 justify-content-between py-3">
                  <Link
                    to="/cart"
                    className="btn btn-outline-primary mt-3 px-4 py-2 rounded-0 text-decoration-none"
                    onClick={() => {
                      closeMobileMenu(); // if mobile menu was open
                      toggleCart(); // ensure cart closes
                    }}
                  >
                    View Cart
                  </Link>

                  <GlobalButton
                    to="/checkout"
                    onClick={handleCheckoutClick}
                    className="mt-3"
                  >
                    Checkout
                  </GlobalButton>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu (Offcanvas) */}
        <div
          className="offcanvas offcanvas-end w-100"
          tabIndex="-1"
          id="mobileMenu"
          aria-labelledby="mobileMenuLabel"
          onClickCapture={handleOffcanvasClick}  // ✅ close on any link/button
        >
          <div className="offcanvas-header bg-dark py-3">
            <Link
              className="navbar-brand p-0 d-flex align-items-center"
              to="/"
              onClick={closeMobileMenu}
            >
              <img src={Logo} alt="Logo" style={{ height: "60px" }} />
            </Link>
            <button
              type="button"
              className="btn-close bg-white"
              data-bs-dismiss="offcanvas"
              aria-label="Close"
            ></button>
          </div>

          <div className="offcanvas-body bg-dark d-flex align-items-center justify-content-center">
            <ul className="navbar-nav text-center heading text-white">
              <li className="nav-item py-4">
                <Link className="nav-link fw-bold fs-2" to="/" onClick={closeMobileMenu}>
                  Home
                </Link>
              </li>
              <li className="nav-item py-4 fs-2">
                <Link className="nav-link fw-bold" to="/about" onClick={closeMobileMenu}>
                  About Us
                </Link>
              </li>
              <li className="nav-item py-4 fs-2">
                <Link className="nav-link fw-bold" to="/shop" onClick={closeMobileMenu}>
                  Shop
                </Link>
              </li>
              <li className="nav-item py-4 fs-2">
                <Link className="nav-link fw-bold" to="/contact" onClick={closeMobileMenu}>
                  Contact Us
                </Link>
              </li>
              <li className="nav-item py-4 fs-2">
                <Link className="nav-link fw-bold" to="/faq" onClick={closeMobileMenu}>
                  F &amp; Q
                </Link>
              </li>

              <div className="d-flex align-items-center justify-content-center gap-4">
                {/* Compare inside offcanvas */}
                <button
                  className="btn p-0 position-relative text-white"
                  data-bs-toggle="modal"
                  data-bs-target="#compareModal"
                  onClick={() => {
                    closeMobileMenu();
                    openCompareModal();
                  }}
                  aria-label="Open compare"
                >
                  <i className="bi bi-repeat fs-1"></i>
                  {compareCount > 0 && (
                    <span
                      className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-primary"
                      style={{ fontSize: "12px", padding: "4px 6px" }}
                    >
                      {compareCount}
                    </span>
                  )}
                </button>

                {/* Account dropdown */}
                <div
                  className="dropdown"
                  onMouseEnter={() => setShowDropdown(true)}
                  onMouseLeave={() => setShowDropdown(false)}
                >
                  <div
                    className="d-flex align-items-center gap-2"
                    style={{ cursor: "pointer" }}
                    data-bs-toggle="dropdown"
                    aria-expanded={showDropdown}
                  >
                    <i className="bi bi-person-fill fs-1"></i>
                  </div>

                  <ul
                    className={`dropdown-menu rounded-0 ${showDropdown ? "show" : ""}`}
                    style={{ minWidth: "150px" }}
                  >
                    {isLoggedIn ? (
                      <>
                        <li>
                          <Link className="dropdown-item" to="/dashboard">
                            Dashboard
                          </Link>
                        </li>
                        <li>
                          <Link className="dropdown-item" to="/user-profile">
                            Edit Profile
                          </Link>
                        </li>
                      </>
                    ) : (
                      <>
                        <li>
                          <Link className="dropdown-item" to="/login">
                            Login
                          </Link>
                        </li>
                        <li>
                          <Link className="dropdown-item" to="/register">
                            Register
                          </Link>
                        </li>
                      </>
                    )}
                  </ul>
                </div>

                {/* Cart trigger inside offcanvas */}
                <span
                  onClick={() => {
                    closeMobileMenu();
                    toggleCart();
                  }}
                  style={{ position: "relative", cursor: "pointer" }}
                  className="d-flex align-items-center"
                >
                  <i className="bi bi-cart-fill fs-1 me-2"></i>
                  <span className="fw-semibold fs-4">${formatCartTotal()}</span>
                  {cartCount > 0 && (
                    <span
                      className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-primary"
                      style={{ fontSize: "12px", padding: "4px 6px" }}
                    >
                      {cartCount}
                    </span>
                  )}
                </span>
              </div>
            </ul>
          </div>
        </div>
      </Container>
    </>
  );
};

export default Header;