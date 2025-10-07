import React, { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import PageHeader from "../Components/PageHeader";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import GlobalButton from "../Components/Button";
import AddressEditModal from "../Components/AddressEditModal";
import InvoiceTemplate from "../Components/InvoiceTemplate";
import AddressTab from "../Components/AddressTab";
import RefundTab from "../Components/RefundTab";
import ReviewTab from "../Components/ReviewTab";
import UserTab from "../Components/UserTab";
import RenderOrderCard from "../Components/RenderOrderCard";
import OrderDetailsModal from "../Components/OrderDetailsModal";

const Dashboard = ({ handleLogout }) => {
  // Get initial tab from localStorage or default to "dashboard"
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem("dashboardActiveTab") || "dashboard";
  });
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  
  // Add userAddresses state
  const [userAddresses, setUserAddresses] = useState([]);

  const [orders, setOrders] = useState([]);
  const [unpaidOrders, setUnpaidOrders] = useState([]);
  const [cancellations, setCancellations] = useState([]);
  const [walletData, setWalletData] = useState([]);

  const [error, setError] = useState(null);
  const [cancellationError, setCancellationError] = useState(null);
  const [walletError, setWalletError] = useState(null);
  const [addressError, setAddressError] = useState(null);

  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  const [cancellationReasons] = useState([
    "Changed my mind about the purchase",
    "Found a better price elsewhere",
    "Ordered by mistake",
    "Shipping takes too long",
    "Product specifications don't meet my needs",
    "Other",
  ]);
  const [selectedReason, setSelectedReason] = useState("");
  const [customReason, setCustomReason] = useState("");

  const contentRef = useRef(null);

  // Invoice states
  const [invoiceData, setInvoiceData] = useState(null);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [loadingInvoice, setLoadingInvoice] = useState(false);
  const [invoiceError, setInvoiceError] = useState(null);

  // Update localStorage whenever activeTab changes
  useEffect(() => {
    localStorage.setItem("dashboardActiveTab", activeTab);
  }, [activeTab]);

  // -------- Helper to safely get an item's image URL --------
  const getItemImageUrl = (item) => {
    if (item?.image && /^https?:\/\//i.test(item.image)) return item.image;
    if (item?.image_url && /^https?:\/\//i.test(item.image_url))
      return item.image_url;

    const storageBase = item?.product?.image_url || item?.image_url || "";
    const imgRel =
      item?.product?.images?.[0]?.imgurl || item?.imgurl || item?.image || "";

    if (!storageBase || !imgRel) return "";
    const base = storageBase.replace(/\/+$/, "");
    const rel = imgRel.replace(/^\/+/, "");
    return `${base}/${rel}`;
  };

  // -------- Format Date Helper --------
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    try {
      return new Date(dateString).toLocaleDateString();
    } catch (error) {
      return "Invalid Date";
    }
  };

  // -------- Auth & User Data Fetching --------
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = localStorage.getItem("auth_token");
        if (!token) return performLogout();

        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}api/auth/user`,
          {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          }
        );
        setUser(response.data);
      } catch (err) {
        performLogout();
      }
    };
    fetchUserData();
  }, []);

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
        setUserAddresses(response.data.data);
      } else {
        setAddressError(response.data.message || "Failed to fetch addresses");
      }
    } catch (err) {
      setAddressError(err.response?.data?.message || err.message);
    }
  };

  useEffect(() => {
    if (!user) return;
    (async () => {
      const freshOrders = await fetchUserOrders();
      fetchCancellations();
      fetchWalletData();
      fetchUserAddresses();
    })();
  }, [user]);

  // -------- Order Data Fetching --------
  const fetchUserOrders = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}api/user/orders`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      if (response.data.status === 200) {
        const formattedOrders = response.data.data.map((order) => {
          let amount = parseFloat(order.total_price) || 0;
          if (isNaN(amount)) amount = 0;

          return {
            id: order.order_id,
            date: order.created_at
              ? new Date(order.created_at).toLocaleDateString()
              : new Date().toLocaleDateString(),
            amount,
            status: order.payment_status,
            method: order.payment_method,
            fullData: order,
          };
        });

        setOrders(formattedOrders);

        const unpaid = formattedOrders.filter(
          (order) => order.status !== "paid" && order.status !== "Completed"
        );
        setUnpaidOrders(unpaid);

        return formattedOrders;
      }
      return [];
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      if (err.response?.status === 401) performLogout();
      return [];
    }
  };

  // -------- Order Cancellation Data Fetching --------
  const fetchCancellations = async () => {
    try {
      const token = localStorage.getItem("auth_token");

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}api/orders/cancellations`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setCancellations(response.data.data);
      }
    } catch (err) {
      setCancellationError(err.response?.data?.message || err.message);
    }
  };

  // -------- Refund Data Fetching --------
  const fetchWalletData = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await axios.get(
        `${
          import.meta.env.VITE_API_URL
        }api/orders/cancellations?status=refunded`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        const walletTransactions = response.data.data.map((cancellation) => ({
          id: cancellation.cancellation_id,
          date: cancellation.processed_at || cancellation.requested_at,
          amount:
            parseFloat(cancellation.refund_amount) ||
            parseFloat(cancellation.order_total) ||
            0,
          type: "refund",
          remark: `Refund for order ${cancellation.order_id} - ${cancellation.reason}`,
          status: "completed",
          created_at: cancellation.processed_at || cancellation.requested_at,
        }));

        setWalletData(walletTransactions);
      } else {
        setWalletError(response.data.message || "Failed to fetch wallet data");
      }
    } catch (err) {
      setWalletError(err.response?.data?.message || err.message);
    }
  };

  // -------- Logout helpers --------
  const clearAllCookies = () => {
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i];
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
    }
  };

  const performLogout = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      if (token) {
        await axios.post(
          `${import.meta.env.VITE_API_URL}api/auth/logout`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
            withCredentials: true,
          }
        );
      }
    } catch (err) {
    } finally {
      localStorage.clear();
      sessionStorage.clear();
      clearAllCookies();
      if (handleLogout) handleLogout();
      window.location.href = "/login";
    }
  };

  const confirmLogout = () => {
    Swal.fire({
      title: "Are you sure?",
      text: "Once you log out, you will need to log in again.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#0d6efd",
      cancelButtonColor: "#dc3545",
      confirmButtonText: "Yes, log out!",
      cancelButtonText: "Cancel",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        performLogout();
      }
    });
  };

  // -------- Payment redirect helpers --------
  const redirectToPaymentBySummary = async (orderId) => {
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        Swal.fire({
          title: "Authentication Required",
          text: "Please log in to proceed with payment",
          icon: "warning",
          confirmButtonColor: "#0d6efd",
        });
        return;
      }

      const url = `${
        import.meta.env.VITE_API_URL
      }api/orders/${orderId}/summary`;
      const { data } = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true,
      });

      if (!data?.success || !data?.order_summary) {
        throw new Error("Unable to load order summary");
      }

      const s = data.order_summary;
      const amount = parseFloat(s.total_amount || "0") || 0;

      const pendingOrder = {
        orderId: s.order_id,
        amount,
        currency: "AUD",
        payment_method: (s.payment_method || "stripe").toLowerCase(),
        payment_status: s.payment_status,
        items: (s.items || []).map((it) => ({
          id: it.product_id,
          name: it.product_name || it.name,
          price: parseFloat(it.unit_price || it.ord_price || "0") || 0,
          quantity: parseInt(it.quantity || it.ord_quantity || "1", 10) || 1,
          image_url: getItemImageUrl(it),
        })),
        shippingAddress: s.shipping_address?.address || "",
        suburb: s.shipping_address?.suburb || "",
        state: s.shipping_address?.state || "",
        postcode: String(s.shipping_address?.postcode || ""),
        user_id: s.user_details?.user_id || user?.user?.id,
        user_email: s.user_details?.email || user?.user?.email,
        created_at: s.order_date,
        source: "unpaid_orders_redirect",
      };

      localStorage.setItem("pending_order", JSON.stringify(pendingOrder));

      navigate("/payform", {
        state: { amount, orderId: s.order_id },
      });
    } catch (err) {
      Swal.fire({
        title: "Unable to start payment",
        text:
          err.response?.data?.message ||
          err.message ||
          "Something went wrong while preparing your payment.",
        icon: "error",
        confirmButtonColor: "#0d6efd",
      });
    }
  };

  const redirectToPayment = (order) => {
    if (!user) {
      Swal.fire({
        title: "Authentication Required",
        text: "Please log in to proceed with payment",
        icon: "warning",
        confirmButtonColor: "#0d6efd",
      });
      return;
    }

    const pendingOrder = {
      orderId: order.id,
      amount: order.amount,
      currency: "AUD",
      items:
        (order.fullData?.items || []).map((it) => ({
          ...it,
          image_url: getItemImageUrl(it),
        })) || [],
      shippingAddress: order.fullData?.shippingaddress || "",
      user_id: user.user.id,
      user_email: user.user.email,
      created_at: new Date().toISOString(),
      source: "orders_table_click",
    };

    localStorage.setItem("pending_order", JSON.stringify(pendingOrder));
    navigate("/payform");
  };

  // -------- Order detail modal & helpers --------
  const handleOrderClick = (order) => {
    if (order.status !== "paid" && order.status !== "Completed") {
      return redirectToPaymentBySummary(order.id);
    }

    setSelectedOrder(order);
    setShowOrderModal(true);
    setSelectedReason("");
    setCustomReason("");
  };

  const handleCancelOrder = async () => {
    if (!selectedReason) {
      Swal.fire({
        title: "Reason Required",
        text: "Please select a reason for cancellation",
        icon: "warning",
        confirmButtonColor: "#0d6efd",
      });
      return;
    }

    try {
      const token = localStorage.getItem("auth_token");
      const finalReason =
        selectedReason === "Other" && customReason
          ? customReason
          : selectedReason;

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}api/orders/cancel/request`,
        {
          order_id: selectedOrder.id,
          reason: finalReason,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        Swal.fire({
          title: "Success!",
          text: "Your request is in progress. We will get back to you soon.",
          icon: "success",
          confirmButtonColor: "#0d6efd",
        });

        setShowOrderModal(false);
        fetchUserOrders();
        fetchCancellations();
      } else {
        throw new Error(response.data.message || "Failed to cancel order");
      }
    } catch (err) {
      Swal.fire({
        title: "Error",
        text:
          err.response?.data?.message ||
          err.message ||
          "Failed to process cancellation",
        icon: "error",
        confirmButtonColor: "#0d6efd",
      });
    }
  };

  const confirmCancellation = () => {
    if (!selectedReason) {
      Swal.fire({
        title: "Reason Required",
        text: "Please select a reason for cancellation",
        icon: "warning",
        confirmButtonColor: "#0d6efd",
      });
      return;
    }

    Swal.fire({
      title: "Confirm Cancellation",
      html: `Are you sure you want to cancel order?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#0d6efd",
      cancelButtonColor: "#dc3545",
      confirmButtonText: "Yes, cancel order",
      cancelButtonText: "No, keep it",
      reverseButtons: true,
    }).then((result) => {
      if (result.isConfirmed) {
        handleCancelOrder();
      }
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case "pending":
        return "bg-warning";
      case "refunded":
        return "bg-success";
      case "rejected":
        return "bg-danger";
      default:
        return "bg-secondary";
    }
  };

  const getWalletStatusBadgeClass = (status) => {
    switch (status) {
      case "completed":
      case "success":
        return "bg-success";
      case "pending":
        return "bg-warning";
      case "failed":
      case "rejected":
        return "bg-danger";
      default:
        return "bg-secondary";
    }
  };

  // -------- Invoice Function --------
  const fetchInvoice = async (orderId) => {
    try {
      setLoadingInvoice(true);
      setInvoiceError(null);

      const token = localStorage.getItem("auth_token");
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}api/invoice/${orderId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
          withCredentials: true,
        }
      );

      if (response.data.success) {
        setInvoiceData(response.data.data);
        setShowInvoiceModal(true);
      } else {
        throw new Error(response.data.message || "Failed to fetch invoice");
      }
    } catch (err) {
      setInvoiceError(err.response?.data?.message || err.message);
      Swal.fire({
        title: "Error",
        text: "Failed to load invoice. Please try again.",
        icon: "error",
        confirmButtonColor: "#0d6efd",
      });
    } finally {
      setLoadingInvoice(false);
    }
  };

  // ------ Content Renderer ------
  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <UserTab user={user} />;

      case "addresses":
        return (
          <AddressTab 
            user={user}
            userAddresses={userAddresses}
            onAddressesUpdate={setUserAddresses}
          />
        );

      case "wallet":
        return (
          <div className="table-container">
            <h4 className="fw-bold heading py-3">My Wallet</h4>
            {walletError ? (
              <div className="alert alert-danger">{walletError}</div>
            ) : walletData.length === 0 ? (
              <div className="alert alert-info">
                You don't have any wallet transactions yet.
              </div>
            ) : (
              <div className="row">
                {walletData.map((transaction, index) => (
                  <div key={index} className="col-md-12 mb-4">
                    <div className="card h-100 bg-white rounded-0">
                      <div className="card-header bg-light d-flex justify-content-between align-items-center">
                        <div>
                          <span className="text-muted small">
                            {new Date(transaction.date).toLocaleDateString()}
                          </span>
                        </div>
                        <div>
                          <span
                            className={`badge ${getWalletStatusBadgeClass(
                              transaction.status
                            )} text-white text-capitalize rounded-0`}
                          >
                            {transaction.status}
                          </span>
                        </div>
                      </div>

                      <div className="card-body">
                        <div className="row">
                          <div className="col-md-8">
                            <h6 className="fw-bold">
                              ${transaction.amount.toFixed(2)}
                            </h6>
                            <p className="text-muted small mb-2 text-capitalize">
                              {transaction.type}
                            </p>
                            <p className="mb-0">
                              {transaction.remark || "N/A"}
                            </p>
                          </div>

                          <div className="col-md-4">
                            <div className="d-flex flex-column gap-2">
                              <p className="mb-0 text-muted small">
                                Transaction ID: {transaction.id}
                              </p>
                              <p className="mb-0 text-muted small">
                                Processed:{" "}
                                {new Date(
                                  transaction.created_at
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="card-footer bg-white d-flex justify-content-between">
                        <div className="d-flex gap-3">
                          <p className="text-muted small mb-0">
                            Amount: ${transaction.amount.toFixed(2)}
                          </p>
                          <p className="text-muted small mb-0">
                            Type: {transaction.type}
                          </p>
                        </div>
                        <p className="text-muted small mb-0">
                          Date:{" "}
                          {new Date(transaction.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "orders":
        return (
          <div className="table-container">
            <h4 className="fw-bold heading py-3">My Orders</h4>
            {error ? (
              <div className="alert alert-danger">{error}</div>
            ) : orders.length === 0 ? (
              <div className="alert alert-info">
                You haven't placed any orders yet.
              </div>
            ) : (
              <div>
                {orders.map((order) => (
                  <RenderOrderCard
                    key={order.id}
                    order={order}
                    user={user}
                    getItemImageUrl={getItemImageUrl}
                    formatDate={formatDate}
                    redirectToPaymentBySummary={redirectToPaymentBySummary}
                    fetchInvoice={fetchInvoice}
                    handleOrderClick={handleOrderClick}
                  />
                ))}
              </div>
            )}
          </div>
        );

      case "unpaidOrders":
        return (
          <div className="table-container">
            <h4 className="fw-bold heading py-3">Unpaid Orders</h4>
            {error ? (
              <div className="alert alert-danger">{error}</div>
            ) : unpaidOrders.length === 0 ? (
              <div className="alert alert-info">
                You don't have any unpaid orders.
              </div>
            ) : (
              <div>
                {unpaidOrders.map((order) => (
                  <RenderOrderCard
                    key={order.id}
                    order={order}
                    user={user}
                    getItemImageUrl={getItemImageUrl}
                    formatDate={formatDate}
                    redirectToPaymentBySummary={redirectToPaymentBySummary}
                    fetchInvoice={fetchInvoice}
                    handleOrderClick={handleOrderClick}
                  />
                ))}
              </div>
            )}
          </div>
        );

      case "refund":
        return (
          <RefundTab
            cancellations={cancellations}
            cancellationError={cancellationError}
            formatDate={formatDate}
            getStatusBadgeClass={getStatusBadgeClass}
            getItemImageUrl={getItemImageUrl}
          />
        );

      case "reviews":
        return (
          <ReviewTab
            user={user}
            orders={orders}
            fetchUserOrders={fetchUserOrders}
            getItemImageUrl={getItemImageUrl}
          />
        );

      default:
        return <p className="text-muted small">Please select a tab.</p>;
    }
  };

  // Tab change handler
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <>
      <PageHeader title="Shop" path="Home / Dashboard" />
      <div className="container py-5">
        <div className="row">
          <div className="col-md-3 p-0">
            <div className="d-flex align-items-center p-3 gap-3">
              <div
                className="bg-white border text-white rounded-circle d-flex align-items-center justify-content-center"
                style={{ width: "50px", height: "50px", overflow: "hidden" }}
              >
                {user?.user ? (
                  <span className="fw-bold text-dark">
                    {user.user.firstname?.charAt(0).toUpperCase() || "U"}
                  </span>
                ) : (
                  <span
                    aria-hidden="true"
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "block",
                      borderRadius: "50%",
                      background: "#e9ecef",
                    }}
                  />
                )}
              </div>

              <div>
                {user?.user ? (
                  <>
                    <p
                      className="mb-0 small heading fw-bold text-truncate"
                      style={{ maxWidth: "180px" }}
                      title={`${user.user.firstname} ${user.user.lastname}`}
                    >
                      {user.user.firstname} {user.user.lastname}
                    </p>
                    <p
                      className="mb-0 text-muted small text-truncate"
                      style={{ maxWidth: "180px" }}
                      title={user.user.email}
                    >
                      {user.user.email}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="mb-1 bg-light rounded" style={{ width: "160px", height: "16px" }} />
                    <div className="bg-light rounded" style={{ width: "140px", height: "14px" }} />
                  </>
                )}
              </div>
            </div>

            <ul className="list-group heading rounded-0 d-none d-md-block">
              <li
                className={`list-group-item border-0 p-2 ${
                  activeTab === "dashboard"
                    ? "active text-primary active-tab ps-1"
                    : ""
                }`}
                onClick={() => handleTabChange("dashboard")}
                style={{ cursor: "pointer" }}
              >
                <i className="bi bi-speedometer2 p-2 me-2 fs-3 text-primary"></i>{" "}
                Dashboard
              </li>
              <li
                className={`list-group-item border-0 p-2${
                  activeTab === "orders"
                    ? "active text-primary active-tab ps-1"
                    : ""
                }`}
                onClick={() => handleTabChange("orders")}
                style={{ cursor: "pointer" }}
              >
                <i className="bi bi-bag-check p-2 me-2 fs-4 text-primary"></i>{" "}
                My Orders
              </li>
              <li
                className={`list-group-item border-0 p-2 ${
                  activeTab === "unpaidOrders"
                    ? "active text-primary active-tab ps-1"
                    : ""
                }`}
                onClick={() => handleTabChange("unpaidOrders")}
                style={{ cursor: "pointer" }}
              >
                <i className="bi bi-bag-x p-2 me-2 fs-4 text-primary"></i>{" "}
                Unpaid Orders
              </li>

              <li
                className={`list-group-item border-0 p-2 ${
                  activeTab === "refund"
                    ? "active text-primary ps-1 active-tab"
                    : ""
                }`}
                onClick={() => handleTabChange("refund")}
                style={{ cursor: "pointer" }}
              >
                <i className="bi bi-clock-history p-2 me-2 fs-4 text-primary"></i>{" "}
                Refund History
              </li>

              <li
                className={`list-group-item border-0 p-2${
                  activeTab === "addresses"
                    ? "active text-primary active-tab ps-1"
                    : ""
                }`}
                onClick={() => handleTabChange("addresses")}
                style={{ cursor: "pointer" }}
              >
                <i className="bi bi-geo-alt p-2 me-2 fs-4 text-primary"></i>
                Addresses
              </li>

              <li
                className={`list-group-item border-0 p-2${
                  activeTab === "reviews"
                    ? "active text-primary active-tab ps-1"
                    : ""
                }`}
                onClick={() => handleTabChange("reviews")}
                style={{ cursor: "pointer" }}
              >
                <i className="bi bi-chat-left-text p-2 me-2 fs-4 text-primary"></i>
                My Reviews
              </li>

              <li
                className={`list-group-item border-0 p-2 ${
                  activeTab === "logout"
                    ? "active text-primary ps-1 active-tab"
                    : ""
                }`}
                onClick={confirmLogout}
                style={{ cursor: "pointer" }}
              >
                <i className="bi bi-box-arrow-right p-2 me-2 fs-4 text-primary"></i>{" "}
                Logout
              </li>
            </ul>

            {/* Mobile tabs */}
            <div className="d-md-none mb-3">
              <div className="row row-cols-4 g-2 p-2 text-center">
                <div
                  className="border py-3"
                  onClick={() => handleTabChange("dashboard")}
                  style={{ cursor: "pointer" }}
                >
                  <i className="bi bi-speedometer2 fs-3 text-primary"></i>
                  <p className="m-0 small">Dashboard</p>
                </div>
                <div
                  className="border py-3"
                  onClick={() => handleTabChange("orders")}
                  style={{ cursor: "pointer" }}
                >
                  <i className="bi bi-bag-check fs-3 text-primary"></i>
                  <p className="m-0 small">My Orders</p>
                </div>
                <div
                  className="border py-3"
                  onClick={() => handleTabChange("unpaidOrders")}
                  style={{ cursor: "pointer" }}
                >
                  <i className="bi bi-bag-x fs-3 text-primary"></i>
                  <p className="m-0 small">Unpaid Orders</p>
                </div>
                <div
                  className="border py-3"
                  onClick={() => handleTabChange("refund")}
                  style={{ cursor: "pointer" }}
                >
                  <i className="bi bi-clock-history fs-3 text-primary"></i>
                  <p className="m-0 small">Refund History</p>
                </div>
                <div
                  className="border py-3"
                  onClick={() => handleTabChange("addresses")}
                  style={{ cursor: "pointer" }}
                >
                  <i className="bi bi-geo-alt fs-3 text-primary"></i>
                  <p className="m-0 small">Address</p>
                </div>
                <div
                  className="border py-3"
                  onClick={() => handleTabChange("reviews")}
                  style={{ cursor: "pointer" }}
                >
                  <i className="bi bi-chat-left-text fs-3 text-primary"></i>
                  <p className="m-0 small">My Reviews</p>
                </div>
                <div
                  className="border py-3"
                  onClick={confirmLogout}
                  style={{ cursor: "pointer" }}
                >
                  <i className="bi bi-box-arrow-right fs-3 text-primary"></i>
                  <p className="m-0 small">Logout</p>
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-9 content-scrollable" ref={contentRef}>
            <div className="mx-3 p-0 p-md-3">{renderContent()}</div>
          </div>
        </div>
      </div>

      {showOrderModal && (
        <OrderDetailsModal
          showOrderModal={showOrderModal}
          setShowOrderModal={setShowOrderModal}
          selectedOrder={selectedOrder}
          user={user}
          getItemImageUrl={getItemImageUrl}
          fetchUserOrders={fetchUserOrders}
          fetchCancellations={fetchCancellations}
        />
      )}

      {showInvoiceModal && (
        <InvoiceTemplate
          invoiceData={invoiceData}
          onClose={() => {
            setShowInvoiceModal(false);
            setInvoiceData(null);
          }}
        />
      )}
    </>
  );
};

export default Dashboard;