import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import axios from "axios";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const formatImageUrl = (imgPath) => {
    if (!imgPath) return "/placeholder.jpg";
    if (Array.isArray(imgPath)) {
      const first = imgPath[0];
      if (typeof first === "string") {
        return first.startsWith("http")
          ? first
          : `https://shop.adroitalarm.com.au${first}`;
      } else if (first?.imgurl) {
        return first.imgurl.startsWith("http")
          ? first.imgurl
          : `https://shop.adroitalarm.com.au${first.imgurl}`;
      }
      return "/placeholder.jpg";
    }
    if (typeof imgPath === "object" && imgPath.imgurl) {
      return imgPath.imgurl.startsWith("http")
        ? imgPath.imgurl
        : `https://shop.adroitalarm.com.au${imgPath.imgurl}`;
    }
    if (typeof imgPath === "string") {
      return imgPath.startsWith("http")
        ? imgPath
        : `https://shop.adroitalarm.com.au${imgPath}`;
    }
    return "/placeholder.jpg";
  };

  const fetchCart = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        const guestCart = JSON.parse(
          localStorage.getItem("guest_cart") || "[]"
        );
        // console.log("🛒 Fetched guest cart:", guestCart);
        setCart(guestCart);
        return;
      }

      const response = await axios.get(
        "https://shop.adroitalarm.com.au/api/cart/view",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const transformed = response.data.map((item) => ({
        ...item,
        id: item.product_id,
        formattedImage: formatImageUrl(item.images || item.imgurl),
      }));

      // console.log("🔐 Fetched user cart:", transformed);
      setCart(transformed);
      setError(null);
    } catch (err) {
      // console.error("❌ Error fetching cart:", err);
      setError(err.response?.data?.message || "Failed to load cart");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const syncGuestCartAfterLogin = async () => {
    const guestCart = JSON.parse(localStorage.getItem("guest_cart") || "[]");
    // console.log("🔄 Syncing guest cart after login:", guestCart);
    if (guestCart.length === 0) return;

    try {
      const token = localStorage.getItem("auth_token");
      if (!token) throw new Error("No auth token available");

      const userCartResponse = await axios.get(
        "https://shop.adroitalarm.com.au/api/cart/view",
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const userCart = userCartResponse.data || [];

      // Normalize userCart keys: extract numeric product_id
      const userCartKeys = new Set(
        userCart.map((item) => {
          const numericId =
            typeof item.product_id === "string" &&
            item.product_id.startsWith("PRO")
              ? item.product_id.replace("PRO", "")
              : item.product_id;
          return `${numericId}_${item.size || "M"}`;
        })
      );

      // Step 3: Loop through guest cart and only add if not in user cart
      for (const guestItem of guestCart) {
        const key = `${guestItem.product_id}_${guestItem.size || "M"}`;

        if (userCartKeys.has(key)) {
          // console.log(`🟡 Skipping already existing item in user cart: ${key}`);
          continue;
        }

        try {
          await axios.post(
            `https://shop.adroitalarm.com.au/api/cart/${guestItem.product_id}/add`,
            {
              quantity: guestItem.quantity,
              size: guestItem.size || "M",
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          // console.log(`✅ Added guest item to user cart: ${key}`);
        } catch (err) {
          // console.error(`❌ Failed to add guest item ${key}:`, err);
        }
      }

      localStorage.removeItem("guest_cart");
      // console.log("🧹 Guest cart cleared after login sync");

      await fetchCart();
    } catch (err) {
      // console.error("❌ Error syncing guest cart:", err);
      setError("Failed to sync guest cart items");
    }
  };

  const addToCart = async (product, quantity = 1, size = "M") => {
    const token = localStorage.getItem("auth_token");

    // Get numeric ID only
    let product_id =
      typeof product === "object"
        ? product?.id || product?.product_id
        : product;

    if (typeof product_id === "string" && product_id.startsWith("PRO")) {
      // console.error(
      //   "❌ Cannot add to cart. SKU (not numeric ID) used:",
      //   product_id
      // );
      return;
    }

    if (!token) {
      let guestCart = JSON.parse(localStorage.getItem("guest_cart") || "[]");
      const existingIndex = guestCart.findIndex(
        (item) => item.product_id === product_id && item.size === size
      );

      if (existingIndex !== -1) {
        guestCart[existingIndex].quantity += quantity;
      } else {
        guestCart.push({
          id: product_id,
          product_id,
          quantity,
          size,
          productname: product?.productname,
          pro_price: product?.pro_price,
          images: product?.images,
        });
      }

      localStorage.setItem("guest_cart", JSON.stringify(guestCart));
      setCart(guestCart);
      // console.log("➕ Added to guest cart:", guestCart);
      return;
    }

    try {
      await axios.post(
        `https://shop.adroitalarm.com.au/api/cart/${product_id}/add`,
        { quantity, size },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      // console.log(`✅ Added to user cart: ${product_id}`);
      await fetchCart();
    } catch (err) {
      // console.error("❌ Error adding to cart:", err);
      setError(err.response?.data?.message || "Failed to add item to cart");
    }
  };

  const updateCartQuantity = async (product_id, change) => {
    const token = localStorage.getItem("auth_token");
    const item = cart.find((item) => item.product_id === product_id);
    if (!item) return;

    const newQuantity = (item.pro_quantity || item.quantity) + change;
    if (newQuantity < 1) return;

    // Update local state immediately for better UX
    if (!token) {
      const guestCart = [...cart];
      const index = guestCart.findIndex((i) => i.product_id === product_id);
      if (index !== -1) {
        guestCart[index].quantity = newQuantity;
        localStorage.setItem("guest_cart", JSON.stringify(guestCart));
        setCart(guestCart);
        //  console.log(
        //   `✏️ Updated guest cart item ${product_id} to quantity: ${newQuantity}`
        // );
      }
      return;
    }

    try {
      // Update local state immediately for better UX
      const updatedCart = cart.map((item) =>
        item.product_id === product_id
          ? { ...item, pro_quantity: newQuantity }
          : item
      );
      setCart(updatedCart);

      await axios.put(
        `https://shop.adroitalarm.com.au/api/cart/${product_id}/update`,
        { quantity: newQuantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log(
        `✏️ Updated user cart item ${product_id} to quantity: ${newQuantity}`
      );
    } catch (err) {
      // Revert local state if API call fails
      await fetchCart();
      // console.error("❌ Error updating quantity:", err);
      setError(err.response?.data?.message || "Failed to update quantity");
    }
  };

  const removeFromCart = async (product_id) => {
    const token = localStorage.getItem("auth_token");

    // Update local state immediately for better UX
    if (!token) {
      const guestCart = cart.filter((item) => item.product_id !== product_id);
      localStorage.setItem("guest_cart", JSON.stringify(guestCart));
      setCart(guestCart);
      // console.log(`🗑️ Removed item ${product_id} from guest cart`);
      return;
    }

    try {
      // Update local state immediately for better UX
      const updatedCart = cart.filter((item) => item.product_id !== product_id);
      setCart(updatedCart);

      await axios.delete(
        `https://shop.adroitalarm.com.au/api/cart/${product_id}/remove`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      // console.log(`🗑️ Removed item ${product_id} from user cart`);
    } catch (err) {
      // Revert local state if API call fails
      await fetchCart();
      // console.error("❌ Error removing item:", err);
      setError(err.response?.data?.message || "Failed to remove item");
    }
  };

  const clearCart = async () => {
    const token = localStorage.getItem("auth_token");

    if (!token) {
      localStorage.removeItem("guest_cart");
      setCart([]);
      // console.log("🧹 Cleared guest cart");
      return;
    }

    try {
      // Clear the server cart
      await Promise.all(
        cart.map((item) =>
          axios.delete(
            `https://shop.adroitalarm.com.au/api/cart/${item.product_id}/remove`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          )
        )
      );
      
      // Clear local state
      setCart([]);
      // console.log("🧹 Cleared user cart");
    } catch (err) {
      // console.error("❌ Error clearing cart:", err);
      // Even if API call fails, clear local state for better UX
      setCart([]);
    }
  };

  // NEW: Function to force refresh cart from server
  const forceRefreshCart = useCallback(async () => {
    // console.log("🔄 Force refreshing cart...");
    await fetchCart();
  }, [fetchCart]);

  return (
    <CartContext.Provider
      value={{
        cart,
        isLoading,
        error,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        fetchCart,
        formatImageUrl,
        syncGuestCartAfterLogin,
        forceRefreshCart, // NEW: Added forceRefreshCart function
        // Changed: Count the number of items instead of total quantity
        cartCount: cart.length,
        cartTotal: cart
          .reduce(
            (sum, item) =>
              sum +
              parseFloat(item.pro_price || 0) *
                (item.pro_quantity || item.quantity || 0),
            0
          )
          .toFixed(2),
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};