import React, { useState, useEffect, useCallback } from "react";
import api from '../Config/api';

const ApprovedReviewsTab = ({ user, formatDate, onRefresh }) => {
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

  // Filter approved reviews only
  const getApprovedReviews = (reviewsData) => {
    if (!reviewsData || !reviewsData.reviews) return [];
    return reviewsData.reviews.filter((review) => review.status === "approved");
  };

  // Fetch reviews using centralized API
  const fetchReviews = useCallback(async () => {
    if (!user?.user) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await api.get("/user/reviews");

      if (response.data.success) {
        setReviews(response.data);
      } else {
        throw new Error(response.data.message || "Failed to fetch reviews");
      }
    } catch (err) {
      console.error("Reviews fetch error:", err);
      
      if (err.response?.status === 401) {
        setError("Authentication failed. Please log in again.");
      } else if (err.response?.status === 404) {
        setError("Reviews endpoint not found. Please contact support.");
      } else if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Failed to load reviews. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

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
          border-left: 4px solid #28a745;
          transition: transform 0.2s ease;
        }
        .review-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0,0,0,0.1);
        }
      `}</style>

      <div className="table-container">
        <div className="d-flex justify-content-between align-items-center py-3">
          <h4 className="fw-bold heading m-0">My Approved Reviews</h4>
          <div className="d-flex gap-2">
            <button 
              className="btn btn-outline-primary btn-sm rounded-0"
              onClick={fetchReviews}
              disabled={loading}
            >
              <i className={`bi bi-arrow-clockwise me-1 ${loading ? 'spinner-border spinner-border-sm' : ''}`}></i>
              Refresh
            </button>
            {onRefresh && (
              <button 
                className="btn btn-outline-secondary btn-sm rounded-0"
                onClick={onRefresh}
              >
                <i className="bi bi-arrow-clockwise me-1"></i>
                Refresh All
              </button>
            )}
          </div>
        </div>

        {loading && (
          <div className="text-center py-4">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading reviews...</span>
            </div>
            <p className="text-muted small mt-2">Loading your approved reviews...</p>
          </div>
        )}

        {error && (
          <div className="alert alert-danger" role="alert">
            <i className="bi bi-exclamation-triangle"></i> {error}
            <div className="mt-2">
              <button 
                className="btn btn-sm btn-outline-danger"
                onClick={fetchReviews}
                disabled={loading}
              >
                Try Again
              </button>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            {approvedReviews.length > 0 ? (
              <div className="row">
                {approvedReviews.map((review) => (
                  <div key={review.review_id} className="col-lg-12 mb-4">
                    <div className="card review-card rounded-0 h-100">
                      <div className="card-header bg-light d-flex justify-content-between align-items-center">
                        <div>
                          <span className="badge bg-success me-2">
                            <i className="bi bi-check-circle me-1"></i>
                            Approved
                          </span>
                          <span className="text-muted small">
                            {formatDate ? formatDate(review.submitted_date) : 
                              new Date(review.submitted_date).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="text-muted small">
                          Order: #{review.order_id}
                        </div>
                      </div>
                      
                      <div className="card-body">
                        <div className="row">
                          <div className="col-md-8">
                            <h6 className="card-title fw-bold text-primary">
                              {review.product_name}
                            </h6>
                            
                            {renderRating(review.rating)}

                            <p className="card-text mt-3 small text-muted">
                              {review.comment}
                            </p>
                          </div>

                          <div className="col-md-4">
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

                      <div className="card-footer bg-white">
                        <div className="d-flex justify-content-between align-items-center">
                          <small className="text-muted">
                            Review ID: {review.review_id}
                          </small>
                          <small className="text-muted">
                            Submitted: {formatDate ? formatDate(review.submitted_date) : 
                              new Date(review.submitted_date).toLocaleDateString()}
                          </small>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-5">
                <i className="bi bi-star display-4 text-muted"></i>
                <h5 className="text-muted mt-3">No Approved Reviews Yet</h5>
                <p className="text-muted">
                  Your approved reviews will appear here once they are approved by our team.
                </p>
                <button 
                  className="btn btn-primary rounded-0 mt-2"
                  onClick={fetchReviews}
                  disabled={loading}
                >
                  <i className="bi bi-arrow-clockwise me-2"></i>
                  Check for New Reviews
                </button>
              </div>
            )}
          </>
        )}

        {reviews && approvedReviews.length > 0 && (
          <div className="mt-4 text-center">
            <p className="text-muted small">
              Showing {approvedReviews.length} approved review{approvedReviews.length !== 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>
    </>
  );
};

export default ApprovedReviewsTab;