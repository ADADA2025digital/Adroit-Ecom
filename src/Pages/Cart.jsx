import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PageHeader from "../Components/PageHeader";
import axios from "axios";
import GlobalButton from "../Components/Button";

const Cart = () => {
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate(); // Add useNavigate hook

  const token = localStorage.getItem("auth_token");

  // Load cart from localStorage instantly on component mount
  useEffect(() => {
    const loadInitialCart = () => {
      if (!token) {
        // For guest users, load from localStorage
        const guestCart = JSON.parse(localStorage.getItem("guest_cart") || "[]");
        setCart(guestCart);
      } else {
        // For authenticated users, try to load from localStorage as fallback
        const cachedCart = JSON.parse(localStorage.getItem("cached_cart") || "[]");
        if (cachedCart.length > 0) {
          setCart(cachedCart);
        }
      }
    };

    loadInitialCart();
    fetchCart(); // Then fetch updated cart data
  }, []);

  const fetchCart = async () => {
    setIsLoading(true);
    setError("");

    try {
      if (!token) {
        const guestCart = JSON.parse(localStorage.getItem("guest_cart") || "[]");

        if (guestCart.length === 0) {
          setIsLoading(false);
          return;
        }

        // Enrich guest cart with product details
        const { data: allProducts } = await axios.get("/api/products");
        const enrichedGuestCart = guestCart.map((item) => {
          const product = allProducts.find((p) => p.id === item.id);
          if (!product) return item;

          return {
            ...item,
            productname: product.productname,
            pro_price: product.pro_price,
            images: product.images,
          };
        });

        setCart(enrichedGuestCart);
        setIsLoading(false);
        return;
      }

      // For authenticated users
      const res = await axios.get("/api/cart/view", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const cartData = res.data || [];
      setCart(cartData);
      
      // Cache the cart data for instant loading next time
      localStorage.setItem("cached_cart", JSON.stringify(cartData));
      setIsLoading(false);
    } catch (err) {
      // console.error("❌ Cart load error", err);
      setError("Failed to load cart. Please try again.");
      setIsLoading(false);
    }
  };

  const updateQuantity = async (productId, change) => {
    const item = cart.find((i) => i.product_id === productId || i.id === productId);
    const newQuantity = (item?.pro_quantity || item?.quantity || 0) + change;
    
    if (newQuantity < 1) return;

    // Update UI instantly
    const updatedCart = cart.map(item => {
      if (item.product_id === productId || item.id === productId) {
        return { 
          ...item, 
          quantity: newQuantity,
          pro_quantity: newQuantity
        };
      }
      return item;
    });
    
    setCart(updatedCart);

    try {
      if (!token) {
        // Update guest cart in localStorage
        localStorage.setItem(
          "guest_cart",
          JSON.stringify(updatedCart.map(({ productname, pro_price, images, ...rest }) => rest))
        );
        return;
      }

      // For authenticated users, sync with server
      await axios.put(
        `/api/cart/${productId}/update`,
        { quantity: newQuantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update cache
      localStorage.setItem("cached_cart", JSON.stringify(updatedCart));
    } catch (err) {
      // console.error("❌ Failed to update quantity", err);
      // Revert UI on error
      setCart(cart);
      alert("Failed to update quantity.");
    }
  };

  const removeFromCart = async (productId) => {
    // Save current cart for potential revert
    const previousCart = [...cart];
    
    // Update UI instantly
    const updatedCart = cart.filter((item) => item.id !== productId && item.product_id !== productId);
    setCart(updatedCart);

    try {
      if (!token) {
        localStorage.setItem(
          "guest_cart",
          JSON.stringify(updatedCart.map(({ productname, pro_price, images, ...rest }) => rest))
        );
        return;
      }

      await axios.delete(`/api/cart/${productId}/remove`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Update cache
      localStorage.setItem("cached_cart", JSON.stringify(updatedCart));
    } catch (err) {
      // console.error("❌ Failed to remove item", err);
      // Revert UI on error
      setCart(previousCart);
      alert("Failed to remove item.");
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert("Your cart is empty. Add items before checkout.");
      return;
    }
    
    // Navigate to checkout page
    navigate("/checkout");
  };

  const formatImageUrl = (images) => {
    if (!images || images.length === 0) return "/placeholder.jpg";
    return images[0]?.imgurl || "/placeholder.jpg";
  };

  const totalPrice = cart
    .reduce(
      (sum, item) =>
        sum +
        (parseFloat(item.pro_price) || 0) *
          (item.pro_quantity || item.quantity || 0),
      0
    )
    .toFixed(2);

  return (
    <section>
      <PageHeader title="Cart" path="Home / Cart" />
      <div className="container py-5">
        {/* {error && (
          <div className="alert alert-danger text-center">
            {error}
          </div>
        )} */}

        {isLoading ? (
          <div className="text-center">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading your cart...</p>
          </div>
        ) : cart.length === 0 ? (
          <div className="text-center">
            <h4>Your cart is empty!</h4>
            <Link to="/shop" className="btn btn-primary mt-3">
              Go to Shop
            </Link>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="table table-hover align-middle cart-table">
                <thead className="border-bottom table-light heading">
                  <tr className="text-uppercase">
                    <th>Image</th>
                    <th>Product Name</th>
                    <th>Price</th>
                    <th>Quantity</th>
                    <th>Total</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map((item) => (
                    <tr
                      key={`${item.product_id || item.id}-${
                        item.size || "default"
                      }`}
                    >
                      <td>
                        <img
                          src={formatImageUrl(item.images)}
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
                      </td>
                      <td className="fw-semibold">{item.productname || "Product"}</td>
                      <td className="text-dark">
                        ${parseFloat(item.pro_price || 0).toFixed(2)}
                      </td>
                      <td>
                        <div className="d-flex align-items-center p-1">
                          <button
                            className="btn btn-light border rounded-0"
                            onClick={() =>
                              updateQuantity(item.product_id || item.id, -1)
                            }
                            disabled={
                              (item.pro_quantity || item.quantity || 0) <= 1
                            }
                          >
                            <i className="bi bi-chevron-left"></i>
                          </button>
                          <span className="mx-3">
                            {item.pro_quantity || item.quantity}
                          </span>
                          <button
                            className="btn btn-light border rounded-0"
                            onClick={() =>
                              updateQuantity(item.product_id || item.id, 1)
                            }
                          >
                            <i className="bi bi-chevron-right"></i>
                          </button>
                        </div>
                      </td>
                      <td className="text-primary">
                        $
                        {(
                          (parseFloat(item.pro_price) || 0) *
                          (item.pro_quantity || item.quantity || 0)
                        ).toFixed(2)}
                      </td>
                      <td>
                        <button
                          className="btn btn-light border rounded-0"
                          onClick={() =>
                            removeFromCart(item.product_id || item.id)
                          }
                        >
                          <i className="bi bi-trash3-fill"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="d-flex justify-content-end align-items-end border-bottom py-3 heading">
              <h5 className="fw-bold">
                Total Price: <span className="text-primary">${totalPrice}</span>
              </h5>
            </div>

            <div className="d-flex justify-content-between mt-4">
              <GlobalButton>
                Continue Shopping
              </GlobalButton>
              <GlobalButton 
                onClick={handleCheckout}
                disabled={cart.length === 0}
              >
                Proceed to Checkout
              </GlobalButton>
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default Cart;