import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../Config/api";
import emailjs from "@emailjs/browser";

function OrderSummary() {
  const [orderSummary, setOrderSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [emailStatus, setEmailStatus] = useState({
    sent: false,
    sending: false,
    error: null,
  });
  const navigate = useNavigate();
  const emailTriggeredRef = useRef(false);

  useEffect(() => {
    emailjs.init("1JhpDFWb4tZlLmkCh"); // Your EmailJS public key
  }, []);

  const hasEmailBeenSent = (orderId) => {
    return localStorage.getItem(`email_sent_${orderId}`) === "true";
  };

  const markEmailAsSent = (orderId) => {
    localStorage.setItem(`email_sent_${orderId}`, "true");
  };

  const sendConfirmationEmail = async (orderData) => {
    const orderId = orderData.order_id;

    if (hasEmailBeenSent(orderId)) {
      setEmailStatus((prev) => ({ ...prev, sent: true }));
      return;
    }

    if (!orderData.user_details?.email) {
      console.warn("No email address available for order confirmation");
      return;
    }

    try {
      setEmailStatus({ sent: false, sending: true, error: null });

      // Calculate the correct total from items
      const subtotal = orderData.items.reduce(
        (acc, item) => acc + parseFloat(item.unit_price) * item.quantity,
        0,
      );

      // Helper function to get full image URL
      const getFullImageUrl = (imagePath) => {
        if (!imagePath) return "";
        if (
          imagePath.startsWith("http://") ||
          imagePath.startsWith("https://")
        ) {
          return imagePath;
        }
        const baseUrl =
          process.env.REACT_APP_API_URL || "http://localhost:5000";
        const cleanPath = imagePath.startsWith("/")
          ? imagePath.slice(1)
          : imagePath;
        return `${baseUrl}/${cleanPath}`;
      };

      // Build the products HTML with images
      const productsHtml = orderData.items
        .map((item) => {
          const imageUrl = getFullImageUrl(item.image);
          const itemTotal = (
            parseFloat(item.unit_price) * item.quantity
          ).toFixed(2);
          const unitPrice = parseFloat(item.unit_price).toFixed(2);

          return `
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 16px;">
          <tr>
            <td width="70" style="padding: 8px 0; vertical-align: middle;">
              ${
                imageUrl
                  ? `
                <img src="${imageUrl}" alt="${item.product_name}" 
                  width="60" height="60" 
                  style="display: block; width: 60px; height: 60px; object-fit: cover; border-radius: 8px; border: 1px solid #e2e8f0;"
                  onerror="this.onerror=null; this.src='https://via.placeholder.com/60x60?text=No+Image';"
                />
              `
                  : `
                <table width="60" height="60" cellpadding="0" cellspacing="0" border="0" 
                  style="width: 60px; height: 60px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e2e8f0;">
                  <tr>
                    <td align="center" valign="middle" style="font-family: Arial, sans-serif; font-size: 10px; color: #94a3b8;">
                      No Image
                    </td>
                  </tr>
                </table>
              `
              }
            </td>
            <td style="padding: 8px 12px; vertical-align: middle;">
              <div style="font-family: Arial, sans-serif; font-size: 14px; font-weight: 600; color: #0b1220; margin-bottom: 4px;">
                ${item.product_name}
              </div>
              <div style="font-family: Arial, sans-serif; font-size: 12px; color: #64748b;">
                Qty: ${item.quantity} | Size: L
              </div>
            </td>
            <td align="right" style="padding: 8px 0; vertical-align: middle;">
              <div style="font-family: Arial, sans-serif; font-size: 14px; font-weight: 700; color: #0b1220;">
                $${itemTotal}
              </div>
              <div style="font-family: Arial, sans-serif; font-size: 11px; color: #94a3b8;">
                $${unitPrice} each
              </div>
            </td>
          </tr>
        </table>
        ${!item.isLast ? '<div style="height: 1px; background: #e2e8f0; margin: 8px 0;"></div>' : ""}
      `;
        })
        .join("");

      // Format shipping address
      const shippingAddress = orderData.shipping_address
        ? {
            address: orderData.shipping_address.address || "",
            suburb: orderData.shipping_address.suburb || "",
            state: orderData.shipping_address.state || "",
            postcode: orderData.shipping_address.postcode || "",
          }
        : null;

      const templateParams = {
        // Customer info
        customer_name: orderData.user_details?.name || "Customer",
        customer_email: orderData.user_details?.email,
        customer_phone: orderData.user_details?.phone || "",

        // Order info
        order_id: orderId,
        order_date: new Date(orderData.order_date).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
        order_status: orderData.order_status || "Confirmed",

        // Payment info
        payment_method: orderData.payment_method || "Credit Card",
        payment_status: orderData.payment_status || "Completed",

        // Address info
        shipping_address: shippingAddress?.address || "",
        shipping_suburb: shippingAddress?.suburb || "",
        shipping_state: shippingAddress?.state || "",
        shipping_postcode: shippingAddress?.postcode || "",

        // Products HTML - This will contain all products with images
        products_html: productsHtml,

        // Financial info
        subtotal: subtotal.toFixed(2),
        shipping_cost: "0.00",
        total: subtotal.toFixed(2),

        // Support info
        support_email: "support@adroitgroup.biz",
        support_phone: "043 317 2345",
        store_address: "15/51 Meacher Street Mt. Druitt 2770, NSW",

        // Current year for copyright
        current_year: new Date().getFullYear().toString(),

        // Tracking URL
        tracking_url: `https://yourapp.com/track/${orderId}`,

        // Unsubscribe link
        unsubscribe_url: "#",
      };

      // console.log("Sending email with products HTML:", productsHtml);

      // Send to EmailJS
      await emailjs.send("service_atcmru7", "template_xjwh0fb", templateParams);

      markEmailAsSent(orderId);
      setEmailStatus({ sent: true, sending: false, error: null });
    } catch (error) {
      // console.error("Email sending failed:", error);
      setEmailStatus({
        sent: false,
        sending: false,
        error: "Failed to send confirmation email",
      });
    }
  };

  useEffect(() => {
    const fetchOrderSummary = async () => {
      try {
        const orderId = localStorage.getItem("latest_order_id");

        if (!orderId) {
          navigate("/");
          return;
        }

        const response = await api.get(`/orders/${orderId}/summary`);

        if (response.data.success && response.data.order_summary) {
          const summary = response.data.order_summary;
          setOrderSummary(summary);

          if (
            summary.user_details?.email &&
            !hasEmailBeenSent(summary.order_id) &&
            !emailTriggeredRef.current
          ) {
            emailTriggeredRef.current = true;
            await sendConfirmationEmail(summary);
          }
        } else {
          setError("Failed to load order summary");
        }
      } catch (err) {
        // console.error("Error fetching order summary:", err);
        let errorMessage =
          "Failed to load order details. Please try again later.";
        if (err.response?.status === 401) {
          errorMessage = "Authentication failed. Please log in again.";
        } else if (err.response?.data?.message) {
          errorMessage = err.response.data.message;
        }
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderSummary();
  }, [navigate]);

  if (loading) {
    return <div className="text-center py-5">Loading order details...</div>;
  }

  if (error) {
    return <div className="text-center py-5 text-danger">{error}</div>;
  }

  if (!orderSummary) {
    return (
      <div className="text-center py-5 text-muted">
        No order details available
      </div>
    );
  }

  // Calculate the correct total from items only
  const subtotal = orderSummary.items.reduce(
    (acc, item) => acc + parseFloat(item.unit_price) * item.quantity,
    0,
  );
  const total = subtotal; // Shipping is free

  return (
    <>
      <div className="container-fluid bg-light d-flex flex-column align-items-center justify-content-center py-5">
        <div className="d-flex flex-column align-items-center">
          <div>
            <div className="loader d-flex align-items-center justify-content-center">
              <i className="bi bi-check-lg"></i>
            </div>
          </div>
          <h1 className="fw-bold">THANK YOU</h1>
          <p className="text-center mt-2">
            Payment Is Successfully Processed And Your Order Is On The Way
            <br />
            {emailStatus.sent && (
              <span className="d-block text-success mt-2">
                A confirmation email has been sent to{" "}
                {orderSummary.user_details?.email}
              </span>
            )}
            {emailStatus.sending && (
              <span className="d-block text-muted mt-2">
                Sending confirmation email...
              </span>
            )}
            {emailStatus.error && (
              <span className="d-block text-danger mt-2">
                {emailStatus.error}
              </span>
            )}
          </p>
        </div>
      </div>

      <div className="container py-5">
        <div className="row">
          <div className="col-md-6">
            <table className="table border m-0">
              <thead className="table-light">
                <tr className="text-dark text-center">
                  <th>Product</th>
                  <th>Product Name</th>
                  <th>Quantity</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {orderSummary.items.map((item) => (
                  <tr key={item.product_id}>
                    <td className="text-center" style={{ padding: "20px 0" }}>
                      <div
                        className="d-flex align-items-center justify-content-center"
                        style={{ height: "100%" }}
                      >
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.product_name}
                            className="border"
                            style={{
                              width: "70px",
                              height: "70px",
                              objectFit: "cover",
                              maxWidth: "100%",
                            }}
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src =
                                "https://via.placeholder.com/70x70?text=No+Image";
                            }}
                          />
                        ) : (
                          <div
                            className="border d-flex align-items-center justify-content-center"
                            style={{
                              width: "70px",
                              height: "70px",
                              backgroundColor: "#f8f9fa",
                            }}
                          >
                            <i className="bi bi-image text-muted"></i>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="text-center" style={{ padding: "20px 0" }}>
                      <span style={{ fontSize: "16px" }}>
                        {item.product_name}
                      </span>
                    </td>
                    <td
                      className="text-center text-secondary"
                      style={{ fontSize: "16px", padding: "20px 0" }}
                    >
                      {item.quantity}
                    </td>
                    <td
                      className="text-center text-secondary"
                      style={{ fontSize: "16px", padding: "20px 0" }}
                    >
                      $
                      {(parseFloat(item.unit_price) * item.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border border-1 p-3">
              <div className="d-flex justify-content-between py-2">
                <p className="mb-0">Subtotal</p>
                <p className="mb-0">${subtotal.toFixed(2)}</p>
              </div>
              <div className="d-flex justify-content-between py-2">
                <p className="mb-0">Shipping</p>
                <p className="mb-0">FREE</p>
              </div>
              <div className="d-flex justify-content-between fw-bold border-top text-dark pt-3">
                <p>Total</p>
                <p>${total.toFixed(2)}</p>
              </div>
            </div>
          </div>

          <div className="col-md-6">
            <div className="card border-0 rounded-0 shadow-sm mb-4">
              <div className="card-body bg-light">
                <div className="row">
                  <div className="col-md-6">
                    <h5 className="text-dark py-2 border-bottom">Summary</h5>
                    <p className="text-secondary mb-2">
                      Order ID: {orderSummary.order_id}
                    </p>
                    <p className="text-secondary mb-2">
                      Order Date:{" "}
                      {new Date(orderSummary.order_date).toLocaleDateString()}
                    </p>
                    <p className="text-secondary mb-2">
                      Order Status: {orderSummary.order_status}
                    </p>
                    <p className="text-secondary mb-4">
                      Order Total: ${total.toFixed(2)}
                    </p>
                  </div>

                  <div className="col-md-6">
                    <h5 className="text-dark py-2 border-bottom">
                      Shipping Address
                    </h5>
                    {orderSummary.shipping_address ? (
                      <>
                        <p className="mb-2">
                          {orderSummary.shipping_address.address}
                        </p>
                        <p className="mb-2">
                          {orderSummary.shipping_address.suburb},{" "}
                          {orderSummary.shipping_address.state}
                        </p>
                        <p className="mb-4">
                          {orderSummary.shipping_address.postcode}
                        </p>
                      </>
                    ) : (
                      <p className="text-muted">
                        No shipping address available
                      </p>
                    )}
                  </div>

                  <div className="col-md-6">
                    <h5 className="text-dark py-2 border-bottom">
                      User Details
                    </h5>
                    {orderSummary.user_details ? (
                      <>
                        <p className="mb-2">
                          Name: {orderSummary.user_details.name}
                        </p>
                        <p className="mb-2">
                          Email: {orderSummary.user_details.email}
                        </p>
                        <p className="mb-4">
                          Phone: {orderSummary.user_details.phone}
                        </p>
                      </>
                    ) : (
                      <p className="text-muted">No user details available</p>
                    )}
                  </div>

                  <div className="px-2">
                    <h6 className="text-dark py-2 border-bottom">
                      Payment Method
                    </h6>
                    <p className="text-secondary mb-2">
                      Method: {orderSummary.payment_method || "N/A"}
                    </p>
                    <p className="text-secondary mb-2">
                      Status: {orderSummary.payment_status || "N/A"}
                    </p>
                    {orderSummary.payment_details && (
                      <>
                        <p className="text-secondary mb-2">
                          Payment ID: {orderSummary.payment_details.payment_id}
                        </p>
                        <p className="text-secondary mb-4">
                          Payment Date:{" "}
                          {orderSummary.payment_details.payment_date}
                        </p>
                      </>
                    )}
                    <a
                      href="#"
                      className="btn btn-link text-decoration-none fw-bold p-0"
                    >
                      Track Order
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default OrderSummary;
