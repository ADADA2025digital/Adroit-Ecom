import React from "react";

const PageHeader = ({ title, path }) => {
  return (
    <div className="bg-light py-5">
      <div className="container d-flex flex-column justify-content-center align-items-center text-center">
        <h2 className="fw-bold heading">{title}</h2>
        <span className="text-muted">{path}</span>
      </div>
    </div>
  );
};

export default PageHeader;
