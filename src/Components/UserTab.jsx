import React, { useState, useEffect } from "react";

const UserTab = ({ user }) => {
  const [reviews, setReviews] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Skeleton Component
  const SkeletonPill = ({ width = 80, height = 28, className = "" }) => (
    <span
      className={`rounded-0 border-bottom border-3 rounded-3 px-2 ${className}`}
      style={{
        width,
        height,
        display: "inline-block",
        background:
          "linear-gradient(90deg, rgba(0,0,0,0.06) 25%, rgba(0,0,0,0.12) 37%, rgba(0,0,0,0.06) 63%)",
        backgroundSize: "400% 100%",
        animation: "shine 1.4s ease infinite",
      }}
      aria-hidden="true"
    />
  );

  // Get authentication token (adjust based on your auth setup)
  const getAuthToken = () => {
    // Check different storage locations
    return (
      localStorage.getItem("auth_token") ||
      localStorage.getItem("token") ||
      sessionStorage.getItem("auth_token") ||
      "180|dXFdnwTgsyao6wj6IkvMKEG7DuLfDKwJBXwxAliC19c09d47"
    ); // Fallback to your token
  };

  // Filter approved reviews only
  const getApprovedReviews = (reviewsData) => {
    if (!reviewsData || !reviewsData.reviews) return [];
    return reviewsData.reviews.filter((review) => review.status === "approved");
  };

  // Fetch reviews when component mounts
  useEffect(() => {
    const fetchReviews = async () => {
      // Only fetch if user is available
      if (!user?.user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const token = getAuthToken();

        if (!token) {
          setError("Authentication required. Please log in.");
          setLoading(false);
          return;
        }

        const response = await fetch(
          "https://shop.adroitalarm.com.au/api/user/reviews",
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        // console.log("Response status:", response.status);
        // console.log("Response headers:", response.headers);

        if (!response.ok) {
          if (response.status === 401) {
            throw new Error("Authentication failed. Please log in again.");
          } else if (response.status === 405) {
            throw new Error(
              "Method not allowed. Please check the API endpoint."
            );
          } else {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
        }

        const data = await response.json();
        // console.log("Reviews data:", data);

        if (data.success) {
          setReviews(data);
        } else {
          throw new Error(data.message || "Failed to fetch reviews");
        }
      } catch (err) {
        // console.error("Error fetching reviews:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [user]);

  // Debug function to test the API call manually
  const testApiCall = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = getAuthToken();
      // console.log("Using token:", token ? "Token available" : "No token");

      const response = await fetch(
        "https://shop.adroitalarm.com.au/api/user/reviews",
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // console.log("Test API Response:", response);

      if (response.ok) {
        const data = await response.json();
        // console.log("Test API Data:", data);
        setReviews(data);
        setError(null);
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (err) {
      // console.error("Test API Error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Format date function
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get status badge
  const getStatusBadge = (status) => {
    const statusConfig = {
      approved: { class: "badge bg-success", text: "Approved" },
      pending: { class: "badge bg-warning", text: "Pending" },
      rejected: { class: "badge bg-danger", text: "Rejected" },
    };

    const config = statusConfig[status] || {
      class: "badge bg-secondary",
      text: status,
    };
    return <span className={config.class}>{config.text}</span>;
  };

  // Render star rating
  const renderRating = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 1; i <= 5; i++) {
      if (i <= fullStars) {
        stars.push(
          <i key={i} className="bi bi-star-fill text-warning me-1"></i>
        );
      } else if (i === fullStars + 1 && hasHalfStar) {
        stars.push(
          <i key={i} className="bi bi-star-half text-warning me-1"></i>
        );
      } else {
        stars.push(<i key={i} className="bi bi-star text-warning me-1"></i>);
      }
    }

    return (
      <div className="d-flex align-items-center">
        {stars} <span className="ms-2 small text-muted">({rating})</span>
      </div>
    );
  };

  // Get approved reviews
  const approvedReviews = reviews ? getApprovedReviews(reviews) : [];

  return (
    <>
      <style>{`
        @keyframes shine {
          0% { background-position: 100% 0; }
          100% { background-position: 0 0; }
        }
        .review-card {
          border-left: 4px solid #007bff;
          transition: transform 0.2s ease;
        }
      `}</style>

      <h4 className="fw-bold heading mt-3">
        Hello,{" "}
        {user?.user ? (
          `${user.user.firstname} ${user.user.lastname} !`
        ) : (
          <SkeletonPill width={160} height={10} />
        )}
      </h4>

      <p className="text-muted small">
        From your My Account Dashboard you have the ability to view a snapshot
        of your recent account activity and update your account information.
        Select a link below to view or edit information.
      </p>

      <div className="my-4">
        <h5 className="fw-bold heading">Account Information</h5>

        <p className="small">
          Full Name:{" "}
          {user?.user ? (
            `${user.user.firstname} ${user.user.lastname}`
          ) : (
            <SkeletonPill width={200} height={10} />
          )}
        </p>

        <p className="small">
          Email:{" "}
          {user?.user ? (
            user.user.email
          ) : (
            <SkeletonPill width={220} height={10} />
          )}
        </p>

        <p className="small">
          Phone:{" "}
          {user?.user ? (
            user.user.phone
          ) : (
            <SkeletonPill width={140} height={10} />
          )}
        </p>

        <p className="small mb-0">
          Address:{" "}
          {user?.billing ? (
            `${user.billing.address}, ${user.billing.suburb}, ${user.billing.postcode}`
          ) : (
            <SkeletonPill width={260} height={10} />
          )}
        </p>
      </div>

      {user?.user ? (
        <a href="/user-profile" className="text-decoration-none fw-semibold">
          <i className="bi bi-pencil-square"></i> Edit
        </a>
      ) : (
        <SkeletonPill width={80} height={10} />
      )}

      {/* Reviews Section */}
      <div className="mt-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h5 className="fw-bold heading mb-0">My Approved Reviews</h5>
        </div>

        {loading && (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading reviews...</span>
            </div>
            <p className="text-muted small mt-2">Loading your reviews...</p>
          </div>
        )}

        {error && (
          <div className="alert alert-danger" role="alert">
            <i className="bi bi-exclamation-triangle"></i> {error}
            <div className="mt-2">
              <small>
                Make sure you're logged in and have a valid authentication
                token.
              </small>
            </div>
          </div>
        )}

        {reviews && !loading && !error && (
          <>
            {/* Approved Reviews List */}
            <div className="row">
              {approvedReviews.length > 0 ? (
                approvedReviews.map((review) => (
                  <div key={review.review_id} className="col-lg-12 mb-3">
                    <div className="card review-card rounded-0 h-100">
                      <div className="card-body">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <h6 className="card-title mb-0">
                            {review.product_name}
                          </h6>
                          <p className="small text-muted mb-2">
                            Order: {review.order_id} •{" "}
                            {formatDate(review.submitted_date)}
                          </p>{" "}
                        </div>

                        {renderRating(review.rating)}

                        <p className="card-text mt-2 small">{review.comment}</p>

                        {/* Review Images */}
                        {review.images && review.images.length > 0 && (
                          <div className="mt-3">
                            <p className="small text-muted mb-2">
                              <i className="bi bi-images"></i>{" "}
                              {review.images.length} image(s)
                            </p>
                            <div className="d-flex gap-2 flex-wrap">
                              {review.images.slice(0, 3).map((image, index) => (
                                <img
                                  key={index}
                                  src={image.url}
                                  alt={`Review ${index + 1}`}
                                  className="img-thumbnail"
                                  style={{
                                    width: "60px",
                                    height: "60px",
                                    objectFit: "cover",
                                  }}
                                />
                              ))}
                              {review.images.length > 3 && (
                                <div
                                  className="d-flex align-items-center justify-content-center bg-light rounded"
                                  style={{ width: "60px", height: "60px" }}
                                >
                                  <span className="small text-muted">
                                    +{review.images.length - 3}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-12">
                  <div className="text-center py-5">
                    <i className="bi bi-chat-square-text display-4 text-muted"></i>
                    <p className="text-muted mt-3">
                      No reviews found.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
};

export default UserTab;