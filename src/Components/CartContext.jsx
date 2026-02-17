import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import axios from "axios";

const CartContext = createContext();

// Custom event for cart updates (for cross-component communication)
const CART_UPDATED_EVENT = "cartUpdated";

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Use ref to track pending updates and prevent race conditions
  const pendingUpdates = useRef(new Map());
  const updateTimeoutRef = useRef(null);

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

  // Dispatch custom event for cart updates
  const dispatchCartUpdate = useCallback(() => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(CART_UPDATED_EVENT));
    }
  }, []);

  const fetchCart = useCallback(async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("auth_token");
      if (!token) {
        const guestCart = JSON.parse(
          localStorage.getItem("guest_cart") || "[]"
        );
        console.log("🛒 Fetched guest cart:", guestCart);
        setCart(guestCart);
        dispatchCartUpdate();
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
        product_id: item.product_id,
        productname: item.productname || item.name,
        pro_price: item.pro_price || item.price,
        pro_quantity: item.pro_quantity || item.quantity || 1,
        quantity: item.pro_quantity || item.quantity || 1,
        size: item.size || "M",
        images: item.images || [],
        formattedImage: formatImageUrl(item.images || item.imgurl),
      }));

      console.log("🔐 Fetched user cart:", transformed);
      setCart(transformed);
      dispatchCartUpdate();
      setError(null);
    } catch (err) {
      console.error("❌ Error fetching cart:", err);
      setError(err.response?.data?.message || "Failed to load cart");
    } finally {
      setIsLoading(false);
    }
  }, [dispatchCartUpdate]);

  // Debounced server sync to prevent too many requests
  const debouncedServerSync = useCallback((callback) => {
    if (updateTimeoutRef.current) {
      clearTimeout(updateTimeoutRef.current);
    }
    updateTimeoutRef.current = setTimeout(() => {
      callback();
      updateTimeoutRef.current = null;
    }, 500);
  }, []);

  const syncGuestCartAfterLogin = async () => {
    const guestCart = JSON.parse(localStorage.getItem("guest_cart") || "[]");
    console.log("🔄 Syncing guest cart after login:", guestCart);
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

      for (const guestItem of guestCart) {
        const key = `${guestItem.product_id}_${guestItem.size || "M"}`;

        if (userCartKeys.has(key)) {
          console.log(`🟡 Skipping already existing item in user cart: ${key}`);
          continue;
        }

        try {
          await axios.post(
            `https://shop.adroitalarm.com.au/api/cart/${guestItem.product_id}/add`,
            {
              quantity: guestItem.quantity || guestItem.pro_quantity || 1,
              size: guestItem.size || "M",
            },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );
          console.log(`✅ Added guest item to user cart: ${key}`);
        } catch (err) {
          console.error(`❌ Failed to add guest item ${key}:`, err);
        }
      }

      localStorage.removeItem("guest_cart");
      console.log("🧹 Guest cart cleared after login sync");

      await fetchCart();
    } catch (err) {
      console.error("❌ Error syncing guest cart:", err);
      setError("Failed to sync guest cart items");
    }
  };

  // ENHANCED: Real-time add to cart with optimistic updates
  const addToCart = useCallback(async (product, quantity = 1, size = "M") => {
    console.log("➕ Adding to cart:", { product, quantity, size });
    
    const token = localStorage.getItem("auth_token");

    // Handle both object and ID input
    let productData;
    let product_id;

    if (typeof product === 'object' && product !== null) {
      product_id = product.id || product.product_id;
      productData = {
        id: product.id || product.product_id,
        product_id: product.id || product.product_id,
        productname: product.productname || product.name || "Unknown Product",
        pro_price: product.pro_price || product.price || 0,
        pro_quantity: quantity,
        quantity: quantity,
        size: size,
        images: product.images || [],
        imgurl: product.imgurl,
        formattedImage: formatImageUrl(product.images || product.imgurl),
      };
    } else {
      product_id = product;
      productData = {
        id: product_id,
        product_id: product_id,
        productname: "Unknown Product",
        pro_price: 0,
        pro_quantity: quantity,
        quantity: quantity,
        size: size,
        images: [],
        formattedImage: "/placeholder.jpg",
      };
    }

    if (typeof product_id === "string" && product_id.startsWith("PRO")) {
      console.error("❌ Cannot add to cart. SKU (not numeric ID) used:", product_id);
      return;
    }

    // OPTIMISTIC UPDATE - Update UI immediately
    setCart(currentCart => {
      // Check if item already exists
      const existingIndex = currentCart.findIndex(
        item => item.product_id === product_id && item.size === size
      );

      let newCart;
      if (existingIndex !== -1) {
        // Update existing item
        newCart = [...currentCart];
        newCart[existingIndex] = {
          ...newCart[existingIndex],
          pro_quantity: (newCart[existingIndex].pro_quantity || 1) + quantity,
          quantity: (newCart[existingIndex].quantity || 1) + quantity,
        };
      } else {
        // Add new item
        newCart = [...currentCart, productData];
      }
      
      return newCart;
    });

    // Dispatch update event immediately
    dispatchCartUpdate();

    if (!token) {
      // Guest cart - update localStorage
      const guestCart = JSON.parse(localStorage.getItem("guest_cart") || "[]");
      const existingIndex = guestCart.findIndex(
        (item) => item.product_id === product_id && item.size === size
      );

      if (existingIndex !== -1) {
        guestCart[existingIndex].pro_quantity += quantity;
        guestCart[existingIndex].quantity = guestCart[existingIndex].pro_quantity;
      } else {
        guestCart.push(productData);
      }

      localStorage.setItem("guest_cart", JSON.stringify(guestCart));
      console.log("➕ Updated guest cart in localStorage:", guestCart);
      return;
    }

    // For logged-in users, sync with server (don't await - let it happen in background)
    try {
      // Track this update to prevent race conditions
      const updateKey = `${product_id}_${size}`;
      pendingUpdates.current.set(updateKey, { quantity, size });

      // Debounced server sync to batch multiple quick updates
      debouncedServerSync(async () => {
        try {
          // Get all pending updates for this product/size combination
          const pendingUpdate = pendingUpdates.current.get(updateKey);
          if (!pendingUpdate) return;

          await axios.post(
            `https://shop.adroitalarm.com.au/api/cart/${product_id}/add`,
            { 
              quantity: pendingUpdate.quantity, 
              size: pendingUpdate.size 
            },
            { 
              headers: { 
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json" 
              } 
            }
          );
          
          console.log(`✅ Synced with server: ${product_id}`);
          pendingUpdates.current.delete(updateKey);
          
          // Optionally refresh from server to ensure consistency
          // fetchCart();
        } catch (err) {
          console.error("❌ Server sync failed:", err);
          // If server sync fails, you might want to revert or show error
          setError("Failed to sync with server. Your items are saved locally.");
          pendingUpdates.current.delete(updateKey);
        }
      });
    } catch (err) {
      console.error("❌ Error in addToCart:", err);
      setError(err.response?.data?.message || "Failed to add item to cart");
    }
  }, [cart, debouncedServerSync, dispatchCartUpdate, formatImageUrl]);

  const updateCartQuantity = useCallback(async (product_id, change) => {
    const token = localStorage.getItem("auth_token");
    const item = cart.find((item) => item.product_id === product_id);
    if (!item) return;

    const newQuantity = (item.pro_quantity || item.quantity || 1) + change;
    if (newQuantity < 1) return;

    // Optimistic update
    setCart(currentCart =>
      currentCart.map(item =>
        item.product_id === product_id
          ? { 
              ...item, 
              pro_quantity: newQuantity,
              quantity: newQuantity 
            }
          : item
      )
    );

    dispatchCartUpdate();

    if (!token) {
      const guestCart = JSON.parse(localStorage.getItem("guest_cart") || "[]");
      const index = guestCart.findIndex((i) => i.product_id === product_id);
      if (index !== -1) {
        guestCart[index].pro_quantity = newQuantity;
        guestCart[index].quantity = newQuantity;
        localStorage.setItem("guest_cart", JSON.stringify(guestCart));
      }
      return;
    }

    try {
      await axios.put(
        `https://shop.adroitalarm.com.au/api/cart/${product_id}/update`,
        { quantity: newQuantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log(`✏️ Updated user cart item ${product_id} to quantity: ${newQuantity}`);
    } catch (err) {
      console.error("❌ Error updating quantity:", err);
      // Revert on error
      fetchCart();
      setError(err.response?.data?.message || "Failed to update quantity");
    }
  }, [cart, dispatchCartUpdate, fetchCart]);

  const removeFromCart = useCallback(async (product_id) => {
    const token = localStorage.getItem("auth_token");

    // Optimistic update
    setCart(currentCart => currentCart.filter((item) => item.product_id !== product_id));
    dispatchCartUpdate();

    if (!token) {
      const guestCart = JSON.parse(localStorage.getItem("guest_cart") || "[]");
      const newGuestCart = guestCart.filter((item) => item.product_id !== product_id);
      localStorage.setItem("guest_cart", JSON.stringify(newGuestCart));
      return;
    }

    try {
      await axios.delete(
        `https://shop.adroitalarm.com.au/api/cart/${product_id}/remove`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      console.log(`🗑️ Removed item ${product_id} from user cart`);
    } catch (err) {
      console.error("❌ Error removing item:", err);
      // Revert on error
      fetchCart();
      setError(err.response?.data?.message || "Failed to remove item");
    }
  }, [dispatchCartUpdate, fetchCart]);

  const clearCart = useCallback(async () => {
    const token = localStorage.getItem("auth_token");

    // Optimistic update
    setCart([]);
    dispatchCartUpdate();

    if (!token) {
      localStorage.removeItem("guest_cart");
      console.log("🧹 Cleared guest cart");
      return;
    }

    try {
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
      console.log("🧹 Cleared user cart");
    } catch (err) {
      console.error("❌ Error clearing cart:", err);
      // Even if API call fails, keep local state cleared
    }
  }, [cart, dispatchCartUpdate]);

  const forceRefreshCart = useCallback(async () => {
    console.log("🔄 Force refreshing cart...");
    await fetchCart();
  }, [fetchCart]);

  // Auto-refresh cart less frequently (10 seconds instead of 2)
  useEffect(() => {
    fetchCart();

    const interval = setInterval(() => {
      // Only refresh if there are no pending updates
      if (pendingUpdates.current.size === 0) {
        fetchCart();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [fetchCart]);

  // Calculate cart values
  const cartCount = cart.length;
  
  const cartTotal = cart
    .reduce((sum, item) => {
      const price = parseFloat(item.pro_price || item.price || 0);
      const qty = item.pro_quantity || item.quantity || 1;
      return sum + (price * qty);
    }, 0)
    .toFixed(2);

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
        forceRefreshCart,
        cartCount,
        cartTotal,
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