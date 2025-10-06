import React, { useEffect } from "react";

const CheckoutCard = ({ id, title, address, selected, onChange }) => {
  useEffect (() => {
    // console.log("Selected Address Updated:", selected);
  }, [selected]);
  return (
    <div className="col-md-6">
      <div className="bg-white rounded p-4 h-100 border">
        <div className="form-check">
          <input
            type="radio"
            className="form-check-input"
            id={id}
            name="checkoutAddress"
            checked={selected}
            onChange={onChange}
          />
          <label className="form-check-label ms-2" htmlFor={id}>
            <strong>{title}</strong>
            <p className="mb-0 text-muted small">{address}</p>
          </label>
        </div>
      </div>
    </div>
  );
};

export default CheckoutCard;
