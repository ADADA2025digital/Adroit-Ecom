import React, { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import PageHeader from "../Components/PageHeader";
import { fetchProducts } from "../Constants/Data";
import Details from "../Components/Details";
import { useCart } from "../Components/CartContext";
import { useCompare } from "../Components/CompareContext";
import CompareModal from "../Components/CompareModal";
import ProductCard from "../Components/ProductCard";
import axios from "axios";

const ProductDetails = () => {
  const { slugWithId } = useParams();
  const id = slugWithId.split("-").pop();
  const navigate = useNavigate();

  const carouselRef = useRef(null);
  const relatedRef = useRef(null);

  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [quantity, setQuantity] = useState(1);
  const [size, setSize] = useState("M");
  const { addToCart, isLoading: cartLoading } = useCart();
  const { add: addToCompare } = useCompare();
  const [selectedImage, setSelectedImage] = useState("default.jpg");
  const [addingToCart, setAddingToCart] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [reviewSummary, setReviewSummary] = useState(null);
  const [showRatingTooltip, setShowRatingTooltip] = useState(false);

  // Load initial data from cache instantly
  useEffect(() => {
    const loadInitialData = () => {
      // Load cached products
      const cachedProducts = JSON.parse(localStorage.getItem("cached_products") || "[]");
      const cachedProductDetails = JSON.parse(localStorage.getItem(`cached_product_${id}`) || "null");
      
      // Try to find product from cached data
      let foundProduct = cachedProductDetails;
      if (!foundProduct) {
        foundProduct = cachedProducts.find((p) => String(p.id) === String(id));
      }
      
      if (foundProduct) {
        setProduct(foundProduct);
        
        // Set related products from cache
        if (foundProduct && foundProduct.category) {
          const related = cachedProducts.filter(
            (p) =>
              p.category &&
              p.category.id === foundProduct.category.id &&
              p.id !== foundProduct.id
          );
          setRelatedProducts(related.slice(0, 8));
        }
        
        // Set initial image
        if (foundProduct.images?.length > 0) {
          setSelectedImage(foundProduct.images[0].imgurl);
        }
      }
    };

    loadInitialData();
    
    // Fetch fresh data in background
    loadProduct();
  }, [id]);

  // Fetch product data and related products in background
  const loadProduct = async () => {
    try {
      const products = await fetchProducts();
      const found = products.find((p) => String(p.id) === String(id));
      
      if (found) {
        setProduct(found);
        // Cache individual product
        localStorage.setItem(`cached_product_${id}`, JSON.stringify(found));

        if (found && found.category) {
          const related = products.filter(
            (p) =>
              p.category &&
              p.category.id === found.category.id &&
              p.id !== found.id
          );
          setRelatedProducts(related.slice(0, 8));
        }
        
        // Set initial image
        if (found.images?.length > 0) {
          setSelectedImage(found.images[0].imgurl);
        }
      }
    } catch (err) {
      // Keep cached data on error
    }
  };

  // Fetch review summary from API in background
  useEffect(() => {
    const fetchReviewSummary = async () => {
      if (!product?.id) return;
      
      try {
        // Use product_id if available, otherwise format the id
        const productId = product.product_id || `PRO${String(product.id).padStart(3, '0')}`;
        
        // Check cache first
        const cachedReview = localStorage.getItem(`cached_review_${productId}`);
        if (cachedReview) {
          setReviewSummary(JSON.parse(cachedReview));
        }
        
        const response = await fetch(`https://shop.adroitalarm.com.au/api/products/${productId}/review-summary`);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.success) {
          setReviewSummary(data.summary);
          // Cache review data
          localStorage.setItem(`cached_review_${productId}`, JSON.stringify(data.summary));
        } else {
          setReviewSummary(null);
        }
      } catch (error) {
        // Keep cached review data on error
      }
    };

    if (product) {
      fetchReviewSummary();
    }
  }, [product]);

  // Intersection Observer for sticky bar
  useEffect(() => {
    if (!relatedRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => setShowStickyBar(entry.isIntersecting),
      { root: null, threshold: 0.1 }
    );

    observer.observe(relatedRef.current);
    return () => observer.disconnect();
  }, []);

  // Helper function to render star rating
  const renderStarRating = (averageRating) => {
    if (!averageRating || averageRating === 0) {
      return (
        <>
          <i className="bi bi-star text-warning" title="0 stars"></i>
          <i className="bi bi-star text-warning" title="0 stars"></i>
          <i className="bi bi-star text-warning" title="0 stars"></i>
          <i className="bi bi-star text-warning" title="0 stars"></i>
          <i className="bi bi-star text-warning" title="0 stars"></i>
        </>
      );
    }

    const stars = [];
    const fullStars = Math.floor(averageRating);
    const hasHalfStar = averageRating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <i key={i} className="bi bi-star-fill text-warning" title={`${averageRating} average rating`}></i>
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <i key={i} className="bi bi-star-half text-warning" title={`${averageRating} average rating`}></i>
        );
      } else {
        stars.push(
          <i key={i} className="bi bi-star text-warning" title={`${averageRating} average rating`}></i>
        );
      }
    }
    return stars;
  };

  // Scroll to reviews section
  const scrollToReviews = () => {
    const reviewsSection = document.querySelector('.reviews-section');
    if (reviewsSection) {
      reviewsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;

    setAddingToCart(true);
    try {
      await addToCart(product.id, quantity, size);
    } catch (error) {
      // console.error("Failed to add to cart:", error);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    if (!product) return;

    setAddingToCart(true);
    try {
      // Resolve backend product_id via API using slug
      let backendProductId = product.product_id || null;
      try {
        const slug = (slugWithId || "").slice(
          0,
          (slugWithId || "").lastIndexOf("-")
        );
        if (slug) {
          const res = await axios.get(`/api/products/${slug}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
          const p = res.data?.product || res.data?.data || res.data;
          backendProductId = p?.product_id || backendProductId;
        }
      } catch (_) {}

      const buyNowItem = {
        product_id: product.product_id || product.id,
        backend_product_id: backendProductId,
        productname: product.productname,
        pro_price: product.pro_price,
        pro_quantity: quantity,
        size,
        images: Array.isArray(product.images) ? product.images : [],
      };

      localStorage.setItem("buy_now_item", JSON.stringify(buyNowItem));

      navigate("/checkout", { state: { buyNow: true } });
    } catch (error) {
      // console.error("Buy Now failed:", error);
      alert("Failed to process Buy Now. Please try again.");
    } finally {
      setAddingToCart(false);
    }
  };

  const handleAddToCompare = () => {
    if (!product) return;
    addToCompare(product);

    const compareModal = new window.bootstrap.Modal(
      document.getElementById("compareModal")
    );
    compareModal.show();
  };

  const getImagePath = (path) => {
    if (!path) return null;
    if (path.startsWith("http://") || path.startsWith("https://")) return path;
    return `${axios.defaults.baseURL}/${path.replace(/^\/+/, "")}`;
  };

  const nextSlide = () => {
    if (carouselRef.current) {
      const itemsPerSlide = 4;
      const maxSlide = Math.ceil(relatedProducts.length / itemsPerSlide) - 1;
      setCurrentSlide((s) => (s < maxSlide ? s + 1 : 0));
    }
  };

  const prevSlide = () => {
    if (carouselRef.current) {
      const itemsPerSlide = 4;
      const maxSlide = Math.ceil(relatedProducts.length / itemsPerSlide) - 1;
      setCurrentSlide((s) => (s > 0 ? s - 1 : maxSlide));
    }
  };

  if (!product) {
    return (
      <div className="container-fluid p-0">
        <PageHeader title="Product Details" path="Home / Products" />
        <div className="container py-5">
          <div className="text-center py-5">
            <p className="text-muted">Product not found</p>
            <Link to="/shop" className="btn btn-primary">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const images = product.images || [];
  const groupedImages = [];
  for (let i = 0; i < images.length; i += 2) {
    groupedImages.push(images.slice(i, i + 2));
  }

  const itemsPerSlide = 4;
  const startIndex = currentSlide * itemsPerSlide;
  const visibleProducts = relatedProducts.slice(
    startIndex,
    startIndex + itemsPerSlide
  );

  return (
    <>
      <div className="container-fluid p-0">
        <PageHeader
          title={product.productname}
          path={`Home / Products / ${product.productname}`}
        />

        <div className="container py-5">
          <div className="row g-4">
            {/* Left: Images */}
            <div className="col-12 col-lg-6">
              {/* Large Image */}
              <div className="d-flex justify-content-center">
                <img
                  src={getImagePath(selectedImage)}
                  alt={product.productname}
                  className="img-fluid mb-3 modal-product-image object-fit-cover"
                  style={{ height: "350px" }}
                />
              </div>

              <div className="row my-4 d-flex justify-content-center">
                {/* Thumbnail Carousel */}
                <div
                  id="imageCarousel"
                  className="carousel slide w-100"
                  data-bs-interval="false"
                >
                  <div className="carousel-inner">
                    {groupedImages.map((group, index) => (
                      <div
                        key={index}
                        className={`carousel-item ${
                          index === 0 ? "active" : ""
                        }`}
                      >
                        <div className="d-flex justify-content-center gap-3 flex-wrap">
                          {group.map((img, idx) => {
                            const imagePath = img.imgurl;
                            return (
                              <img
                                key={idx}
                                src={getImagePath(imagePath)}
                                alt={`Thumbnail ${idx + 1}`}
                                className="img-thumbnail rounded-0"
                                style={{
                                  width: "100px",
                                  height: "100px",
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
                        data-bs-target="#imageCarousel"
                        data-bs-slide="prev"
                        style={{
                          width: "40px",
                          height: "40px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          left: "-20px",
                        }}
                      >
                        <span className="carousel-control-prev-icon" />
                        <span className="visually-hidden">Previous</span>
                      </button>
                      <button
                        className="carousel-control-next bg-secondary text-dark rounded-circle"
                        type="button"
                        data-bs-target="#imageCarousel"
                        data-bs-slide="next"
                        style={{
                          width: "40px",
                          height: "40px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          right: "-20px",
                        }}
                      >
                        <span className="carousel-control-next-icon" />
                        <span className="visually-hidden">Next</span>
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="reviews-section">
                <Details 
                  product={product} 
                  reviewSummary={reviewSummary}
                />
              </div>
            </div>

            {/* Right: Info */}
            <div className="col-12 col-lg-6 mt-4 mt-lg-0 px-4 px-md-0">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <div className="w-100">
                  <h2 className="py-2 heading">{product.productname}</h2>

                  {/* Enhanced Review Section with API Data */}
                  <div 
                    className="d-flex align-items-center mb-3 flex-wrap gap-2 position-relative"
                    onMouseEnter={() => setShowRatingTooltip(true)}
                    onMouseLeave={() => setShowRatingTooltip(false)}
                  >
                    {reviewSummary && reviewSummary.total_ratings > 0 ? (
                      <>
                        {/* Clickable Rating */}
                        <button 
                          className="d-flex align-items-center border-end pe-2 bg-transparent border-0"
                          onClick={scrollToReviews}
                          style={{ cursor: 'pointer' }}
                          title="Click to view all reviews"
                        >
                          {renderStarRating(reviewSummary.average_rating)}
                          <span className="ms-2 fw-bold text-dark">
                            {reviewSummary.average_rating?.toFixed(1) || '0.0'}
                          </span>
                        </button>
                        
                        {/* Reviews count */}
                        <button 
                          className="text-muted small bg-transparent border-0 p-0"
                          onClick={scrollToReviews}
                          style={{ cursor: 'pointer' }}
                          title="Click to view all reviews"
                        >
                          {reviewSummary.total_ratings} {reviewSummary.total_ratings === 1 ? 'Review' : 'Reviews'}
                        </button>
                      </>
                    ) : reviewSummary && reviewSummary.total_ratings === 0 ? (
                      <>
                        <div className="d-flex align-items-center border-end pe-2">
                          {renderStarRating(0)}
                          <span className="ms-2 fw-bold text-dark">0.0</span>
                        </div>
                        <span className="text-muted small">No reviews yet</span>
                        <button 
                          className="btn btn-outline-primary btn-sm ms-2"
                          onClick={scrollToReviews}
                        >
                          Be the first to review
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="d-flex align-items-center border-end pe-2">
                          {renderStarRating(0)}
                          <span className="ms-2 fw-bold text-dark">0.0</span>
                        </div>
                        <span className="text-muted small">0 Reviews</span>
                      </>
                    )}
                  </div>

                  <div className="d-flex gap-2 mt-3 align-items-center mb-3 flex-wrap">
                    <i className="bi bi-eye-fill blink-icon"></i>
                    <p className="text-muted m-0">
                      People are viewing this right now.
                    </p>
                  </div>

                  <p className="text-muted">
                    <i className="bi bi-fire text-danger fire-animation me-2"></i>{" "}
                    12 Sold so far
                  </p>

                  <div className="small text-muted">
                    Availability:{" "}
                    <span className="text-dark">
                      {product.stock > 5
                        ? "In stock"
                        : product.stock > 0
                        ? `Only ${product.stock} left!`
                        : "Out of stock"}
                    </span>
                  </div>

                  <p className="text-muted mt-2 mb-1">
                    Category:{" "}
                    <span className="text-dark">
                      {product.category?.categoryname || "N/A"}
                    </span>
                  </p>
                  <p className="text-muted mb-1">
                    Category Description:{" "}
                    <span className="text-dark">
                      {product.category?.cat_description ||
                        "No description available"}
                    </span>
                  </p>
                  <p className="text-muted mb-1">
                    Specification:{" "}
                    <span className="text-dark">
                      {product.specification || "N/A"}
                    </span>
                  </p>
                  <p className="text-muted my-3">{product.pro_description}</p>
                  <hr />
                </div>
              </div>

              <div className="mb-2">
                <span className="fw-bold fs-4 py-1 text-primary">
                  ${product.pro_price}
                </span>
                {product.original_price && (
                  <span className="text-muted text-decoration-line-through ms-2">
                    ${product.original_price}
                  </span>
                )}
              </div>

              {/* Quantity + Buttons */}
              <div className="my-3">
                <p className="text-muted">Quantity:</p>
                <div className="d-flex flex-column flex-md-row gap-3">
                  <div className="d-flex align-items-center bg-light border p-2 gap-2">
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
                  <button
                    className="button px-4 py-2 d-flex align-items-center justify-content-center text-white fw-semibold"
                    onClick={handleAddToCart}
                    disabled={addingToCart || cartLoading}
                  >
                    {addingToCart ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Adding...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-cart me-2"></i> Add To Cart
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleBuyNow}
                    className="button px-4 py-2 d-flex align-items-center justify-content-center text-white fw-semibold"
                    disabled={addingToCart || cartLoading}
                  >
                    {addingToCart ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Processing...
                      </>
                    ) : (
                      <>
                        <i className="bi bi-cash-coin me-2"></i> Buy Now
                      </>
                    )}
                  </button>
                  <button
                    className="btn btn-outline-secondary rounded-0"
                    onClick={handleAddToCompare}
                  >
                    <i className="bi bi-repeat px-1"></i>
                  </button>
                </div>
              </div>

              <div className="my-3 d-flex flex-column flex-md-row gap-4 flex-wrap">
                <span className="d-flex gap-2 justify-content-center justify-content-start">
                  <i className="bi bi-question-circle"></i> Ask a question
                </span>
                <span className="d-flex gap-2 justify-content-center justify-content-start">
                  <i className="bi bi-truck"></i> Shipping & return
                </span>
                <span className="d-flex gap-2 justify-content-center justify-content-start">
                  <i className="bi bi-share"></i> Share
                </span>
              </div>
              <hr />

              <div className="py-2">
                <h6 className="mb-2">Delivery Details</h6>
                <p className="mb-1">
                  Your order is likely to reach you within 7 days.
                </p>
              </div>

              <h6 className="mb-2">Guaranteed Safe Checkout</h6>
              <div className="d-flex justify-content-start">
                <img
                  src="https://themes.pixelstrap.com/multikart/assets/images/product-details/payments.png"
                  alt="Payment Methods"
                  className="img-fluid"
                  style={{ maxHeight: "50px" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* RELATED ITEMS */}
        <section className="products mb-3" ref={relatedRef}>
          <div className="container">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2 className="text-dark text-uppercase py-2 d-inline-block position-relative heading m-0">
                Related items
              </h2>

              {relatedProducts.length > 4 && (
                <div className="d-flex gap-2">
                  <button
                    className="btn btn-outline-primary rounded-circle p-2 d-flex align-items-center justify-content-center"
                    onClick={prevSlide}
                    style={{ width: "40px", height: "40px" }}
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                  <button
                    className="btn btn-outline-primary rounded-circle p-2 d-flex align-items-center justify-content-center"
                    onClick={nextSlide}
                    style={{ width: "40px", height: "40px" }}
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </div>
              )}
            </div>

            <div className="row py-3" ref={carouselRef}>
              {visibleProducts.length > 0 ? (
                visibleProducts.map((relatedProduct) => (
                  <div
                    key={relatedProduct.id}
                    className="col-lg-3 col-md-4 col-sm-6 mb-4"
                  >
                    <ProductCard product={relatedProduct} />
                  </div>
                ))
              ) : (
                <p className="text-center text-muted">
                  No related products found.
                </p>
              )}
            </div>
          </div>
        </section>

        {/* STICKY BOTTOM BAR */}
        <section
          className={`bg-white py-3 sticky-checkout-bar ${
            showStickyBar ? "show" : ""
          }`}
          aria-hidden={!showStickyBar}
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
            boxShadow: "0 -2px 10px rgba(0,0,0,0.1)",
            transform: showStickyBar ? "translateY(0%)" : "translateY(100%)",
            transition: "transform 0.3s ease-in-out",
          }}
        >
          <div className="container">
            <div className="d-flex align-items-center justify-content-between gap-3 flex-wrap">
              {/* Product image + spec */}
              <div className="d-none d-md-flex align-items-center gap-2">
                <div className="border">
                  <img
                    src={getImagePath(selectedImage)}
                    alt={product.productname}
                    className="img-fluid"
                    style={{
                      height: "48px",
                      width: "48px",
                      objectFit: "cover",
                    }}
                  />
                </div>
                <p className="mb-0 heading">{product.productname}</p>
              </div>

              {/* Compare + Quantity + Add to cart */}
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <button
                  className="btn btn-outline-secondary rounded-0"
                    onClick={handleAddToCompare}
                  aria-label="Add to compare"
                >
                  <i className="bi bi-repeat px-1"></i>
                </button>

                <div className="d-flex align-items-center bg-light border gap-2 px-2">
                  <button
                    className="btn btn-sm bg-light border-0"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  >
                    <i className="bi bi-dash text-black fs-5"></i>
                  </button>
                  <span>{quantity}</span>
                  <button
                    className="btn btn-sm bg-light border-0"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <i className="bi bi-plus text-black fs-5"></i>
                  </button>
                </div>

                <button
                  className="button px-3 py-2 d-flex align-items-center justify-content-center text-white fw-semibold"
                  onClick={handleAddToCart}
                  disabled={addingToCart || cartLoading}
                >
                  {addingToCart ? (
                    <>
                      <span
                        className="spinner-border spinner-border-sm me-2"
                        role="status"
                      ></span>
                      Adding...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-cart me-2"></i> Add To Cart
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Compare Modal element should exist in DOM */}
      <CompareModal />
    </>
  );
};

export default ProductDetails;