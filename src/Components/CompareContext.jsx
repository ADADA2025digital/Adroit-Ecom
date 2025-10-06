import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const KEY = "compareItems";
const CompareContext = createContext(null);

export const CompareProvider = ({ children }) => {
  const [items, setItems] = useState(() => {
    try {
      const raw = sessionStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  // persist to sessionStorage
  useEffect(() => {
    sessionStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  const add = (product) => {
    setItems((prev) => {
      // avoid duplicates by product.id
      if (prev.some((p) => p.id === product.id)) return prev;
      return [...prev, minimalProduct(product)];
    });
  };

  const remove = (id) => setItems((prev) => prev.filter((p) => p.id !== id));
  const clear = () => setItems([]);

  const value = useMemo(() => ({ items, add, remove, clear }), [items]);
  return (
    <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
  );
};

export const useCompare = () => {
  const ctx = useContext(CompareContext);
  if (!ctx)
    throw new Error("useCompare must be used inside <CompareProvider />");
  return ctx;
};

// store only what we need in sessionStorage
function minimalProduct(p) {
  return {
    id: p.id,
    productname: p.productname,
    pro_price: p.pro_price,
    images: p.images || [],
  };
}