import React from "react";
import { Link } from "react-router-dom";

const GlobalButton = ({ to, onClick, className, children, ...props }) => {
  if (to) {
    return (
      <Link
        to={to}
        onClick={onClick}
        className={`button px-4 py-2 text-decoration-none position-relative d-flex align-items-center justify-content-center text-white fw-semibold outline-none overflow-hidden ${className}`}
        {...props}
      >
        {children}
      </Link>
    );
  }
  
  return (
    <button
      onClick={onClick}
        className={`button px-4 py-2 text-decoration-none position-relative d-flex align-items-center justify-content-center text-white fw-semibold outline-none overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default GlobalButton;