import { useEffect, useMemo, useState } from "react";
import { useStripe, useElements, CardElement } from "@stripe/react-stripe-js";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2";
import Paypallogo from "../Assets/Images/Stripe.png";
import GlobalButton from "./Button";
import PageHeader from "./PageHeader";

const CARD_OPTIONS = {
  style: {
    base: {
      fontSize: "16px",
      color: "#424770",
      "::placeholder": {
        color: "#aab7c4",
      },
    },
    invalid: {
      color: "#9e2146",
    },
  },
};

function PaymentForm() {
  const stripe = useStripe();
  const elements = useElements();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [amount, setAmount] = useState(0);
  const [orderId, setOrderId] = useState("");
  const [paymentIntents, setPaymentIntents] = useState([]);
  const [paymentIntentExpired, setPaymentIntentExpired] = useState(false);

  const [cardComplete, setCardComplete] = useState(false);
  const [cardBrand, setCardBrand] = useState("unknown");

  // Timer
  const [time, setTime] = useState(3 * 60 + 20);
  const [timeExpired, setTimeExpired] = useState(false);
  
  useEffect(() => {
    const id = setInterval(() => {
      setTime((t) => {
        if (t <= 0) {
          clearInterval(id);
          setTimeExpired(true);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);
  
  const countdown = useMemo(() => {
    const m = String(Math.floor(time / 60)).padStart(2, "0");
    const s = String(time % 60).padStart(2, "0");
    return `${m}:${s}`;
  }, [time]);

  // Handle timeout redirect
  useEffect(() => {
    if (timeExpired) {
      Swal.fire({
        title: "Time Expired",
        text: "Your payment session has expired. Please try again.",
        icon: "warning",
        confirmButtonText: "OK",
        confirmButtonColor: "#0d6efd",
      }).then(() => {
        clearLocalStorageItems();
        navigate("/checkout");
      });
    }
  }, [timeExpired, navigate]);

  const [submitted, setSubmitted] = useState(false);
  const formValid = name.trim() && cardComplete;

  const clearLocalStorageItems = () => {
    localStorage.removeItem("pending_order");
    localStorage.removeItem("buy_now_item");
  };

  useEffect(() => {
    if (success) {
      Swal.fire({
        title: "Payment Successful!",
        text: `Your order #${orderId} has been placed successfully.`,
        icon: "success",
        confirmButtonText: "View Order Summary",
        confirmButtonColor: "#0d6efd",
        willClose: () => {
          navigate("/order-success");
        },
      });
    }
  }, [success, orderId, navigate]);

  useEffect(() => {
    // Don't initialize payment if time has expired
    if (timeExpired) return;
    
    const pendingOrder = JSON.parse(
      localStorage.getItem("pending_order") || "null"
    );
    if (!pendingOrder) {
      navigate("/checkout");
      return;
    }

    setAmount(pendingOrder.amount);
    setOrderId(pendingOrder.orderId);

    const initializePayment = async () => {
      try {
        const response = await axios.post(
          "/api/create-payment-intent",
          {
            amount: pendingOrder.amount,
            currency: "aud",
            order_id: pendingOrder.orderId,
            user_id: pendingOrder.user_id,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );

        if (
          response.data?.success &&
          Array.isArray(response.data.paymentIntents)
        ) {
          setPaymentIntents(response.data.paymentIntents);
          setPaymentIntentExpired(false);
        } else {
          throw new Error(
            response.data?.message || "Payment initialization failed"
          );
        }
      } catch (err) {
        const errorMsg =
          err?.response?.data?.message ||
          err?.message ||
          "Failed to initialize payment. Please try again.";
        setError(errorMsg);
        clearLocalStorageItems();
        setTimeout(() => navigate("/checkout"), 3000);
      }
    };

    initializePayment();
  }, [navigate, paymentIntentExpired, timeExpired]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitted(true);

    // Don't process if time has expired
    if (timeExpired) {
      setError("Payment session has expired. Please try again.");
      return;
    }

    if (!formValid) return;
    if (!stripe || !elements || paymentIntents.length === 0) {
      setError("Payment system not ready. Please wait...");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) throw new Error("Payment field not ready.");

      for (let i = 0; i < paymentIntents.length; i++) {
        const { clientSecret, amount: splitAmount } = paymentIntents[i];

        const { error: stripeError, paymentIntent } =
          await stripe.confirmCardPayment(clientSecret, {
            payment_method: {
              card: cardElement,
              billing_details: { name: name.trim() },
            },
          });

        if (stripeError) {
          throw new Error(
            `Split #${i + 1} failed ($${splitAmount}): ${stripeError.message}`
          );
        }

        if (paymentIntent?.status !== "succeeded") {
          throw new Error(
            `Split #${i + 1} ($${splitAmount}) not completed. Status: ${
              paymentIntent?.status
            }`
          );
        }

        await axios.post(
          "/api/handle-payment-success",
          {
            payment_intent_id: paymentIntent.id,
            order_id: orderId,
            amount: (paymentIntent.amount / 100).toFixed(2),
            currency: paymentIntent.currency,
            user_id: JSON.parse(localStorage.getItem("pending_order") || "{}")
              .user_id,
          },
          {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          }
        );
      }

      clearLocalStorageItems();
      localStorage.setItem("latest_order_id", orderId);
      setSuccess(true);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.message ||
          "Payment processing failed"
      );
      if (
        String(err?.message || "")
          .toLowerCase()
          .includes("expired") ||
        err?.code === "resource_missing"
      ) {
        setPaymentIntentExpired(true);
      }
      clearLocalStorageItems();
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    clearLocalStorageItems();
    navigate("/checkout");
  };

  const formattedCardNumber = "XXXX XXXX XXXX XXXX";
  const formattedName = useMemo(() => {
    if (!name.trim()) return "XXXXX XXXXX";
    return name.toUpperCase();
  }, [name]);
  const formattedExpiry = "XX/XX";

  const VisaSVG = () => (
    <svg
      x="0px"
      y="0px"
      width="65"
      height="65"
      viewBox="0 0 240 53"
      xmlns="http://www.w3.org/2000/svg"
      className="logo position-absolute"
    >
      <defs>
        <linearGradient
          y2="100%"
          y1="-4.006%"
          x2="54.877%"
          x1="45.974%"
          id="logosVisa0"
        >
          <stop stop-color="#222357" offset="0%"></stop>
          <stop stop-color="#254AA5" offset="100%"></stop>
        </linearGradient>
      </defs>
      <path
        transform="matrix(0.9 0 0 -1 0 82.668)"
        d="M132.397 56.24c-.146-11.516 10.263-17.942 18.104-21.763c8.056-3.92 10.762-6.434 10.73-9.94c-.06-5.365-6.426-7.733-12.383-7.825c-10.393-.161-16.436 2.806-21.24 5.05l-3.744-17.519c4.82-2.221 13.745-4.158 23-4.243c21.725 0 35.938 10.724 36.015 27.351c.085 21.102-29.188 22.27-28.988 31.702c.069 2.86 2.798 5.912 8.778 6.688c2.96.392 11.131.692 20.395-3.574l3.636 16.95c-4.982 1.814-11.385 3.551-19.357 3.551c-20.448 0-34.83-10.87-34.946-26.428m89.241 24.968c-3.967 0-7.31-2.314-8.802-5.865L181.803 1.245h21.709l4.32 11.939h26.528l2.506-11.939H256l-16.697 79.963h-17.665m3.037-21.601l6.265-30.027h-17.158l10.893 30.027m-118.599 21.6L88.964 1.246h20.687l17.104 79.963h-20.679m-30.603 0L53.941 26.782l-8.71 46.277c-1.022 5.166-5.058 8.149-9.54 8.149H.493L0 78.886c7.226-1.568 15.436-4.097 20.41-6.803c3.044-1.653 3.912-3.098 4.912-7.026L41.819 1.245H63.68l33.516 79.963H75.473"
        fill="url(#logosVisa0)"
      ></path>
    </svg>
  );

  const MastercardSVG = () => (
    <svg
      className="logo position-absolute"
      xmlns="http://www.w3.org/2000/svg"
      x="0px"
      y="0px"
      width="65"
      height="65"
      viewBox="0 0 48 48"
    >
      <path
        fill="#ff9800"
        d="M32 10A14 14 0 1 0 32 38A14 14 0 1 0 32 10Z"
      ></path>
      <path
        fill="#d50000"
        d="M16 10A14 14 0 1 0 16 38A14 14 0 1 0 16 10Z"
      ></path>
      <path
        fill="#ff3d00"
        d="M18,24c0,4.755,2.376,8.95,6,11.48c3.624-2.53,6-6.725,6-11.48s-2.376-8.95-6-11.48 C20.376,15.05,18,19.245,18,24z"
      ></path>
    </svg>
  );

  const BrandBadge = () => {
    switch (cardBrand) {
      case "visa":
        return (
          <>
            <p className="cardheading position-absolute">VISA</p>
            <VisaSVG />
          </>
        );
      case "mastercard":
        return (
          <>
            <p className="cardheading position-absolute">MASTERCARD</p>
            <MastercardSVG />
          </>
        );
      case "amex":
        return (
          <p className="cardheading position-absolute">AMERICAN EXPRESS</p>
        );
      case "discover":
        return <p className="cardheading position-absolute">DISCOVER</p>;
      case "diners":
        return <p className="cardheading position-absolute">DINERS CLUB</p>;
      case "jcb":
        return <p className="cardheading position-absolute">JCB</p>;
      case "unionpay":
        return <p className="cardheading position-absolute">UNIONPAY</p>;
      default:
        return <p className="cardheading position-absolute">CARD</p>;
    }
  };

  return (
    <>
      <PageHeader title="Checkout" path="Home / Shop / Checkout / Payment" />

      <div className="container py-4 py-md-5">
        <div className="row g-4 justify-content-center">
          {/* Form */}
          <div className="col-lg-8">
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-4">
              <div className="d-flex align-items-center gap-2">
                <img
                  src={Paypallogo}
                  alt="PayPal Logo"
                  style={{ width: "150px" }}
                />
              </div>

              <div className="text-end">
                <small className="text-secondary d-block">Time left</small>
                <div className="fw-semibold">{countdown}</div>
              </div>
            </div>

            {error && (
              <div className="alert alert-danger" role="alert">
                {error}
              </div>
            )}

            {timeExpired && (
              <div className="alert alert-warning" role="alert">
                Your payment session has expired. You will be redirected shortly.
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              {/* Name */}
              <div className="mb-3">
                <label className="form-label">Card Name Holder</label>
                <input
                  type="text"
                  className={`form-control rounded-0 ${
                    submitted && !name.trim() ? "is-invalid" : ""
                  }`}
                  autoComplete="cc-name"
                  placeholder="Name on the card"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={loading || timeExpired}
                />
                <div className="form-text">
                  Enter name card holder on the card
                </div>
                <div className="invalid-feedback">
                  Please enter the cardholder name.
                </div>
              </div>

              {/* Card Element */}
              <div className="mb-3">
                <label className="form-label rounded-0">Card Details</label>
                <div className="border p-3">
                  <CardElement
                    options={CARD_OPTIONS}
                    onChange={(e) => {
                      setCardComplete(!!e.complete);
                      setCardBrand(e.brand || "unknown");
                    }}
                    disabled={timeExpired}
                  />
                </div>
                <div className="form-text">
                  Enter your card details securely
                </div>
              </div>

              <div className="d-flex gap-2 mt-4">
                <GlobalButton
                  type="submit"
                  className="w-100"
                  disabled={loading || !stripe || paymentIntents.length === 0 || timeExpired}
                >
                  {loading ? "Processing..." : `Pay $${amount}`}
                </GlobalButton>
                <button
                  type="button"
                  className="btn btn-outline-secondary rounded-0"
                  onClick={handleCancel}
                  disabled={loading}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>

          {/* Preview + Summary */}
          <div className="col-lg-3">
            {/* Card Preview */}
            <div className="atm-card bg-transparent mb-4 text-white">
              <div className="atm-card-front rounded-4 position-absolute d-flex flex-column justify-content-center w-100 h-100 p-3">
                <BrandBadge />

                {/* Chip */}
                <svg
                  version="1.1"
                  className="chip position-absolute"
                  id="Layer_1"
                  xmlns="http://www.w3.org/2000/svg"
                  xmlnsXlink="http://www.w3.org/1999/xlink"
                  x="0px"
                  y="0px"
                  width="45px"
                  height="45px"
                  viewBox="0 0 50 50"
                  xmlSpace="preserve"
                >
                  <image
                    id="image0"
                    width="50"
                    height="50"
                    x="0"
                    y="0"
                    href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAMAAAAp4XiDAAAABGdBTUEAALGPC/xhBQAAACBjSFJN
AAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAB6VBMVEUAAACNcTiVeUKVeUOY
fEaafEeUeUSYfEWZfEaykleyklaXe0SWekSZZjOYfEWYe0WXfUWXe0WcgEicfkiXe0SVekSXekSW
ekKYe0a9nF67m12ZfUWUeEaXfESVekOdgEmVeUWWekSniU+VeUKVeUOrjFKYfEWliE6WeESZe0GS
e0WYfES7ml2Xe0WXeESUeEOWfEWcf0eWfESXe0SXfEWYekSVeUKXfEWxklawkVaZfEWWekOUekOW
ekSYfESZe0eXekWYfEWZe0WZe0eVeUSWeETAnmDCoWLJpmbxy4P1zoXwyoLIpWbjvXjivnjgu3bf
u3beunWvkFWxkle/nmDivXiWekTnwXvkwHrCoWOuj1SXe0TEo2TDo2PlwHratnKZfEbQrWvPrWua
fUfbt3PJp2agg0v0zYX0zYSfgkvKp2frxX7mwHrlv3rsxn/yzIPgvHfduXWXe0XuyIDzzISsjVO1
lVm0lFitjVPzzIPqxX7duna0lVncuHTLqGjvyIHeuXXxyYGZfUayk1iyk1e2lln1zYTEomO2llrb
tnOafkjFpGSbfkfZtXLhvHfkv3nqxH3mwXujhU3KqWizlFilh06khk2fgkqsjlPHpWXJp2erjVOh
g0yWe0SliE+XekShhEvAn2D///+gx8TWAAAARnRSTlMACVCTtsRl7Pv7+vxkBab7pZv5+ZlL/UlU
/f3SJCVe+Fx39naA9/75XSMh0/3SSkia+pil/KRj7Pr662JPkrbP7OLQ0JFOijI1MwAAAAFiS0dE
orDd34wAAAAJcEhZcwAACxMAAAsTAQCanBgAAAAHdElNRQfnAg0IDx2lsiuJAAACLElEQVRIx2Ng
GAXkAUYmZhZWPICFmYkRVQcbOwenmzse4MbFzc6DpIGXj8PD04sA8PbhF+CFaxEU8iWkAQT8hEVg
OkTF/InR4eUVICYO1SIhCRMLDAoKDvFDVhUaEhwUFAjjSUlDdMiEhcOEItzdI6OiYxA6YqODIt3d
I2DcuDBZsBY5eVTr4xMSYcyk5BRUOXkFsBZFJTQnp6alQxgZmVloUkrKYC0qqmji2WE5EEZuWB6a
lKoKdi35YQUQRkFAPpFaCouKIYzi6EDitJSUlsGY5RWVRGjJLyxNy4ZxqtIqqvOxaVELQwZFZdkI
JVU1RSiSalAt6rUwUBdWG1CP6pT6gNqwOrgCdQyHNYR5YQFhDXj8MiK1IAeyN6aORiyBjByVTc0F
qBoKWpqwRCVSgilOaY2OaUPw29qjOzqLvTAchpos47u6EZyYnngUSRwpuTe6D+6qaFQdOPNLRzOM
1dzhRZyW+CZouHk3dWLXglFcFIflQhj9YWjJGlZcaKAVSvjyPrRQ0oQVKDAQHlYFYUwIm4gqExGm
BSkutaVQJeomwViTJqPK6OhCy2Q9sQBk8cY0DxjTJw0lAQWK6cOKfgNhpKK7ZMpUeF3jPa28BCET
amiEqJKM+X1gxnWXpoUjVIVPnwErw71nmpgiqiQGBjNzbgs3j1nus+fMndc+Cwm0T52/oNR9lsdC
S24ra7Tq1cbWjpXV3sHRCb1idXZ0sGdltXNxRateRwHRAACYHutzk/2I5QAAACV0RVh0ZGF0ZTpj
cmVhdGUAMjAyMy0wMi0xM3QwODoxNToyOSswMDowMEUnN7UAAAAldEVYdGRhdGU6bW9kaWZ5ADIw
MjMtMDItMTNUMDg6MTU6MjkrMDA6MDA0eo8JAAAAKHRFWHRkYXRlOnRpbWVzdGFtcAAyMDIzLTAy
LTEzVDA4OjE1OjI5KzAwOjAwY2+u1gAAAABJRU5ErkJggg=="
                  ></image>
                </svg>

                {/* Contactless icon */}
                <svg
                  version="1.1"
                  className="contactless position-absolute"
                  id="Layer_1"
                  xmlns="http://www.w3.org/2000/svg"
                  xmlnsXlink="http://www.w3.org/1999/xlink"
                  x="0px"
                  y="0px"
                  width="30px"
                  height="30px"
                  viewBox="0 0 50 50"
                  xmlSpace="preserve"
                >
                  <image
                    id="image0"
                    width="50"
                    height="50"
                    x="0"
                    y="0"
                    href="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADIAAAAyCAQAAAC0NkA6AAAABGdBTUEAALGPC/xhBQAAACBjSFJN
AAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAAmJLR0QA/4ePzL8AAAAJcEhZ
cwAACxMAAAsTAQCanBgAAAAHdElNRQfnAg0IEzgIwaKTAAADDklEQVRYw+1XS0iUURQ+f5qPyjQf
lGRFEEFK76koKGxRbWyVVLSOgsCgwjZBJJYuKogSIoOonUK4q3U0WVBWFPZYiIE6kuArG3VGzK/F
fPeMM/MLt99/NuHdfPd888/57jn3nvsQWWj/VcMlvMMd5KRTogqx9iCdIjUUmcGR9ImUYowyP3xN
GQJoRLVaZ2DaZf8kyjEJALhI28ELioyiwC+Rc3QZwRYyO/DH51hQgWm6DMIh10KmD4u9O16K49it
VoPOAmcGAWWOepXIRScAoJZ2Frro8oN+EyTT6lWkkg6msZfMSR35QTJmjU0g15tIGSJ08ZZMJkJk
HpNZgSkyXosS13TkJpZ62mPIJvOSzC1bp8vRhhCakEk7G9/o4gmZdbpsTcKu0m63FbnBP9Qrc15z
bkbemfgNDtEOI8NO5L5O9VYyRYgmJayZ9nPaxZrSjW4+F6Uw9yQqIiIZwhp2huQTf6OIvCZyGM6g
DJBZbyXifJXr7FZjGXsdxADxI7HUJFB6iWvsIhFpkoiIiGTJfjJfiCuJg2ZEspq9EHGVpYgzKqwJ
qSAOEwuJQ/pxPvE3cYltJCLdxBLiSKKIE5HxJKcTRNeadxfhDiuYw44zVs1dxKwRk/uCxIiQkxKB
sSctRVAge9g1E15EHE6yRUaJecRxcWlukdRIbGFOSZCMWQA/iWauIP3slREHXPyliqBcrrD70Amz
Z+rD1Mt2Yr8TZc/UR4/YtFnbijnHi3UrN9vKQ9rPaJf867ZiaqDB+czeKYmd3pNa6fuI75MiC0uX
XSR5aEMf7s7a6r/PudVXkjFb/SsrCRfROk0Fx6+H1i9kkTGn/E1vEmt1m089fh+RKdQ5O+xNJPUi
cUIjO0Dm7HwvErEr0YxeibL1StSh37STafE4I7zcBdRq1DiOkdmlTJVnkQTBTS7X1FYyvfO4piaI
nKbDCDaT2anLudYXCRFsQBgAcIF2/Okwgvz5+Z4tsw118dzruvIvjhTB+HOuWy8UvovEH6beitBK
xDyxm9MmISKCWrzB7bSlaqGlsf0FC0gMjzTg6GgAAAAldEVYdGRhdGU6Y3JlYXRlADIwMjMtMDIt
MTNUMDg6MTk6NTYrMDA6MDCjlq7LAAAAJXRFWHRkYXRlOm1vZGlfyQAyMDIzLTAyLTEzVDA4OjE5
OjU2KzAwOjAw0ssWdwAAACh0RVh0ZGF0ZTp0aW1lc3RhbXAAMjAyMy0wMi0xM1QwODoxOTo1Nisw
MDowMIXeN6gAAAAASUVORK5CYII="
                  ></image>
                </svg>

                <p className="number position-absolute fw-bold">
                  {formattedCardNumber}
                </p>
                <p className="valid_thru position-absolute fw-bold">
                  VALID THRU
                </p>
                <p className="card-date position-absolute fw-bold">
                  {formattedExpiry}
                </p>
                <p className="card-name position-absolute fw-bold">
                  {formattedName}
                </p>
              </div>
            </div>

            {/* Order Summary */}
            <div className="card border-0 rounded-0 shadow-sm">
              <div className="card-body">
                <div className="d-flex justify-content-between small mb-2">
                  <span className="text-secondary">Order Number</span>
                  <span className="fw-semibold">{orderId}</span>
                </div>
                <div className="d-flex justify-content-between small mb-2">
                  <span className="text-secondary">Total Price</span>
                  <span className="fw-semibold">${amount}</span>
                </div>
                <div className="d-flex justify-content-between small mb-2">
                  <span className="text-secondary">Tax (11%)</span>
                  <span className="fw-semibold">Included</span>
                </div>
                <hr className="my-3" />
                <div className="d-flex justify-content-between align-items-baseline">
                  <span className="text-secondary small">
                    Total you have to pay
                  </span>
                  <div className="text-end">
                    <div className="fs-6 fw-bold">${amount} AUD</div>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-center mt-3 small text-secondary mb-0">
              Secure checkout • Stripe
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default PaymentForm;