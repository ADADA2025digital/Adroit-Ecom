import React, { useState } from "react";
import PageHeader from "../Components/PageHeader";
import { faqData } from "../Constants/Data";

const FAQ = () => {
  const [openFaqId, setOpenFaqId] = useState(0);

  // Toggle FAQ function
  const toggleFaq = (idx) => {
    setOpenFaqId((prev) => (prev === idx ? null : idx));
  };

  return (
    <>
      <PageHeader title="Frequently Asked Questions" path="Home / FAQ" />

      <div className="container my-5">
        <div className="row justify-content-center">
          <div className="col-md-12">
            <div className="accordion">
              {faqData.map((item, index) => (
                <div key={index} className="mb-3">
                  {/* Toggle Button */}
                  <div
                    onClick={() => toggleFaq(index)}
                    className={`w-100 selected border d-flex justify-content-between align-items-center px-4 py-3 ${
                      openFaqId === index
                        ? "text-white bg-primary border-0 heading shadow-sm"
                        : " bg-white"
                    }`}
                    aria-expanded={openFaqId === index}
                    aria-controls={`faq-panel-${index}`}
                    style={{ cursor: "pointer" }}
                  >
                    <span className="fw-medium text-start">
                      {item.question}
                    </span>
                    <i
                      className={`bi ${
                        openFaqId === index ? "bi-dash-lg" : "bi-plus-lg"
                      } fs-5`}
                    />
                  </div>

                  {/* Answer + List */}
                  {openFaqId === index && (
                    <div
                      id={`faq-panel-${index}`}
                      className="px-4 py-3 border border-top-0 text-start  bg-white"
                    >
                      {item.answer && (
                        <p
                          className="text-muted small mb-2"
                          style={{ whiteSpace: "pre-line" }}
                        >
                          {item.answer}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default FAQ;
