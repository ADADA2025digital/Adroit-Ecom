import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import slugify from "slugify";
import { useCart } from "./CartContext";
import { useCompare } from "./CompareContext";
import GlobalButton from "./Button";
import { Modal } from "bootstrap";

const ProductCard = ({ product }) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedSize] = useState("M");
  const { addToCart, formatImageUrl } = useCart();
  const { items, add: addToCompare } = useCompare();
  const [reviewSummary, setReviewSummary] = useState(null);
  const [loadingReviews, setLoadingReviews] = useState(false);

  const isCompared = items?.some((p) => p.id === product.id);
  const modalId = `productModal-${product.id}`;

  const images = product?.images || [];
  const selectedImageDefault = images[0]?.imgurl || "default.jpg";
  const [selectedImage, setSelectedImage] = useState(selectedImageDefault);

  const groupedImages = [];
  for (let i = 0; i < images.length; i += 2) {
    groupedImages.push(images.slice(i, i + 2));
  }

  useEffect(() => {
    const fetchReviewSummary = async () => {
      if (!product?.id) return;
      
      try {
        setLoadingReviews(true);
        const productIdString = String(product.id);
        const productId = productIdString.startsWith('PRO') ? productIdString : `PRO${productIdString.padStart(3, '0')}`;
        
        const response = await fetch(`https://shop.adroitalarm.com.au/api/products/${productId}/review-summary`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          setReviewSummary(data.summary);
        }
      } catch (error) {
        setReviewSummary(null);
      } finally {
        setLoadingReviews(false);
      }
    };

    fetchReviewSummary();
  }, [product?.id]);

  const renderStarRating = () => {
    if (loadingReviews) {
      return (
        <span className="text-warning fs-4">
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
        <span className="text-warning fs-4">
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

    return <span className="text-warning fs-4">{stars}</span>;
  };

  const safeHideModalById = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (document.activeElement && el.contains(document.activeElement)) {
      document.activeElement.blur();
    }
    const instance = Modal.getInstance(el) || new Modal(el);
    instance.hide();
  };

  const handleAddToCart = async () => {
    try {
      await addToCart(product, quantity, selectedSize);
      safeHideModalById(modalId);
    } catch (error) {
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

  return (
    <>
      <div className="product-card-wrap">
        <div className="card product-card border shadow-none rounded-0">
          <div className="product-media bg-secondary border overflow-hidden position-relative">
            <Link
              to={`/shop/product/${slugify(product.productname, { lower: true })}-${product.id}`}
              className="stretched-link"
              aria-label={product.productname}
            >
              <img
                src={formatImageUrl(images[0]?.imgurl)}
                alt={product.productname || "Product Image"}
                className="img-fluid w-100 product-image d-block"
                onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/300")}
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
                    maxWidth: "200px",
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
                      maxWidth: "200px",
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

      <div
        className="modal fade modal-fullscreen-fallback"
        id={modalId}
        tabIndex="-1"
        aria-hidden="true"
      >
        <div className="modal-dialog modal-xl modal-dialog-centered modal-fullscreen-sm-down">
          <div className="modal-content rounded-0">
            <div className="modal-body">
              <div className="d-flex justify-content-between align-items-center p-4">
                <button className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
              </div>
              <div className="container p-4">
                <div className="row">
                  <div className="col-md-6 p-0">
                    <div className="d-flex flex-column align-items-center">
                      <img
                        src={formatImageUrl(selectedImage)}
                        alt={product.productname}
                        className="img-fluid mb-3 border modal-product-image object-fit-cover"
                      />
                      <div
                        id={`imageCarousel-${product.id}`}
                        className="carousel slide w-100 mt-4 mt-md-0"
                        data-bs-interval="false"
                      >
                        <div className="carousel-inner">
                          {groupedImages.map((group, index) => (
                            <div
                              key={index}
                              className={`carousel-item ${index === 0 ? "active" : ""}`}
                            >
                              <div className="d-flex justify-content-center gap-3">
                                {group.map((img, idx) => {
                                  const imagePath = img.imgurl;
                                  return (
                                    <img
                                      key={idx}
                                      src={formatImageUrl(imagePath)}
                                      alt={`Thumbnail ${idx + 1}`}
                                      className="img-thumbnail rounded-0"
                                      style={{
                                        width: "50px",
                                        height: "50px",
                                        objectFit: "cover",
                                        cursor: "pointer",
                                        border:
                                          imagePath === selectedImage
                                            ? "2px solid #0d6efd"
                                            : "1px solid #dee2e6",
                                      }}
                                      onClick={() => setSelectedImage(imagePath)}
                                    />
                                  );
                                })}
                              </div>
                            </div>
                          ))}
                        </div>
                        {groupedImages.length > 1 && (
                          <>
                            <button
                              className="carousel-control-prev bg-secondary text-dark rounded-circle"
                              type="button"
                              data-bs-target={`#imageCarousel-${product.id}`}
                              data-bs-slide="prev"
                            >
                              <span
                                className="carousel-control-prev-icon"
                                aria-hidden="true"
                              ></span>
                              <span className="visually-hidden">Previous</span>
                            </button>
                            <button
                              className="carousel-control-next bg-secondary text-dark rounded-circle"
                              type="button"
                              data-bs-target={`#imageCarousel-${product.id}`}
                              data-bs-slide="next"
                            >
                              <span
                                className="carousel-control-next-icon"
                                aria-hidden="true"
                              ></span>
                              <span className="visually-hidden">Next</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="col-md-6 text-start mt-5 mt-md-0">
                    <h1 className="fw-bold heading">{product.productname}</h1>
                    <p className="text-muted">{product.specification}</p>
                    
                    <div className="d-flex align-items-center justify-content-start gap-2 mb-2">
                      {renderStarRating()}
                      <span className="text-muted small">
                        {loadingReviews ? (
                          "Loading reviews..."
                        ) : reviewSummary ? (
                          `${reviewSummary.total_ratings} ${reviewSummary.total_ratings === 1 ? 'Review' : 'Reviews'}`
                        ) : (
                          "0 Reviews"
                        )}
                      </span>
                    </div>
                    
                    <p>
                      <i className="bi bi-eye-fill"></i> In Stock
                    </p>
                    <div className="d-flex align-items-center mb-3">
                      <p className="m-0">
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
                    </div>

                    <p className="text-muted">{product.pro_description}</p>

                    <div className="d-flex flex-column align-items-start justify-content-start mt-3 gap-2">
                      <p className="text-dark m-0">Quantity</p>
                      <div className="d-flex align-items-center bg-light p-2 gap-2">
                        <button
                          className="btn btn-sm bg-light border-0"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        >
                          <i className="bi bi-dash text-black fs-5"></i>
                        </button>
                        <span className="mx-2">{quantity}</span>
                        <button
                          className="btn btn-sm bg-light border-0"
                          onClick={() => setQuantity(quantity + 1)}
                        >
                          <i className="bi bi-plus text-black fs-5"></i>
                        </button>
                      </div>
                    </div>

                    <div className="d-flex gap-2">
                      <GlobalButton onClick={handleAddToCart} className="mt-3 flex-grow-1">
                        Add To Cart
                      </GlobalButton>

                      <button
                        className={`btn rounded-0 border mt-3 ${
                          isCompared ? "btn-primary text-white" : "btn-light"
                        }`}
                        data-bs-toggle="modal"
                        data-bs-target="#compareModal"
                        onClick={handleOpenCompare}
                        title={isCompared ? "In compare" : "Add to compare"}
                      >
                        <i className={`bi bi-repeat ${isCompared ? "text-white" : ""}`}></i>
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