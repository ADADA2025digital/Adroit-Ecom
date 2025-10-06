import React from "react";

const TextAreaField = ({ label, id, rows, placeholder, error
 }) => {
  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <textarea
        className={`form-control rounded-0 ${error ? "is-invalid" : ""}`}
        id={id}
        rows={rows}
        placeholder={placeholder}
      ></textarea>
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
};

export default TextAreaField;
