import React, { useRef } from "react";
import { Container, Table, Button } from "react-bootstrap";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";
import Logo from "../Assets/Images/image.jpeg";
import PageHeader from "../Components/PageHeader";

const InvoicePage = () => {
  const invoiceRef = useRef();

  const invoiceData = {
    issueDate: "20 March, 2020",
    invoiceNo: "908452",
    email: "User@Gmail.Com",
    company: {
      name: "Multikart Demo Store India",
      address: "Multikart Demo Store India - 363512",
      support: "Support@Multikart.Com",
    },
    client: {
      address: "2644 Tail Ends Road, ORADELL, New Jersey, 07649",
    },
    items: [
      { id: 1, description: "Logo Designing", price: 50, hours: 2, total: 100 },
      {
        id: 2,
        description: "Frontend Development",
        price: 95,
        hours: 1,
        total: 95,
      },
      {
        id: 3,
        description: "Backend Development",
        price: 95,
        hours: 1,
        total: 95,
      },
      {
        id: 4,
        description: "SEO, Digital Marketing",
        price: 95,
        hours: 1,
        total: 95,
      },
    ],
  };

  const grandTotal = invoiceData.items.reduce(
    (sum, item) => sum + item.total,
    0
  );

  // Function to generate and download PDF
  const downloadPDF = () => {
    const input = invoiceRef.current;
    html2canvas(input, { scale: 2 }).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 210; // A4 width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 0, 10, imgWidth, imgHeight);
      pdf.save("invoice.pdf");
    });
  };
  
  
  return (
    <>
      <PageHeader title="Invoice" path="Home / Shop / Checkout / Invoice" />

      <Container className="d-flex justify-content-center align-items-center py-4">
        <div className="invoice-box shadow bg-white rounded-0 col-md-8">
          <div ref={invoiceRef} id="invoice-section">
            <div className="align-items-center border-bottom p-4 bg-light">
              <div className="d-flex justify-content-between mb-3">
                <img
                  src={Logo}
                  alt="Multikart Logo"
                  style={{ height: "40px" }}
                />
                <h4 className="fw-bold">INVOICE</h4>
              </div>
              <div className="d-flex justify-content-between">
                <div>
                  <p className="m-0">{invoiceData.company.name}</p>
                  <p className="m-0 text-muted">
                    {invoiceData.company.support}
                  </p>
                </div>
                <div className="text-end">
                  <p className="m-0 text-muted">
                    {invoiceData.company.address}
                  </p>
                  <p className="m-0">{invoiceData.client.address}</p>
                </div>
              </div>
            </div>

            <div className="p-4">
              <div className="pb-2">
                <p className="m-0">
                  <strong>Issue Date:</strong> {invoiceData.issueDate}
                </p>
                <p className="m-0">
                  <strong>Invoice No:</strong> {invoiceData.invoiceNo}
                </p>
                <p className="m-0">
                  <strong>Email:</strong> {invoiceData.email}
                </p>
              </div>

              <Table responsive className="border">
                <thead className="bg-light">
                  <tr>
                    <th>#</th>
                    <th>Description</th>
                    <th>Price</th>
                    <th>Hrs</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoiceData.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.description}</td>
                      <td>${item.price}</td>
                      <td>{item.hours}</td>
                      <td>${item.total}</td>
                    </tr>
                  ))}
                </tbody>
              </Table>

              <div className="d-flex justify-content-between align-items-center border-top pt-2">
                <h5 className="fw-bold">GRAND TOTAL:</h5>
                <h5 className="text-danger fw-bold">${grandTotal}</h5>
              </div>
            </div>
          </div>
          <div className="d-flex justify-content-between align-items-center mt-4 p-4">
            <Button
              variant="dark"
              className="d-flex align-items-center rounded-0"
              onClick={downloadPDF}
            >
              <i className="bi bi-file-earmark-pdf-fill me-2"></i> Export as PDF
            </Button>
            <Button
              variant="danger"
              className="d-flex align-items-center rounded-0"
              onClick={() => window.print()}
            >
              <i className="bi bi-printer-fill me-2"></i> Print
            </Button>
          </div>
        </div>
      </Container>
    </>
  );
};

export default InvoicePage;
