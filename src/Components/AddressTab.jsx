import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import AddressEditModal from "../Components/AddressEditModal";

const AddressTab = ({ user, userAddresses: initialAddresses, onAddressesUpdate }) => {
  const [userAddresses, setUserAddresses] = useState(initialAddresses || []);
  const [addressError, setAddressError] = useState(null);
  const [showEditAddressModal, setShowEditAddressModal] = useState(false);
  const [selectedAddressForEdit, setSelectedAddressForEdit] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  // Update local state when prop changes
  React.useEffect(() => {
    setUserAddresses(initialAddresses || []);
  }, [initialAddresses]);

  // -------- Address Data Fetching --------
  const fetchUserAddresses = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}api/address`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      if (response.data.status === 200) {
        const addresses = response.data.data;
        setUserAddresses(addresses);
        if (onAddressesUpdate) {
          onAddressesUpdate(addresses);
        }
      } else {
        setAddressError(response.data.message || "Failed to fetch addresses");
      }
    } catch (err) {
      setAddressError(err.response?.data?.message || err.message);
      // console.error("Failed to fetch addresses:", err);
    }
  };

  // -------- Address Deletion --------
  const handleDeleteAddress = async (addressId) => {
    try {
      setDeletingId(addressId);
      const token = localStorage.getItem("auth_token");
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}api/address/${addressId}/delete`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      if (response.data.status === 200) {
        Swal.fire({
          title: "Success!",
          text: "Address deleted successfully.",
          icon: "success",
          confirmButtonColor: "#0d6efd",
        });
        fetchUserAddresses(); // Refresh the list
      } else {
        throw new Error(response.data.message || "Failed to delete address");
      }
    } catch (err) {
      // console.error("Address deletion error:", err);
      Swal.fire({
        title: "Error",
        text: err.response?.data?.message || err.message || "Failed to delete address",
        icon: "error",
        confirmButtonColor: "#0d6efd",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const confirmDeleteAddress = (addressId) => {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to recover this address!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#0d6efd",
      cancelButtonColor: "#dc3545",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        handleDeleteAddress(addressId);
      }
    });
  };

  // -------- Address Edit, Copy --------
  const openEditAddress = (addr) => {
    setSelectedAddressForEdit(addr);
    setShowEditAddressModal(true);
  };

  const closeEditAddress = () => {
    setShowEditAddressModal(false);
    setSelectedAddressForEdit(null);
  };

  const handleAddressSaved = () => {
    fetchUserAddresses(); // Refresh addresses after edit
    closeEditAddress();
  };

  const handleCopyAddress = (address, event) => {
    const fullAddress = `${address.address}, ${address.suburb}, ${address.state}, ${address.country || "Australia"}, ${address.postcode}`;
    navigator.clipboard.writeText(fullAddress);
    
    // Show feedback that address was copied
    const originalText = event.target.textContent;
    event.target.textContent = "Copied!";
    event.target.style.color = "#198754";
    
    setTimeout(() => {
      event.target.textContent = originalText;
      event.target.style.color = "";
    }, 1500);
  };

  return (
    <div className="table-container">
      <h4 className="fw-bold heading py-3">My Addresses</h4>
      {addressError ? (
        <div className="alert alert-danger">{addressError}</div>
      ) : userAddresses.length === 0 ? (
        <div className="alert alert-info">
          You haven't added any addresses yet.
        </div>
      ) : (
        <div className="row">
          {userAddresses.map((address, index) => (
            <div key={address.id || index} className="col-md-12 mb-4">
              <div className="card h-100 bg-white rounded-0">
                <div className="card-body pb-0">
                  <p className="card-text mb-1 small">
                    <span className="fw-semibold me-2">
                      {user?.user?.firstname} {user?.user?.lastname}
                    </span> 
                    {user?.user?.phone && `+${user.user.phone}`}
                  </p>
                  <p className="card-text mb-1 small">
                    {address.address}, {address.suburb}, {address.state}, 
                    {address.country || "Australia"}, {address.postcode}
                  </p>
                </div>
                <div className="card-footer d-flex justify-content-between bg-white border-0 pt-0">
                  <div className="d-flex gap-2 mb-2">
                    {address.is_default && (
                      <span className="badge rounded-0 bg-primary">Default</span>
                    )}
                    {index === 0 && (
                      <span className="badge rounded-0 bg-warning">Recently used</span>
                    )}
                  </div>
                  <div className="d-flex justify-content-end">
                    {/* <button
                      className="btn btn-link text-danger p-0 border-0 small text-decoration-none me-3"
                      onClick={() => confirmDeleteAddress(address.id)}
                      disabled={deletingId === address.id}
                      style={{ cursor: deletingId === address.id ? 'not-allowed' : 'pointer' }}
                    >
                      {deletingId === address.id ? "Deleting..." : "Delete"}
                    </button> */}
                    <button
                      className="btn btn-link text-dark p-0 border-0 small text-decoration-none me-3"
                      onClick={(e) => handleCopyAddress(address, e)}
                    >
                      Copy
                    </button>
                    <button
                      className="btn btn-link text-success p-0 border-0 small text-decoration-none"
                      onClick={() => openEditAddress(address)}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AddressEditModal
        show={showEditAddressModal}
        onClose={closeEditAddress}
        address={selectedAddressForEdit}
        onSaved={handleAddressSaved}
      />
    </div>
  );
};

export default AddressTab;