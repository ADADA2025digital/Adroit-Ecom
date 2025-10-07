import React, { useEffect, useState } from "react";
import PageHeader from "../Components/PageHeader";
import CheckoutCardSection from "../Components/CheckoutCardsection";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useCart } from "../Components/CartContext";
import GlobalButton from "../Components/Button";

const CheckoutPage = () => {
  const { cart = [], clearCart } = useCart();
  const [selectedShippingAddress, setSelectedShippingAddress] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [addresses, setAddresses] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [validationErrors, setValidationErrors] = useState({});
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [isLoadingAddresses, setIsLoadingAddresses] = useState(true);

  const [checkoutInput, setCheckoutInput] = useState({
    user_id: "",
    firstname: "",
    lastname: "",
    email: "",
    phone: "",
  });

  const paymentMethods = [
    { id: "STRIPE", name: "Credit/Debit Card" },
  ];

  const formatImageUrl = (imgPath) => {
    if (!imgPath) return "/placeholder.jpg";
    if (imgPath.startsWith("http")) return imgPath;
    return `${import.meta.env.VITE_API_URL || ""}${imgPath}`;
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await axios.get("/api/auth/user", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        const userData = response.data.user;

        if (userData) {
          setIsLoggedIn(true);
          setCheckoutInput({
            user_id: userData.user_id || "",
            firstname: userData.firstname || "",
            lastname: userData.lastname || "",
            email: userData.email || "",
            phone: userData.phone || "",
          });

          // If a Buy Now item is present, use it for checkout; otherwise load cart
          const buyNowItemRaw = localStorage.getItem("buy_now_item");
          if (buyNowItemRaw) {
            try {
              const buyNowItem = JSON.parse(buyNowItemRaw);
              setCartItems([buyNowItem]);
            } catch (_) {
              localStorage.removeItem("buy_now_item");
            }
          } else {
            const cartResponse = await axios.get("/api/cart/view", {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            });
            setCartItems(cartResponse.data || []);
          }

          const addressesResponse = await axios.get("/api/address", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
         
          if (addressesResponse.data.status === 200) {
            setAddresses(addressesResponse.data.data);
            if (addressesResponse.data.data.length > 0) {
              setSelectedShippingAddress(String(addressesResponse.data.data[0].id));
            } else {
              setShowAddressForm(true);
            }
          }
          setIsLoadingAddresses(false);
        } else {
          setIsLoggedIn(false);
          setIsLoadingAddresses(false);
        }
      } catch (error) {
        setIsLoggedIn(false);
        setIsLoadingAddresses(false);
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, []);

  const renderPaymentDetails = () => {
    if (selectedPayment === "PAYID") {
      return (
        <div className="col-12">
          <div className="bg-white p-3 border rounded">
            <h6 className="fw-bold mb-2">PayID Details</h6>
            <p className="m-0">
              <strong>PayID:</strong> 0451112478
            </p>
          </div>
        </div>
      );
    } else if (selectedPayment === "BANK_TRANSFER") {
      return (
        <div className="col-12">
          <div className="bg-white p-3 border rounded">
            <h6 className="fw-bold mb-2">Bank Transfer Details</h6>
            <p className="m-0">
              <strong>Name:</strong> Account Name
            </p>
            <p className="m-0">
              <strong>BSB:</strong> 062 123
            </p>
            <p className="m-0">
              <strong>ACC:</strong> 1234 5678
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const subTotal = cartItems.reduce(
    (total, item) =>
      total + (parseFloat(item.pro_price) * parseInt(item.pro_quantity) || 0),
    0
  );

  const total = subTotal;

  const prepareOrderData = () => {
    const selectedAddress = addresses.find(
      (addr) => String(addr.id) === String(selectedShippingAddress)
    );

    if (!selectedAddress) {
      throw new Error("Selected address not found");
    }

    const postcode = selectedAddress.postcode
      ? String(selectedAddress.postcode)
      : "";

    const paymentMethodMap = {
      PAYID: "cod",
      BANK_TRANSFER: "cod",
      PAYPAL: "cod",
      STRIPE: "stripe",
    };

    return {
      user_id: checkoutInput.user_id,
      shippingaddress: selectedAddress.address,
      suburb: selectedAddress.suburb,
      postcode: postcode,
      state: selectedAddress.state,
      total_price: total.toFixed(2),
      payment_method:
        paymentMethodMap[selectedPayment] || selectedPayment.toLowerCase(),
      items: cartItems.map((item) => ({
        id: item.backend_product_id || item.product_id,
        ord_price: item.pro_price,
        ord_quantity: item.pro_quantity,
        image_url: formatImageUrl(item.images?.[0]?.imgurl),
      })),
    };
  };

  const prepareOrderDataAsync = async () => {
    const base = prepareOrderData();
    const resolvedItems = await Promise.all(
      base.items.map(async (it, idx) => {
        if (it.id) return it;
        const source = cartItems[idx];
        const identifier = source?.product_id || source?.id;
        if (!identifier) return it;
        try {
          const res = await axios.get(`/api/products/${identifier}`, {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
          const product = res.data?.product || res.data?.data || res.data;
          const backendId = product?.product_id || product?.id || null;
          return { ...it, id: backendId || it.id };
        } catch {
          return it;
        }
      })
    );
    return { ...base, items: resolvedItems };
  };

  const completeOrder = async (paymentMethod = null) => {
    try {
      let orderData = await prepareOrderDataAsync();
      if (paymentMethod) {
        orderData.payment_method = paymentMethod;
      }

      const response = await axios.post("/api/place-order", orderData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      if (response.data && response.data.order_id) {
        localStorage.setItem("latest_order_id", response.data.order_id);

        const orderedProducts = cartItems.map((item) => ({
          product_id: item.product_id,
          name: item.productname,
          price: item.pro_price,
          quantity: item.pro_quantity,
          image_url: formatImageUrl(item.images?.[0]?.imgurl),
        }));

        localStorage.setItem(
          "ordered_products",
          JSON.stringify(orderedProducts)
        );
       
        await clearCart();
       
        navigate("/order-success");
      } else {
        throw new Error(response.data.message || "Order failed");
      }
    } catch (error) {
      // console.error("Order Placement Error:", error);
      if (error.response?.status === 422) {
        setValidationErrors(error.response.data.errors || {});
        alert(
          "Validation errors: " + JSON.stringify(error.response.data.errors)
        );
      } else {
        alert(`Order failed: ${error.message}`);
      }
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleStripePayment = async () => {
    try {
      const orderData = await prepareOrderDataAsync();

      // Create the order
      const orderResponse = await axios.post(
        "/api/place-order",
        {
          ...orderData,
          payment_method: "stripe",
          payment_status: "pending",
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      if (!orderResponse.data?.order_id) {
        throw new Error("Failed to create order");
      }

      localStorage.setItem(
        "pending_order",
        JSON.stringify({
          orderId: orderResponse.data.order_id,
          amount: total.toFixed(2),
          currency: "aud",
          user_id: checkoutInput.user_id,
        })
      );

      // If this was a Buy Now flow, do not clear entire cart; just proceed
      navigate("/payform", {
        state: {
          amount: total,
          orderId: orderResponse.data.order_id,
        },
      });
    } catch (error) {
      // console.error("Payment failed:", error);
      if (error.response?.status === 422) {
        setValidationErrors(error.response.data.errors || {});
        alert(
          "Validation errors: " + JSON.stringify(error.response.data.errors)
        );
      } else {
        alert(error.message || "Payment processing failed");
      }
      setIsPlacingOrder(false);
    }
  };

  const placeOrder = async () => {
    setIsPlacingOrder(true);
    setValidationErrors({});
    try {
      if (cartItems.length === 0) {
        throw new Error("Your cart is empty. Please add items before proceeding.");
      }

      if (!selectedShippingAddress) {
        throw new Error("Please select a shipping address");
      }

      const addressExists = addresses.find(
        (addr) => String(addr.id) === String(selectedShippingAddress)
      );
     
      if (!addressExists) {
        throw new Error("The selected address is no longer available. Please select a different address.");
      }

      if (!selectedPayment) {
        throw new Error("Please select a payment method");
      }

      if (selectedPayment === "STRIPE") {
        await handleStripePayment();
        return;
      }

      await completeOrder();
      // Clear Buy Now state after non-Stripe orders complete
      localStorage.removeItem("buy_now_item");
    } catch (error) {
      // console.error("Order Placement Error:", error);
      alert(`Order failed: ${error.message}`);
      setIsPlacingOrder(false);
    }
  };

  const handlePlaceOrder = () => {
    placeOrder();
  };

  const handleAddressAdded = (newAddress) => {
    setAddresses([...addresses, newAddress]);
    setSelectedShippingAddress(String(newAddress.id));
    setShowAddressForm(false);
  };

  return (
    <>
      <PageHeader title="Checkout" path="Home / Shop / Checkout" />
      <div className="container my-5">
        <div className="row">
          <div className="col-md-7">
            {!isLoggedIn && (
              <div className="card border-0 bg-light mb-4">
                <div className="card-body p-4 text-start">
                  <h5 className="fw-bold mb-3">Login</h5>
                  <button className="btn btn-primary rounded-0">
                    <Link
                      to="/login"
                      className="text-decoration-none text-white"
                    >
                      Login
                    </Link>
                  </button>
                </div>
              </div>
            )}

            {isLoggedIn && (
              <>
                <div className="card border-0 bg-light mb-4">
                  <div className="card-body p-4 text-start">
                    <h5 className="fw-bold mb-3 heading">User Details</h5>
                    <ul className="list-unstyled">
                      <li className="mb-2">
                        <strong>First Name:</strong> {checkoutInput.firstname}
                      </li>
                      <li className="mb-2">
                        <strong>Last Name:</strong> {checkoutInput.lastname}
                      </li>
                      <li className="mb-2">
                        <strong>Email:</strong> {checkoutInput.email}
                      </li>
                      <li>
                        <strong>Phone Number:</strong> {checkoutInput.phone}
                      </li>
                    </ul>
                  </div>
                </div>

                {addresses.length > 0 && !showAddressForm ? (
                  <CheckoutCardSection
                    title="Shipping Address"
                    options={addresses}
                    selectedOption={String(selectedShippingAddress)}
                    onSelect={(addressId) => {
                      setSelectedShippingAddress(addressId);
                    }}
                    onAddressAdded={handleAddressAdded}
                  />
                ) : (
                  <div className="card border-0 bg-light mb-4">
                    <div className="card-body p-4 text-start">
                      <h5 className="fw-bold">Shipping Address</h5>
                      {showAddressForm ? (
                        <CheckoutCardSection
                          options={addresses}
                          selectedOption={String(selectedShippingAddress)}
                          onSelect={(addressId) => {
                            setSelectedShippingAddress(addressId);
                          }}
                          onAddressAdded={handleAddressAdded}
                        />
                      ) : (
                        <>
                          <p>
                            No addresses found. Please add an address to continue.
                          </p>
                          <button
                            className="btn btn-primary rounded-0"
                            onClick={() => setShowAddressForm(true)}
                          >
                            Add New Address
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="card border-0 bg-light mb-4">
              <div className="card-body p-4">
                <h5 className="fw-bold mb-3 heading">Payment Options</h5>
                <div className="row g-4">
                  {paymentMethods.map((method) => (
                    <div className="col-md-6" key={method.id}>
                      <div className="form-check">
                        <input
                          className="form-check-input"
                          type="radio"
                          name="paymentMethod"
                          id={method.id}
                          checked={selectedPayment === method.id}
                          onChange={() => setSelectedPayment(method.id)}
                        />
                        <label className="form-check-label" htmlFor={method.id}>
                          {method.name}
                        </label>
                      </div>
                    </div>
                  ))}
                  {renderPaymentDetails()}
                </div>
              </div>
            </div>
          </div>

          <div className="col-md-5">
            <div className="card rounded-0 bg-light border">
              <div className="card-header border-bottom p-3">
                <h4 className="mb-2 fw-bold heading">Order Summary</h4>
              </div>
              <div className="card-body">
                {cartItems.length > 0 ? (
                  cartItems.map((item, index) => (
                    <div
                      className="d-flex justify-content-between align-items-center mb-3"
                      key={index}
                    >
                      <div className="d-flex align-items-center gap-3">
                        <img
                          src={formatImageUrl(item.images?.[0]?.imgurl)}
                          alt={item.productname}
                          className="border p-2"
                          style={{
                            width: "70px",
                            height: "70px",
                            objectFit: "cover",
                          }}
                          onError={(e) => {
                            e.target.src = "/placeholder.jpg";
                          }}
                        />
                        <div
                          className="text-muted"
                          style={{ fontSize: "0.9rem" }}
                        >
                          <div className="fw-bold">{item.productname}</div>
                          <div>Quantity: {item.pro_quantity}</div>
                        </div>
                      </div>
                      <span className="fw-bold text-dark">
                        $
                        {(
                          parseFloat(item.pro_price) *
                          parseInt(item.pro_quantity)
                        ).toFixed(2)}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-4">
                    <Link to="/shop" className="btn btn-primary rounded-0">
                      Continue Shopping
                    </Link>
                  </div>
                )}
              </div>
            </div>

            <div className="card rounded-0 bg-light border mt-3 p-3">
              <h4 className="fw-bold border-bottom pb-3 heading">Billing Summary</h4>
              <div className="mt-4">
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Subtotal (Tax included)</span>
                  <span className="fw-bold">${subTotal.toFixed(2)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span className="text-muted">Shipping</span>
                  <span className="fw-bold">Free</span>
                </div>
                <div className="d-flex justify-content-between mt-3 pt-3 border-top">
                  <span className="fw-bold">Total</span>
                  <span className="fw-bold text-primary">
                    ${total.toFixed(2)}
                  </span>
                </div>
              </div>

              <GlobalButton
                disabled={
                  isPlacingOrder ||
                  !selectedShippingAddress ||
                  !selectedPayment ||
                  cartItems.length === 0 ||
                  isLoadingAddresses
                }
                onClick={handlePlaceOrder}
                className="mt-4"
                children={isPlacingOrder ? "Placing Order..." : "Place Order"}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CheckoutPage;