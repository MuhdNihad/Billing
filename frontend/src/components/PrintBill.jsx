import { useEffect } from "react";

const PrintBill = ({ sale, printType = "a4", onPrintComplete }) => {
  useEffect(() => {
    if (sale) {
      // Wait a moment for render, then print
      const timer = setTimeout(() => {
        window.print();
        if (onPrintComplete) {
          onPrintComplete();
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [sale, onPrintComplete]);

  if (!sale) return null;

  const isThermal = printType === "thermal";

  return (
    <div className={`print-only ${isThermal ? "thermal-print" : "a4-print"}`}>
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-only, .print-only * {
            visibility: visible;
          }
          .print-only {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          @page {
            margin: ${isThermal ? "0" : "10mm"};
            size: ${isThermal ? "80mm auto" : "A4"};
          }
        }
        
        .thermal-print {
          width: 80mm;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          padding: 5mm;
        }
        
        .a4-print {
          width: 210mm;
          font-family: Arial, sans-serif;
          font-size: 14px;
          padding: 10mm;
        }
        
        .bill-header {
          text-align: center;
          border-bottom: 2px dashed #000;
          padding-bottom: 10px;
          margin-bottom: 10px;
        }
        
        .bill-title {
          font-size: ${isThermal ? "18px" : "24px"};
          font-weight: bold;
          margin-bottom: 5px;
        }
        
        .customer-info {
          margin: 10px 0;
          padding: 5px 0;
          border-bottom: 1px solid #000;
        }
        
        .bill-table {
          width: 100%;
          border-collapse: collapse;
          margin: 10px 0;
        }
        
        .bill-table th,
        .bill-table td {
          text-align: left;
          padding: ${isThermal ? "3px 2px" : "5px"};
          border-bottom: 1px dotted #000;
        }
        
        .bill-table th {
          font-weight: bold;
          border-bottom: 1px solid #000;
        }
        
        .text-right {
          text-align: right;
        }
        
        .bill-summary {
          margin-top: 10px;
          padding-top: 10px;
          border-top: 2px solid #000;
        }
        
        .summary-row {
          display: flex;
          justify-content: space-between;
          padding: 3px 0;
        }
        
        .total-row {
          font-size: ${isThermal ? "16px" : "18px"};
          font-weight: bold;
          border-top: 2px solid #000;
          padding-top: 5px;
          margin-top: 5px;
        }
        
        .bill-footer {
          text-align: center;
          margin-top: 15px;
          padding-top: 10px;
          border-top: 2px dashed #000;
          font-size: ${isThermal ? "10px" : "12px"};
        }
      `}</style>

      <div className="bill-header">
        <div className="bill-title">BILLING APPLICATION</div>
        <div>Invoice #{sale.id.substring(0, 8).toUpperCase()}</div>
        <div>{new Date(sale.date).toLocaleString()}</div>
        <div style={{ textTransform: 'uppercase', fontWeight: 'bold', marginTop: '5px' }}>
          {sale.sale_type} SALE
        </div>
      </div>

      {(sale.customer_name || sale.customer_phone) && (
        <div className="customer-info">
          {sale.customer_name && <div><strong>Customer:</strong> {sale.customer_name}</div>}
          {sale.customer_phone && <div><strong>Phone:</strong> {sale.customer_phone}</div>}
        </div>
      )}

      <table className="bill-table">
        <thead>
          <tr>
            <th>Item</th>
            <th className="text-right">Qty</th>
            <th className="text-right">Price</th>
            <th className="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          {sale.items.map((item, index) => (
            <tr key={index}>
              <td>{item.name}</td>
              <td className="text-right">{item.quantity}</td>
              <td className="text-right">₹{item.unit_price.toFixed(2)}</td>
              <td className="text-right">₹{item.total.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="bill-summary">
        <div className="summary-row">
          <span>Subtotal:</span>
          <span>₹{sale.subtotal.toFixed(2)}</span>
        </div>
        {sale.discount_amount > 0 && (
          <div className="summary-row">
            <span>Discount ({sale.discount_type === 'percentage' ? `${sale.discount_value}%` : `₹${sale.discount_value}`}):</span>
            <span>- ₹{sale.discount_amount.toFixed(2)}</span>
          </div>
        )}
        <div className="summary-row total-row">
          <span>TOTAL:</span>
          <span>₹{sale.total.toFixed(2)}</span>
        </div>
        <div className="summary-row" style={{ marginTop: '10px' }}>
          <span>Payment Method:</span>
          <span style={{ textTransform: 'uppercase' }}>{sale.payment_method}</span>
        </div>
      </div>

      <div className="bill-footer">
        <div>Thank you for your business!</div>
        <div>Visit again</div>
      </div>
    </div>
  );
};

export default PrintBill;
