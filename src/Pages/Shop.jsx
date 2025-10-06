import React, { useEffect, useState, useMemo } from "react";
import PageHeader from "../Components/PageHeader";
import Banner from "../Assets/Images/banner.png";
import ProductCard from "../Components/ProductCard";
import { fetchProducts } from "../Constants/Data";
import PageBanner from "../Components/PageBanner";
import axios from "axios";
import PageLoader from "../Components/PageLoader";
import { CgLayoutGrid } from "react-icons/cg";
import { TfiLayoutGrid3Alt, TfiLayoutGrid4Alt } from "react-icons/tfi";

const Shop = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOrder, setSortOrder] = useState("Ascending Order");
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [currentPage, setCurrentPage] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [imageLoading, setImageLoading] = useState(true);
  const [gridView, setGridView] = useState("grid-4");
  const [loading, setLoading] = useState(true);

  const hideLoader = () => {
    setLoading(false);
  };

  // Memoized filtered products
  const filteredProducts = useMemo(() => {
    if (!Array.isArray(products)) {
      return [];
    }

    return products.filter((product) => {
      const name = product.productname ? product.productname.toLowerCase() : "";
      return name.includes(searchQuery.toLowerCase());
    });
  }, [products, searchQuery]);

  // Memoized sorted products
  const sortedProducts = useMemo(() => {
    let sorted = [...filteredProducts];

    if (sorted.length === 0) {
      return sorted;
    }

    if (sortOrder === "Ascending Order") {
      sorted.sort((a, b) =>
        (a.productname || "").localeCompare(b.productname || "")
      );
    } else if (sortOrder === "Descending Order") {
      sorted.sort((a, b) =>
        (b.productname || "").localeCompare(a.productname || "")
      );
    } else if (sortOrder === "Low - High Price") {
      sorted.sort(
        (a, b) => parseFloat(a.pro_price || 0) - parseFloat(b.pro_price || 0)
      );
    } else if (sortOrder === "High - Low Price") {
      sorted.sort(
        (a, b) => parseFloat(b.pro_price || 0) - parseFloat(a.pro_price || 0)
      );
    }
    return sorted;
  }, [filteredProducts, sortOrder]);

  // Calculate total pages
  const totalPages = Math.ceil(sortedProducts.length / itemsPerPage);

  // Paginated products
  const paginatedProducts = useMemo(() => {
    return sortedProducts.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
    );
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

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get("/api/getcategory");
        setCategories(response.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setTimeout(hideLoader, 1000);
      }
    };

    fetchCategories();
  }, []);

  useEffect(() => {
    // console.log("🔥 Products State Changed:", products);
  }, [products]);

  useEffect(() => {
    const loadProducts = async () => {
      setLoading(true);
      try {
        const data = await fetchProducts();
        // console.log("Fetched Products:", data);

        if (data.length === 0) {
          // console.warn("⚠️ No products found, state is empty");
        } else {
          // console.log("✅ Setting products state:", data);
        }

        setProducts(data);
      } catch (err) {
        // console.error("❌ Error fetching products:", err);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  useEffect(() => {
    const fetchProductsByCategory = async () => {
      setLoading(true);
      try {
        if (selectedCategories.length > 0) {
          const categoryParam = selectedCategories.join(",");
          const response = await axios.get(
            `/api/category/${categoryParam}/products`
          );

          // console.log("✅ API Response:", response.data);

          const productsWithImages = response.data.map((product) => ({
            ...product,
            imageUrl: product.image
              ? `https://shop.adroitalarm.com.au/storage/${product.image.replace(
                  "public/storage/",
                  ""
                )}`
              : "https://via.placeholder.com/300",
          }));

          setProducts(productsWithImages);
        } else {
          const data = await fetchProducts();
          setProducts(data);
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
        setTimeout(hideLoader, 1000);
      }
    };

    fetchProductsByCategory();
  }, [selectedCategories]);

  const handleCategorySelection = (categoryId) => {
    setSelectedCategories((prevSelected) =>
      prevSelected.includes(categoryId)
        ? prevSelected.filter((id) => id !== categoryId)
        : [...prevSelected, categoryId]
    );
    setCurrentPage(1);
  };

  // Handle page change
  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Generate page numbers for pagination
  const getPageNumbers = () => {
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
  };

  const SkeletonCard = () => (
    <div className="mb-5">
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

  const chunkArray = (array, size) => {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  };

  return (
    <>
      {/* minimal CSS for skeleton shimmer */}
      <style>{`
        @keyframes shine {
          0% { background-position: 100% 0; }
          100% { background-position: 0 0; }
        }
      `}</style>

      <section>
        <PageHeader title="Shop" path="Home / Shop" />

        <div className="container py-5">
          <PageBanner src={Banner} alt="Home Page Banner" />

          {/* Filter panel */}
          <div className="bg-light p-2 border mt-3 d-flex flex-column flex-md-row justify-content-md-between align-items-md-center gap-3">
            <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center gap-2 w-100">
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

              <select
                className="form-select text-secondary border bg-white rounded-0 w-100 w-md-auto"
                value={sortOrder}
                onChange={(e) => {
                  setSortOrder(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option>Ascending Order</option>
                <option>Descending Order</option>
                <option>Low - High Price</option>
                <option>High - Low Price</option>
              </select>

              <select
                className="form-select text-secondary border bg-white rounded-0 w-100 w-md-auto"
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
              >
                <option value="12">12 Products</option>
                <option value="24">24 Products</option>
                <option value="36">36 Products</option>
                <option value="48">48 Products</option>
              </select>

              {/* Search box moved INSIDE here so it stacks below on mobile */}
              <div className="input-group w-100 mt-2 mt-md-0">
                <input
                  type="text"
                  className="form-control rounded-0"
                  placeholder="Search..."
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
            </div>
          </div>

          {/* Grid View Selector */}
          <div className="d-none d-md-flex justify-content-start align-items-center mt-2">
            {/* <span className="me-2 text-muted heading">View:</span> */}
            <div
              className="btn-group bg-light border p-2 rounded-0"
              role="group"
            >
              <button
                type="button"
                className={`btn bg-white border rounded-0 ${
                  gridView === "grid-2" ? "active" : ""
                }`}
                onClick={() => setGridView("grid-2")}
                title="2 Columns"
              >
                <CgLayoutGrid size={20} />
              </button>
              <button
                type="button"
                className={`btn bg-white border rounded-0  ${
                  gridView === "grid-3" ? "active" : ""
                }`}
                onClick={() => setGridView("grid-3")}
                title="3 Columns"
              >
                <TfiLayoutGrid3Alt />
              </button>
              <button
                type="button"
                className={`btn bg-white border rounded-0  ${
                  gridView === "grid-4" ? "active" : ""
                }`}
                onClick={() => setGridView("grid-4")}
                title="4 Columns"
              >
                <TfiLayoutGrid4Alt size={25} />
              </button>
            </div>
          </div>

          <div
            className={`border bg-white mt-2 p-3 ${
              isOpen ? "d-block" : "d-none"
            }`}
          >
            <div className="row">
              <h6 className="fw-bold heading">Categories</h6>
              {Array.isArray(categories) &&
                chunkArray(categories, 8).map((categoryGroup, colIndex) => (
                  <div className="col-md-3" key={colIndex}>
                    {categoryGroup.map((category) => (
                      <div
                        key={category.category_id}
                        className="form-check collection-filter-checkbox"
                      >
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id={category.categoryname}
                          checked={selectedCategories.includes(
                            category.category_id
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
                ))}

              <div className="col-md-3 mt-3 mt-md-0">
                <h6 className="fw-bold heading">Brand</h6>
                {[
                  "Couture Edge",
                  "Glamour Gaze",
                  "Urban Chic",
                  "VogueVista",
                  "Velocity Vibe",
                ].map((brand, index) => (
                  <div key={index} className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={brand}
                    />
                    <label className="form-check-label" htmlFor={brand}>
                      {brand}
                    </label>
                  </div>
                ))}
              </div>

              <div className="col-md-3 mt-3 mt-md-0">
                <h6 className="fw-bold heading">Rating</h6>
                {[5, 4, 3, 2, 1].map((star, index) => (
                  <div
                    key={index}
                    className="form-check d-flex align-items-center"
                  >
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`star-${star}`}
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
          </div>

          <div className="row pt-5">
            {loading ? (
              // Show skeleton placeholders while fetching
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
                    Math.random()
                  }
                  className={`${getGridClasses()} mb-5`}
                >
                  <ProductCard product={product} />
                </div>
              ))
            ) : (
              <p className="text-muted text-center">No products available</p>
            )}
          </div>

          {totalPages > 1 && (
            <nav>
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

                {getPageNumbers().map((page, index) => (
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
                        className={`page-link ${
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
                  className={`page-item ${
                    currentPage === totalPages ? "disabled" : ""
                  }`}
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

          {!loading && (
            <div className="text-center small heading mt-3 text-muted">
              Showing {paginatedProducts.length} of {sortedProducts.length}{" "}
              products
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default Shop;
