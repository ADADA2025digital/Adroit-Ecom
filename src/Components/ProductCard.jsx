import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import slugify from "slugify";
import { useCart } from "./CartContext";
import { useCompare } from "./CompareContext";
import GlobalButton from "./Button";
import { Modal } from "bootstrap";
import api from "../Config/api";

const ProductCard = ({ product, gridView = "grid-4" }) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize] = useState("M");
  const { addToCart, formatImageUrl } = useCart();
  const { items, add: addToCompare } = useCompare();
  const [reviewSummary, setReviewSummary] = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [currentImageStartIndex, setCurrentImageStartIndex] = useState(0);

  const isCompared = items?.some((p) => p.id === product.id);
  const modalId = `productModal-${product.id}`;

  const images = product?.images || [];
  const selectedImageDefault = images[0]?.imgurl || "default.jpg";
  const [selectedImage, setSelectedImage] = useState(selectedImageDefault);

  // Calculate max index for single image navigation
  const maxImageIndex = Math.max(0, images.length - 3);

  // Get CSS custom property values based on grid view
  const getCSSVariables = () => {
    switch (gridView) {
      case "grid-2":
        return {
          "--card-h": "540px",
          "--card-h-hover": "580px",
          "--media-h": "400px",
        };
      case "grid-3":
        return {
          "--card-h": "490px",
          "--card-h-hover": "530px",
          "--media-h": "350px",
        };
      case "grid-4":
      default:
        return {
          "--card-h": "440px",
          "--card-h-hover": "480px",
          "--media-h": "300px",
        };
    }
  };

  // Get media height for inline style (backup)
  const getMediaHeight = () => {
    switch (gridView) {
      case "grid-2":
        return "400px";
      case "grid-3":
        return "350px";
      case "grid-4":
      default:
        return "300px";
    }
  };

  useEffect(() => {
    const fetchReviewSummary = async () => {
      if (!product?.id) return;

      try {
        setLoadingReviews(true);
        const productIdString = String(product.id);
        const productId = productIdString.startsWith("PRO")
          ? productIdString
          : `PRO${productIdString.padStart(3, "0")}`;

        const response = await api.get(`/products/${productId}/review-summary`);

        if (response.data.success) {
          setReviewSummary(response.data.summary);
        } else {
          setReviewSummary(null);
        }
      } catch (error) {
        // console.error("Error fetching review summary:", error);
        setReviewSummary(null);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchReviewSummary();
  }, [product?.id]);

  // Reset selected image when product changes
  useEffect(() => {
    if (images.length > 0) {
      setSelectedImage(images[0]?.imgurl || "default.jpg");
      setCurrentImageStartIndex(0);
    }
  }, [product?.id, images]);

  const nextImages = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageStartIndex((prev) => Math.min(prev + 1, maxImageIndex));
  };

  const prevImages = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageStartIndex((prev) => Math.max(prev - 1, 0));
  };

  const renderStarRating = () => {
    if (loadingReviews) {
      return (
        <span className="text-warning fs-6">
          <i className="bi bi-star text-warning"></i>
          <i className="bi bi-star text-warning"></i>
          <i className="bi bi-star text-warning"></i>
          <i className="bi bi-star text-warning"></i>
          <i className="bi bi-star text-warning"></i>
        </span>
      );
    }

    if (!reviewSummary || reviewSummary.average_rating === 0) {
      return (
        <span className="text-warning fs-6">
          <i className="bi bi-star text-warning"></i>
          <i className="bi bi-star text-warning"></i>
          <i className="bi bi-star text-warning"></i>
          <i className="bi bi-star text-warning"></i>
          <i className="bi bi-star text-warning"></i>
        </span>
      );
    }

    const averageRating = reviewSummary.average_rating;
    const stars = [];

    for (let i = 1; i <= 5; i++) {
      if (i <= Math.floor(averageRating)) {
        stars.push(<i key={i} className="bi bi-star-fill text-warning"></i>);
      } else if (i === Math.ceil(averageRating) && averageRating % 1 !== 0) {
        stars.push(<i key={i} className="bi bi-star-half text-warning"></i>);
      } else {
        stars.push(<i key={i} className="bi bi-star text-warning"></i>);
      }
    }

    return <span className="text-warning fs-6">{stars}</span>;
  };

  const safeHideModalById = (id) => {
    const el = document.getElementById(id);
    if (!el) return;

    // If focus is inside the modal, blur it (prevents some stuck states)
    if (document.activeElement && el.contains(document.activeElement)) {
      document.activeElement.blur();
    }

    const instance = Modal.getInstance(el) || new Modal(el);

    // After it is fully hidden, ensure Bootstrap leftovers are cleaned up
    el.addEventListener(
      "hidden.bs.modal",
      () => {
        // Remove any stuck backdrops
        document.querySelectorAll(".modal-backdrop").forEach((b) => b.remove());

        // Remove stuck body state
        document.body.classList.remove("modal-open");
        document.body.style.removeProperty("padding-right");
        document.body.style.removeProperty("overflow");
      },
      { once: true },
    );

    instance.hide();
  };

  const handleAddToCart = async () => {
    try {
      await addToCart(product, quantity, selectedSize);
      safeHideModalById(modalId);
    } catch (error) {
      // console.error("Failed to add item to cart:", error);
      alert("Failed to add item to cart. Please try again.");
    }
  };

  const handleOpenCompare = (e) => {
    if (e) e.preventDefault();
    if (!isCompared) addToCompare(product);
    const el = document.getElementById("compareModal");
    if (el) {
      const m = Modal.getInstance(el) || new Modal(el);
      m.show();
    }
  };

  const compareBtnClasses =
    "icon-btn d-flex align-items-center justify-content-center rounded-circle border " +
    (isCompared ? "bg-primary" : "bg-white");
  const compareIconClasses = isCompared
    ? "bi bi-repeat text-white"
    : "bi bi-repeat text-muted";

  const cssVariables = getCSSVariables();
  const mediaHeight = getMediaHeight();

  return (
    <>
      <div className="product-card-wrap" style={cssVariables}>
        <div className="card product-card border shadow-none rounded-0">
          <div
            className="product-media bg-secondary border overflow-hidden position-relative"
            style={{ height: mediaHeight }}
          >
            <Link
              to={`/shop/product/${slugify(product.productname, { lower: true })}-${product.id}`}
              className="stretched-link"
              aria-label={product.productname}
            >
              <img
                src={formatImageUrl(images[0]?.imgurl)}
                alt={product.productname || "Product Image"}
                className="img-fluid w-100 product-image d-block"
                style={{
                  height: "100%",
                  objectFit: "cover",
                }}
                onError={(e) =>
                  (e.currentTarget.src = "https://via.placeholder.com/300")
                }
              />
            </Link>

            <div className="icon-batch position-absolute z-2 d-flex flex-column">
              <button
                type="button"
                className="icon-btn d-flex align-items-center justify-content-center rounded-circle bg-white border"
                aria-label="Add to cart"
                onClick={(e) => {
                  e.preventDefault();
                  handleAddToCart();
                }}
              >
                <i className="bi bi-bag-plus text-muted"></i>
              </button>

              <button
                type="button"
                className={compareBtnClasses}
                aria-label={isCompared ? "In compare" : "Add to compare"}
                data-bs-toggle="modal"
                data-bs-target="#compareModal"
                onClick={handleOpenCompare}
                title={isCompared ? "In compare" : "Add to compare"}
              >
                <i className={compareIconClasses}></i>
              </button>

              <button
                type="button"
                className="icon-btn d-flex align-items-center justify-content-center rounded-circle bg-white border"
                aria-label="Quick view"
                data-bs-toggle="modal"
                data-bs-target={`#${modalId}`}
                onClick={(e) => e.preventDefault()}
              >
                <i className="bi bi-eye text-muted"></i>
              </button>
            </div>
          </div>

          <div className="card-body px-0 text-start">
            <div className="d-flex justify-content-between">
              <div>
                <p
                  className="mb-0 text-muted"
                  style={{
                    fontSize: "12px",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    maxWidth:
                      gridView === "grid-2"
                        ? "300px"
                        : gridView === "grid-3"
                          ? "250px"
                          : "200px",
                  }}
                >
                  {product.specification}
                </p>
                <Link
                  to={`/shop/product/${slugify(product.productname, { lower: true })}-${product.id}`}
                  className="text-decoration-none text-dark"
                >
                  <h5
                    className="mb-0 mt-1 heading"
                    style={{
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                      whiteSpace: "nowrap",
                      maxWidth:
                        gridView === "grid-2"
                          ? "300px"
                          : gridView === "grid-3"
                            ? "250px"
                            : "200px",
                    }}
                  >
                    {product.productname}
                  </h5>
                </Link>
              </div>
            </div>
            <p className="pt-2 m-0">
              <span className="text-primary">${product.pro_price}</span>
              {product.oldPrice && (
                <>
                  <span className="text-muted text-decoration-line-through ms-2">
                    ${product.oldPrice}
                  </span>
                  <span className="text-success ms-2">
                    {product.discount}% off
                  </span>
                </>
              )}
            </p>

            <div className="quick-add-collapse">
              <button
                className="btn btn-light rounded-0 w-100"
                onClick={(e) => {
                  e.preventDefault();
                  handleAddToCart();
                }}
              >
                <i className="bi bi-cart me-2"></i>
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal - Quick View */}
      <div
        className="modal fade modal-fullscreen-fallback"
        id={modalId}
        tabIndex="-1"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-xl modal-dialog-centered modal-fullscreen-sm-down">
          <div className="modal-content rounded-0">
            <div className="modal-body">
              <div className="d-flex justify-content-end align-items-center p-3 pb-0">
                <button
                  className="btn-close bg-primary p-2 rounded-0"
                  data-bs-dismiss="modal"
                  aria-label="Close"
                />
              </div>
              <div className="container p-4 pt-0">
                <div className="row">
                  <div className="col-md-6 p-0">
                    <div className="d-flex flex-column align-items-center">
                      {/* Main product image */}
                      <div
                        className="w-100 border"
                        style={{
                          height: "350px",
                          overflow: "hidden",
                          background: "#fff",
                        }}
                      >
                        <img
                          src={formatImageUrl(selectedImage)}
                          alt={product.productname || "Product Image"}
                          className="w-100 h-100 d-block"
                          style={{
                            objectFit: "contain",
                          }}
                          onError={(e) =>
                            (e.currentTarget.src =
                              "https://via.placeholder.com/430")
                          }
                        />
                      </div>

                      {/* Thumbnail carousel - shows 3 images, navigates one at a time */}
                      {images.length > 0 && (
                        <div className="position-relative w-100 mt-4 px-4">
                          <div className="d-flex justify-content-center align-items-center gap-3">
                            {/* Previous button */}
                            {currentImageStartIndex > 0 && (
                              <button
                                className="btn btn-sm btn-outline-secondary rounded-circle position-absolute start-0 z-3 p-0 d-flex align-items-center justify-content-center translate-middle-x"
                                onClick={prevImages}
                                style={{
                                  width: "32px",
                                  height: "32px",
                                }}
                                aria-label="Previous images"
                              >
                                <i className="bi bi-chevron-left"></i>
                              </button>
                            )}

                            {/* Display 3 images starting from current index */}
                            {images
                              .slice(
                                currentImageStartIndex,
                                currentImageStartIndex + 3,
                              )
                              .map((img, idx) => {
                                const imagePath = img.imgurl;
                                return (
                                  <img
                                    key={currentImageStartIndex + idx}
                                    src={formatImageUrl(imagePath)}
                                    alt={`Thumbnail ${currentImageStartIndex + idx + 1}`}
                                    className="img-thumbnail rounded-0"
                                    style={{
                                      width: "90px",
                                      height: "90px",
                                      objectFit: "cover",
                                      cursor: "pointer",
                                      border:
                                        selectedImage === imagePath
                                          ? "3px solid #0d6efd"
                                          : "1px solid #dee2e6",
                                      transition: "all 0.2s ease",
                                      opacity:
                                        selectedImage === imagePath ? 1 : 0.7,
                                    }}
                                    onClick={() => setSelectedImage(imagePath)}
                                    onMouseEnter={(e) => {
                                      if (selectedImage !== imagePath) {
                                        e.currentTarget.style.opacity = "0.9";
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (selectedImage !== imagePath) {
                                        e.currentTarget.style.opacity = "0.7";
                                      }
                                    }}
                                  />
                                );
                              })}

                            {/* Next button */}
                            {currentImageStartIndex < maxImageIndex && (
                              <button
                                className="btn btn-sm btn-outline-secondary rounded-circle position-absolute end-0 z-3 p-0 d-flex align-items-center justify-content-center translate-middle-x"
                                onClick={nextImages}
                                style={{
                                  width: "32px",
                                  height: "32px",
                                }}
                                aria-label="Next images"
                              >
                                <i className="bi bi-chevron-right"></i>
                              </button>
                            )}
                          </div>

                          {/* Image counter */}
                          {images.length > 3 && (
                            <div className="text-center mt-2 small text-muted">
                              {currentImageStartIndex + 1} -{" "}
                              {Math.min(
                                currentImageStartIndex + 3,
                                images.length,
                              )}{" "}
                              of {images.length} images
                            </div>
                          )}
                        </div>
                      )}

                      {/* Fallback if no images */}
                      {images.length === 0 && (
                        <div className="text-center text-muted mt-3">
                          No additional images available
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="col-md-6 text-start mt-5 mt-md-0 px-4">
                    <h1 className="fw-bold heading h2">
                      {product.productname}
                    </h1>
                    <p className="text-muted mb-2">{product.specification}</p>

                    {/* Rating section */}
                    <div className="d-flex align-items-center justify-content-start gap-2 mb-3">
                      {renderStarRating()}
                      <span className="text-muted small">
                        {loadingReviews
                          ? "Loading reviews..."
                          : reviewSummary
                            ? `(${reviewSummary.total_ratings} ${reviewSummary.total_ratings === 1 ? "Review" : "Reviews"})`
                            : "(0 Reviews)"}
                      </span>
                    </div>

                    {/* Stock status */}
                    <p className="mb-3">
                      <i className="bi bi-check-circle-fill text-success me-2"></i>
                      <span className="text-success">In Stock</span>
                    </p>

                    {/* Price section */}
                    <div className="d-flex align-items-center mb-3">
                      <p className="m-0">
                        <span className="text-primary fs-3 fw-bold">
                          ${product.pro_price}
                        </span>
                        {product.oldPrice && (
                          <>
                            <span className="text-muted text-decoration-line-through ms-2 fs-5">
                              ${product.oldPrice}
                            </span>
                            <span className="text-success ms-2 bg-success bg-opacity-10 px-2 py-1 rounded">
                              Save {product.discount}%
                            </span>
                          </>
                        )}
                      </p>
                    </div>

                    {/* Description */}
                    <p className="text-muted mb-4">{product.pro_description}</p>

                    {/* Quantity selector */}
                    <div className="d-flex flex-column align-items-start justify-content-start my-3 gap-2">
                      <p className="text-dark m-0 fw-semibold">Quantity</p>
                      <div className="d-flex align-items-center bg-light p-1 border">
                        <button
                          className="btn btn-sm bg-white border rounded-0"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          aria-label="Decrease quantity"
                          disabled={quantity <= 1}
                        >
                          <i className="bi bi-dash fs-5"></i>
                        </button>
                        <span
                          className="mx-3 fw-semibold"
                          style={{ minWidth: "30px", textAlign: "center" }}
                        >
                          {quantity}
                        </span>
                        <button
                          className="btn btn-sm bg-white border rounded-0"
                          onClick={() => setQuantity(quantity + 1)}
                          aria-label="Increase quantity"
                          disabled={quantity >= (product.stock || 99)}
                        >
                          <i className="bi bi-plus fs-5"></i>
                        </button>
                      </div>
                      {product.stock && (
                        <small className="text-muted">
                          {product.stock} items available
                        </small>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="d-flex gap-2">
                      <GlobalButton
                        onClick={handleAddToCart}
                        className="mt-3 flex-grow-1 py-2"
                        disabled={product.stock === 0}
                      >
                        <i className="bi bi-cart-plus me-2"></i>
                        Add To Cart
                      </GlobalButton>

                      <button
                        className={`btn rounded-0 border mt-3 px-3 ${
                          isCompared ? "btn-primary text-white" : "btn-light"
                        }`}
                        data-bs-toggle="modal"
                        data-bs-target="#compareModal"
                        onClick={handleOpenCompare}
                        title={isCompared ? "In compare" : "Add to compare"}
                        aria-label={
                          isCompared ? "Remove from compare" : "Add to compare"
                        }
                      >
                        <i
                          className={`bi bi-repeat fs-5 ${isCompared ? "text-white" : ""}`}
                        ></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProductCard;
