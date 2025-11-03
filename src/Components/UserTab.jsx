import React, { useEffect } from "react";
import api from '../Config/api';

const UserTab = ({ user }) => {
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

  // Fetch reviews when component mounts
  useEffect(() => {
    const fetchReviews = async () => {
      // Only fetch if user is available
      if (!user?.user) {
        return;
      }

      try {
        const response = await api.get("/user/reviews");

        if (response.data.success) {
          // Reviews are fetched but not used in current UI
          // Keeping the API call for potential future use
          console.log("User reviews loaded:", response.data);
        }
      } catch (err) {
        console.error("Error fetching reviews:", err);
      }
    };

    fetchReviews();
  }, [user]);

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
    </>
  );
};

export default UserTab;