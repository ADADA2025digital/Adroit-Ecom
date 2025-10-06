import React from "react";

const InputField = ({ label, type, id, placeholder, value, onChange, error }) => {
  return (
    <div className="mb-3">
      <label htmlFor={id} className="form-label">
        {label}
      </label>
      <input
        type={type}
        className={`form-control rounded-0 ${error ? "is-invalid" : ""}`}
        id={id}
        placeholder={placeholder}
        value={value} // Pass the value prop
        onChange={onChange} // Pass the onChange prop
      />
      {error && <div className="invalid-feedback">{error}</div>}
    </div>
  );
};

export default InputField;
