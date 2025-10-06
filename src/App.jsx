import "./App.css";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useEffect, useState } from "react";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap-icons/font/bootstrap-icons.css";

import "../src/Assets/Styles/Style.css";
import axios from "axios";

import Header from "./Components/Header";
import Footer from "./Components/Footer";
import PaymentForm from "./Components/PaymentForm";
import { CartProvider } from "./Components/CartContext";
import ScrollToTop from "./Components/ScrollToTop";
import BackToTop from "./Components/BacktToTop";
import Cookies from "./Components/Cookies";
import { CompareProvider } from "./Components/CompareContext";
import CompareModal from "./Components/CompareModal";

import Home from "./Pages/Home";
import About from "./Pages/About";
import Shop from "./Pages/Shop";
import Contact from "./Pages/Contact";
import ViewCart from "./Pages/Cart";
import Checkout from "./Pages/Checkout";
import Login from "./Pages/Login";
import Register from "./Pages/Register";
import OrderSummary from "./Pages/OrderSuccess";
import UserProfile from "./Pages/UserProfile";
import FAQ from "./Pages/FAQ";
import ProductDetails from "./Pages/ProductDetails";
import InvoicePage from "./Pages/Invoice";
import AdminPrivateRoute from "./AdminPrivateRoute";
import PasswordReset from "./Pages/PasswordReset";

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_API_URL;
axios.defaults.headers.post["Accept"] = "application/json";
axios.defaults.headers.post["Content-Type"] = "application/json";

axios.interceptors.request.use(function (config) {
  const token = localStorage.getItem("auth_token");
  config.headers.Authorization = token ? `Bearer ${token}` : "";
  return config;
});

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = async () => {
    try {
      await axios.post("/api/logout");
    } catch (error) {
      // console.error("Error logging out:", error);
    } finally {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("auth_name");
      setIsLoggedIn(false);
    }
  };

  return (
    <CompareProvider>
      <CartProvider>
        <Router>
          <div className="App">
            <ScrollToTop />
            <Header isLoggedIn={isLoggedIn} />

            <Routes>
              <Route
                path="/login"
                element={
                  isLoggedIn ? (
                    <Navigate to="/dashboard" replace />
                  ) : (
                    <Login setIsLoggedIn={setIsLoggedIn} />
                  )
                }
              />
              <Route
                path="/register"
                element={
                  isLoggedIn ? <Navigate to="/" replace /> : <Register />
                }
              />
              <Route path="/reset-password" element={<PasswordReset />} />
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/cart" element={<ViewCart />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route
                path="/payform"
                element={
                  <Elements stripe={stripePromise}>
                    <PaymentForm />
                  </Elements>
                }
              />
              <Route path="/order-success" element={<OrderSummary />} />
              <Route path="/user-profile" element={<UserProfile />} />
              <Route
                path="/dashboard"
                element={
                  isLoggedIn ? (
                    <AdminPrivateRoute handleLogout={handleLogout} />
                  ) : (
                    <Navigate to="/login" replace />
                  )
                }
              />
              <Route path="/faq" element={<FAQ />} />
              <Route
                path="/shop/product/:slugWithId"
                element={<ProductDetails />}
              />
              <Route path="/invoice" element={<InvoicePage />} />
            </Routes>

            {/* Global compare modal (opens with #compareModal) */}
            <CompareModal />

            <Footer />
            <BackToTop />
            <Cookies />
          </div>
        </Router>
      </CartProvider>
    </CompareProvider>
  );
}

export default App;
