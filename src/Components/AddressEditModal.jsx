import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import GlobalButton from "./Button"; // adjust path if different
import { City, State } from "country-state-city";
// If you already have a shared InputField component, import it:
import InputField from "./InputField"; // adjust path

const AddressEditModal = ({ show, onClose, address, onSaved }) => {
  const [saving, setSaving] = useState(false);

  // Map backend fields to form
  const initial = {
    address: address?.address || "",
    state: address?.state || "",               // e.g., VIC
    city: address?.city || address?.suburb || "",
    postcode: address?.postcode || "",
    country: address?.country || "Australia",
    address_type: address?.address_type || "delivery",
  };

  const [formData, setFormData] = useState(initial);

  useEffect(() => {
    setFormData({
      address: address?.address || "",
      state: address?.state || "",
      city: address?.city || address?.suburb || "",
      postcode: address?.postcode || "",
      country: address?.country || "Australia",
      address_type: address?.address_type || "delivery",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address?.id, show]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const saveAddress = async () => {
    if (!address?.id) return;

    // Minimal client-side checks
    if (!formData.address || !formData.state || !formData.city || !formData.postcode) {
      Swal.fire({
        title: "Missing details",
        text: "Please fill address, state, city, and postcode.",
        icon: "warning",
        confirmButtonColor: "#0d6efd",
      });
      return;
    }

    try {
      setSaving(true);
      const token = localStorage.getItem("auth_token");
      const url = `${import.meta.env.VITE_API_URL}api/address/${address.id}/edit`;

      // API expects suburb => we send city as suburb
      const payload = {
        address: formData.address,
        suburb: formData.city,
        postcode: formData.postcode,
        state: formData.state,          // keep as ISO (e.g., VIC)
        address_type: formData.address_type || "delivery",
      };

      const { data } = await axios.put(url, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        withCredentials: true,
      });

      if (data?.status === 200) {
        Swal.fire({
          title: "Saved!",
          text: "Address updated successfully.",
          icon: "success",
          confirmButtonColor: "#0d6efd",
        });
        onSaved?.(data?.data); // let parent refresh
        onClose?.();
      } else {
        throw new Error(data?.message || "Failed to update address");
      }
    } catch (err) {
      Swal.fire({
        title: "Error",
        text:
          err.response?.data?.message ||
          err.message ||
          "Could not update address.",
        icon: "error",
        confirmButtonColor: "#0d6efd",
      });
    } finally {
      setSaving(false);
    }
  };

  if (!show) return null;

  return (
    <div
      className={`modal fade ${show ? "show" : ""}`}
      style={{ display: show ? "block" : "none", backgroundColor: "rgba(0,0,0,0.5)" }}
      tabIndex="-1"
      aria-modal="true"
      role="dialog"
    >
      <div className="modal-dialog modal-dialog-centered modal-lg rounded-0">
        <div className="modal-content rounded-0">
          <div className="modal-header">
            <h5 className="modal-title fw-bold">Edit Address</h5>
            <button type="button" className="btn-close" onClick={onClose} />
          </div>

          <div className="modal-body">
            <>
              <div className="row">
                <div className="col-md-12">
                  <InputField
                    label="Address"
                    type="text"
                    id="address"
                    name="address"
                    placeholder="Enter Address"
                    value={formData.address}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="row">
                {/* Hidden country field (always Australia) */}
                <input type="hidden" id="country" value={formData.country} />

                <div className="col-md-6">
                  <label className="form-label">Select State</label>
                  <select
                    className="form-control rounded-0"
                    id="state"
                    value={formData.state}
                    onChange={(e) => {
                      handleInputChange(e);
                      setFormData((prev) => ({ ...prev, city: "" }));
                    }}
                  >
                    <option value="">Select State</option>
                    {State.getStatesOfCountry("AU").map((st) => (
                      <option key={st.isoCode} value={st.isoCode}>
                        {st.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Select City</label>
                  <select
                    className="form-control rounded-0"
                    id="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    disabled={!formData.state}
                  >
                    <option value="">Select City</option>
                    {formData.state &&
                      City.getCitiesOfState("AU", formData.state).map((ct) => (
                        <option key={ct.name} value={ct.name}>
                          {ct.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="col-md-12 mt-3">
                  <InputField
                    label="Zip Code"
                    type="text"
                    id="postcode"
                    placeholder="Enter Zip Code"
                    value={formData.postcode}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div className="row mt-4">
                <div className="col-md-12 d-flex justify-content-between gap-2">
                  <GlobalButton
                    onClick={saveAddress}
                    className="btn btn-primary rounded-0"
                    disabled={saving}
                  >
                    {saving ? "Saving..." : "Save"}
                  </GlobalButton>
                  <button className="btn btn-outline-dark rounded-0" onClick={onClose}>
                    Cancel
                  </button>
                </div>
              </div>
            </>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddressEditModal;