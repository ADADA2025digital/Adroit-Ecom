import React from "react";

const PageBanner = ({ src, alt = "banner" }) => {
  return (
    <div className="overflow-hidden">
      {src ? (
        <img src={src} alt={alt} className="img-fluid w-100" />
      ) : (
        <div className="placeholder">No Image Available</div>
      )}
    </div>
  );
};

export default PageBanner;