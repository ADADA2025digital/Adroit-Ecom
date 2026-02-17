import React, { useState, useEffect, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import PageBanner from "../Components/PageBanner";
import Banner from "../Assets/Images/2.png";
import PageHeader from "../Components/PageHeader";
import GlobalButton from "../Components/Button";
import api from "../Config/api";

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [firstAttemptDone, setFirstAttemptDone] = useState(false);

  const fetchCategories = async () => {
    try {
      const response = await api.get("/getcategory");
      console.log("Categories response:", response);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      // console.error("Failed to fetch categories:", error);
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
      // console.error("Failed to fetch products:", error);
      throw new Error("Failed to fetch products");
    }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retryCount]);

  // Calculate product counts per category
  const categoryProductCounts = useMemo(() => {
    const counts = {};
    for (const cat of categories || []) {
      const count = products.filter((p) => {
        const pid = p?.category_id;
        const arr = p?.categories;
        const nested = p?.category?.id;
        return (
          String(pid) === String(cat?.id) ||
          (Array.isArray(arr) && arr.map(String).includes(String(cat?.id))) ||
          String(nested) === String(cat?.id)
        );
      }).length;
      counts[cat?.id] = count;
    }
    return counts;
  }, [categories, products]);

  // Get category image from first product
  const normalizeImageUrl = (p) => {
    const fromArray =
      p?.images?.[0]?.imgurl || p?.images?.[0]?.url || p?.images?.[0];
    const single =
      p?.image?.imgurl || p?.image?.url || p?.imgurl || p?.url || p?.thumbnail;
    return fromArray || single || null;
  };

  const categoryImageMap = useMemo(() => {
    const map = {};
    for (const cat of categories || []) {
      const match = products.find((p) => {
        const pid = p?.category_id;
        const arr = p?.categories;
        const nested = p?.category?.id;
        return (
          String(pid) === String(cat?.id) ||
          (Array.isArray(arr) && arr.map(String).includes(String(cat?.id))) ||
          String(nested) === String(cat?.id)
        );
      });
      map[cat?.id] = match ? normalizeImageUrl(match) : null;
    }
    return map;
  }, [categories, products]);

  // Skeleton card component
  const SkeletonCard = () => (
    <div className="col-lg-3 col-md-6 col-sm-12 mb-4">
      <div className="card h-100 border-0 text-center">
        <div
          className="img-fluid w-100"
          style={{
            height: "220px",
            background:
              "linear-gradient(90deg, rgba(0,0,0,0.05) 25%, rgba(0,0,0,0.1) 37%, rgba(0,0,0,0.05) 63%)",
            backgroundSize: "400% 100%",
            animation: "shine 1.4s ease infinite",
          }}
        />
        <div className="card-body">
          <div
            className="placeholder-wave mx-auto"
            style={{
              width: 80,
              height: 20,
              backgroundColor: "#f0f0f0",
              borderRadius: "4px",
            }}
          />
          <div
            className="placeholder-wave mt-3 mx-auto"
            style={{
              width: 120,
              height: 24,
              backgroundColor: "#f0f0f0",
              borderRadius: "4px",
            }}
          />
          <div
            className="placeholder-wave mt-3 mx-auto"
            style={{
              width: "100%",
              height: 60,
              backgroundColor: "#f0f0f0",
              borderRadius: "4px",
            }}
          />
          <div className="d-flex justify-content-center mt-3">
            <div
              className="placeholder-wave"
              style={{
                width: 100,
                height: 38,
                backgroundColor: "#f0f0f0",
                borderRadius: "4px",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <Helmet>
        {/* Basic SEO */}
        <title>Categories | Adroit Alarm Systems</title>
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
        <PageHeader title="Categories" path="Home / Categories" />

        <div className="py-4 bg-white">
          <div className="container">
            <PageBanner src={Banner} alt="Home Page Banner" />

            {/* Error Alert */}
            {error && (
              <div className="alert alert-danger" role="alert">
                {error}{" "}
                <button className="btn btn-link" onClick={handleRetry}>
                  Retry
                </button>
              </div>
            )}

            {/* Cards Section */}
            <div className="row py-5">
              {!firstAttemptDone && categories.length === 0 ? (
                // Show skeleton cards while loading
                Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonCard key={`sk-${i}`} />
                ))
              ) : categories.length > 0 ? (
                categories.map((category) => {
                  const image = categoryImageMap[category.id] || null;
                  const productCount = categoryProductCounts[category.id] || 0;
                  const title = category?.categoryname || "Category";
                  const description =
                    category?.cat_description ||
                    "Lorem Ipsum is simply dummy text of the printing and typesetting industry...";

                  return (
                    <div
                      key={category.id}
                      className="col-lg-3 col-md-6 col-sm-12 mb-5 d-flex"
                    >
                      <div className="card border-0 text-center w-100 d-flex flex-column">
                        {/* Image section - fixed height */}
                        <div style={{ height: "220px", overflow: "hidden" }}>
                          {image ? (
                            <img
                              src={image}
                              className="img-fluid border w-100 h-100"
                              alt={title}
                              style={{ objectFit: "cover" }}
                              loading="lazy"
                            />
                          ) : (
                            <div className="bg-light d-flex align-items-center justify-content-center w-100 h-100">
                              <i
                                className="bi bi-image text-muted"
                                style={{ fontSize: 64 }}
                              />
                            </div>
                          )}
                        </div>

                        {/* Card body with flex-grow to push button down */}
                        <div className="card-body d-flex flex-column">
                          <div>
                            <small className="text-muted">
                              ({productCount} Product
                              {productCount !== 1 ? "s" : ""})
                            </small>
                            <h5 className="card-title mt-2 fw-bold">{title}</h5>
                            <p className="card-text text-muted small mb-4">
                              {description}
                            </p>
                          </div>

                          <div className="d-flex justify-content-center mt-auto">
                            <GlobalButton type="submit" to="/shop">
                              Shop Now
                            </GlobalButton>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-muted text-center w-100">
                  No categories available
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Categories;
