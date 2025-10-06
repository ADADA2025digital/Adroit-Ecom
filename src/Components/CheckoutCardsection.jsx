import React, { useEffect, useState } from "react";
import { Country, State, City } from "country-state-city";
import CheckoutCard from "./CheckoutCard";
import InputField from "./InputField";
import Select from "react-select";
import axios from "axios";
import GlobalButton from "./Button";

const CheckoutCardSection = ({ title, options, selectedOption, onSelect }) => {
  const [formData, setFormData] = useState({
    address: "",
    postcode: "",
    country: "AU", // Default to Australia
    state: "",
    city: "",
  });

  const [selectedAddressType, setSelectedAddressType] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    // console.log(`Input changed: ${id} = ${value}`); // Debug log
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const addressTypeOptions = [
    { value: "new_address", label: "New Address" },
    ...savedAddresses.map((address) => ({
      value: address.id,
      label: `${address.address}, ${address.suburb}, ${address.state} ${address.postcode}`, // Merge fields
    })),
  ];

  useEffect(() => {
    const fetchSavedAddresses = async () => {
      try {
        const response = await axios.get("/api/address");
        if (response.data.status === 200) {
          setSavedAddresses(response.data.data);
        } else {
          // console.error("Failed to fetch addresses:", response.data.message);
        }
      } catch (error) {
        // console.error("Error fetching addresses:", error);
      }
    };

    fetchSavedAddresses();
  }, []);

  const saveAddress = async () => {
    try {
      const response = await axios.post("/api/storeAddress", {
        address: formData.address,
        suburb: formData.city,
        postcode: formData.postcode,
        state: formData.state,
        country: formData.country, // Include country in the request
        address_type: "delivery",
      });

      if (response.data.status === 200) {
        alert("Address saved successfully!");

        // Refresh saved addresses
        const addressesResponse = await axios.get("/api/address");
        if (addressesResponse.data.status === 200) {
          setSavedAddresses(addressesResponse.data.data);

          // Automatically select the new address
          const newlyAddedAddress = addressesResponse.data.data.find(
            (addr) => addr.address === formData.address
          );
          if (newlyAddedAddress) {
            setSelectedAddressType({
              value: newlyAddedAddress.id,
              label: newlyAddedAddress.address,
            });
            onSelect(newlyAddedAddress.id); // Auto-select new address
          }
        }

        // Clear the form data (except country which stays as Australia)
        setFormData({
          address: "",
          postcode: "",
          country: "AU",
          state: "",
          city: "",
        });
      } else {
        alert(response.data.message || "Failed to save the address.");
      }
    } catch (error) {
      // console.error("Error saving address:", error);
      alert("An error occurred while saving the address.");
    }
  };

  const handleAddressSelection = (selectedOption) => {
    setSelectedAddressType(selectedOption);

    if (selectedOption.value !== "new_address") {
      const selectedAddress = savedAddresses.find(
        (address) => address.id === selectedOption.value
      );

      if (selectedAddress) {
        setFormData({
          address: selectedAddress.address,
          postcode: selectedAddress.postcode,
          country: selectedAddress.country || "AU", // Default to AU if not set
          state: selectedAddress.state,
          city: selectedAddress.suburb,
        });

        // ✅ Update selected address in parent component
        onSelect(selectedAddress.id);
      }
    } else {
      // ✅ Reset form for new address entry (but keep country as Australia)
      setFormData({
        address: "",
        postcode: "",
        country: "AU",
        state: "",
        city: "",
      });

      onSelect("new");
    }
  };

  return (
    <div className="card border-0 bg-light mb-4">
      <div className="card-body p-4">
        <h5 className="fw-bold mb-3 heading">{title}</h5>

        {/* Address Type Selection */}
        <div className="col-md-12 mb-3">
          <label className="form-label">Select Address Type:</label>
          <Select
            options={addressTypeOptions}
            value={selectedAddressType}
            onChange={handleAddressSelection}
            placeholder="Select the Address"
            className="rounded-0"
          />
        </div>

        {/* Display CheckoutCard if selecting saved addresses */}
        {selectedAddressType &&
          selectedAddressType.value === "new_address" &&
          savedAddresses.length > 0 && (
            <div className="row g-4 mt-4">
              {savedAddresses
                .filter((address) => address.id === selectedAddressType.value)
                .map((address) => (
                  <CheckoutCard
                    key={address.id}
                    id={address.id}
                    address={`${address.address}, ${address.suburb}, ${address.state}, ${address.postcode}`}
                    selected={
                      selectedOption ===
                      `${address.address}, ${address.suburb}, ${address.state} ${address.postcode}`
                    }
                    onChange={() =>
                      onSelect(
                        `${address.address}, ${address.suburb}, ${address.state} ${address.postcode}`
                      )
                    }
                  />
                ))}
            </div>
          )}

        {/* Display New Address Form when selected */}
        {selectedAddressType && selectedAddressType.value === "new_address" && (
          <>
            <div className="row">
              <div className="col-md-12">
                <InputField
                  label="address"
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
                    setFormData((prev) => ({
                      ...prev,
                      city: "",
                    }));
                  }}
                >
                  <option value="">Select State</option>
                  {State.getStatesOfCountry("AU").map((state) => (
                    <option key={state.isoCode} value={state.isoCode}>
                      {state.name}
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
                    City.getCitiesOfState("AU", formData.state).map((city) => (
                      <option key={city.name} value={city.name}>
                        {city.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="col-md-6 mt-3">
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
              <div className="col-md-12 d-flex justify-content-start">
                <GlobalButton
                  onClick={saveAddress}
                  className="btn btn-primary rounded-0"
                >
                  Save
                </GlobalButton>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CheckoutCardSection;
