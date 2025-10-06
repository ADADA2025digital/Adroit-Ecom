import React, { useEffect, useState, useRef } from "react";
import { Clients, carouselData, fetchProducts } from "../Constants/Data";
import ProductCard from "../Components/ProductCard";
import axios from "axios";
import GlobalButton from "../Components/Button";
import ProductCollection from "../Components/ProductCollection";

const Home = () => {
  const BASE_URL =
    import.meta.env.VITE_API_URL || "https://shop.adroitalarm.com.au/";

  // Data state
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [itemTypes, setItemTypes] = useState([]);
  const [selectedItemType, setSelectedItemType] = useState("");

  // Loading flags
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [loadingTypes, setLoadingTypes] = useState(true);

  // ---- Skeletons (no spinner) ----
  const SkeletonPill = () => (
    <span
      className="rounded-0 border-bottom border-3 px-2"
      style={{
        width: 80,
        height: 28,
        display: "inline-block",
        background:
          "linear-gradient(90deg, rgba(0,0,0,0.06) 25%, rgba(0,0,0,0.12) 37%, rgba(0,0,0,0.06) 63%)",
        backgroundSize: "400% 100%",
        animation: "shine 1.4s ease infinite",
      }}
      aria-hidden="true"
    />
  );

  const SkeletonCard = () => (
    <div className="col-lg-3 col-md-4 col-sm-6 mb-5">
      <div className="border rounded-0 p-3 h-100">
        <div
          style={{
            width: "100%",
            height: 180,
            borderRadius: 12,
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.06) 25%, rgba(0,0,0,0.12) 37%, rgba(0,0,0,0.06) 63%)",
            backgroundSize: "400% 100%",
            animation: "shine 1.4s ease infinite",
          }}
        />
        <div
          className="mt-3"
          style={{
            width: "70%",
            height: 16,
            borderRadius: 6,
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.06) 25%, rgba(0,0,0,0.12) 37%, rgba(0,0,0,0.06) 63%)",
            backgroundSize: "400% 100%",
            animation: "shine 1.4s ease infinite",
          }}
        />
        <div
          className="mt-2"
          style={{
            width: "50%",
            height: 14,
            borderRadius: 6,
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.06) 25%, rgba(0,0,0,0.12) 37%, rgba(0,0,0,0.06) 63%)",
            backgroundSize: "400% 100%",
            animation: "shine 1.4s ease infinite",
          }}
        />
        <div
          className="mt-3"
          style={{
            width: "40%",
            height: 32,
            borderRadius: 8,
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.06) 25%, rgba(0,0,0,0.12) 37%, rgba(0,0,0,0.06) 63%)",
            backgroundSize: "400% 100%",
            animation: "shine 1.4s ease infinite",
          }}
        />
      </div>
    </div>
  );

  // (Optional) your circular skeleton from the prompt, in case you want to reuse it:
  const SkeletonCircle = () => (
    <div
      className="me-0 mb-3 border rounded-circle"
      style={{
        width: 150,
        height: 150,
        overflow: "hidden",
        background:
          "linear-gradient(90deg, rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.1) 37%, rgba(0,0,0,0.05) 63%)",
        backgroundSize: "400% 100%",
        animation: "shine 1s ease infinite",
      }}
      aria-hidden="true"
    />
  );

  // Fetch products
  useEffect(() => {
    const loadProducts = async () => {
      setLoadingProducts(true);
      try {
        const data = await fetchProducts();
        if (Array.isArray(data) && data.length > 0) {
          setAllProducts(data);
          // Show 12 latest initially
          setProducts(data.slice(0, 12));
        } else {
          setAllProducts([]);
          setProducts([]);
          // console.error("API returned empty or invalid products:", data);
        }
      } catch (err) {
        // console.error("Error fetching products:", err);
        setAllProducts([]);
        setProducts([]);
      } finally {
        setLoadingProducts(false);
      }
    };
    loadProducts();
  }, []);

  // Fetch item types
  useEffect(() => {
    const fetchItemTypes = async () => {
      setLoadingTypes(true);
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}api/items/itemtypes`
        );
        setItemTypes(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        // console.error("Error fetching item types:", error);
        setItemTypes([]);
      } finally {
        setLoadingTypes(false);
      }
    };
    fetchItemTypes();
  }, []);

  // Filter products when item type changes
  useEffect(() => {
    if (!selectedItemType) {
      setProducts(allProducts.slice(0, 12));
      return;
    }
    const filtered = Array.isArray(allProducts)
      ? allProducts.filter((product) => product?.item_type === selectedItemType)
      : [];
    setProducts(filtered);
  }, [selectedItemType, allProducts]);

  // Carousel auto-slide
  const carouselRef = useRef(null);
  useEffect(() => {
    if (carouselRef.current) {
      const el = carouselRef.current;
      const interval = setInterval(() => {
        const nextButton = el.querySelector('[data-bs-slide="next"]');
        if (nextButton) nextButton.click();
      }, 6000);
      return () => clearInterval(interval);
    }
  }, []);

  return (
    <>
      {/* minimal CSS for skeleton shimmer */}
      <style>{`
        @keyframes shine {
          0% { background-position: 100% 0; }
          100% { background-position: 0 0; }
        }
      `}</style>

      <div className="container-fluid p-0">
        {/* ===== Hero Carousel ===== */}
        <section className="heroCarousel p-0">
          <div
            id="heroCarousel"
            className="carousel slide"
            data-bs-ride="carousel"
            ref={carouselRef}
          >
            <div className="carousel-indicators position-absolute">
              {carouselData.map((_, index) => (
                <button
                  key={`ind-${index}`}
                  type="button"
                  data-bs-target="#heroCarousel"
                  data-bs-slide-to={index}
                  className={index === 0 ? "active" : ""}
                  aria-current={index === 0 ? "true" : "false"}
                  aria-label={`Slide ${index + 1}`}
                ></button>
              ))}
            </div>

            <div className="carousel-inner">
              {carouselData.map((slide, index) => (
                <div
                  className={`carousel-item hero-slide ${
                    index === 0 ? "active" : ""
                  }`}
                  key={slide.id || `slide-${index}`}
                  data-bs-interval="6000"
                >
                  <div className="bg-dark d-flex align-items-center justify-content-center h-100 text-white py-5">
                    <div className="container py-5">
                      <div className="row align-items-center">
                        <div className="col-md-6 pb-5 text-center text-md-start">
                          <div className="d-flex gap-2 heading d-flex align-items-center justify-content-center justify-content-md-start mb-3">
                            <p className="text-primary fw-semibold">
                              {slide.subtitle}
                            </p>
                            <i className="bi bi-dash-lg text-primary"></i>
                          </div>
                          <h1 className="fw-bold display-6 display-md-5 heading">
                            {slide.title}
                          </h1>
                          <p
                            className="text-light"
                            style={{ fontSize: "14px" }}
                          >
                            {slide.description}
                          </p>
                          <div className="d-flex align-items-center justify-content-center justify-content-md-start">
                            <GlobalButton
                              to={slide.buttonLink}
                              className="mt-3"
                            >
                              {slide.buttonText}
                            </GlobalButton>
                          </div>
                        </div>

                        <div className="col-md-6 d-flex align-items-center justify-content-center justify-content-md-end gap-5">
                          <div className="position-relative">
                            <img
                              src={slide.imageUrl}
                              className="img-fluid hero-img"
                              alt="Hero"
                            />
                          </div>
                          <div className="carousel-arrows position-relative d-flex flex-column justify-content-center align-items-center gap-3">
                            <button
                              type="button"
                              className="arrow-btn border-0 rounded-circle d-flex align-items-center justify-content-center"
                              data-bs-target="#heroCarousel"
                              data-bs-slide="prev"
                              aria-label="Previous"
                            >
                              <i className="bi bi-arrow-left"></i>
                            </button>
                            <button
                              type="button"
                              className="arrow-btn border-0 rounded-circle d-flex align-items-center justify-content-center"
                              data-bs-target="#heroCarousel"
                              data-bs-slide="next"
                              aria-label="Next"
                            >
                              <i className="bi bi-arrow-right"></i>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ===== Client Logos ===== */}
        <section className="py-5">
          <div className="client-logos bg-dark d-flex overflow-hidden position-relative py-5">
            <div className="logo-wrapper d-flex">
              {Clients.concat(Clients).map((imageSrc, index) => (
                <img
                  src={imageSrc}
                  alt={`Client Logo ${index + 1}`}
                  key={`client-${index}`}
                  className="client-logo"
                />
              ))}
            </div>
          </div>
        </section>

        <ProductCollection />

        {/* ===== Products ===== */}
        <section className="container products pb-5 justify-content-center text-center">
          <h2 className="text-dark text-center text-uppercase py-2 d-inline-block position-relative heading">
            Just For You
          </h2>

          {/* Item Type Filter */}
          <div className="d-flex flex-nowrap justify-content-center gap-3 pt-4 overflow-x-auto">
            <span
              className={`rounded-0 border-bottom border-3 px-2 fs-5 fw-semibold ${
                selectedItemType === ""
                  ? "border-primary text-primary"
                  : "border-white"
              }`}
              onClick={() => setSelectedItemType("")}
            >
              All
            </span>

            {itemTypes.map((type) => (
              <span
                key={type}
                className={`rounded-0 border-bottom border-3 px-2 ${
                  selectedItemType === type
                    ? "border-primary text-primary"
                    : "border-white"
                }`}
                onClick={() => setSelectedItemType(type)}
              >
                {type}
              </span>
            ))}
          </div>

          {/* Display Products */}
          <div className="row pt-5">
            {loadingProducts ? (
              // 8–12 skeleton cards to match typical grid
              Array.from({ length: 12 }).map((_, i) => (
                <SkeletonCard key={`sk-${i}`} />
              ))
            ) : Array.isArray(products) && products.length > 0 ? (
              products.map((product) => (
                <div
                  key={
                    product?.id ??
                    product?.slug ??
                    `p-${product?.sku ?? product?.name}`
                  }
                  className="col-lg-3 col-md-4 col-sm-6 mb-5"
                >
                  <ProductCard product={product} />
                </div>
              ))
            ) : (
              <p className="text-muted">No products available</p>
            )}
          </div>

          <div className="d-flex justify-content-center">
            <GlobalButton to="/shop">View More</GlobalButton>
          </div>
        </section>
      </div>
    </>
  );
};

export default Home;
