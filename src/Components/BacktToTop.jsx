import React, { useEffect, useState } from "react";

const BackToTop = () => {
  const [visible, setVisible] = useState(false);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setVisible(true);
      } else {
        setVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <button
      className={`wrapper overflow-hidden border-0 position-fixed bg-primary d-none d-md-flex justify-content-center align-items-center flex-column position-relative ${
        visible ? "fall-in" : "fly-out"
      }`}
      onClick={scrollToTop}
    >
      <span>
        <svg
          viewBox="0 0 16 16"
          fill="#fff"
          height="20"
          width="20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M7.646 2.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 3.707 2.354 9.354a.5.5 0 1 1-.708-.708l6-6z"
            fillRule="evenodd"
          />
          <path
            d="M7.646 6.646a.5.5 0 0 1 .708 0l6 6a.5.5 0 0 1-.708.708L8 7.707l-5.646 5.647a.5.5 0 0 1-.708-.708l6-6z"
            fillRule="evenodd"
          />
        </svg>
      </span>
    </button>
  );
};

export default BackToTop;
