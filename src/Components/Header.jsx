import React, { useState, useEffect, useRef, useLayoutEffect, useCallback } from "react";
import { Container } from "react-bootstrap";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useCart } from "./CartContext";
import { useCompare } from "./CompareContext";
import Logo from "../Assets/Images/image.jpeg";
import GlobalButton from "./Button";
import { Offcanvas, Modal } from "bootstrap";

const Header = ({ isLoggedIn }) => {
  const [accountOpen, setAccountOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hideTopHeader, setHideTopHeader] = useState(false);
  const [cartVisible, setCartVisible] = useState(false);
  const lastScrollY = useRef(0);
  const headerRef = useRef(null);
  const cartOffcanvasInstanceRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Cart context with all needed values
  const {
    cart,
    error,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    cartTotal,
    cartCount,
    formatImageUrl,
    forceRefreshCart,
  } = useCart();

  // Compare
  const { items: compareItems } = useCompare();
  const compareCount = compareItems?.length || 0;

  // Debug log to verify cart updates
  useEffect(() => {
    console.log("🛍️ Header cart updated:", {
      count: cartCount,
      items: cart.length,
      total: cartTotal
    });
  }, [cart, cartCount, cartTotal]);

  useEffect(() => {
    const onScroll = () => {
      const currentScrollY = window.scrollY;
      setScrolled(currentScrollY > 40);

      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setHideTopHeader(true);
      } else {
        setHideTopHeader(false);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const measureHeader = () => {
    if (!headerRef.current) return;
    const h = headerRef.current.offsetHeight || 0;
    document.documentElement.style.setProperty("--header-height", `${h}px`);
  };

  useLayoutEffect(() => {
    measureHeader();
    const t = setTimeout(measureHeader, 0);
    window.addEventListener("resize", measureHeader);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", measureHeader);
    };
  }, [hideTopHeader]);

  // Initialize cart offcanvas
  useEffect(() => {
    const offcanvasEl = document.getElementById("cartOffcanvas");
    if (offcanvasEl) {
      cartOffcanvasInstanceRef.current = new Offcanvas(offcanvasEl, {
        backdrop: true,
        scroll: false,
      });

      // Listen for offcanvas events
      offcanvasEl.addEventListener('show.bs.offcanvas', () => {
        setCartVisible(true);
      });
      
      offcanvasEl.addEventListener('hide.bs.offcanvas', () => {
        setCartVisible(false);
      });
    }

    return () => {
      cartOffcanvasInstanceRef.current?.dispose();
    };
  }, []);

  // Custom event listener for cart updates from context
  useEffect(() => {
    const handleCartUpdate = () => {
      console.log("📢 Cart update event received in Header");
      // Force re-render
      measureHeader();
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => window.removeEventListener('cartUpdated', handleCartUpdate);
  }, []);

  const getOffcanvasInstance = () => {
    const el = document.getElementById("mobileMenu");
    if (!el) return null;
    return Offcanvas.getInstance(el) || new Offcanvas(el);
  };

  const closeMobileMenu = () => {
    const inst = getOffcanvasInstance();
    inst?.hide();
  };

  const openCompareModal = () => {
    const el = document.getElementById("compareModal");
    if (!el) return;
    Modal.getOrCreateInstance(el).show();
  };

  const toggleCart = () => {
    cartOffcanvasInstanceRef.current?.toggle();
  };
  
  const hideCart = () => {
    cartOffcanvasInstanceRef.current?.hide();
  };

  const handleClearCart = () => {
    if (cartCount === 0) return;
    clearCart();
  };

  // Close account dropdown when clicking outside
  useEffect(() => {
    const onDocClick = (e) => {
      if (!e.target.closest(".account-dropdown")) setAccountOpen(false);
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const handleOffcanvasClick = (e) => {
    const target = e.target.closest("a, button, [data-close-offcanvas]");
    if (!target) return;
    if (target.closest("[data-account-toggle]")) return;
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
    if (total % 1 === 0) return new Intl.NumberFormat("en-US").format(total);
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(total);
  };

  const handleUpdateQuantity = (productId, change) =>
    updateCartQuantity(productId, change);

  const getCartItemImage = (item) => {
    if (!item) return "/placeholder.jpg";

    const imageSources = [
      item.formattedImage,
      item.images?.[0]?.imgurl,
      item.imgurl,
      item.image,
      item.images?.[0],
      item.images,
      item.product_image,
    ];

    for (const source of imageSources) {
      if (!source) continue;

      const formatted = formatImageUrl(source);
      if (
        formatted &&
        formatted !== "/placeholder.jpg" &&
        !formatted.includes("undefined") &&
        !formatted.includes("null")
      ) {
        return formatted;
      }
    }
    return "/placeholder.jpg";
  };

  const getProductDetails = (item) => {
    const productName =
      item?.productname ||
      item?.name ||
      item?.product_name ||
      item?.title ||
      "Unknown Product";
    const quantity =
      Number(item?.pro_quantity) ||
      Number(item?.quantity) ||
      Number(item?.qty) ||
      1;
    const price =
      parseFloat(item?.pro_price) ||
      parseFloat(item?.price) ||
      parseFloat(item?.product_price) ||
      parseFloat(item?.original_price) ||
      0;
    const size = item?.size || item?.product_size || "M";
    const productId = item?.product_id || item?.id || "unknown";
    const imageUrl = getCartItemImage(item);

    return {
      id: productId,
      name: productName,
      price,
      quantity,
      size,
      image: imageUrl,
    };
  };

  const handleCheckoutClick = () => {
    hideCart();
    navigate("/checkout");
  };

  const toggleAccount = (e) => {
    e.stopPropagation();
    setAccountOpen((s) => !s);
  };

  return (
    <>
      <div
        ref={headerRef}
        className={`shop-header fixed-top w-100 ${hideTopHeader ? "top-header-hidden" : ""}`}
      >
        <Container fluid className="p-0">
          {/* Top Header Bar */}
          <div
            className={`header d-none d-lg-flex align-items-center justify-content-center dark-blue-bg py-2 transition-header ${hideTopHeader ? "header-hidden" : ""}`}
          >
            <div className="container">
              <div className="row">
                <div className="col-12 d-flex align-items-center justify-content-between text-white">
                  <div className="d-flex align-items-center heading gap-5">
                    <p className="mb-0">Welcome to Our Adroit Shop!</p>
                    <span className="d-flex align-items-center gap-2">
                      <i className="bi bi-telephone-fill text-primary"></i>
                      <a
                        href="tel:1234567890"
                        className="text-decoration-none text-white"
                      >
                        Call Us: 043 - 317 - 2345
                      </a>
                    </span>
                  </div>

                  {/* Account dropdown */}
                  <div className="d-flex align-items-center heading">
                    <div className="dropdown account-dropdown">
                      <div
                        className="d-flex align-items-center gap-2"
                        style={{ cursor: "pointer" }}
                        onClick={toggleAccount}
                        data-account-toggle
                        aria-expanded={accountOpen}
                      >
                        <i className="bi bi-person-fill text-primary"></i>
                        <p className="mb-0">My Account</p>
                      </div>

                      <ul
                        className={`dropdown-menu rounded-0 ${accountOpen ? "show" : ""}`}
                        style={{ minWidth: "150px", zIndex: 1050 }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        {isLoggedIn ? (
                          <>
                            <li>
                              <Link
                                className="dropdown-item"
                                to="/dashboard"
                                onClick={() => setAccountOpen(false)}
                              >
                                Dashboard
                              </Link>
                            </li>
                            <li>
                              <Link
                                className="dropdown-item"
                                to="/user-profile"
                                onClick={() => setAccountOpen(false)}
                              >
                                Edit Profile
                              </Link>
                            </li>
                          </>
                        ) : (
                          <>
                            <li>
                              <Link
                                className="dropdown-item"
                                to="/login"
                                onClick={() => setAccountOpen(false)}
                              >
                                Login
                              </Link>
                            </li>
                            <li>
                              <Link
                                className="dropdown-item"
                                to="/register"
                                onClick={() => setAccountOpen(false)}
                              >
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
            className={`navbar navbar-expand-lg bg-white shadow-sm ${scrolled ? "navbar-scrolled" : ""}`}
          >
            <div className="container">
              <div className="d-flex align-items-center">
                <Link
                  className="navbar-brand p-0 d-flex align-items-center"
                  to="/"
                >
                  <img src={Logo} alt="Logo" className="logo" />
                </Link>
              </div>

              {/* Mobile icons */}
              <div className="d-flex d-md-none gap-2">
                <div className="d-flex px-2 d-md-none align-items-center gap-3">
                  {/* Compare icon */}
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

                  {/* Cart icon with count */}
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

                <button
                  className="navbar-toggler border-0"
                  type="button"
                  data-bs-toggle="offcanvas"
                  data-bs-target="#mobileMenu"
                  aria-controls="mobileMenu"
                  aria-expanded="false"
                  aria-label="Toggle navigation"
                  onClick={() => setAccountOpen(false)}
                >
                  <span className="navbar-toggler-icon"></span>
                </button>
              </div>

              {/* Desktop nav */}
              <div
                className="collapse navbar-collapse justify-content-end gap-3"
                id="navbarNav"
              >
                <ul className="navbar-nav heading gap-3">
                  <li className="nav-item fw-semibold">
                    <Link className="nav-link" to="/">
                      Home
                    </Link>
                  </li>
                  <li className="nav-item fw-semibold">
                    <Link className="nav-link" to="/about">
                      About Us
                    </Link>
                  </li>
                  <li className="nav-item fw-semibold">
                    <Link className="nav-link" to="/shop">
                      Shop
                    </Link>
                  </li>
                  <li className="nav-item fw-semibold">
                    <Link className="nav-link" to="/faq">
                      FAQ
                    </Link>
                  </li>
                  <li className="nav-item fw-semibold">
                    <Link className="nav-link" to="/contact">
                      Contact Us
                    </Link>
                  </li>
                </ul>

                {/* Compare icon */}
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
                      style={{
                        fontSize: "11px",
                        padding: "4px 6px",
                        top: "28px",
                      }}
                    >
                      {compareCount}
                    </span>
                  )}
                </button>

                <div className="d-flex align-items-center gap-2">
                  {/* Cart icon with count */}
                  <span
                    className="nav-link d-flex align-items-center"
                    onClick={toggleCart}
                    style={{ position: "relative", cursor: "pointer" }}
                  >
                    <i className="bi bi-bag-plus fs-4"></i>
                    {cartCount > 0 && (
                      <span
                        className="position-absolute start-100 translate-middle badge rounded-pill bg-primary"
                        style={{
                          fontSize: "11px",
                          padding: "4px 6px",
                          top: "28px",
                        }}
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
        </Container>
      </div>

      {/* Cart Sidebar */}
      <div className="offcanvas offcanvas-end" tabIndex="-1" id="cartOffcanvas">
        <div className="offcanvas-header bg-white border-bottom">
          <h5 className="offcanvas-title heading">
            My Cart ({cartCount})
            {cartCount > 0 && (
              <span className="ms-2 text-primary">• {cartCount} items</span>
            )}
          </h5>
          <button
            type="button"
            className="btn-close bg-light text-dark p-2 rounded-0"
            aria-label="Close"
            onClick={hideCart}
            data-bs-dismiss="offcanvas"
          ></button>
        </div>

        <div className="offcanvas-body d-flex flex-column p-0">
          {error ? (
            <div className="alert alert-danger m-3">{error}</div>
          ) : cartCount === 0 ? (
            <div className="text-center p-4">
              <i className="bi bi-cart-x fs-1 text-muted mb-3"></i>
              <p>Your cart is empty.</p>
              <button
                className="btn btn-outline-primary rounded-0 mt-2"
                onClick={hideCart}
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <>
              <div className="flex-grow-1 overflow-auto p-3">
                <div className="d-flex justify-content-end mb-2">
                  <button
                    className="btn btn-link text-danger fw-semibold small text-decoration-none p-0"
                    onClick={handleClearCart}
                    style={{ cursor: "pointer" }}
                  >
                    Clear Cart
                  </button>
                </div>

                {cart.map((item, index) => {
                  const productDetails = getProductDetails(item);
                  return (
                    <div
                      key={`${productDetails.id}-${index}`}
                      className="d-flex justify-content-between align-items-center border-bottom py-2"
                    >
                      <img
                        src={productDetails.image}
                        alt={productDetails.name}
                        width="70"
                        height="70"
                        style={{ objectFit: "cover", border: "1px solid #eee" }}
                        onError={(e) => {
                          e.currentTarget.src = "/placeholder.jpg";
                        }}
                      />

                      <div className="flex-grow-1 ms-3">
                        <p className="mb-0 fw-semibold small">
                          {productDetails.name}
                        </p>
                        <p className="mb-0 text-muted small">
                          Size: {productDetails.size} | Qty:{" "}
                          {productDetails.quantity}
                        </p>
                        <p className="mb-0 text-primary fw-semibold">
                          $
                          {(
                            productDetails.price * productDetails.quantity
                          ).toFixed(2)}
                        </p>
                      </div>

                      <div className="d-flex flex-column align-items-end justify-content-center gap-2">
                        <button
                          className="btn btn-sm btn-outline-secondary border rounded-0"
                          onClick={() => removeFromCart(productDetails.id)}
                        >
                          <i className="bi bi-trash small"></i>
                        </button>

                        <div className="d-flex align-items-center border p-1 bg-light">
                          <button
                            className="btn btn-sm btn-light border-0 rounded-0"
                            onClick={() =>
                              handleUpdateQuantity(productDetails.id, -1)
                            }
                            disabled={productDetails.quantity <= 1}
                          >
                            <i className="bi bi-dash small"></i>
                          </button>
                          <span className="mx-2 small fw-semibold">
                            {productDetails.quantity}
                          </span>
                          <button
                            className="btn btn-sm btn-light border-0 rounded-0"
                            onClick={() =>
                              handleUpdateQuantity(productDetails.id, 1)
                            }
                          >
                            <i className="bi bi-plus small"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-auto p-3 border-top">
                <div className="d-flex gap-2 pb-2 justify-content-between heading">
                  <h6 className="m-0">Sub Total:</h6>
                  <span className="text-primary fw-bold fs-5">
                    ${formatCartTotal()}
                  </span>
                </div>

                <div className="d-flex gap-3 justify-content-between border-top pt-3">
                  <Link
                    to="/cart"
                    className="btn btn-outline-primary px-4 py-2 rounded-0 text-decoration-none flex-grow-1"
                    onClick={() => {
                      closeMobileMenu();
                      hideCart();
                    }}
                  >
                    View Cart
                  </Link>

                  <GlobalButton
                    to="/checkout"
                    onClick={handleCheckoutClick}
                    className="flex-grow-1"
                  >
                    Checkout
                  </GlobalButton>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      <div
        className="offcanvas offcanvas-end w-100"
        tabIndex="-1"
        id="mobileMenu"
        aria-labelledby="mobileMenuLabel"
        onClickCapture={handleOffcanvasClick}
      >
        <div className="offcanvas-header dark-blue-bg py-3">
          <Link
            className="navbar-brand p-0 d-flex align-items-center"
            to="/"
            onClick={closeMobileMenu}
          >
            <img src={Logo} alt="Logo" style={{ height: "60px" }} />
          </Link>
          <button
            type="button"
            className="btn-close bg-white me-2"
            data-bs-dismiss="offcanvas"
            aria-label="Close"
          ></button>
        </div>

        <div className="offcanvas-body dark-blue-bg d-flex align-items-center justify-content-center">
          <ul className="navbar-nav text-center heading text-white">
            <li className="nav-item py-4">
              <Link
                className="nav-link fw-bold fs-2"
                to="/"
                onClick={closeMobileMenu}
              >
                Home
              </Link>
            </li>
            <li className="nav-item py-4 fs-2">
              <Link
                className="nav-link fw-bold"
                to="/about"
                onClick={closeMobileMenu}
              >
                About Us
              </Link>
            </li>
            <li className="nav-item py-4 fs-2">
              <Link
                className="nav-link fw-bold"
                to="/shop"
                onClick={closeMobileMenu}
              >
                Shop
              </Link>
            </li>
            <li className="nav-item py-4 fs-2">
              <Link
                className="nav-link fw-bold"
                to="/contact"
                onClick={closeMobileMenu}
              >
                Contact Us
              </Link>
            </li>
            <li className="nav-item py-4 fs-2">
              <Link
                className="nav-link fw-bold"
                to="/faq"
                onClick={closeMobileMenu}
              >
                F &amp; Q
              </Link>
            </li>

            <div className="position-relative">
              <div
                className="d-flex align-items-center gap-2 fs-2 justify-content-center py-4 fw-bold"
                style={{ cursor: "pointer" }}
                onClick={toggleAccount}
                data-account-toggle
                aria-expanded={accountOpen}
              >
                <i className="bi bi-person-fill fs-1 me-2"></i> Account
              </div>

              <div
                className={`dropdown-menu rounded-0 ${accountOpen ? "show" : ""}`}
                style={{
                  position: "absolute",
                  top: "100%",
                  left: "50%",
                  transform: "translateX(-50%)",
                  minWidth: "200px",
                  marginTop: "5px",
                  zIndex: 9999,
                  boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                  display: accountOpen ? "block" : "none"
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {isLoggedIn ? (
                  <>
                    <li>
                      <Link
                        className="dropdown-item"
                        to="/dashboard"
                        onClick={() => setAccountOpen(false)}
                      >
                        Dashboard
                      </Link>
                    </li>
                    <li>
                      <Link
                        className="dropdown-item"
                        to="/user-profile"
                        onClick={() => setAccountOpen(false)}
                      >
                        Edit Profile
                      </Link>
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <Link
                        className="dropdown-item"
                        to="/login"
                        onClick={() => setAccountOpen(false)}
                      >
                        Login
                      </Link>
                    </li>
                    <li>
                      <Link
                        className="dropdown-item"
                        to="/register"
                        onClick={() => setAccountOpen(false)}
                      >
                        Register
                      </Link>
                    </li>
                  </>
                )}
              </div>
            </div>

            <div className="d-flex align-items-center justify-content-center gap-4">
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
    </>
  );
};

export default Header;