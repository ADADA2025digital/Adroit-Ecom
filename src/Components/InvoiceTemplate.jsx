import React, { useState, useEffect } from "react";
import { useReactToPrint } from "react-to-print";
import companyLogo from "../Assets/Images/image.jpeg";

const InvoiceTemplate = ({ invoiceData, onClose }) => {
  const invoiceRef = React.useRef();

  const handlePrint = useReactToPrint({
    content: () => invoiceRef.current,
    documentTitle: `Invoice-${invoiceData?.invoice_number || "Unknown"}`,
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-AU", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (!invoiceData) return null;

  return (
    <>
      <div
        className="modal fade show"
        style={{ display: "block", backgroundColor: "rgba(0,0,0,0.5)" }}
      >
        <div className="modal-dialog modal-xl">
          <div className="modal-content rounded-0">
            <div className="modal-body">
              {/* Printable Invoice Content */}
              <div ref={invoiceRef} className="invoice-container p-4">
                <div className="d-print-none mb-4 text-end d-flex justify-content-end">
                  {/* <button
                    className="btn btn-primary btn-sm rounded-0"
                    onClick={handlePrint}
                  >
                    <i className="bi bi-printer me-2"></i>Print
                  </button> */}
                  <button
                    className="btn btn-secondary btn-sm rounded-0"
                    onClick={onClose}
                  >
                    Close
                  </button>
                </div>

                <div className="invoice-content">
                  <div className="d-flex justify-content-between align-items-center mb-4 border-bottom pb-4">
                    <div className="d-flex align-items-center">
                      <div className="me-3" style={{ width: "150px" }}>
                        <img
                          src={companyLogo}
                          alt="Company Logo"
                          className="img-fluid"
                          style={{ maxHeight: "80px", objectFit: "contain" }}
                        />
                      </div>
                      <div>
                        <p className="text-muted mb-0">
                          Invoice #: {invoiceData.invoice_number}
                        </p>
                      </div>
                    </div>
                    <div className="text-end">
                      <div
                        className="text-muted"
                        style={{ fontSize: "0.9rem" }}
                      >
                        15/51 Meacher Street Mt. Druitt 2770
                        <br />
                        NSW
                        <br />
                        Phone: (123) 456-7890
                        <br />
                        Email: info@adroitgroup.biz
                      </div>
                    </div>
                  </div>

                  <div className="row mb-4">
                    <div className="col-md-6">
                      <div className="card border-0 rounded-0 bg-light">
                        <div className="card-header bg-light">
                          <h5 className="mb-0 text-dark">Bill To</h5>
                        </div>
                        <div className="card-body">
                          <p className="mb-1">
                            <strong>{invoiceData.user?.full_name}</strong>
                          </p>
                          <p className="mb-1">{invoiceData.billing_address}</p>
                          <p className="mb-1">
                            Email: {invoiceData.user?.email}
                          </p>
                          <p className="mb-0">
                            Phone: {invoiceData.user?.phone}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-6 mt-3 mt-md-0">
                      <div className="card border-0 rounded-0 bg-light">
                        <div className="card-header bg-light">
                          <h5 className="mb-0 text-dark">Invoice Details</h5>
                        </div>
                        <div className="card-body">
                          <table className="table table-bordered mb-0">
                            <tbody>
                              <tr>
                                <td>
                                  <strong>Order ID:</strong>
                                </td>
                                <td> {invoiceData.order_id}</td>
                              </tr>
                              <tr>
                                <td>
                                  <strong>Invoice Date:</strong>
                                </td>
                                <td> {formatDate(invoiceData.invoice_date)}</td>
                              </tr>
                              <tr>
                                <td>
                                  <strong>Due Date:</strong>
                                </td>
                                <td>{formatDate(invoiceData.due_date)}</td>
                              </tr>
                              <tr>
                                <td>
                                  <strong>Payment Status:</strong>
                                </td>
                                <td>
                                  <span
                                    className={`badge bg-${
                                      invoiceData.payment_status === "paid"
                                        ? "success"
                                        : "danger"
                                    }`}
                                  >
                                    {invoiceData.payment_status.toUpperCase()}
                                  </span>
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <strong>Payment Method:</strong>
                                </td>
                                <td className="text-capitalize">
                                  {invoiceData.notes}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <table className="table table-bordered table-hover mb-0">
                      <thead className="table-light">
                        <tr>
                          <th style={{ width: "5%" }}>#</th>
                          <th style={{ width: "45%" }}>Product</th>
                          <th style={{ width: "15%" }} className="text-end">
                            Unit Price
                          </th>
                          <th style={{ width: "10%" }} className="text-center">
                            Qty
                          </th>
                          <th style={{ width: "15%" }} className="text-end">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {invoiceData.items?.map((item, index) => (
                          <tr key={index}>
                            <td>{index + 1}</td>
                            <td>{item.product_name}</td>
                            <td className="text-end">
                              ${formatCurrency(item.unit_price)}
                            </td>
                            <td className="text-center">{item.quantity}</td>
                            <td className="text-end">
                              ${formatCurrency(item.total_price)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="row justify-content-end">
                    <div className="col-md-5">
                      <table className="table table-bordered mb-4">
                        <tbody>
                          <tr>
                            <td>
                              <strong>Subtotal:</strong>
                            </td>
                            <td className="text-end">
                              ${formatCurrency(invoiceData.subtotal)}
                            </td>
                          </tr>
                          <tr>
                            <td>
                              <strong>Tax:</strong>
                            </td>
                            <td className="text-end">Tax included</td>
                          </tr>
                          {/* <tr>
                  <td>
                    <strong>Shipping:</strong>
                  </td>
                  <td className="text-end">
                    ${parseFloat(invoice.shipping_cost).toFixed(2)}
                  </td>
                </tr> */}
                          <tr className="table-active">
                            <td>
                              <strong>Total:</strong>
                            </td>
                            <td className="text-end">
                              {formatCurrency(invoiceData.total_amount)}
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="text-center pt-2 border-top">
                    <p className="mb-2 text-muted">
                      <strong>Thank you for your business!</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default InvoiceTemplate;