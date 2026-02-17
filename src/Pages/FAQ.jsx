import React, { useState } from "react";
import { Helmet } from "react-helmet-async";
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
      <Helmet>
        {/* Basic SEO */}
        <title>Frequently Asked Questions | Adroit Alarm Systems</title>
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
                    className={`w-100 selected border bg-white d-flex justify-content-between align-items-center px-4 py-3 ${
                      openFaqId === index
                        ? "text-primary fwbold heading shadow-sm"
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
