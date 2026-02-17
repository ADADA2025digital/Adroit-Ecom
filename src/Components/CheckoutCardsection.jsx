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
        // console.error("Error fetching addresses:", {
        //   error,
        //   message: error.message,
        //   response: error.response?.data
        // });
      }
    };

    fetchSavedAddresses();
  }, []);

  const saveAddress = async () => {    
    // Validation
    if (!formData.address.trim()) {
      // console.error("Validation failed: Address is required");
      alert("Please enter an address");
      return;
    }
    
    if (!formData.state) {
      alert("Please select a state");
      return;
    }
    
    if (!formData.city) {
      alert("Please select a city");
      return;
    }
    
    if (!formData.postcode.trim()) {
      alert("Please enter a postcode");
      return;
    }

    try {
      const response = await axios.post("/api/storeAddress", {
        address: formData.address,
        suburb: formData.city,
        postcode: formData.postcode,
        state: formData.state,
        country: formData.country,
        address_type: "delivery",
      });


      if (response.data.status === 200) {
        alert("Address saved successfully!");

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
            onSelect(newlyAddedAddress.id);
          }
        }

        // Clear the form data
        setFormData({
          address: "",
          postcode: "",
          country: "AU",
          state: "",
          city: "",
        });
      } else {
        // console.error("API returned error:", response.data.message);
        alert(response.data.message || "Failed to save the address.");
      }
    } catch (error) {
      // console.error("Error saving address:", {
      //   error,
      //   message: error.message,
      //   response: error.response?.data,
      //   config: error.config
      // });
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
          country: selectedAddress.country || "AU",
          state: selectedAddress.state,
          city: selectedAddress.suburb,
        });

        onSelect(selectedAddress.id);
      }
    } else {
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
      <div className="card-body">

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

        {/* Display selected saved address in a nice box */}
        {selectedAddressType && selectedAddressType.value !== "new_address" && (
          <div className="mt-4">
            {savedAddresses
              .filter((address) => String(address.id) === String(selectedAddressType.value))
              .map((address) => (
                <div 
                  key={address.id} 
                  className="bg-white p-3 border mb-3"
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <h6 className="fw-bold mb-2">Selected Shipping Address</h6>
                      <p className="mb-1">
                        <i className="bi bi-geo-alt me-1 text-primary"></i> {address.address}, {address.suburb}, {address.state},{address.country}, {address.postcode}
                      </p>
                    </div>
                  </div>
                </div>
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