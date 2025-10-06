import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import GlobalButton from "../Components/Button";

const MIN_COMMENT_LEN = 10;
const MAX_IMAGES = 5;
const MAX_IMAGE_MB = 5;
const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
];

const API_BASE_URL = "https://shop.adroitalarm.com.au/api";

// helpers
const toNumeric = (v) => {
  if (v === null || v === undefined) return null;
  if (!isNaN(Number(v))) return Number(v);
  const m = String(v).match(/\d+/g);
  return m ? Number(m.join("")) : null;
};

const clamp = (num, min, max) => Math.max(min, Math.min(max, num));

const ReviewTab = ({ user, orders, fetchUserOrders, getItemImageUrl }) => {
  const [reviewItems, setReviewItems] = useState([]);
  const [reviewsError, setReviewsError] = useState(null);
  const [selectedOrderForReview, setSelectedOrderForReview] = useState("all");
  const [expandedReviewId, setExpandedReviewId] = useState(null);
  const [reviewFormData, setReviewFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Get auth token from user or localStorage
  const getAuthToken = () => {
    return user?.token || localStorage.getItem("auth_token") || "";
  };

  // -------- Real API Integration --------
  const fetchReviewables = async () => {
    try {
      setIsLoading(true);
      setReviewsError(null);

      const token = getAuthToken();
      if (!token) {
        throw new Error("Authentication token not found");
      }

      const response = await fetch(`${API_BASE_URL}/user/products/to-review`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || "Failed to fetch reviewable products");
      }

      // Transform API response to match our component structure
      const transformedItems = data.products_to_review.map(
        (product, index) => ({
          id: `${product.order_id}-${product.product_id}-${index}`,
          order_id: product.order_id,
          product_id: product.product_id,
          order_code: product.order_id,
          product_code: product.product_id,
          title: product.product_name,
          product_name: product.product_name,
          order_date: product.order_date,
          order_status: product.order_status,
          can_review: product.can_review,
          review_eligibility_reason: product.review_eligibility_reason,
          product_image: product.product_image,
          image_url:
            product.product_image ||
            `https://via.placeholder.com/100x100?text=${encodeURIComponent(
              product.product_name
            )}`,
        })
      );
      setReviewItems(transformedItems);
        // console.log(transformedItems)

      return {
        items: transformedItems,
        summary: data.summary,
      };
    } catch (error) {
      setReviewsError(`Failed to load reviewable products: ${error.message}`);
      setReviewItems([]);

      // Show error to user
      Swal.fire({
        title: "Error",
        text: error.message,
        icon: "error",
        confirmButtonText: "OK",
      });

      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch reviews when component mounts
  useEffect(() => {
    if (!user) {
      return;
    }

    fetchReviewables();
  }, [user]);

  // ---------- Form state handlers ----------
  const handleLeaveReview = (item) => {
    if (expandedReviewId === item.id) {
      setExpandedReviewId(null);
    } else {
      setExpandedReviewId(item.id);
      setReviewFormData((prev) => ({
        ...prev,
        [item.id]: {
          rating: 0,
          comment: "",
          images: [],
          product_id: item.product_id,
          order_id: item.order_id,
          product_name: item.title || item.product_name,
          _debug: {
            original_product_id: item.product_id,
            original_order_id: item.order_id,
            product_code: item.product_code,
            order_code: item.order_code,
          },
        },
      }));
    }
  };

  const handleCommentChange = (itemId, comment) => {
    setReviewFormData((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], comment },
    }));
  };

  const handleImageChange = (itemId, event) => {
    const files = Array.from(event.target.files || []);
    const errors = [];

    if (files.length > MAX_IMAGES) {
      errors.push(`You can upload up to ${MAX_IMAGES} images.`);
    }

    const validFiles = files.slice(0, MAX_IMAGES).filter((f) => {
      if (!ALLOWED_IMAGE_TYPES.includes(f.type)) {
        errors.push(`${f.name}: Unsupported type (${f.type || "unknown"}).`);
        return false;
      }
      if (f.size > MAX_IMAGE_MB * 1024 * 1024) {
        errors.push(`${f.name}: Exceeds ${MAX_IMAGE_MB} MB limit.`);
        return false;
      }
      return true;
    });

    if (errors.length) {
      Swal.fire("Image validation", errors.join("\n"), "warning");
    }

    setReviewFormData((prev) => ({
      ...prev,
      [itemId]: { ...prev[itemId], images: validFiles },
    }));
  };

  // Rating handlers
  const setItemRating = (itemId, value) => {
    setReviewFormData((prev) => ({
      ...prev,
      [itemId]: { ...(prev[itemId] || {}), rating: value },
    }));
  };

  const handleStarClick = (e, itemId, starIndex) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const half = rect.width / 2;
    const newValue = clickX <= half ? starIndex - 0.5 : starIndex;
    setItemRating(itemId, newValue);
  };

  const handleStarContextMenu = (e, itemId, starIndex) => {
    e.preventDefault();
    setItemRating(itemId, starIndex - 0.5);
  };

  // ---------- Validation ----------
  const validateReviewData = (fd) => {
    const errors = [];

    const productId = fd.product_id;
    const orderId = fd.order_id;

    if (!productId || typeof productId !== "string") {
      errors.push("Invalid product reference.");
    }
    if (!orderId || typeof orderId !== "string") {
      errors.push("Invalid order reference.");
    }

    const ratingValue = Number(fd.rating || 0);
    const normalizedRating = clamp(ratingValue, 0.5, 5);

    if (!normalizedRating || normalizedRating < 0.5 || normalizedRating > 5) {
      errors.push("Rating must be between 0.5 and 5 stars.");
    }

    const commentLength = fd.comment?.trim().length || 0;

    if (!fd.comment || commentLength < MIN_COMMENT_LEN) {
      errors.push(
        `Comment must be at least ${MIN_COMMENT_LEN} characters (currently ${commentLength}).`
      );
    }

    if (Array.isArray(fd.images) && fd.images.length > MAX_IMAGES) {
      errors.push(`You can upload up to ${MAX_IMAGES} images.`);
    }

    return {
      errors,
      normalizedRating,
      productId,
      orderId,
      isValid: errors.length === 0,
    };
  };

  // ---------- Submit Review (Real API) ----------
  const handleSubmitReview = async (item) => {
    const fd = reviewFormData[item.id];
    if (!fd) {
      Swal.fire("Error", "Review data not found. Please try again.", "error");
      return;
    }

    const { errors, normalizedRating, productId, orderId, isValid } =
      validateReviewData(fd);
    if (!isValid) {
      Swal.fire("Error", errors.join("\n"), "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error("Authentication token not found");
      }

      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append("product_id", productId);
      formData.append("order_id", orderId);
      formData.append("rating", normalizedRating.toString());
      formData.append("comment", fd.comment.trim());

      // Add images if any
      if (fd.images && fd.images.length > 0) {
        fd.images.forEach((image, index) => {
          formData.append("images[]", image);
        });
      }

      const response = await fetch(`${API_BASE_URL}/reviews/submit`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type for FormData - browser will set it with boundary
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${errorText}`
        );
      }

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || "Failed to submit review");
      }

      Swal.fire({
        title: "Success!",
        text: result.message || "Review submitted successfully",
        icon: "success",
        timer: 3000,
        showConfirmButton: false,
      });

      setReviewItems((prev) => prev.filter((ri) => ri.id !== item.id));
      setExpandedReviewId(null);

      setReviewFormData((prev) => {
        const nd = { ...prev };
        delete nd[item.id];
        return nd;
      });
    } catch (error) {
      // console.error("Error in review submission:", error);

      Swal.fire({
        title: "Submission Error",
        text: error.message || "Failed to submit review. Please try again.",
        icon: "error",
        confirmButtonText: "OK",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const productsToReview = Array.isArray(reviewItems) ? reviewItems : [];
  const filteredReviewItems =
    selectedOrderForReview === "all"
      ? productsToReview
      : productsToReview.filter(
          (x) => String(x.order_id) === String(selectedOrderForReview)
        );

  return (
    <div className="table-container">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h4 className="fw-bold heading mb-0">
          Ready for review{" "}
          <span className="text-muted small">({productsToReview.length})</span>
        </h4>

        {/* Refresh Button */}
        <button
          className="btn btn-outline-primary btn-sm"
          onClick={fetchReviewables}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <span className="spinner-border spinner-border-sm me-2" />
              Loading...
            </>
          ) : (
            <>
              <i className="bi bi-arrow-clockwise me-2" />
              Refresh
            </>
          )}
        </button>
      </div>

      {reviewsError ? (
        <div className="alert alert-danger">
          <strong>Error:</strong> {reviewsError}
          <div className="mt-2">
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={fetchReviewables}
            >
              Retry
            </button>
          </div>
        </div>
      ) : isLoading ? (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <div className="mt-2">Loading products ready for review...</div>
        </div>
      ) : productsToReview.length === 0 ? (
        <div className="alert alert-info">
          <i className="bi bi-info-circle me-2"></i>
          No products ready for review. Products will appear here after they are
          delivered.
        </div>
      ) : (
        <div className="list-group rounded-0">
          {filteredReviewItems.map((item, index) => {
            const imageUrl =
              item.image_url ||
              (getItemImageUrl ? getItemImageUrl(item) : null);
            const isExpanded = expandedReviewId === item.id;
            const currentForm = reviewFormData[item.id] || {};
            const rating = Number(currentForm.rating || 0);

            return (
              <div
                key={item.id}
                className={`list-group-item border-0 border-bottom py-3 ${
                  isExpanded ? "expanded bg-light" : ""
                }`}
              >
                {/* Main Item Info */}
                <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between">
                  <div className="d-flex align-items-center gap-3 w-100 mb-2 mb-md-0">
                    <div
                      className="border flex-shrink-0 bg-light"
                      style={{
                        width: 100,
                        height: 100,
                        overflow: "hidden",
                        background: "#f8f9fa",
                      }}
                    >
                      {imageUrl ? (
                        <img
                          src={imageUrl}
                          alt={item.title || item.product_name || "Product"}
                          className="img-fluid"
                          style={{
                            objectFit: "cover",
                            width: "100%",
                            height: "100%",
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = "none";
                            const placeholder =
                              e.currentTarget.parentElement.querySelector(
                                ".image-placeholder"
                              );
                            if (placeholder) placeholder.style.display = "flex";
                          }}
                          onLoad={(e) => {
                            const placeholder =
                              e.currentTarget.parentElement.querySelector(
                                ".image-placeholder"
                              );
                            if (placeholder) placeholder.style.display = "none";
                          }}
                        />
                      ) : null}

                      <div
                        className="image-placeholder w-100 h-100 d-flex align-items-center justify-content-center text-muted"
                        style={{
                          display: imageUrl ? "none" : "flex",
                          background: "#f8f9fa",
                        }}
                      >
                        <i className="bi bi-image fs-2"></i>
                      </div>
                    </div>

                    <div className="flex-grow-1">
                      <div className="fw-bold mb-1">
                        {item.title || item.product_name || "Product"}
                      </div>
                      <div className="text-muted small mb-1">
                        Order: #{item.order_code || item.order_id} | Ordered:{" "}
                        {item.order_date
                          ? new Date(item.order_date).toLocaleDateString()
                          : "N/A"}
                      </div>
                      <div className="text-muted small">
                        Status: {item.order_status || "N/A"} | Product ID:{" "}
                        {item.product_id}
                      </div>
                      {item.review_eligibility_reason && (
                        <div className="text-info small mt-1">
                          <i className="bi bi-info-circle me-1"></i>
                          {item.review_eligibility_reason}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Review Button */}
                  <div className="w-100 w-md-auto mt-2 mt-md-0">
                    <GlobalButton
                      onClick={() => handleLeaveReview(item)}
                      className="w-100 w-md-auto"
                      disabled={isSubmitting || !item.can_review}
                    >
                      {isExpanded ? "Cancel" : "Leave a review"}
                    </GlobalButton>
                  </div>
                </div>

                {/* Expanded Review Form */}
                {isExpanded && (
                  <div className="mt-4 p-3 border bg-white">
                    <h6 className="mb-3">
                      <i className="bi bi-pencil-square me-2"></i>
                      Write Your Review for{" "}
                      <strong>{item.title || item.product_name}</strong>
                    </h6>

                    {/* Rating */}
                    <div className="mb-3">
                      <label className="form-label fw-bold">Rating *</label>
                      <div className="d-flex gap-2 align-items-center">
                        <div className="d-flex gap-1">
                          {[1, 2, 3, 4, 5].map((star) => {
                            let icon = "bi-star";
                            if (rating >= star) icon = "bi-star-fill";
                            else if (rating >= star - 0.5)
                              icon = "bi-star-half";

                            return (
                              <i
                                key={star}
                                className={`fs-2 bi ${icon} text-warning`}
                                style={{ cursor: "pointer" }}
                                onClick={(e) =>
                                  handleStarClick(e, item.id, star)
                                }
                                onContextMenu={(e) =>
                                  handleStarContextMenu(e, item.id, star)
                                }
                                aria-label={`Rate ${star} star${
                                  star > 1 ? "s" : ""
                                }`}
                                role="button"
                                tabIndex={0}
                              ></i>
                            );
                          })}
                        </div>
                        <span className="ms-2 text-muted">
                          {rating > 0 ? `${rating} stars` : "Not rated"}
                        </span>
                      </div>
                    </div>

                    {/* Comment */}
                    <div className="mb-3">
                      <label
                        htmlFor={`comment-${item.id}`}
                        className="form-label fw-bold"
                      >
                        Review Comment *
                      </label>
                      <textarea
                        id={`comment-${item.id}`}
                        className="form-control"
                        rows="4"
                        placeholder={`Share your experience with this product... (at least ${MIN_COMMENT_LEN} characters)`}
                        value={currentForm.comment || ""}
                        onChange={(e) =>
                          handleCommentChange(item.id, e.target.value)
                        }
                        required
                      />
                    </div>

                    {/* Images */}
                    <div className="mb-3">
                      <label
                        htmlFor={`images-${item.id}`}
                        className="form-label fw-bold"
                      >
                        Upload Images (Optional)
                      </label>
                      <input
                        type="file"
                        id={`images-${item.id}`}
                        className="form-control"
                        multiple
                        accept={ALLOWED_IMAGE_TYPES.join(",")}
                        onChange={(e) => handleImageChange(item.id, e)}
                        disabled={isSubmitting}
                      />
                      <div className="form-text">
                        Up to {MAX_IMAGES} images. Types: JPG/PNG/GIF/WebP. Max{" "}
                        {MAX_IMAGE_MB}MB each.
                      </div>
                      {currentForm.images?.length > 0 && (
                        <div className="mt-2">
                          <small className="fw-bold">
                            Selected files ({currentForm.images.length}):
                          </small>
                          <ul className="small mt-1 list-unstyled">
                            {currentForm.images.map((file, idx) => (
                              <li key={idx} className="text-success">
                                <i className="bi bi-check-circle me-1"></i>
                                {file.name} (
                                {(file.size / 1024 / 1024).toFixed(2)} MB)
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Submit Buttons */}
                    <div className="d-flex gap-2">
                      <GlobalButton
                        onClick={() => handleSubmitReview(item)}
                        disabled={isSubmitting}
                        className="flex-grow-1"
                      >
                        {isSubmitting ? (
                          <>
                            <span
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                              aria-hidden="true"
                            ></span>
                            Submitting Review...
                          </>
                        ) : (
                          <>
                            <i className="bi bi-send-check me-2"></i>
                            Submit Review
                          </>
                        )}
                      </GlobalButton>
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setExpandedReviewId(null)}
                        disabled={isSubmitting}
                      >
                        <i className="bi bi-x-circle me-2"></i>
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ReviewTab;