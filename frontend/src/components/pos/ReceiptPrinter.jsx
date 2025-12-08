import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

/**
 * Component xử lý in hóa đơn
 * @param {Object} order - Thông tin đơn hàng
 * @param {Array} items - Danh sách sản phẩm trong đơn
 * @param {Object} settings - Cài đặt cửa hàng (store_name, store_address, store_phone, etc.)
 * @param {string} customerName - Tên khách hàng
 * @param {Object} paymentInfo - Thông tin thanh toán {method, receivedAmount, changeAmount}
 */
export const printReceipt = ({
  order,
  items,
  settings = {},
  customerName = "Khách lẻ",
  paymentInfo = {},
}) => {
  if (!order) {
    toast.error("Không có thông tin đơn hàng để in");
    return;
  }

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    toast.error("Vui lòng cho phép mở cửa sổ bật lên để in");
    return;
  }

  const formatCurrency = (value) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value || 0);

  const formatDate = (date) => {
    if (!date) return new Date().toLocaleString("vi-VN");
    return new Date(date).toLocaleString("vi-VN");
  };

  const getPaymentMethodText = (method) => {
    const methods = {
      cash: "Tiền mặt",
      transfer: "Chuyển khoản",
      card: "Thẻ",
    };
    return methods[method] || "Tiền mặt";
  };

  const htmlContent = `
    <html>
      <head>
        <title>Hóa đơn - ${order.order_number}</title>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: 'Courier New', monospace;
            padding: 10px;
            max-width: 300px;
            margin: 0 auto;
            font-size: 12px;
            color: #000;
          }
          .text-center { text-align: center; }
          .text-right { text-align: right; }
          .bold { font-weight: bold; }
          .line { border-bottom: 1px dashed #000; margin: 8px 0; }
          .item {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
          }
          .header { margin-bottom: 10px; }
          @media print {
            @page { margin: 0; }
            body { padding: 10px; }
          }
        </style>
      </head>
      <body>
        <div class="text-center header">
          <h2 style="margin: 0; font-size: 16px; text-transform: uppercase;">
            ${settings.store_name || "LOSPEC"}
          </h2>
          ${
            settings.store_phone
              ? `
            <p style="margin: 2px 0; font-size: 10px;">
              ĐT: ${settings.store_phone}
              ${settings.store_email ? ` - Email: ${settings.store_email}` : ""}
            </p>
          `
              : ""
          }
          ${
            settings.store_address
              ? `
            <p style="margin: 0; font-size: 10px;">
              ĐC: ${settings.store_address}
            </p>
          `
              : ""
          }
          <p style="margin-top: 10px; font-weight: bold; font-size: 14px;">
            HÓA ĐƠN BÁN LẺ
          </p>
        </div>

        <div class="line"></div>

        <div>
          Số phiếu: ${order.order_number}<br/>
          Ngày: ${formatDate(order.created_at)}<br/>
          Khách hàng: ${customerName}
          ${order.customer_phone ? `<br/>SĐT: ${order.customer_phone}` : ""}
          ${order.staff_name ? `<br/>Nhân viên: ${order.staff_name}` : ""}
        </div>

        <div class="line"></div>

        <div>
          ${items
            ?.map(
              (item) => `
            <div class="item">
              <div style="flex: 1;">
                ${item.product_name || item.productName}<br/>
                <span style="font-size: 10px;">
                  ${item.quantity} x ${formatCurrency(
                item.unit_price || item.unitPrice
              )}
                </span>
              </div>
              <div class="text-right">
                ${formatCurrency(
                  (item.unit_price || item.unitPrice) * item.quantity
                )}
              </div>
            </div>
          `
            )
            .join("")}
        </div>

        <div class="line"></div>

        <div class="item">
          <span>Tạm tính:</span>
          <span>${formatCurrency(order.subtotal)}</span>
        </div>

        ${
          order.discount > 0
            ? `
          <div class="item">
            <span>Giảm giá:</span>
            <span>-${formatCurrency(order.discount)}</span>
          </div>
        `
            : ""
        }

        <div class="item">
          <span>Thuế (${settings.tax_rate || 10}%):</span>
          <span>${formatCurrency(order.tax)}</span>
        </div>

        <div class="item bold" style="font-size: 14px; margin-top: 5px;">
          <span>TỔNG CỘNG:</span>
          <span>${formatCurrency(order.total)}</span>
        </div>

        ${
          paymentInfo.method === "cash" && paymentInfo.receivedAmount
            ? `
  <div class="item" style="margin-top: 5px;">
    <span>Khách đưa:</span>
    <span>${formatCurrency(paymentInfo.receivedAmount)}</span>
  </div>
  <div class="item">
    <span>Tiền thừa:</span>
    <span>${formatCurrency(paymentInfo.changeAmount || 0)}</span>
  </div>
`
            : `
  <div class="item" style="margin-top: 5px;">
    <span>Thanh toán:</span>
    <span>${getPaymentMethodText(
      paymentInfo.method || order.payment_method
    )}</span>
  </div>
`
        }



        <div class="line"></div>

        <div class="text-center">
          <p style="font-style: italic; margin-top: 10px;">
            Cảm ơn quý khách!
          </p>
          <p style="font-size: 10px;">
            Powered by LOSPEC POS
          </p>
        </div>
      </body>
    </html>
  `;

  printWindow.document.write(htmlContent);
  printWindow.document.close();

  setTimeout(() => {
    printWindow.print();
  }, 500);
};

export function PrintReceiptButton({
  order,
  items,
  settings,
  customerName,
  paymentInfo,
  variant = "default",
  className = "",
  children,
}) {
  const handleClick = () => {
    printReceipt({ order, items, settings, customerName, paymentInfo });
  };

  return (
    <Button variant={variant} onClick={handleClick} className={className}>
      {children || (
        <>
          <Printer className="h-4 w-4 mr-1" /> In hóa đơn
        </>
      )}
    </Button>
  );
}
