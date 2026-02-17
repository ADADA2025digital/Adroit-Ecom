import React, { useEffect, useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import PageHeader from "../Components/PageHeader";
import Banner from "../Assets/Images/1.png";
import ProductCard from "../Components/ProductCard";
import { fetchProducts } from "../Constants/Data";
import PageBanner from "../Components/PageBanner";
import api from "../Config/api";
import { CgLayoutGrid } from "react-icons/cg";
import { TfiLayoutGrid3Alt, TfiLayoutGrid4Alt } from "react-icons/tfi";
import { Range } from "react-range";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";

const Shop = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("Ascending Order");
  const [itemsPerPage, setItemsPerPage] = useState(12); // Default to 12 products per page
  const [currentPage, setCurrentPage] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedRatings, setSelectedRatings] = useState([]);
  const [gridView, setGridView] = useState("grid-4");
  const [loading, setLoading] = useState(true);
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [debouncedPriceRange, setDebouncedPriceRange] = useState([0, 10000]);

  // State for custom dropdowns
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [isItemsPerPageOpen, setIsItemsPerPageOpen] = useState(false);

  // State for collapsible sections
  const [collapsedSections, setCollapsedSections] = useState({
    categories: false,
    ratings: false,
    priceRange: false,
  });

  // Calculate min and max price from products
  const priceBounds = useMemo(() => {
    if (!Array.isArray(products) || products.length === 0) {
      return { min: 0, max: 10000 };
    }

    const prices = products
      .map((p) => parseFloat(p.pro_price || p.price || 0))
      .filter((p) => p > 0);
    
    if (prices.length === 0) {
      return { min: 0, max: 10000 };
    }

    return {
      min: Math.floor(Math.min(...prices)),
      max: Math.ceil(Math.max(...prices)),
    };
  }, [products]);

  // Set initial price range based on actual product prices
  useEffect(() => {
    if (products.length > 0) {
      const { min, max } = priceBounds;
      setPriceRange([min, max]);
      setDebouncedPriceRange([min, max]);
    }
  }, [products, priceBounds]);

  // Toggle section collapse
  const toggleSection = (section) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Debounce price range changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPriceRange(priceRange);
      setCurrentPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [priceRange]);

  // Add animation styles to head
  useEffect(() => {
    const style = document.createElement("style");
    style.innerHTML = `
      @keyframes shine {
        0% { background-position: 100% 0; }
        100% { background-position: 0 0; }
      }
      
      .filter-section-content {
        transition: opacity 0.3s ease-in-out, visibility 0.3s ease-in-out;
        height: 180px !important;
        overflow-y: auto !important;
      }   
      
      .filter-section-content.collapsed {
        opacity: 0;
        visibility: hidden;
      }
      
      .filter-section-header {
        cursor: pointer;
        transition: background-color 0.2s ease;
      }   
      
      .filter-arrow {
        transition: transform 0.3s ease;
      }

      .rotate-180 {
        transform: rotate(180deg);
      }
      
      .custom-select {
        appearance: none !important;
        background-image: none !important;
        background: white !important;
        padding: 0.375rem 0.75rem !important;
        cursor: pointer;
      }
      
      .custom-select .filter-arrow {
        pointer-events: none;
      }
      
      .custom-select-dropdown {
        top: 100%;
        z-index: 1060;
        margin-top: 4px;
        max-height: 200px;
        overflow-y: auto;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      }
      
      .custom-select-option {
        padding: 0.375rem 0.75rem;
        cursor: pointer;
        transition: background-color 0.2s;
      }
      
      .custom-select-option:hover {
        background-color: #f8f9fa;
      }
      
      .custom-select-option.selected {
        background-color: #0d6efd;
        color: white;
      }
      
      .custom-select-option.selected:hover {
        background-color: #0b5ed7;
      }
    `;
    document.head.appendChild(style);
    return () => style.remove();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        !event.target.closest(".sort-dropdown") &&
        !event.target.closest(".items-dropdown")
      ) {
        setIsSortOpen(false);
        setIsItemsPerPageOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Memoized filtered products by search, price, categories, and ratings
  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products) || products.length === 0) {
      return [];
    }

    return products.filter((product) => {
      const name = (product.productname || product.name || "").toLowerCase();
      const matchesSearch = name.includes(searchQuery.toLowerCase());

      const productPrice = parseFloat(product.pro_price || product.price || 0);
      const matchesPrice =
        productPrice >= debouncedPriceRange[0] &&
        productPrice <= debouncedPriceRange[1];

      const categoryId = product.category_id || product.categoryId;
      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.includes(categoryId);

      const matchesRating =
        selectedRatings.length === 0 ||
        selectedRatings.some(
          (rating) => product.rating && product.rating >= rating,
        );

      return matchesSearch && matchesPrice && matchesCategory && matchesRating;
    });
  }, [
    products,
    searchQuery,
    debouncedPriceRange,
    selectedCategories,
    selectedRatings,
  ]);

  // Memoized sorted products
  const sortedProducts = useMemo(() => {
    let sorted = [...filteredProducts];

    if (sorted.length === 0) {
      return sorted;
    }

    if (sortOrder === "Ascending Order") {
      sorted.sort((a, b) =>
        (a.productname || a.name || "").localeCompare(b.productname || b.name || ""),
      );
    } else if (sortOrder === "Descending Order") {
      sorted.sort((a, b) =>
        (b.productname || b.name || "").localeCompare(a.productname || a.name || ""),
      );
    } else if (sortOrder === "Low - High Price") {
      sorted.sort(
        (a, b) => parseFloat(a.pro_price || a.price || 0) - parseFloat(b.pro_price || b.price || 0),
      );
    } else if (sortOrder === "High - Low Price") {
      sorted.sort(
        (a, b) => parseFloat(b.pro_price || b.price || 0) - parseFloat(a.pro_price || a.price || 0),
      );
    }
    return sorted;
  }, [filteredProducts, sortOrder]);

  // Calculate total pages
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);

  // Paginated products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedProducts.slice(startIndex, endIndex);
  }, [sortedProducts, currentPage, itemsPerPage]);

  // Get grid column classes based on selected view
  const getGridClasses = () => {
    switch (gridView) {
      case "grid-2":
        return "col-lg-6 col-md-6 col-sm-6";
      case "grid-3":
        return "col-lg-4 col-md-4 col-sm-6";
      case "grid-4":
      default:
        return "col-lg-3 col-md-4 col-sm-6";
    }
  };

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await api.get("/getcategory");
        setCategories(response.data);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };

    fetchCategories();
  }, []);

  // Fetch products based on selected categories
  useEffect(() => {
    const fetchProductsData = async () => {
      setLoading(true);
      try {
        if (selectedCategories.length > 0) {
          const categoryParam = selectedCategories.join(",");
          const response = await api.get(`/category/${categoryParam}/products`);

          const productsWithImages = response.data.map((product) => ({
            ...product,
            imageUrl: product.image
              ? `https://shop.adroitalarm.com.au/storage/${product.image.replace(
                  "public/storage/",
                  "",
                )}`
              : "https://via.placeholder.com/300",
          }));

          setProducts(productsWithImages);
        } else {
          const data = await fetchProducts();
          setProducts(data);
        }
        setCurrentPage(1); // Reset to first page when products change
      } catch (err) {
        console.error("Error fetching products:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProductsData();
  }, [selectedCategories]);

  const handleCategorySelection = (categoryId) => {
    setSelectedCategories((prevSelected) =>
      prevSelected.includes(categoryId)
        ? prevSelected.filter((id) => id !== categoryId)
        : [...prevSelected, categoryId],
    );
    setCurrentPage(1);
  };

  const handleRatingSelection = (rating) => {
    setSelectedRatings((prevSelected) =>
      prevSelected.includes(rating)
        ? prevSelected.filter((r) => r !== rating)
        : [...prevSelected, rating],
    );
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle price range change
  const handlePriceRangeChange = (values) => {
    setPriceRange(values);
  };

  // Reset all filters
  const resetAllFilters = () => {
    setSelectedCategories([]);
    setSelectedRatings([]);
    const { min, max } = priceBounds;
    setPriceRange([min, max]);
    setDebouncedPriceRange([min, max]);
    setSearchQuery("");
    setSortOrder("Ascending Order");
    setCurrentPage(1);
  };

  // Generate page numbers for pagination
  const pageNumbers = useMemo(() => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      let startPage = Math.max(2, currentPage - 1);
      let endPage = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 2) {
        endPage = 3;
      }

      if (currentPage >= totalPages - 1) {
        startPage = totalPages - 2;
      }

      if (startPage > 2) {
        pages.push("...");
      }

      for (let i = startPage; i <= endPage; i++) {
        pages.push(i);
      }

      if (endPage < totalPages - 1) {
        pages.push("...");
      }

      pages.push(totalPages);
    }

    return pages;
  }, [totalPages, currentPage]);

  const SkeletonCard = () => (
    <div className="mb-5">
      <div className="border rounded-0 p-3 h-100">
        <div
          style={{
            width: "100%",
            height:
              gridView === "grid-2"
                ? "400px"
                : gridView === "grid-3"
                  ? "350px"
                  : "300px",
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

  return (
    <>
      <Helmet>
        <title>Shop | Adroit Alarm Systems</title>
        <meta
          name="description"
          content="ADROIT is a premier Australian security company specializing in Electronic Security, Home Automation, Audio Visual, Data Cabling, and Ducted Vacuum systems."
        />
        <meta name="keywords" content="ADROIT, Adroit Alarm System, security companies Australia, electronic security Sydney" />
        <meta name="author" content="ADROIT Alarm Systems Australia" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://shop.adroitalarm.com.au/" />
      </Helmet>

      <section>
        <PageHeader title="Shop" path="Home / Shop" />

        <div className="container py-5">
          <PageBanner src={Banner} alt="Home Page Banner" />

          {/* Filter panel controls */}
          <div className="bg-light p-2 border mt-3 d-flex flex-column flex-md-row justify-content-md-between align-items-md-center gap-3">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-5 w-100">
              <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center gap-2 w-100 w-md-auto">
                <button
                  className="btn border bg-white text-secondary rounded-0 w-100 w-md-auto d-flex align-items-center justify-content-center gap-2"
                  onClick={() => setIsOpen(!isOpen)}
                >
                  {isOpen ? (
                    <>
                      <i className="bi bi-x"></i> Close Filter Panel
                    </>
                  ) : (
                    <>
                      <i className="bi bi-funnel"></i> Filter Panel
                    </>
                  )}
                </button>

                {/* Custom Sort Order Dropdown */}
                <div className="position-relative w-100 w-md-auto sort-dropdown">
                  <button
                    className="form-select custom-select bg-white rounded-0 w-100 text-start position-relative d-flex align-items-center justify-content-between"
                    onClick={() => {
                      setIsSortOpen(!isSortOpen);
                      setIsItemsPerPageOpen(false);
                    }}
                    type="button"
                  >
                    <span>{sortOrder}</span>
                    <span
                      className={`filter-arrow ms-2 d-flex align-items-center justify-content-center ${isSortOpen ? "rotate-180" : ""}`}
                    >
                      <FaChevronDown size={12} />
                    </span>
                  </button>
                  {isSortOpen && (
                    <div className="custom-select-dropdown position-absolute start-0 end-0 bg-white">
                      {[
                        "Ascending Order",
                        "Descending Order",
                        "Low - High Price",
                        "High - Low Price",
                      ].map((option) => (
                        <div
                          key={option}
                          className={`custom-select-option ${sortOrder === option ? "selected" : ""}`}
                          onClick={() => {
                            setSortOrder(option);
                            setCurrentPage(1);
                            setIsSortOpen(false);
                          }}
                        >
                          {option}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Custom Items Per Page Dropdown */}
                <div className="position-relative w-100 w-md-auto items-dropdown">
                  <button
                    className="form-select custom-select bg-white rounded-0 w-100 text-start position-relative d-flex align-items-center justify-content-between"
                    onClick={() => {
                      setIsItemsPerPageOpen(!isItemsPerPageOpen);
                      setIsSortOpen(false);
                    }}
                    type="button"
                  >
                    <span>{itemsPerPage} Products</span>
                    <span
                      className={`filter-arrow ms-2 d-flex align-items-center justify-content-center ${isItemsPerPageOpen ? "rotate-180" : ""}`}
                    >
                      <FaChevronDown size={12} />
                    </span>
                  </button>
                  {isItemsPerPageOpen && (
                    <div className="custom-select-dropdown position-absolute start-0 end-0 bg-white">
                      {[12, 24, 36, 48].map((option) => (
                        <div
                          key={option}
                          className={`custom-select-option ${itemsPerPage === option ? "selected" : ""}`}
                          onClick={() => {
                            setItemsPerPage(option);
                            setCurrentPage(1);
                            setIsItemsPerPageOpen(false);
                          }}
                        >
                          {option} Products
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center gap-2 w-100 w-md-auto">
                <div className="input-group w-100 w-md-auto">
                  <input
                    type="text"
                    className="form-control rounded-0"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                  <button className="btn btn-light border rounded-0">
                    <i className="bi bi-search"></i>
                  </button>
                </div>

                {/* Grid View Selector */}
                <div className="d-none d-md-flex align-items-center">
                  <div className="btn-group p-0 rounded-0" role="group">
                    <button
                      type="button"
                      className={`btn bg-white border rounded-0 ${
                        gridView === "grid-2"
                          ? "active text-primary"
                          : "text-dark"
                      }`}
                      onClick={() => setGridView("grid-2")}
                      title="2 Columns"
                    >
                      <CgLayoutGrid size={20} />
                    </button>
                    <button
                      type="button"
                      className={`btn bg-white border rounded-0 ${
                        gridView === "grid-3"
                          ? "active text-primary"
                          : "text-dark"
                      }`}
                      onClick={() => setGridView("grid-3")}
                      title="3 Columns"
                    >
                      <TfiLayoutGrid3Alt />
                    </button>
                    <button
                      type="button"
                      className={`btn bg-white border rounded-0 ${
                        gridView === "grid-4"
                          ? "active text-primary"
                          : "text-dark"
                      }`}
                      onClick={() => setGridView("grid-4")}
                      title="4 Columns"
                    >
                      <TfiLayoutGrid4Alt size={25} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="position-relative mt-3">
            {isOpen && (
              <div
                className="bg-light border p-3 position-absolute rounded-0 top-0 start-0 end-0"
                style={{
                  zIndex: 1050,
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)",
                  maxHeight: "500px",
                  overflowY: "auto",
                }}
              >
                <div className="row g-3 mb-2 border-bottom pb-1">
                  {/* Categories */}
                  <div className="col-md-4">
                    <div
                      className="filter-section-header d-flex justify-content-between align-items-center py-2 mb-2"
                      onClick={() => toggleSection("categories")}
                    >
                      <h6 className="fw-bold heading mb-0">Categories</h6>
                      <span className="filter-arrow">
                        {collapsedSections.categories ? (
                          <FaChevronDown size={14} />
                        ) : (
                          <FaChevronUp size={14} />
                        )}
                      </span>
                    </div>
                    <div
                      className={`panel-column filter-section-content p-1 ${
                        collapsedSections.categories ? "collapsed" : ""
                      }`}
                    >
                      {Array.isArray(categories) &&
                        categories.map((category) => (
                          <div
                            key={category.category_id}
                            className="form-check collection-filter-checkbox mb-1"
                          >
                            <input
                              type="checkbox"
                              className="form-check-input rounded-0"
                              id={category.categoryname}
                              checked={selectedCategories.includes(
                                category.category_id,
                              )}
                              onChange={() =>
                                handleCategorySelection(category.category_id)
                              }
                            />
                            <label
                              className="form-check-label"
                              htmlFor={category.categoryname}
                            >
                              {category.categoryname}
                            </label>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Ratings */}
                  <div className="col-md-4">
                    <div
                      className="filter-section-header d-flex justify-content-between align-items-center py-2 mb-2"
                      onClick={() => toggleSection("ratings")}
                    >
                      <h6 className="fw-bold heading mb-0">Rating</h6>
                      <span className="filter-arrow">
                        {collapsedSections.ratings ? (
                          <FaChevronDown size={14} />
                        ) : (
                          <FaChevronUp size={14} />
                        )}
                      </span>
                    </div>
                    <div
                      className={`panel-column filter-section-content p-1 ${
                        collapsedSections.ratings ? "collapsed" : ""
                      }`}
                    >
                      {[5, 4, 3, 2, 1].map((star) => (
                        <div
                          key={star}
                          className="form-check d-flex align-items-center mb-2"
                        >
                          <input
                            className="form-check-input rounded-0"
                            type="checkbox"
                            id={`star-${star}`}
                            checked={selectedRatings.includes(star)}
                            onChange={() => handleRatingSelection(star)}
                          />
                          <label
                            className="form-check-label ms-2"
                            htmlFor={`star-${star}`}
                          >
                            {"★".repeat(star)}
                            {"☆".repeat(5 - star)} ({star} Star)
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Price Range */}
                  <div className="col-md-4">
                    <div
                      className="filter-section-header d-flex justify-content-between align-items-center py-2 mb-2"
                      onClick={() => toggleSection("priceRange")}
                    >
                      <h6 className="fw-bold heading mb-0">Filter By Price</h6>
                      <span className="filter-arrow">
                        {collapsedSections.priceRange ? (
                          <FaChevronDown size={14} />
                        ) : (
                          <FaChevronUp size={14} />
                        )}
                      </span>
                    </div>
                    <div
                      className={`panel-column filter-section-content price-section p-2 ${
                        collapsedSections.priceRange ? "collapsed" : ""
                      }`}
                    >
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span className="small fw-bold">Price Range</span>
                      </div>
                      <p className="small mb-4">
                        Your range:{" "}
                        <strong>
                          ${priceRange[0].toLocaleString()} - $
                          {priceRange[1].toLocaleString()}
                        </strong>
                      </p>

                      <div className="px-1">
                        <Range
                          step={10}
                          min={priceBounds.min}
                          max={priceBounds.max}
                          values={priceRange}
                          onChange={handlePriceRangeChange}
                          renderTrack={({ props, children }) => {
                            const { key, ...restProps } = props;
                            return (
                              <div
                                {...restProps}
                                key={key}
                                style={{
                                  height: "2px",
                                  width: "100%",
                                  background: "rgba(0,0,0,0.3)",
                                  position: "relative",
                                  marginTop: "10px",
                                }}
                              >
                                <div
                                  style={{
                                    position: "absolute",
                                    height: "2px",
                                    background: "#0d6efd",
                                    left: `${((priceRange[0] - priceBounds.min) / (priceBounds.max - priceBounds.min)) * 100}%`,
                                    right: `${100 - ((priceRange[1] - priceBounds.min) / (priceBounds.max - priceBounds.min)) * 100}%`,
                                  }}
                                />
                                {children}
                              </div>
                            );
                          }}
                          renderThumb={({ props }) => {
                            const { key, ...restProps } = props;
                            return (
                              <div
                                {...restProps}
                                key={key}
                                style={{
                                  height: "14px",
                                  width: "14px",
                                  backgroundColor: "#0d6efd",
                                  borderRadius: "50%",
                                  marginTop: "-14px",
                                  cursor: "pointer",
                                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                                }}
                              />
                            );
                          }}
                        />

                        <div className="d-flex justify-content-between mt-2">
                          <span className="small">${priceBounds.min}</span>
                          <span className="small">${priceBounds.max}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reset All Filters Button */}
                <div className="d-flex justify-content-end">
                  <button
                    className="btn btn-outline-secondary rounded-0 d-flex align-items-center gap-2"
                    onClick={resetAllFilters}
                  >
                    <i className="bi bi-arrow-counterclockwise"></i>
                    Reset All Filters
                  </button>
                </div>
              </div>
            )}

            {/* Products container */}
            <div className="row pt-3">
              {loading ? (
                Array.from({ length: itemsPerPage }).map((_, i) => (
                  <div key={`sk-${i}`} className={`${getGridClasses()} mb-5`}>
                    <SkeletonCard />
                  </div>
                ))
              ) : paginatedProducts.length > 0 ? (
                paginatedProducts.map((product) => (
                  <div
                    key={
                      product.id ??
                      product.product_id ??
                      product.slug ??
                      `product-${Math.random()}`
                    }
                    className={`${getGridClasses()} mb-5`}
                  >
                    <ProductCard product={product} gridView={gridView} />
                  </div>
                ))
              ) : (
                <div className="col-12">
                  <div className="text-center py-5">
                    <p className="text-muted mb-3">No products available</p>
                    <p className="text-muted small">
                      Try adjusting your filters or price range
                    </p>
                    <button
                      className="btn btn-outline-primary rounded-0 mt-2"
                      onClick={resetAllFilters}
                    >
                      Reset Filters
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav className="mt-4">
              <ul className="pagination justify-content-center gap-2">
                <li
                  className={`page-item ${currentPage === 1 ? "disabled" : ""}`}
                >
                  <button
                    className="page-link rounded-0"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    <i className="bi bi-chevron-left"></i>
                  </button>
                </li>

                {pageNumbers.map((page, index) => (
                  <li
                    key={index}
                    className={`page-item ${
                      page === "..."
                        ? "disabled"
                        : currentPage === page
                          ? "active"
                          : ""
                    }`}
                  >
                    {page === "..." ? (
                      <span className="page-link">...</span>
                    ) : (
                      <button
                        className={`page-link rounded-0 ${
                          currentPage === page
                            ? "bg-primary text-white border-primary"
                            : ""
                        }`}
                        onClick={() => handlePageChange(page)}
                      >
                        {page}
                      </button>
                    )}
                  </li>
                ))}

                <li
                  className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}
                >
                  <button
                    className="page-link rounded-0"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    <i className="bi bi-chevron-right"></i>
                  </button>
                </li>
              </ul>
            </nav>
          )}

          {/* Showing info */}
          {!loading && sortedProducts.length > 0 && (
            <div className="text-center small heading mt-3 text-muted">
              Showing {paginatedProducts.length} of {sortedProducts.length} products
              {sortedProducts.length < products.length && 
                ` (${products.length - sortedProducts.length} filtered out)`
              }
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default Shop;