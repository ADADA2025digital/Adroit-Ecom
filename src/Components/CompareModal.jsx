import React, { useEffect, useState } from "react";
import { useCompare } from "./CompareContext";
import { useCart } from "./CartContext";

// 🔹 NEW: responsive COLS that mirrors Bootstrap breakpoints
function useResponsiveCols() {
  const getCols = () => {
    const w = typeof window !== "undefined" ? window.innerWidth : 1200;
    if (w < 768) return 1;        // < md  => 1 col (mobile)
    if (w < 1200) return 2;       // md–lg => 2 cols (tablet)
    return 4;                     // ≥ xl  => 4 cols (desktop)
  };

  const [cols, setCols] = useState(getCols);

  useEffect(() => {
    const onResize = () => setCols(getCols());
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return cols;
}

const CompareModal = () => {
  const { items, remove, clear } = useCompare();
  const { formatImageUrl } = useCart?.() || { formatImageUrl: (u) => u };

  const COLS = useResponsiveCols();           // ✅ use responsive COLS
  const padded = [...items];
  while (padded.length < COLS) padded.push(null); // ✅ keep your padding logic

  return (
    <div className="modal fade" id="compareModal" tabIndex="-1" aria-hidden="true">
      <div className="modal-dialog modal-xl modal-dialog-centered modal-fullscreen-sm-down">
        <div className="modal-content border-0 rounded-0">
          <div className="modal-body p-0">
            <div className="d-flex justify-content-between align-items-center p-4">
              <h3 className="m-0 heading">Compare products</h3>
              <button className="btn-close" data-bs-dismiss="modal" aria-label="Close" />
            </div>

            <div className="p-4">
              <div className="row g-4">
                {padded.map((item, idx) => (
                  <div key={idx} className="col-12 col-md-6 col-xl-3">
                    <div className="border h-100 p-3">
                      {/* top remove bar */}
                      <div className="d-flex justify-content-center align-items-center px-3 border-bottom">
                        {item ? (
                          <button
                            className="btn btn-sm btn-link text-decoration-none"
                            onClick={() => remove(item.id)}
                            aria-label="Remove from compare"
                          >
                            Remove X
                          </button>
                        ) : (
                          <span className="text-muted">×</span>
                        )}
                      </div>

                      {/* card body */}
                      <div className="px-4 py-4 text-center">
                        {item ? (
                          <>
                            <div
                              className="fw-medium text-muted mb-3"
                              style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}
                            >
                              {item.productname}
                            </div>
                            <div className="ratio ratio-1x1" style={{ maxWidth: 220, margin: "0 auto" }}>
                              <img
                                className="img-fluid object-fit-contain border"
                                src={formatImageUrl(item.images?.[0]?.imgurl) || "https://via.placeholder.com/300"}
                                alt={item.productname}
                                onError={(e) => (e.currentTarget.src = "https://via.placeholder.com/300")}
                              />
                            </div>
                            <div className="small text-muted mb-2" style={{ minHeight: 38 }} />
                            <div className="text-muted">${Number(item.pro_price).toFixed(2)}</div>
                          </>
                        ) : (
                          <div className="text-muted py-5" style={{ minHeight: 220 }}>
                            <div className="mb-2">Empty</div>
                            <small>Add a product to compare</small>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* keep your clear action if you use it somewhere */}
              {/* <button className="btn btn-outline-secondary mt-3" onClick={clear}>Clear all</button> */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompareModal;