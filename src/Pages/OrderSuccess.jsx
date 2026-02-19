import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../Config/api";

function OrderSummary() {
  const [orderSummary, setOrderSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

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
        } else {
          setError("Failed to load order summary");
        }
      } catch (err) {
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