import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import OrderDetailsModal from "./OrderDetailsModal";

const NotificationTab = ({ 
  formatDate, 
  user, 
  getItemImageUrl, 
  fetchUserOrders, 
  fetchCancellations,
  orders // Pass orders from Dashboard to find order details
}) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Order Details Modal State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await axios.get("/api/notifications", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data.success) {
        setNotifications(response.data.data);
      }
    } catch (err) {
      setError("Failed to fetch notifications");
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await axios.get("/api/notifications/unread-count", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data.success) {
        setUnreadCount(response.data.unread_count);
      }
    } catch (err) {
      console.error("Error fetching unread count:", err);
    }
  }, []);

  // Mark notification as read
  const markAsRead = useCallback(async (notificationId) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await axios.put(
        `/api/notifications/${notificationId}/read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        // Update local state
        setNotifications(prev =>
          prev.map(notif =>
            notif.notification_id === notificationId
              ? { ...notif, status: "read", read_at: new Date().toISOString() }
              : notif
          )
        );
        // Refresh unread count
        fetchUnreadCount();
      } else {
        console.error("Failed to mark as read:", response.data.message);
      }
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  }, [fetchUnreadCount]);

  // Mark all as read
  const markAllAsRead = useCallback(async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await axios.put(
        "/api/notifications/read-all",
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        // Update all notifications to read
        setNotifications(prev =>
          prev.map(notif => ({
            ...notif,
            status: "read",
            read_at: notif.read_at || new Date().toISOString(),
          }))
        );
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  }, []);

  // Delete single notification
  const deleteNotification = useCallback(async (notificationId) => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await axios.delete(
        `/api/notifications/${notificationId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.success) {
        // Remove from local state
        setNotifications(prev =>
          prev.filter(notif => notif.notification_id !== notificationId)
        );
        // Refresh unread count
        fetchUnreadCount();
      } else {
        console.error("Failed to delete notification:", response.data.message);
      }
    } catch (err) {
      console.error("Error deleting notification:", err);
    }
  }, [fetchUnreadCount]);

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await axios.delete("/api/notifications", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.data.success) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (err) {
      console.error("Error clearing all notifications:", err);
    }
  }, []);

  // Handle notification click (mark as read when clicked)
  const handleNotificationClick = useCallback((notification) => {
    if (notification.status === "unread") {
      markAsRead(notification.notification_id);
    }
  }, [markAsRead]);

  // Handle View Order button click - FIXED VERSION
  const handleViewOrder = useCallback(async (orderId) => {
    try {
      console.log("Looking for order:", orderId);
      
      // Method 1: Try to find order in existing orders from Dashboard
      if (orders && Array.isArray(orders)) {
        const existingOrder = orders.find(order => order.id === orderId);
        
        if (existingOrder) {
          console.log("Found order in existing orders:", existingOrder);
          setSelectedOrder(existingOrder);
          setShowOrderModal(true);
          
          // Mark notification as read when viewing order
          const notification = notifications.find(
            n => n.data?.order_id === orderId
          );
          if (notification && notification.status === "unread") {
            markAsRead(notification.notification_id);
          }
          return;
        }
      }

      // Method 2: Try to fetch order details from API with correct endpoint
      const token = localStorage.getItem("auth_token");
      
      // Try different API endpoints
      const endpoints = [
        `/api/orders/${orderId}`,
        `/api/user/orders/${orderId}`,
        `/api/order/${orderId}`,
        `/api/order/details/${orderId}`
      ];

      let orderData = null;

      for (const endpoint of endpoints) {
        try {
          console.log(`Trying endpoint: ${endpoint}`);
          const response = await axios.get(endpoint, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          });

          if (response.data.success) {
            orderData = response.data.data;
            console.log("Order data found from API:", orderData);
            break;
          }
        } catch (apiError) {
          console.log(`Endpoint ${endpoint} failed:`, apiError.message);
          continue;
        }
      }

      if (!orderData) {
        // Method 3: Create a mock order object from notification data
        console.log("Creating order from notification data");
        const notification = notifications.find(
          n => n.data?.order_id === orderId
        );

        if (notification) {
          orderData = {
            id: orderId,
            date: notification.created_at
              ? new Date(notification.created_at).toLocaleDateString()
              : new Date().toLocaleDateString(),
            amount: parseFloat(notification.data?.refund_amount) || 0,
            status: "completed", // Default status
            method: "unknown",
            fullData: {
              order_id: orderId,
              created_at: notification.created_at,
              payment_status: "paid",
              payment_method: "unknown",
              shippingaddress: "Address not available",
              items: [], // Empty items array
              ...notification.data // Include any additional data from notification
            },
          };
        } else {
          throw new Error("Could not find order details");
        }
      }

      // Format the order data to match what OrderDetailsModal expects
      const formattedOrder = {
        id: orderData.order_id || orderData.id,
        date: orderData.created_at
          ? new Date(orderData.created_at).toLocaleDateString()
          : new Date().toLocaleDateString(),
        amount: parseFloat(orderData.total_price || orderData.amount) || 0,
        status: orderData.payment_status || orderData.status,
        method: orderData.payment_method || orderData.method,
        fullData: orderData.fullData || orderData,
      };

      setSelectedOrder(formattedOrder);
      setShowOrderModal(true);
      
      // Mark notification as read when viewing order
      const notification = notifications.find(
        n => n.data?.order_id === orderId
      );
      if (notification && notification.status === "unread") {
        markAsRead(notification.notification_id);
      }

    } catch (err) {
      console.error("Error handling view order:", err);
      
      // Show user-friendly error message
      // Using window.alert as a fallback since Swal is not defined
      window.alert("Order Not Found: We couldn't load the order details. The order might be from an older notification or has been archived.");
    }
  }, [orders, notifications, markAsRead]);

  // Fetch data on component mount
  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();

    // Set up live updates polling
    const interval = setInterval(() => {
      fetchNotifications();
      fetchUnreadCount();
    }, 30000); // Poll every 30 seconds

    // Cleanup interval on unmount
    return () => {
      clearInterval(interval);
    };
  }, [fetchNotifications, fetchUnreadCount]);

  const getNotificationIcon = (type) => {
    switch (type) {
      case "order_cancelled":
      case "cancellation_request":
        return "bi bi-arrow-clockwise text-success";
      case "order_shipped":
        return "bi bi-truck text-warning";
      case "payment":
        return "bi bi-credit-card text-info";
      case "refund":
        return "bi bi-arrow-counterclockwise text-danger";
      case "system":
        return "bi bi-bell text-secondary";
      default:
        return "bi bi-bell text-primary";
    }
  };

  const getNotificationBadgeClass = (status) => {
    switch (status) {
      case "unread":
        return "bg-primary";
      case "read":
        return "bg-secondary";
      case "important":
        return "bg-danger";
      default:
        return "bg-secondary";
    }
  };

  // Format notification data to match component structure
  const formatNotificationData = useCallback((notification) => ({
    id: notification.notification_id,
    type: notification.type,
    title: notification.title,
    message: notification.message,
    status: notification.status,
    created_at: notification.created_at,
    metadata: {
      orderId: notification.data?.order_id,
      amount: notification.data?.refund_amount,
      cancellationId: notification.data?.cancellation_id,
      trackingNumber: notification.data?.tracking_number,
      adminName: notification.data?.admin_name,
      adminNotes: notification.data?.admin_notes,
    },
    actions: getNotificationActions(notification),
  }), []);

  // Generate actions based on notification type
  const getNotificationActions = useCallback((notification) => {
    const actions = [];
    
    if (notification.data?.order_id) {
      actions.push({
        label: "View Order",
        primary: true,
        onClick: () => handleViewOrder(notification.data.order_id),
      });
    }

    if (notification.status === "unread") {
      actions.push({
        label: "Mark as Read",
        primary: false,
        onClick: () => markAsRead(notification.notification_id),
      });
    }

    actions.push({
      label: "Clear",
      primary: false,
      onClick: () => deleteNotification(notification.notification_id),
    });

    return actions;
  }, [handleViewOrder, markAsRead, deleteNotification]);

  if (loading) {
    return (
      <div className="table-container">
        <h4 className="fw-bold heading py-3">Notifications</h4>
        <div className="d-flex justify-content-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="table-container">
        <h4 className="fw-bold heading py-3">Notifications</h4>
        <div className="alert alert-danger">
          <i className="bi bi-exclamation-triangle me-2"></i>
          {error}
        </div>
      </div>
    );
  }

  if (!notifications || notifications.length === 0) {
    return (
      <div className="table-container">
        <h4 className="fw-bold heading py-3">Notifications</h4>
        <div className="alert alert-info">
          <i className="bi bi-bell-slash me-2"></i>
          You don't have any notifications yet.
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="table-container">
        <div className="d-flex justify-content-between align-items-center py-3">
          <h4 className="fw-bold heading m-0">Notifications</h4>
          <div className="d-flex gap-2">
            {unreadCount > 0 && (
              <button
                className="btn btn-outline-primary btn-sm rounded-0"
                onClick={markAllAsRead}
              >
                <i className="bi bi-check-all me-1"></i>
                Mark All as Read
              </button>
            )}
            <button
              className="btn btn-outline-danger btn-sm rounded-0"
              onClick={clearAllNotifications}
            >
              <i className="bi bi-trash me-1"></i>
              Clear All
            </button>
          </div>
        </div>

        <div className="row">
          {notifications.map((notification, index) => {
            const formattedNotification = formatNotificationData(notification);
            
            return (
              <div key={notification.notification_id || index} className="col-md-12 mb-3">
                <div 
                  className={`card h-100 rounded-0 border-start-0 border-end-0 border-top-0 ${
                    notification.status === "unread" ? "border-primary border-2" : "border-light"
                  }`}
                  style={{ cursor: 'pointer' }}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="card-body">
                    <div className="row align-items-center">
                      <div className="col-auto">
                        <i className={`${getNotificationIcon(notification.type)} fs-4`}></i>
                      </div>
                      
                      <div className="col">
                        <div className="d-flex justify-content-between align-items-start">
                          <h6 className="fw-bold mb-1">{notification.title}</h6>
                          <div className="d-flex gap-2 align-items-center">
                            {notification.status === "unread" && (
                              <span className={`badge ${getNotificationBadgeClass(notification.status)} text-white rounded-0`}>
                                New
                              </span>
                            )}
                            <small className="text-muted">
                              {formatDate ? formatDate(notification.created_at) : 
                                new Date(notification.created_at).toLocaleDateString()}
                            </small>
                          </div>
                        </div>
                        
                        <p className="mb-2 text-muted small">{notification.message}</p>
                        
                        {notification.data && (
                          <div className="mt-2">
                            {notification.data.order_id && (
                              <span className="badge bg-light text-dark me-2 rounded-0">
                                Order: {notification.data.order_id}
                              </span>
                            )}
                            {notification.data.refund_amount && (
                              <span className="badge bg-light text-dark me-2 rounded-0">
                                Amount: ${notification.data.refund_amount}
                              </span>
                            )}
                            {notification.data.tracking_number && (
                              <span className="badge bg-light text-dark me-2 rounded-0">
                                Tracking: {notification.data.tracking_number}
                              </span>
                            )}
                            {notification.data.cancellation_id && (
                              <span className="badge bg-light text-dark me-2 rounded-0">
                                Cancellation: {notification.data.cancellation_id}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {formattedNotification.actions && formattedNotification.actions.length > 0 && (
                    <div className="card-footer bg-white border-0 pt-0">
                      <div className="d-flex gap-2">
                        {formattedNotification.actions.map((action, actionIndex) => (
                          <button
                            key={actionIndex}
                            className={`btn btn-sm ${
                              action.primary ? "btn-primary" : "btn-outline-secondary"
                            } rounded-0`}
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent triggering the card click
                              action.onClick();
                            }}
                          >
                            {action.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Unread count badge */}
        {unreadCount > 0 && (
          <div className="mt-3 text-center">
            <span className="badge bg-primary rounded-pill">
              {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* Order Details Modal */}
      {showOrderModal && selectedOrder && (
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
    </>
  );
};

export default NotificationTab;