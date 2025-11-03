import React, { useState, useEffect, useRef } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import PageHeader from "../Components/PageHeader";
import { api } from '../Config';
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
import NotificationTab from "../Components/NotificationTab";
import ApprovedReviewsTab from "../Components/ApprovedReviewsTab.jsx";

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
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [error, setError] = useState(null);
  const [cancellationError, setCancellationError] = useState(null);
  const [walletError, setWalletError] = useState(null);
  const [addressError, setAddressError] = useState(null);
  const [notificationError, setNotificationError] = useState(null);

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

  // Live update states
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const eventSourceRef = useRef(null);
  const pollingIntervalsRef = useRef({});

  // Update localStorage whenever activeTab changes
  useEffect(() => {
    localStorage.setItem("dashboardActiveTab", activeTab);
  }, [activeTab]);

  // -------- Real-time Updates Setup --------
  const setupRealTimeUpdates = () => {
    // Try Server-Sent Events first
    setupSSE();
    
    // Setup polling as fallback
    setupPolling();
  };

  const setupSSE = () => {
    try {
      const eventSource = new EventSource(`/api/events`);

      eventSource.onopen = () => {
        console.log("SSE Connected");
        setIsConnected(true);
      };

      eventSource.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleRealTimeUpdate(data);
        setLastUpdate(new Date());
      };

      eventSource.onerror = (error) => {
        console.error("SSE Error:", error);
        setIsConnected(false);
        eventSource.close();
        // Fall back to polling
        setupPolling();
      };

      eventSourceRef.current = eventSource;

      return () => {
        eventSource.close();
      };
    } catch (error) {
      console.error("SSE setup failed:", error);
      setupPolling();
    }
  };

  const setupPolling = () => {
    // Clear existing intervals
    Object.values(pollingIntervalsRef.current).forEach(clearInterval);
    
    // Poll orders every 30 seconds
    pollingIntervalsRef.current.orders = setInterval(() => {
      fetchUserOrders();
    }, 30000);

    // Poll notifications every 20 seconds
    pollingIntervalsRef.current.notifications = setInterval(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, 20000);

    // Poll cancellations every 45 seconds
    pollingIntervalsRef.current.cancellations = setInterval(() => {
      fetchCancellations();
      fetchWalletData();
    }, 45000);

    console.log("Polling setup completed");
  };

  const handleRealTimeUpdate = (data) => {
    switch (data.type) {
      case 'order_updated':
        updateOrderInState(data.order);
        break;
      case 'order_created':
        addOrderToState(data.order);
        break;
      case 'notification_created':
        addNotificationToState(data.notification);
        break;
      case 'notification_updated':
        updateNotificationInState(data.notification);
        break;
      case 'cancellation_updated':
        updateCancellationInState(data.cancellation);
        break;
      case 'wallet_updated':
        updateWalletData(data.wallet);
        break;
      default:
        console.log('Unknown event type:', data.type);
    }
  };

  // State update helpers for real-time
  const updateOrderInState = (updatedOrder) => {
    setOrders(prev => prev.map(order => 
      order.id === updatedOrder.order_id ? formatOrder(updatedOrder) : order
    ));
    setUnpaidOrders(prev => prev.filter(order => 
      order.status === "paid" || order.status === "Completed"
    ));
  };

  const addOrderToState = (newOrder) => {
    const formattedOrder = formatOrder(newOrder);
    setOrders(prev => [formattedOrder, ...prev]);
    if (formattedOrder.status !== "paid" && formattedOrder.status !== "Completed") {
      setUnpaidOrders(prev => [formattedOrder, ...prev]);
    }
  };

  const addNotificationToState = (newNotification) => {
    setNotifications(prev => [newNotification, ...prev]);
    if (newNotification.status === 'unread') {
      setUnreadCount(prev => prev + 1);
    }
  };

  const updateNotificationInState = (updatedNotification) => {
    setNotifications(prev => prev.map(notification =>
      notification.notification_id === updatedNotification.notification_id 
        ? updatedNotification 
        : notification
    ));
    
    // Update unread count
    const unread = notifications.filter(n => n.status === 'unread').length;
    setUnreadCount(unread);
  };

  const updateCancellationInState = (updatedCancellation) => {
    setCancellations(prev => prev.map(cancellation =>
      cancellation.cancellation_id === updatedCancellation.cancellation_id
        ? updatedCancellation
        : cancellation
    ));
  };

  const updateWalletData = (newWalletData) => {
    setWalletData(prev => [newWalletData, ...prev]);
  };

  // Format order helper
  const formatOrder = (order) => {
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
  };

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
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
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

        const response = await api.get("/auth/user");
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
      const response = await api.get("/address");

      if (response.data.status === 200) {
        setUserAddresses(response.data.data);
      } else {
        setAddressError(response.data.message || "Failed to fetch addresses");
      }
    } catch (err) {
      setAddressError(err.response?.data?.message || err.message);
    }
  };

  // -------- Notification Data Fetching --------
  const fetchNotifications = async () => {
    try {
      const response = await api.get("/notifications");

      if (response.data.success) {
        setNotifications(response.data.data || []);
        setNotificationError(null);
      } else {
        throw new Error(response.data.message || "Failed to fetch notifications");
      }
    } catch (err) {
      console.error("Error fetching notifications:", err);
      setNotificationError(err.response?.data?.message || err.message);
    }
  };

  // -------- Unread Count Fetching --------
  const fetchUnreadCount = async () => {
    try {
      const response = await api.get("/notifications/unread-count");

      if (response.data.success) {
        setUnreadCount(response.data.unread_count || 0);
      }
    } catch (err) {
      console.error("Error fetching unread count:", err);
      // Calculate from local notifications as fallback
      const unread = notifications.filter(n => n.status === 'unread').length;
      setUnreadCount(unread);
    }
  };

  // -------- Mark Notification as Read --------
  const markNotificationAsRead = async (notificationId) => {
    try {
      const response = await api.put(`/notifications/${notificationId}/read`, {});

      if (response.data.success) {
        // Update local state immediately for better UX
        setNotifications(prev =>
          prev.map(notification =>
            notification.notification_id === notificationId
              ? { ...notification, status: "read", read_at: new Date().toISOString() }
              : notification
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      } else {
        console.error("Failed to mark as read:", response.data.message);
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  // -------- Mark All Notifications as Read --------
  const markAllNotificationsAsRead = async () => {
    try {
      const response = await api.put("/notifications/read-all", {});

      if (response.data.success) {
        // Update all notifications to read immediately
        setNotifications(prev =>
          prev.map(notification => ({
            ...notification,
            status: "read",
            read_at: notification.read_at || new Date().toISOString(),
          }))
        );
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  // -------- Delete Notification --------
  const deleteNotification = async (notificationId) => {
    try {
      const response = await api.delete(`/notifications/${notificationId}`);

      if (response.data.success) {
        // Remove from local state immediately
        setNotifications(prev =>
          prev.filter(notification => notification.notification_id !== notificationId)
        );
        // Recalculate unread count
        const unread = notifications.filter(n => n.status === 'unread').length;
        setUnreadCount(unread);
      } else {
        console.error("Failed to delete notification:", response.data.message);
      }
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  };

  // -------- Clear All Notifications --------
  const clearAllNotifications = async () => {
    try {
      const response = await api.delete("/notifications");

      if (response.data.success) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Error clearing all notifications:", err);
    }
  };

  // Handle notifications update from child component
  const handleNotificationsUpdate = (updatedNotifications) => {
    setNotifications(updatedNotifications);
    const unread = updatedNotifications.filter(n => n.status === 'unread').length;
    setUnreadCount(unread);
  };

  // Initial data fetch and real-time setup
  useEffect(() => {
    if (!user) return;

    const fetchAllData = async () => {
      await fetchUserOrders();
      await fetchCancellations();
      await fetchWalletData();
      await fetchUserAddresses();
      await fetchNotifications();
      await fetchUnreadCount();
      
      // Setup real-time updates after initial data load
      setupRealTimeUpdates();
    };

    fetchAllData();

    // Cleanup function
    return () => {
      // Close SSE connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      
      // Clear all polling intervals
      Object.values(pollingIntervalsRef.current).forEach(clearInterval);
    };
  }, [user]);

  // -------- Order Data Fetching --------
  const fetchUserOrders = async () => {
    try {
      const response = await api.get("/user/orders");

      if (response.data.status === 200) {
        const formattedOrders = response.data.data.map(formatOrder);
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
      const response = await api.get("/orders/cancellations");

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
      const response = await api.get("/orders/cancellations?status=refunded");

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
        await api.post("/auth/logout", {});
      }
    } catch (err) {
      // Logout should proceed even if API call fails
    } finally {
      // Cleanup real-time connections
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      Object.values(pollingIntervalsRef.current).forEach(clearInterval);
      
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

      const { data } = await api.get(`/orders/${orderId}/summary`);

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
      const finalReason =
        selectedReason === "Other" && customReason
          ? customReason
          : selectedReason;

      const response = await api.post("/orders/cancel/request", {
        order_id: selectedOrder.id,
        reason: finalReason,
      });

      if (response.data.success) {
        Swal.fire({
          title: "Success!",
          text: "Your request is in progress. We will get back to you soon.",
          icon: "success",
          confirmButtonColor: "#0d6efd",
        });

        setShowOrderModal(false);
        // Real-time updates will handle the refresh automatically
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

      const response = await api.get(`/invoice/${orderId}`);

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

  // Manual refresh function
  const refreshAllData = async () => {
    try {
      await fetchUserOrders();
      await fetchCancellations();
      await fetchWalletData();
      await fetchNotifications();
      await fetchUnreadCount();
      setLastUpdate(new Date());
      
      Swal.fire({
        title: "Refreshed!",
        text: "All data has been updated.",
        icon: "success",
        confirmButtonColor: "#0d6efd",
        timer: 1500
      });
    } catch (error) {
      console.error("Error refreshing data:", error);
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
            <div className="d-flex justify-content-between align-items-center py-3">
              <h4 className="fw-bold heading m-0">My Wallet</h4>
              <button 
                className="btn btn-outline-primary btn-sm rounded-0"
                onClick={refreshAllData}
              >
                <i className="bi bi-arrow-clockwise me-1"></i>
                Refresh
              </button>
            </div>
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
            <div className="d-flex justify-content-between align-items-center py-3">
              <h4 className="fw-bold heading m-0">My Orders</h4>
              <button 
                className="btn btn-outline-primary btn-sm rounded-0"
                onClick={refreshAllData}
              >
                <i className="bi bi-arrow-clockwise me-1"></i>
                Refresh
              </button>
            </div>
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
            <div className="d-flex justify-content-between align-items-center py-3">
              <h4 className="fw-bold heading m-0">Unpaid Orders</h4>
              <button 
                className="btn btn-outline-primary btn-sm rounded-0"
                onClick={refreshAllData}
              >
                <i className="bi bi-arrow-clockwise me-1"></i>
                Refresh
              </button>
            </div>
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
            onRefresh={refreshAllData}
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

      case "approvedReviews":
        return (
          <ApprovedReviewsTab
            user={user}
            formatDate={formatDate}
            onRefresh={refreshAllData}
          />
        );

      case "notifications":
        return (
          <NotificationTab
            notifications={notifications}
            formatDate={formatDate}
            onMarkAsRead={markNotificationAsRead}
            onMarkAllAsRead={markAllNotificationsAsRead}
            onDeleteNotification={deleteNotification}
            onClearAllNotifications={clearAllNotifications}
            onNotificationsUpdate={handleNotificationsUpdate}
            error={notificationError}
            onRefresh={refreshAllData}
            user={user}
            getItemImageUrl={getItemImageUrl}
            fetchUserOrders={fetchUserOrders}
            fetchCancellations={fetchCancellations}
            orders={orders}
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
      
      {/* Connection Status Indicator */}
      <div className="container-fluid bg-light py-2 border-bottom">
        <div className="container">
          <div className="row align-items-center">
            {/* <div className="col-md-6">
              <small className="text-muted">
                <i className={`bi bi-circle-fill me-1 ${isConnected ? 'text-success' : 'text-warning'}`}></i>
                {isConnected ? 'Live updates connected' : 'Using polling updates'}
                <span className="ms-2">Last update: {formatDate(lastUpdate)}</span>
              </small>
            </div> */}
            {/* <div className="col-md-6 text-end">
              <button 
                className="btn btn-outline-secondary btn-sm rounded-0"
                onClick={refreshAllData}
                title="Refresh all data"
              >
                <i className="bi bi-arrow-clockwise me-1"></i>
                Refresh Now
              </button>
            </div> */}
          </div>
        </div>
      </div>

      <div className="container py-4">
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
                className={`list-group-item border-0 p-2 ${
                  activeTab === "notifications"
                    ? "active text-primary ps-1 active-tab"
                    : ""
                }`}
                onClick={() => handleTabChange("notifications")}
                style={{ cursor: "pointer" }}
              >
                <i className="bi bi-bell p-2 me-2 fs-4 text-primary"></i>
                Notifications
                {unreadCount > 0 && (
                  <span className="badge bg-danger ms-2 rounded-pill">
                    {unreadCount}
                  </span>
                )}
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
                className={`list-group-item border-0 p-2 ${
                  activeTab === "approvedReviews"
                    ? "active text-primary ps-1 active-tab"
                    : ""
                }`}
                onClick={() => handleTabChange("approvedReviews")}
                style={{ cursor: "pointer" }}
              >
                <i className="bi bi-star p-2 me-2 fs-4 text-primary"></i>
                My Reviews
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
                To Be Reviews
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
                  onClick={() => handleTabChange("approvedReviews")}
                  style={{ cursor: "pointer" }}
                >
                  <i className="bi bi-star-fill fs-3 text-primary"></i>
                  <p className="m-0 small">Approved</p>
                </div>
                <div
                  className="border py-3 position-relative"
                  onClick={() => handleTabChange("notifications")}
                  style={{ cursor: "pointer" }}
                >
                  <i className="bi bi-bell fs-3 text-primary"></i>
                  <p className="m-0 small">Notifications</p>
                  {unreadCount > 0 && (
                    <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                      {unreadCount}
                    </span>
                  )}
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