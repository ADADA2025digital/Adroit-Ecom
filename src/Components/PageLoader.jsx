import React, { useEffect, useState } from "react";
import "../Assets/Styles/Style.css"; // Make sure this file exists

const PageLoader = ({ hideLoader }) => {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        hideLoader();
      }, 300); // Shorter fade-out delay for better performance
    }, 1000); // Reduce loading time to 1 second
  }, [hideLoader]);

  return (
    <div id="loader" className={`page-loader ${fadeOut ? "fade-out" : ""}`}>
      <div className="spinner"></div> {/* Fast-loading spinner */}
    </div>
  );
};

export default PageLoader;
