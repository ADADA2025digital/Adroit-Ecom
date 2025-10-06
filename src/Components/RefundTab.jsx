import React from "react";

const RefundTab = ({ cancellations, cancellationError, formatDate, getStatusBadgeClass, getItemImageUrl }) => {
  if (cancellationError) {
    return (
      <div className="table-container">
        <h4 className="fw-bold heading py-3">Refund History</h4>
        <div className="alert alert-danger">{cancellationError}</div>
      </div>
    );
  }

  if (cancellations.length === 0) {
    return (
      <div className="table-container">
        <h4 className="fw-bold heading py-3">Refund History</h4>
        <div className="alert alert-info">
          You haven't requested any cancellations yet.
        </div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <h4 className="fw-bold heading py-3">Refund History</h4>
      <div>
        {cancellations.map((cancellation) => (
          <div
            key={cancellation.cancellation_id}
            className="card mb-4 border rounded-0"
          >
            <div className="card-header bg-light d-flex justify-content-between align-items-center">
              <div>
                <span className="text-muted small">
                  Requested on {formatDate(cancellation.requested_at)}
                </span>
              </div>
              <div>
                <span
                  className={`badge ${getStatusBadgeClass(
                    cancellation.status
                  )} text-white text-capitalize rounded-0`}
                >
                  {cancellation.status}
                </span>
              </div>
            </div>

            <div className="card-body">
              <div className="row">
                <div className="col-md-8">
                  <h6 className="fw-bold">
                    Order #{cancellation.order_id}
                  </h6>
                  <p className="text-muted small mb-2">
                    Order Date: {formatDate(cancellation.order_date)}
                  </p>
                  <p className="mb-2">
                    <strong>Reason:</strong> {cancellation.reason}
                  </p>

                  {cancellation.admin_notes && (
                    <div className="mt-3 p-3 bg-light rounded">
                      <h6 className="fw-bold">Admin Notes:</h6>
                      <p className="mb-0 small">
                        {cancellation.admin_notes}
                      </p>
                    </div>
                  )}

                  {cancellation.refund_amount && (
                    <div className="mt-3">
                      <p className="mb-0">
                        <strong>Refund Amount:</strong> $
                        {parseFloat(cancellation.refund_amount).toFixed(2)}
                      </p>
                      <p className="text-muted small mb-0">
                        Processed on: {formatDate(cancellation.processed_at)}
                      </p>
                    </div>
                  )}
                </div>

                <div className="col-md-4">
                  <div className="d-flex flex-column gap-2">
                    <p className="mb-0">
                      <strong>Total:</strong> $
                      {parseFloat(cancellation.order_total).toFixed(2)}
                    </p>
                    <p className="mb-0">
                      <strong>Payment Method:</strong> {cancellation.payment_method}
                    </p>
                  </div>
                </div>
              </div>

              {/* Items list */}
              {cancellation.items && cancellation.items.length > 0 && (
                <div className="mt-4">
                  <h6 className="fw-bold border-bottom pb-2">
                    Items in this order:
                  </h6>
                  {cancellation.items.map((item, index) => {
                    const itemImage = getItemImageUrl(item);
                    const name =
                      item.name ||
                      item.product_name ||
                      item?.product?.productname ||
                      `Product ${index + 1}`;
                    const price =
                      parseFloat(item.price || item.unit_price || "0") || 0;
                    const quantity = parseInt(item.quantity || "1", 10) || 1;

                    return (
                      <div
                        key={index}
                        className="d-flex align-items-center gap-3 mb-3"
                      >
                        <div
                          className="border"
                          style={{ width: "60px", height: "60px" }}
                        >
                          {itemImage ? (
                            <img
                              src={itemImage}
                              alt={name}
                              className="img-fluid"
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
                              <i className="bi bi-image text-muted"></i>
                            </div>
                          )}
                        </div>
                        <div className="flex-grow-1">
                          <div className="text-muted fw-semibold small">
                            {name}
                          </div>
                          <div className="d-flex justify-content-between">
                            <div className="text-muted small">
                              ${price.toFixed(2)}
                            </div>
                            <div className="text-muted small">
                              x {quantity}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="card-footer bg-white d-flex justify-content-between">
              <div className="d-flex gap-3">
                <p className="text-muted small mb-0">
                  Request ID: {cancellation.cancellation_id}
                </p>
                <p className="text-muted small mb-0">
                  Order ID: {cancellation.order_id}
                </p>
              </div>
              <p className="text-muted small mb-0">
                Requested: {formatDate(cancellation.requested_at)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RefundTab;