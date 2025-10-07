import React, { useEffect, useState } from "react";
import { Country, State, City } from "country-state-city";
import CheckoutCard from "./CheckoutCard";
import InputField from "./InputField";
import Select from "react-select";
import axios from "axios";
import GlobalButton from "./Button";

const CheckoutCardSection = ({ title, options, selectedOption, onSelect }) => {
  console.log("🔹 CheckoutCardSection rendered with props:", {
    title,
    options,
    selectedOption,
    onSelect
  });

  const [formData, setFormData] = useState({
    address: "",
    postcode: "",
    country: "AU", // Default to Australia
    state: "",
    city: "",
  });

  const [selectedAddressType, setSelectedAddressType] = useState(null);
  const [savedAddresses, setSavedAddresses] = useState([]);

  console.log("🔹 Current state:", {
    formData,
    selectedAddressType,
    savedAddressesCount: savedAddresses.length,
    savedAddresses
  });

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    console.log(`🔹 Input changed: ${id} = ${value}`, {
      previousValue: formData[id],
      newValue: value,
      eventType: e.type
    });
    
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const addressTypeOptions = [
    { value: "new_address", label: "New Address" },
    ...savedAddresses.map((address) => ({
      value: address.id,
      label: `${address.address}, ${address.suburb}, ${address.state} ${address.postcode}`,
    })),
  ];

  console.log("🔹 Address type options:", addressTypeOptions);

  useEffect(() => {
    console.log("🔹 useEffect triggered - fetching addresses");
    const fetchSavedAddresses = async () => {
      try {
        console.log("🟡 Starting API call to /api/address");
        const response = await axios.get("/api/address");
        console.log("🟢 API Response:", response.data);
        
        if (response.data.status === 200) {
          console.log("✅ Addresses fetched successfully:", response.data.data);
          setSavedAddresses(response.data.data);
        } else {
          console.error("❌ Failed to fetch addresses:", response.data.message);
        }
      } catch (error) {
        console.error("❌ Error fetching addresses:", {
          error,
          message: error.message,
          response: error.response?.data
        });
      }
    };

    fetchSavedAddresses();
  }, []);

  const saveAddress = async () => {
    console.log("🔹 saveAddress called with formData:", formData);
    
    // Validation
    if (!formData.address.trim()) {
      console.error("❌ Validation failed: Address is required");
      alert("Please enter an address");
      return;
    }
    
    if (!formData.state) {
      console.error("❌ Validation failed: State is required");
      alert("Please select a state");
      return;
    }
    
    if (!formData.city) {
      console.error("❌ Validation failed: City is required");
      alert("Please select a city");
      return;
    }
    
    if (!formData.postcode.trim()) {
      console.error("❌ Validation failed: Postcode is required");
      alert("Please enter a postcode");
      return;
    }

    try {
      console.log("🟡 Starting API call to /api/storeAddress with data:", {
        address: formData.address,
        suburb: formData.city,
        postcode: formData.postcode,
        state: formData.state,
        country: formData.country,
        address_type: "delivery",
      });

      const response = await axios.post("/api/storeAddress", {
        address: formData.address,
        suburb: formData.city,
        postcode: formData.postcode,
        state: formData.state,
        country: formData.country,
        address_type: "delivery",
      });

      console.log("🟢 Store Address API Response:", response.data);

      if (response.data.status === 200) {
        console.log("✅ Address saved successfully!");
        alert("Address saved successfully!");

        // Refresh saved addresses
        console.log("🟡 Refreshing addresses list...");
        const addressesResponse = await axios.get("/api/address");
        console.log("🟢 Refresh addresses response:", addressesResponse.data);
        
        if (addressesResponse.data.status === 200) {
          setSavedAddresses(addressesResponse.data.data);

          // Automatically select the new address
          const newlyAddedAddress = addressesResponse.data.data.find(
            (addr) => addr.address === formData.address
          );
          console.log("🔹 Newly added address:", newlyAddedAddress);
          
          if (newlyAddedAddress) {
            setSelectedAddressType({
              value: newlyAddedAddress.id,
              label: newlyAddedAddress.address,
            });
            console.log("🔹 Auto-selecting new address:", newlyAddedAddress.id);
            onSelect(newlyAddedAddress.id);
          }
        }

        // Clear the form data
        console.log("🔹 Clearing form data");
        setFormData({
          address: "",
          postcode: "",
          country: "AU",
          state: "",
          city: "",
        });
      } else {
        console.error("❌ API returned error:", response.data.message);
        alert(response.data.message || "Failed to save the address.");
      }
    } catch (error) {
      console.error("❌ Error saving address:", {
        error,
        message: error.message,
        response: error.response?.data,
        config: error.config
      });
      alert("An error occurred while saving the address.");
    }
  };

  const handleAddressSelection = (selectedOption) => {
    console.log("🔹 Address selection changed:", selectedOption);
    setSelectedAddressType(selectedOption);

    if (selectedOption.value !== "new_address") {
      const selectedAddress = savedAddresses.find(
        (address) => address.id === selectedOption.value
      );
      console.log("🔹 Found selected address:", selectedAddress);

      if (selectedAddress) {
        console.log("🔹 Updating form with selected address data");
        setFormData({
          address: selectedAddress.address,
          postcode: selectedAddress.postcode,
          country: selectedAddress.country || "AU",
          state: selectedAddress.state,
          city: selectedAddress.suburb,
        });

        console.log("🔹 Calling onSelect with address ID:", selectedAddress.id);
        onSelect(selectedAddress.id);
      }
    } else {
      console.log("🔹 New address selected, resetting form");
      setFormData({
        address: "",
        postcode: "",
        country: "AU",
        state: "",
        city: "",
      });

      console.log("🔹 Calling onSelect with 'new'");
      onSelect("new");
    }
  };

  console.log("🔹 Rendering component with current state");

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
                    console.log("🔹 State selection changed:", e.target.value);
                    handleInputChange(e);
                    setFormData((prev) => ({
                      ...prev,
                      city: "", // Reset city when state changes
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
                <small className="text-muted">
                  Available states: {State.getStatesOfCountry("AU").length}
                </small>
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
                <small className="text-muted">
                  {formData.state 
                    ? `Available cities: ${City.getCitiesOfState("AU", formData.state).length}`
                    : "Select a state first"}
                </small>
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
                  Save Address
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