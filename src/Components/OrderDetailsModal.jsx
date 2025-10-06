import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

const OrderDetailsModal = ({
  showOrderModal,
  setShowOrderModal,
  selectedOrder,
  user,
  getItemImageUrl,
  fetchUserOrders,
  fetchCancellations,
  redirectToPaymentBySummary,
}) => {
  const navigate = useNavigate();
  const [expandedReview, setExpandedReview] = useState(null);
  const [reviewData, setReviewData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reviewedItems, setReviewedItems] = useState(new Set());
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  if (!selectedOrder || !selectedOrder.fullData) return null;

  const order = selectedOrder.fullData;
  const isShipped = (order.orderstatus ?? "").toLowerCase() === "shipped";
  const isPaid = order.payment_status === "paid";

  const cancellationReasons = [
    "Changed my mind",
    "Found a better price",
    "Shipping takes too long",
    "Ordered by mistake",
    "Other",
  ];

  // Add missing redirect function if not provided as prop
  const handleRedirectToPayment = (orderId) => {
    if (redirectToPaymentBySummary) {
      redirectToPaymentBySummary(orderId);
    } else {
      // console.warn("redirectToPaymentBySummary function not provided");
      // Fallback: navigate to payments page
      navigate("/payment", { state: { orderId } });
    }
  };

  const calculateItemsTotal = () => {
    if (!order.items || order.items.length === 0) return 0;
    return order.items.reduce((total, item) => {
      const price =
        parseFloat(item.ord_price ?? item.unit_price ?? item.price ?? "0") || 0;
      const quantity =
        parseInt(item.ord_quantity ?? item.quantity ?? "1", 10) || 1;
      return total + price * quantity;
    }, 0);
  };

  const itemsTotal = calculateItemsTotal();
  const displayTotal =
    itemsTotal > 0 ? itemsTotal : parseFloat(order.total_price || "0") || 0;

  const fmtMoney = (v) => (isNaN(v) ? "$0.00" : `$${Number(v).toFixed(2)}`);

  const statusBadge = (
    <span
      className={`badge rounded-0 ms-2 ${
        (order.orderstatus ?? "").toLowerCase() === "delivered"
          ? "bg-success"
          : (order.orderstatus ?? "").toLowerCase() === "processing"
          ? "bg-warning text-dark"
          : (order.orderstatus ?? "").toLowerCase() === "shipped"
          ? "bg-info text-dark"
          : "bg-secondary"
      }`}
    >
      {(order.orderstatus ?? "N/A").charAt(0).toUpperCase() +
        (order.orderstatus ?? "N/A").slice(1)}
    </span>
  );

  const paidBadge = (
    <span
      className={`badge rounded-0 ms-2 ${isPaid ? "bg-success" : "bg-danger"}`}
    >
      {isPaid ? "Paid" : "Unpaid"}
    </span>
  );

  const toggleReviewSection = (itemIndex) => {
    if (expandedReview === itemIndex) {
      setExpandedReview(null);
    } else {
      setExpandedReview(itemIndex);
      if (!reviewData[itemIndex]) {
        setReviewData((prev) => ({
          ...prev,
          [itemIndex]: {
            rating: 5,
            comment: "",
            images: [],
          },
        }));
      }
    }
  };

  const handleReviewChange = (itemIndex, field, value) => {
    setReviewData((prev) => ({
      ...prev,
      [itemIndex]: {
        ...prev[itemIndex],
        [field]: value,
      },
    }));
  };

  const handleStarClick = (e, itemIndex, star) => {
    e.preventDefault();
    const currentRating = reviewData[itemIndex]?.rating || 0;
    const newRating = currentRating === star - 0.5 ? star - 1 : star - 0.5;
    handleReviewChange(itemIndex, "rating", Math.max(0.5, newRating));
  };

  const handleStarContextMenu = (e, itemIndex, star) => {
    e.preventDefault();
    handleReviewChange(itemIndex, "rating", star);
  };

  const handleImageUpload = (itemIndex, event) => {
    const files = Array.from(event.target.files);

    const validFiles = files.filter((file) => {
      const maxSize = 5 * 1024 * 1024;
      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/gif",
        "image/webp",
      ];

      if (file.size > maxSize) {
        Swal.fire({
          title: "File Too Large",
          text: `${file.name} is too large. Maximum size is 5MB.`,
          icon: "error",
          confirmButtonColor: "#0d6efd",
        });
        return false;
      }

      if (!allowedTypes.includes(file.type)) {
        Swal.fire({
          title: "Invalid File Type",
          text: `${file.name} must be JPEG, PNG, GIF, or WebP.`,
          icon: "error",
          confirmButtonColor: "#0d6efd",
        });
        return false;
      }

      return true;
    });

    if (validFiles.length > 0) {
      setReviewData((prev) => ({
        ...prev,
        [itemIndex]: {
          ...prev[itemIndex],
          images: [...(prev[itemIndex]?.images || []), ...validFiles],
        },
      }));
    }
  };

  const removeImage = (itemIndex, imageIndex) => {
    setReviewData((prev) => ({
      ...prev,
      [itemIndex]: {
        ...prev[itemIndex],
        images: prev[itemIndex].images.filter((_, idx) => idx !== imageIndex),
      },
    }));
  };

  const validateReviewData = (item, itemIndex) => {
    const data = reviewData[itemIndex];
    if (!data) throw new Error("Review data not found");

    if (!data.comment?.trim()) throw new Error("Comment is required");
    if (data.comment.length < 5)
      throw new Error("Comment must be at least 5 characters");
    if (data.comment.length > 1000)
      throw new Error("Comment must be less than 1000 characters");

    if (!data.rating || data.rating < 0.5 || data.rating > 5) {
      throw new Error("Rating must be between 0.5 and 5 stars");
    }

    const productId = item.product_id || item.id;
    if (!productId) throw new Error("Product ID is missing");

    if (!order.order_id) throw new Error("Order ID is missing");

    return true;
  };

  const getErrorMessage = (error) => {
    const message = error.message || "An unexpected error occurred.";

    if (message.includes("500") || message.includes("Server error")) {
      return "Our servers are experiencing issues. Please try again in a few minutes.";
    }
    if (
      message.includes("Network Error") ||
      message.includes("Failed to fetch")
    ) {
      return "Network connection failed. Please check your internet connection.";
    }
    if (message.includes("Timeout")) {
      return "Request timed out. Please try again.";
    }
    if (message.includes("Validation error") || message.includes("422")) {
      return "Please check your input and try again.";
    }
    if (message.includes("Authentication") || message.includes("401")) {
      return "Your session has expired. Please log in again.";
    }

    return message;
  };

  const submitReview = async (item, itemIndex) => {
    if (!reviewData[itemIndex]?.comment.trim()) {
      Swal.fire({
        title: "Error",
        text: "Please enter a comment for your review",
        icon: "error",
        confirmButtonColor: "#0d6efd",
      });
      return;
    }

    setIsSubmitting(true);

    // Enhanced mock for development
    if (import.meta.env.DEV && import.meta.env.VITE_USE_MOCK_API === "true") {
      //  console.log("MOCK: Would submit review:", {
      //   product_id: item.product_id || item.id,
      //   rating: Math.round(reviewData[itemIndex].rating),
      //   comment: reviewData[itemIndex].comment,
      //   order_id: order.order_id,
      //   image_count: reviewData[itemIndex].images?.length || 0,
      // });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Simulate random success/failure for testing
      const shouldSucceed = Math.random() > 0.3;

      if (shouldSucceed) {
        Swal.fire({
          title: "Success! (Mock)",
          text: "Review submitted successfully!",
          icon: "success",
          confirmButtonColor: "#0d6efd",
        });

        setReviewedItems((prev) => new Set(prev).add(itemIndex));
        setExpandedReview(null);
        setReviewData((prev) => {
          const newData = { ...prev };
          delete newData[itemIndex];
          return newData;
        });
      } else {
        Swal.fire({
          title: "Error (Mock)",
          text: "Mock server error occurred",
          icon: "error",
          confirmButtonColor: "#0d6efd",
        });
      }

      setIsSubmitting(false);
      return;
    }

    try {
      validateReviewData(item, itemIndex);

      const formData = new FormData();
      const roundedRating = Math.round(reviewData[itemIndex].rating);
      const productId = item.product_id || item.id;
      const orderId = order.order_id;

      formData.append("product_id", productId.toString());
      formData.append("rating", roundedRating.toString());
      formData.append("comment", reviewData[itemIndex].comment.trim());
      formData.append("order_id", orderId.toString());

      if (
        reviewData[itemIndex].images &&
        reviewData[itemIndex].images.length > 0
      ) {
        reviewData[itemIndex].images.forEach((image, idx) => {
          if (image instanceof File) {
            formData.append("images[]", image);
          }
        });
      }

      const token = localStorage.getItem("auth_token");
      if (!token) {
        throw new Error("Authentication token not found. Please log in again.");
      }

      //  console.log("Submitting review with data:", {
      //   product_id: productId,
      //   rating: roundedRating,
      //   comment_length: reviewData[itemIndex].comment.length,
      //   order_id: orderId,
      //   image_count: reviewData[itemIndex].images?.length || 0,
      // });

      const API_URL = import.meta.env.VITE_API_URL;
      if (!API_URL) {
        throw new Error("Configuration error: API URL not found");
      }

      const baseUrl = API_URL.endsWith("/") ? API_URL : `${API_URL}/`;
      const fullUrl = `${baseUrl}api/reviews/submit`;

      // console.log("Making request to:", fullUrl);

      const response = await fetch(fullUrl, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      // Improved response handling
      let result;
      try {
        const responseText = await response.text();
        // console.log("Raw server response:", responseText);

        if (!responseText) {
          throw new Error("Empty response from server");
        }

        result = JSON.parse(responseText);
      } catch (parseError) {
        // console.error("Failed to parse server response:", parseError);
        throw new Error(
          `Server returned invalid response: ${response.status} ${response.statusText}`
        );
      }

      if (!response.ok) {
        //  console.error("Server error details:", {
        //   status: response.status,
        //   statusText: response.statusText,
        //   response: result,
        // });

        let errorMessage =
          result?.message || `HTTP error! status: ${response.status}`;

        // Handle specific status codes
        switch (response.status) {
          case 400:
            errorMessage =
              result?.message || "Bad request. Please check your input.";
            break;
          case 401:
            errorMessage = "Authentication failed. Please log in again.";
            break;
          case 403:
            errorMessage =
              result?.message ||
              "You don't have permission to perform this action.";
            break;
          case 404:
            errorMessage = result?.message || "Review endpoint not found.";
            break;
          case 422:
            const validationErrors = result.errors
              ? Object.values(result.errors).flat().join(", ")
              : result.message;
            errorMessage = `Validation error: ${validationErrors}`;
            break;
          case 500:
            errorMessage =
              result?.message || "Server error. Please try again later.";
            break;
          default:
            errorMessage =
              result?.message ||
              `Request failed with status ${response.status}`;
        }

        throw new Error(errorMessage);
      }

      if (result.success) {
        Swal.fire({
          title: "Success!",
          text: result.message || "Review submitted successfully!",
          icon: "success",
          confirmButtonColor: "#0d6efd",
        });

        setReviewedItems((prev) => new Set(prev).add(itemIndex));
        setExpandedReview(null);
        setReviewData((prev) => {
          const newData = { ...prev };
          delete newData[itemIndex];
          return newData;
        });

        // Refresh orders to show the review status
        if (fetchUserOrders) {
          fetchUserOrders();
        }
      } else {
        throw new Error(result.message || "Failed to submit review");
      }
    } catch (error) {
      // console.error("Review submission failed:", error);

      const userFriendlyMessage = getErrorMessage(error);

      if (
        error.message.includes("Authentication") ||
        error.message.includes("Unauthenticated") ||
        error.message.includes("token") ||
        error.message.includes("401")
      ) {
        localStorage.removeItem("auth_token");
        Swal.fire({
          title: "Session Expired",
          text: "Please log in again to submit your review.",
          icon: "warning",
          confirmButtonColor: "#0d6efd",
        }).then(() => {
          navigate("/login");
        });
      } else {
        Swal.fire({
          title: "Error",
          text: userFriendlyMessage,
          icon: "error",
          confirmButtonColor: "#0d6efd",
          willClose: () => {
            // Keep the review form open so user can fix errors
            setIsSubmitting(false);
          },
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBuyAgain = async () => {
    try {
      // console.log("Buy Again clicked for order:", selectedOrder);

      const firstItem = selectedOrder.fullData?.items?.[0];
      // console.log("First item:", firstItem);

      if (!firstItem) {
        Swal.fire({
          title: "Error",
          text: "No items found in this order",
          icon: "error",
          confirmButtonColor: "#0d6efd",
        });
        return;
      }

      const baseUrl = (import.meta?.env?.VITE_API_URL || "").replace(
        /\/+$/,
        ""
      );
      const toAbsoluteUrl = (url) => {
        if (!url) return "";
        const s = String(url);
        if (s.startsWith("http") || s.startsWith("//")) return s;
        return `${baseUrl}/${s.replace(/^\/+/, "")}`;
      };

      let imageUrl = getItemImageUrl(firstItem);
      imageUrl = toAbsoluteUrl(imageUrl);

      const name =
        firstItem?.name ||
        firstItem?.product_name ||
        firstItem?.product?.productname ||
        `Product from order ${selectedOrder?.id ?? ""}`;

      const priceRaw =
        firstItem?.ord_price ??
        firstItem?.unit_price ??
        firstItem?.price ??
        "0";
      const pro_price = Number(priceRaw) || 0;

      const qtyRaw = firstItem?.ord_quantity ?? firstItem?.quantity ?? "1";
      const pro_quantity = Math.max(1, parseInt(qtyRaw, 10) || 1);

      const buyNowItem = {
        product_id: firstItem?.product_id || firstItem?.id,
        backend_product_id: firstItem?.product_id || null,
        productname: name,
        pro_price,
        pro_quantity,
        size: firstItem?.size || firstItem?.variant?.size || "M",
        color: firstItem?.color || firstItem?.variant?.color || "",
        image: imageUrl,
        image_url: imageUrl,
        imgurl: imageUrl,
        images: imageUrl
          ? [{ imgurl: imageUrl, image_url: imageUrl, image: imageUrl }]
          : [],
        variant: firstItem?.variant || firstItem?.attributes || {},
        order_source: "buy_again",
        _originalItem: firstItem,
      };

      // console.log("BuyAgain -> Final payload:", buyNowItem);
      // console.log("BuyAgain -> Image URL:", imageUrl);

      localStorage.setItem("buy_now_item", JSON.stringify(buyNowItem));

      setShowOrderModal(false);
      navigate("/checkout", {
        state: { buyNow: true, fromOrder: selectedOrder?.id },
      });
    } catch (error) {
      // console.error("Buy Again failed:", error);
      Swal.fire({
        title: "Error",
        text: "Failed to process Buy Again. Please try again.",
        icon: "error",
        confirmButtonColor: "#0d6efd",
      });
    }
  };

  const handleCancelOrder = async () => {
    const reason = selectedReason === "Other" ? customReason : selectedReason;

    if (!reason.trim()) {
      Swal.fire({
        title: "Error",
        text: "Please provide a cancellation reason",
        icon: "error",
        confirmButtonColor: "#0d6efd",
      });
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}api/orders/cancel/request`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            order_id: selectedOrder.id,
            reason: reason,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        Swal.fire({
          title: "Success!",
          text: "Your cancellation request has been submitted.",
          icon: "success",
          confirmButtonColor: "#0d6efd",
        });

        setShowOrderModal(false);
        fetchUserOrders();
        fetchCancellations();
      } else {
        throw new Error(result.message || "Failed to cancel order");
      }
    } catch (error) {
      // console.error("Cancellation error:", error);
      Swal.fire({
        title: "Error",
        text: error.message || "Failed to process cancellation",
        icon: "error",
        confirmButtonColor: "#0d6efd",
      });
    }
  };

  const confirmCancellation = () => {
    const reason = selectedReason === "Other" ? customReason : selectedReason;

    if (!reason.trim()) {
      Swal.fire({
        title: "Error",
        text: "Please provide a cancellation reason",
        icon: "error",
        confirmButtonColor: "#0d6efd",
      });
      return;
    }

    Swal.fire({
      title: "Confirm Cancellation",
      text: "Are you sure you want to cancel this order?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, cancel order",
      cancelButtonText: "No, keep order",
    }).then((result) => {
      if (result.isConfirmed) {
        handleCancelOrder();
      }
    });
  };

  return (
    <div
      className={`modal fade ${showOrderModal ? "show" : ""}`}
      style={{
        display: showOrderModal ? "block" : "none",
        backgroundColor: "rgba(0,0,0,0.5)",
      }}
      tabIndex="-1"
    >
      <div className="modal-dialog modal-dialog-centered modal-xl rounded-0">
        <div className="modal-content rounded-0 p-0">
          {/* Header */}
          <div className="p-4 border-bottom d-flex align-items-center justify-content-between">
            <div className="d-flex align-items-center gap-3">
              <h4 className="m-0 fw-bold">Order Details</h4>
              <span className="text-success small d-inline-flex align-items-center">
                <i className="bi bi-shield-check me-1"></i>
                All data is safeguarded
              </span>
            </div>
            <div className="d-flex align-items-center">
              <button
                type="button"
                className="btn-close"
                onClick={() => setShowOrderModal(false)}
              />
            </div>
          </div>

          {/* Top meta row */}
          <div className="px-4 pt-3 pb-2 border-bottom text-muted small order-meta">
            <div className="d-flex flex-wrap gap-4">
              <div>
                <span className="me-2">Order time:</span>
                <strong>
                  {new Date(order.created_at).toLocaleDateString()}
                </strong>
              </div>
              <div className="vr" />
              <div>
                <span className="me-2">Order ID:</span>
                <strong>{order.order_id}</strong>
                <span
                  className="text-primary ms-2 cursor-pointer"
                  onClick={() =>
                    navigator.clipboard?.writeText(`PO-${order.order_id}`)
                  }
                >
                  <i className="bi bi-copy"></i>
                </span>
              </div>
              {order.email && (
                <>
                  <div className="vr" />
                  <div>
                    Order confirmation was sent on{" "}
                    {new Date(order.created_at).toLocaleDateString()} to{" "}
                    <strong>{order.email}</strong>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Two-column "Shipping to / Delivery time" cards */}
          <div className="p-4">
            <div className="bg-light p-3 row g-3">
              <div className="col-lg-6">
                <div className="od-card h-100">
                  <div className="od-card-title heading">Shipping to</div>
                  <div className="mt-2">
                    <h5 className="fw-semibold">
                      {user?.user?.firstname} {user?.user?.lastname}
                    </h5>
                    {order.shippingaddress ? (
                      <>
                        <div className="small text-muted">
                          {order.shippingaddress}
                        </div>
                        {order.suburb && (
                          <div className="small text-muted">{order.suburb}</div>
                        )}
                        {(order.city || order.state || order.postcode) && (
                          <div className="small text-muted">
                            {[order.city, order.state, order.postcode]
                              .filter(Boolean)
                              .join(", ")}
                          </div>
                        )}
                        {order.country && (
                          <div className="small text-muted">
                            {order.country}
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-muted">
                        No shipping address available
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="col-lg-6 border-start px-3">
                <div className="od-card h-100">
                  <div className="od-card-title heading">Delivery time</div>
                  <div className="mt-2 small">
                    Delivered on{" "}
                    <strong>
                      {order.delivered_at
                        ? new Date(order.delivered_at).toLocaleDateString()
                        : new Date(
                            order.updated_at ?? order.created_at
                          ).toLocaleDateString()}
                    </strong>
                  </div>
                  <div className="mt-3">
                    <div className="small">Order Status: {statusBadge}</div>
                    <div className="mt-2 small">
                      Payment: {paidBadge}
                      <span className="ms-3 text-muted">
                        Method: <strong>{order.payment_method || "N/A"}</strong>
                      </span>
                      <span className="ms-3 text-muted">
                        Total: <strong>{fmtMoney(displayTotal)}</strong>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Items list */}
            <div className="mt-4">
              {order.items?.length ? (
                order.items.map((item, index) => {
                  const price =
                    parseFloat(
                      item.ord_price ?? item.unit_price ?? item.price ?? "0"
                    ) || 0;
                  const quantity =
                    parseInt(item.ord_quantity ?? item.quantity ?? "1", 10) ||
                    1;
                  const itemTotal = price * quantity;
                  const thumb = getItemImageUrl(item);
                  const name =
                    item.name ||
                    item.product_name ||
                    item?.product?.productname ||
                    item?.product?.SKU ||
                    `Product ${index + 1}`;
                  const variant =
                    item?.variant || item?.attributes || item?.spec || "";

                  const isItemReviewed = reviewedItems.has(index);
                  const rating = reviewData[index]?.rating || 0;

                  return (
                    <div key={index}>
                      <div className="row d-flex justify-content-between border-bottom pb-3 mb-3">
                        <div className="col-md-8 d-flex align-items-start gap-3 flex-grow-1">
                          <div className="od-thumb">
                            <div
                              className="me-3 border"
                              style={{ width: "100px", height: "100px" }}
                            >
                              {thumb ? (
                                <img
                                  src={thumb}
                                  alt={name}
                                  className="img-fluid"
                                  style={{
                                    objectFit: "cover",
                                    width: "100%",
                                    height: "100%",
                                  }}
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    e.target.nextSibling.style.display = "flex";
                                  }}
                                />
                              ) : (
                                <div
                                  className="bg-light d-flex align-items-center justify-content-center"
                                  style={{ width: "100%", height: "100%" }}
                                >
                                  <i className="bi bi-image text-muted"></i>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex-grow-1">
                            <div className="text-muted fw-semibold">{name}</div>
                            {variant && (
                              <div className="text-muted small mt-1">
                                {typeof variant === "string"
                                  ? variant
                                  : Object.entries(variant)
                                      .map(([k, v]) => `${k}: ${v}`)
                                      .join(", ")}
                              </div>
                            )}
                            <div className="d-flex justify-content-between mt-2">
                              <div className="text-muted small">
                                Price: {fmtMoney(price)}
                              </div>
                              <div className="text-muted small">
                                Quantity: {quantity}
                              </div>
                              <div className="text-muted fw-semibold">
                                Total: {fmtMoney(itemTotal)}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Right column with buttons */}
                        <div className="col-md-4 od-actions d-flex flex-column justify-content-center text-center">
                          <button
                            className="btn btn-outline-dark btn-sm w-100 rounded-0"
                            onClick={handleBuyAgain}
                          >
                            Buy this again
                          </button>
                        </div>
                      </div>

                      {/* Expanded Review Section */}
                      {!isItemReviewed && expandedReview === index && (
                        <div className="review-section bg-light p-4 mb-3">
                          <h6 className="fw-semibold mb-3">
                            Write Your Review
                          </h6>

                          {/* Rating with Reversed Half-Star Support */}
                          <div className="mb-3">
                            <label className="form-label fw-semibold">
                              Rating
                            </label>
                            <div className="d-flex align-items-center">
                              <div className="d-flex gap-1">
                                {[1, 2, 3, 4, 5].map((star) => {
                                  let icon = "bi-star"; // Default: empty star

                                  // Logic for star display:
                                  if (rating >= star) {
                                    icon = "bi-star-fill"; // Full star
                                  } else if (rating >= star - 0.5) {
                                    icon = "bi-star-half"; // Half star
                                  }
                                  // Otherwise remains "bi-star" (empty)

                                  return (
                                    <i
                                      key={star}
                                      className={`fs-4 bi ${icon} text-warning`}
                                      style={{
                                        cursor: "pointer",
                                        transition: "color 0.2s ease",
                                      }}
                                      onClick={(e) =>
                                        handleStarClick(e, index, star)
                                      }
                                      onContextMenu={(e) =>
                                        handleStarContextMenu(e, index, star)
                                      }
                                      aria-label={`Rate ${star} star${
                                        star > 1 ? "s" : ""
                                      }`}
                                      role="button"
                                      tabIndex={0}
                                      onKeyDown={(e) => {
                                        if (
                                          e.key === "Enter" ||
                                          e.key === " "
                                        ) {
                                          e.preventDefault();
                                          handleStarClick(e, index, star);
                                        }
                                      }}
                                    ></i>
                                  );
                                })}
                              </div>
                              <span className="ms-2 text-muted fw-semibold">
                                {rating.toFixed(1)} stars
                              </span>
                            </div>

                            {!rating && (
                              <small className="text-danger">
                                Please select a rating
                              </small>
                            )}
                            <div className="text-muted small mt-1">
                              <i className="bi bi-info-circle me-1"></i>
                              Left-click for half stars • Right-click for full
                              stars
                            </div>
                          </div>

                          {/* Comment */}
                          <div className="mb-3">
                            <label className="form-label fw-semibold">
                              Review Comment
                            </label>
                            <textarea
                              className="form-control rounded-0"
                              rows="4"
                              placeholder="Share your experience with this product..."
                              value={reviewData[index]?.comment || ""}
                              onChange={(e) =>
                                handleReviewChange(
                                  index,
                                  "comment",
                                  e.target.value
                                )
                              }
                            />
                            <div className="text-muted small mt-1">
                              {reviewData[index]?.comment?.length || 0}/1000
                              characters
                            </div>
                          </div>

                          {/* Image Upload */}
                          <div className="mb-3">
                            <label className="form-label fw-semibold">
                              Upload Photos (Optional) - Max 5MB per image
                            </label>
                            <input
                              type="file"
                              className="form-control rounded-0"
                              multiple
                              accept="image/jpeg,image/png,image/gif,image/webp"
                              onChange={(e) => handleImageUpload(index, e)}
                            />
                            <div className="mt-2">
                              {reviewData[index]?.images?.map(
                                (image, imgIndex) => (
                                  <div
                                    key={imgIndex}
                                    className="d-inline-block me-2 mb-2 position-relative"
                                  >
                                    <img
                                      src={URL.createObjectURL(image)}
                                      alt={`Preview ${imgIndex + 1}`}
                                      style={{
                                        width: "80px",
                                        height: "80px",
                                        objectFit: "cover",
                                      }}
                                      className="border rounded"
                                    />
                                    <button
                                      type="button"
                                      className="btn-close position-absolute top-0 end-0 bg-white"
                                      style={{
                                        transform: "translate(50%, -50%)",
                                      }}
                                      onClick={() =>
                                        removeImage(index, imgIndex)
                                      }
                                    />
                                  </div>
                                )
                              )}
                            </div>
                          </div>

                          {/* Submit Button */}
                          <div className="d-flex justify-content-end gap-2">
                            <button
                              type="button"
                              className="btn btn-outline-secondary btn-sm rounded-0"
                              onClick={() => setExpandedReview(null)}
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              className="btn btn-primary btn-sm rounded-0"
                              onClick={() => submitReview(item, index)}
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-2" />
                                  Submitting...
                                </>
                              ) : (
                                "Submit Review"
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="text-muted text-center py-4">
                  No items found for this order
                </div>
              )}
            </div>
          </div>

          {/* Footers */}
          {!isShipped && isPaid && (
            <div className="col-md-12 p-4 border-top d-flex justify-content-between">
              <div className="d-flex flex-column">
                <div className="d-flex">
                  <h6 className="mb-2 fw-semibold">Cancellation Reason</h6>
                  <select
                    className="form-select rounded-0"
                    value={selectedReason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                  >
                    <option value="">Select a reason</option>
                    {cancellationReasons.map((reason, idx) => (
                      <option key={idx} value={reason}>
                        {reason}
                      </option>
                    ))}
                  </select>
                </div>
                {selectedReason === "Other" && (
                  <textarea
                    className="form-control rounded-0 mt-2"
                    rows="3"
                    placeholder="Please specify your reason"
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                  />
                )}
              </div>

              <div className="text-center mt-3">
                <button
                  className="btn btn-danger rounded-0"
                  onClick={confirmCancellation}
                  disabled={!selectedReason}
                >
                  Request Order Cancellation
                </button>
              </div>
            </div>
          )}

          {isShipped && (
            <div className="p-4 border-top text-center text-muted">
              This order has already been shipped and cannot be cancelled.
            </div>
          )}

          {!isPaid && (
            <div className="p-4 border-top text-center">
              <div className="text-muted mb-2">
                This order has not been paid yet.
              </div>
              <button
                className="btn btn-primary rounded-0"
                onClick={() => {
                  setShowOrderModal(false);
                  handleRedirectToPayment(order.order_id || selectedOrder.id);
                }}
              >
                Proceed to Payment
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;