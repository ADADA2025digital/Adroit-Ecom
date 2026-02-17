import React, { useState, useEffect, useMemo } from "react";
import api from "../Config/api";
import GlobalButton from "./Button";

const ProductCollection = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [firstAttemptDone, setFirstAttemptDone] = useState(false);

  const fetchCategories = async () => {
    try {
      const response = await api.get("/getcategory");
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      throw new Error("Failed to fetch categories");
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get("/products");
      const data = response.data;
      const list = data?.products ?? data ?? [];
      return Array.isArray(list) ? list : [];
    } catch (error) {
      throw new Error("Failed to fetch products");
    }
  };

  // Function to shuffle array and get random items
  const getRandomCategories = (categoriesArray, count = 6) => {
    if (!categoriesArray || categoriesArray.length === 0) return [];
    
    // Create a copy of the array to avoid mutating original
    const shuffled = [...categoriesArray];
    
    // Fisher-Yates shuffle algorithm
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    
    // Return first 'count' items
    return shuffled.slice(0, count);
  };

  const loadData = async () => {
    setError(null);
    setFirstAttemptDone(false);
    try {
      const catsP = fetchCategories()
        .then((cats) => setCategories(cats))
        .catch(() => {
          setError((prev) => prev ?? "Failed to load categories.");
        });

      const prodsP = fetchProducts()
        .then((prods) => setProducts(prods))
        .catch(() => {
          setError((prev) => prev ?? "Failed to load products.");
        });

      await Promise.allSettled([catsP, prodsP]);
    } finally {
      setFirstAttemptDone(true);
    }
  };

  const handleRetry = () => setRetryCount((p) => p + 1);

  useEffect(() => {
    loadData();
  }, [retryCount]);

  // Get random 6 categories whenever categories array changes
  const randomCategories = useMemo(() => {
    return getRandomCategories(categories, 6);
  }, [categories]);

  const normalizeImageUrl = (p) => {
    const fromArray =
      p?.images?.[0]?.imgurl || p?.images?.[0]?.url || p?.images?.[0];
    const single =
      p?.image?.imgurl || p?.image?.url || p?.imgurl || p?.url || p?.thumbnail;
    return fromArray || single || null;
  };

  const categoryIdMatches = (p, catId) => {
    const pid = p?.category_id;
    const arr = p?.categories;
    const nested = p?.category?.id;
    return (
      String(pid) === String(catId) ||
      (Array.isArray(arr) && arr.map(String).includes(String(catId))) ||
      String(nested) === String(catId)
    );
  };

  const categoryImageMap = useMemo(() => {
    const map = {};
    for (const cat of categories || []) {
      const match = products.find((p) => categoryIdMatches(p, cat?.id));
      map[cat?.id] = match ? normalizeImageUrl(match) : null;
    }
    return map;
  }, [categories, products]);

  const Skeleton = () => (
    <div
      className="me-0 mb-3 border rounded-circle"
      style={{
        width: 150,
        height: 150,
        overflow: "hidden",
        background:
          "linear-gradient(90deg, rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.1) 37%, rgba(0,0,0,0.05) 63%)",
        backgroundSize: "400% 100%",
        animation: "shine 1.4s ease infinite",
      }}
    />
  );

  return (
    <section className="container text-center products py-5">
      <h2 className="text-dark text-center text-uppercase py-2 d-inline-block position-relative heading mb-5">
        Product Categories
      </h2>

      <div className="row d-flex justify-content-center align-items-center">
        {/* Show skeletons while loading */}
        {!firstAttemptDone && categories.length === 0 ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div
              key={`sk-${i}`}
              className="col-lg-2 col-md-4 col-sm-6 mb-4 d-flex justify-content-center align-items-center flex-column"
            >
              <Skeleton />
              <div className="text-center mt-1">
                <div
                  className="placeholder-wave"
                  style={{ width: 80, height: 16 }}
                />
              </div>
            </div>
          ))
        ) : randomCategories.length > 0 ? (
          randomCategories.map((category, index) => {
            const itemImage = categoryImageMap[category.id] || null;
            const name = category?.categoryname || "Category";
            const desc = category?.cat_description || "";

            return (
              <div
                key={category.id ?? index}
                className="col-lg-2 col-md-4 col-sm-6 mb-4 d-flex justify-content-center align-items-center flex-column"
              >
                <div
                  className="me-0 mb-3 border rounded-circle d-flex align-items-center justify-content-center"
                  style={{ width: 150, height: 150, overflow: "hidden" }}
                >
                  {itemImage ? (
                    <img
                      src={itemImage}
                      alt={name}
                      className="img-fluid"
                      loading="lazy"
                      style={{
                        objectFit: "cover",
                        width: "100%",
                        height: "100%",
                      }}
                    />
                  ) : (
                    <div
                      className="bg-light d-flex align-items-center justify-content-center"
                      style={{ width: "100%", height: "100%" }}
                    >
                      <i
                        className="bi bi-image text-muted"
                        style={{ fontSize: 42 }}
                      />
                    </div>
                  )}
                </div>

                <div className="text-center mt-1">
                  <h6 className="heading text-primary mb-1">{name}</h6>
                  {/* {!!desc && <p className="m-0 small">{desc}</p>} */}
                </div>
              </div>
            );
          })
        ) : (
          <p className="text-muted">No categories available</p>
        )}
        
        {/* Only show View More button if there are more than 6 categories */}
        {categories.length > 6 && (
          <div className="d-flex justify-content-center align-items-center mt-4">
            <GlobalButton type="submit" to="/categories">
              View More
            </GlobalButton>
          </div>
        )}
      </div>

      <style>{`
        @keyframes shine {
          0% { background-position: 100% 0; }
          100% { background-position: 0 0; }
        }
      `}</style>
    </section>
  );
};

export default ProductCollection;