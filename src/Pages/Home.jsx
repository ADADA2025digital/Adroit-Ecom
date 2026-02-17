import React, { useEffect, useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { Clients, carouselData, fetchProducts } from "../Constants/Data";
import ProductCard from "../Components/ProductCard";
import api from "../Config/api";
import GlobalButton from "../Components/Button";
import ProductCollection from "../Components/ProductCollection";
import Ad1 from "../Assets/Images/ad1.png";
import Ad2 from "../Assets/Images/ad2.png";
import Ad3 from "../Assets/Images/ad3.png";
import Hero from "../Assets/Images/hero.png";

const Home = () => {
  // Data state
  const [products, setProducts] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [itemTypes, setItemTypes] = useState([]);
  const [selectedItemType, setSelectedItemType] = useState("");
  const [activeHeroBar, setActiveHeroBar] = useState(0); // ✅ Added missing state

  // Carousel auto-slide
  const carouselRef = useRef(null);
  useEffect(() => {
    const el = carouselRef.current;
    if (!el) return;

    const handleSlid = (e) => {
      // e.to = new slide index (Bootstrap carousel event)
      if (typeof e.to === "number") setActiveHeroBar(e.to);
    };

    el.addEventListener("slid.bs.carousel", handleSlid);
    return () => el.removeEventListener("slid.bs.carousel", handleSlid);
  }, []);

  // Load initial data from cache instantly
  useEffect(() => {
    const loadInitialData = () => {
      // Load cached products
      const cachedProducts = JSON.parse(
        localStorage.getItem("cached_products") || "[]",
      );
      const cachedItemTypes = JSON.parse(
        localStorage.getItem("cached_item_types") || "[]",
      );

      if (cachedProducts.length > 0) {
        setAllProducts(cachedProducts);
        setProducts(cachedProducts.slice(0, 12));
      }

      if (cachedItemTypes.length > 0) {
        setItemTypes(cachedItemTypes);
      }
    };

    loadInitialData();

    // Fetch fresh data in background
    loadProducts();
    fetchItemTypes();
  }, []);

  const loadProducts = async () => {
    try {
      const data = await fetchProducts();
      if (Array.isArray(data) && data.length > 0) {
        setAllProducts(data);
        setProducts(data.slice(0, 12));
        // Cache for next load
        localStorage.setItem("cached_products", JSON.stringify(data));
      }
    } catch (err) {
      // Keep cached data on error
      // console.error("Error loading products:", err);
    }
  };

  const fetchItemTypes = async () => {
    try {
      const response = await api.get("/items/itemtypes");
      const types = Array.isArray(response.data) ? response.data : [];
      setItemTypes(types);
      localStorage.setItem("cached_item_types", JSON.stringify(types));
    } catch (error) {
      // console.error("Error fetching item types:", error);
      // Keep cached item types on error
    }
  };

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

  return (
    <>
      <Helmet>
        {/* Basic SEO */}
        <title>
          Adroit Alarm Systems | Integrated Security & Automation Solutions
          Australia
        </title>
        <meta
          name="description"
          content="ADROIT is a premier Australian security company specializing in Electronic Security, Home Automation, Audio Visual, Data Cabling, and Ducted Vacuum systems. ASIAL accredited with 20+ years of experience delivering integrated, hassle-free solutions."
        />
        <meta
          name="keywords"
          content="ADROIT, Adroit Alarm System, security companies Australia, electronic security Sydney, home automation Australia, audio visual installation, data cabling contractors, ducted vacuum systems, ASIAL Silver Member, security license holders, integrated security solutions, Dynalite certified, commercial security, residential automation, access control, CCTV installation Australia"
        />
        <meta name="author" content="ADROIT Alarm Systems Australia" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://shop.adroitalarm.com.au/" />

        {/* Open Graph */}
        <meta
          property="og:title"
          content="ADROIT Alarm Systems | Electronic Security & Automation Experts"
        />
        <meta
          property="og:description"
          content="Since 2008, ADROIT has delivered premium integrated solutions including security, automation, and AV. Fully licensed (Master License No: 000101930) and ASIAL accredited."
        />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://shop.adroitalarm.com.au/" />
        <meta property="og:site_name" content="ADROIT Alarm Systems" />

        {/* Social Links */}
        <meta
          property="og:see_also"
          content="https://www.instagram.com/adroitalarm/"
        />
        <meta
          property="og:see_also"
          content="https://www.facebook.com/p/Adroit-alarms-100071267801808/"
        />

        {/* Facebook  */}
        <meta property="fb:app_id" content="#" />
        <meta
          property="fb:admins"
          content="https://www.facebook.com/p/Adroit-alarms-100071267801808/"
        />

        {/* Instagram */}
        <meta name="instagram:title" content="ADROIT Alarm Systems Australia" />
        <meta
          name="instagram:description"
          content="Integrated solutions in electronic security, automation, audio visual and data cabling. Trusted Australian security specialists since 2008."
        />
        <meta name="instagram:site" content="@adroitalarm" />
      </Helmet>

      <div className="container-fluid p-0">
        {/* ===== Hero Carousel ===== */}
        <section
          className="heroCarousel p-0 position-relative"
          style={{
            backgroundImage: `url(${Hero})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div
            id="heroCarousel"
            className="carousel slide vh-100 d-flex align-items-center"
            data-bs-ride="carousel"
            ref={carouselRef}
          >
            <div className="hero-navigation position-absolute d-flex justify-content-center gap-3">
              {carouselData.map((slide, index) => (
                <button
                  key={index}
                  type="button"
                  data-bs-target="#heroCarousel"
                  data-bs-slide-to={index}
                  className={`hero-bar border-0 ${activeHeroBar === index ? "active" : ""}`}
                  aria-label={`Go to slide ${index + 1}: ${slide.title || slide.heading || "Hero slide"}`}
                  aria-current={activeHeroBar === index ? "true" : undefined}
                  onClick={() => setActiveHeroBar(index)}
                />
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
                  <div className="d-flex align-items-center justify-content-center h-100 text-white py-5">
                    <div className="container py-5">
                      <div className="row align-items-center">
                        <div className="col-md-7 pb-5 text-center text-md-start">
                          <div className="d-flex fs-5 gap-2 heading d-flex align-items-center justify-content-center justify-content-md-start mb-3">
                            <p className="text-primary fw-semibold">
                              {slide.subtitle}
                            </p>
                            <i className="bi bi-dash-lg text-primary"></i>
                          </div>
                          <h1 className="fw-bold display-4 display-md-5 heading">
                            {slide.title}
                          </h1>
                          <h6 className="text-light my-4">
                            {slide.description}
                          </h6>
                          <div className="d-flex align-items-center justify-content-center justify-content-md-start">
                            <GlobalButton
                              to={slide.buttonLink}
                              className="mt-3"
                            >
                              {slide.buttonText}
                            </GlobalButton>
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
        <section className="pb-5">
          <div className="client-logos dark-blue-bg d-flex overflow-hidden position-relative py-5">
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

        {/* ===== Featured Products ===== */}
        <section className="pb-5">
          <div className="container">
            <div className="row g-3">
              <div className="col-md-4">
                <div className="image-wrapper">
                  <img
                    src={Ad1}
                    alt="Featured Product"
                    className="object-fit-cover w-100"
                  />
                </div>
              </div>

              <div className="col-md-4">
                <div className="image-wrapper">
                  <img
                    src={Ad2}
                    alt="Featured Product"
                    className="object-fit-cover w-100"
                  />
                </div>
              </div>

              <div className="col-md-4">
                <div className="image-wrapper">
                  <img
                    src={Ad3}
                    alt="Featured Product"
                    className="object-fit-cover w-100"
                  />
                </div>
              </div>
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
            {Array.isArray(products) && products.length > 0 ? (
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
              <div className="col-12 text-center py-5">
                <p className="text-muted mb-4">
                  No products available at the moment
                </p>
                <GlobalButton to="/shop">Browse All Products</GlobalButton>
              </div>
            )}
          </div>

          {products.length > 0 && (
            <div className="d-flex justify-content-center">
              <GlobalButton to="/shop">View More</GlobalButton>
            </div>
          )}
        </section>
      </div>
    </>
  );
};

export default Home;
