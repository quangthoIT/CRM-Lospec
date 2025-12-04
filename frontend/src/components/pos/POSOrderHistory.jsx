import { useState, useEffect } from "react";
import api from "../../config/api"; // Import api instance
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Search,
  Eye,
  RefreshCw,
  User,
  Calendar,
  ShoppingBag,
  Printer,
} from "lucide-react";
import { toast } from "sonner";

export function POSOrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetail, setShowDetail] = useState(false);

  useEffect(() => {
    fetchOrders();

    // Tự động tải lại khi focus vào cửa sổ (hỗ trợ khi chuyển tab quay lại)
    const onFocus = () => fetchOrders();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/orders");
      setOrders(data || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      // Không hiển thị toast lỗi khi auto-fetch để tránh làm phiền
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (orderId) => {
    const { data } = await api.get(`/orders/${orderId}`);
    console.log("DETAIL ORDER API:", data);
    try {
      const { data } = await api.get(`/orders/${orderId}`);
      setSelectedOrder(data);
      setShowDetail(true);
    } catch (error) {
      toast.error("Lỗi tải chi tiết đơn hàng");
    }
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val || 0);

  const formatDate = (d) => {
    if (!d) return "";
    return new Date(d).toLocaleString("vi-VN");
  };

  const getStatusBadge = (status) => {
    const styles = {
      completed: "bg-emerald-100 text-emerald-700 border-emerald-200",
      pending: "bg-amber-100 text-amber-700 border-amber-200",
      cancelled: "bg-rose-100 text-rose-700 border-rose-200",
    };
    return (
      <Badge
        className={`${
          styles[status] || "bg-gray-100"
        } shadow-none hover:bg-opacity-80`}
      >
        {status === "completed"
          ? "Hoàn thành"
          : status === "pending"
          ? "Chờ xử lý"
          : "Đã hủy"}
      </Badge>
    );
  };

  const handlePrintReceipt = () => {
    if (!selectedOrder) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Vui lòng cho phép mở cửa sổ bật lên để in");
      return;
    }

    const htmlContent = `
      <html>
        <head><title>Hóa đơn - ${selectedOrder.order_number}</title>
          <style>
            body { font-family: 'Courier New', monospace; padding: 10px; max-width: 300px; margin: 0 auto; font-size: 12px; color: #000; }
            .text-right { text-align: right; }
            .text-center { text-align: center; }
            .bold { font-weight: bold; }
            .line { border-bottom: 1px dashed #000; margin: 8px 0; }
            .item { display: flex; justify-content: space-between; margin-bottom: 4px; }
          </style>
        </head>
        <body>
          <div class="text-center">
            <h2 style="margin:0; font-size:18px;">LOSPEC</h2>
            <p style="margin:0;">HÓA ĐƠN SAO LƯU</p>
          </div>
          <div class="line"></div>
          <div>Số phiếu: ${selectedOrder.order_number}<br/>Ngày: ${formatDate(
      selectedOrder.created_at
    )}<br/>Khách: ${selectedOrder.customer_name || "Khách lẻ"}</div>
          <div class="line"></div>
          <div>${selectedOrder.items
            ?.map(
              (item) =>
                `<div class="item"><div style="flex:1;">${
                  item.product_name
                }<br/>${item.quantity} x ${formatCurrency(
                  item.unit_price
                )}</div><div class="text-right">${formatCurrency(
                  item.total
                )}</div></div>`
            )
            .join("")}</div>
          <div class="line"></div>
          <div class="item"><span>Tạm tính:</span><span>${formatCurrency(
            selectedOrder.subtotal
          )}</span></div>

          ${
            selectedOrder.discount > 0
              ? `<div class="item"><span>Giảm giá:</span><span>-${formatCurrency(
                  selectedOrder.discount
                )}</span></div>`
              : ""
          }
              <div class="item"><span>Thuế (10%):</span><span>${formatCurrency(
                selectedOrder.tax
              )}</span></div>
          <div class="item bold" style="margin-top:5px;"><span>TỔNG CỘNG:</span><span>${formatCurrency(
            selectedOrder.total
          )}</span></div>
        </body>
      </html>`;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const filteredOrders = orders.filter(
    (o) =>
      o.order_number?.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
        <Input
          placeholder="Tìm tên, SKU, barcode..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          icon={<Search size={20} />}
        />

        <Button variant="outline" onClick={fetchOrders}>
          <RefreshCw className="h-4 w-4 mr-1" /> Làm mới
        </Button>
      </div>

      <Table className="bg-white border border-gray-200 shadow-lg">
        <TableHeader>
          <TableRow className="bg-gray-200">
            <TableHead>Mã đơn</TableHead>
            <TableHead>Thời gian</TableHead>
            <TableHead className="text-center">Khách hàng</TableHead>
            <TableHead className="text-center">Người bán</TableHead>
            <TableHead className="text-right">Tổng tiền</TableHead>
            <TableHead className="text-center">Thanh toán</TableHead>
            <TableHead className="text-center">Trạng thái</TableHead>
            <TableHead className="text-center">Chi tiết</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-600" />
              </TableCell>
            </TableRow>
          ) : filteredOrders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-gray-600">
                Chưa có đơn hàng nào
              </TableCell>
            </TableRow>
          ) : (
            filteredOrders.map((order) => (
              <TableRow key={order.id} className="hover:bg-gray-100">
                <TableCell className="font-mono font-medium text-gray-600">
                  {order.order_number}
                </TableCell>
                <TableCell className="text-gray-500 text-sm">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {formatDate(order.created_at)}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {order.customer_name ? (
                    <div className="font-medium text-sm text-gray-900">
                      {order.customer_name}
                    </div>
                  ) : (
                    <span className="text-gray-600 text-sm flex items-center justify-center gap-1">
                      <User className="h-3 w-3" /> Khách lẻ
                    </span>
                  )}
                </TableCell>
                <TableCell className="text-sm text-gray-600 text-center">
                  {order.staff_name || "---"}
                </TableCell>
                <TableCell className="font-bold text-emerald-600 text-right">
                  {formatCurrency(order.total)}
                </TableCell>
                <TableCell className="text-center">
                  <Badge
                    variant="outline"
                    className="font-normal text-gray-600"
                  >
                    {order.payment_method === "transfer"
                      ? "Chuyển khoản"
                      : order.payment_method === "card"
                      ? "Thẻ"
                      : "Tiền mặt"}
                  </Badge>
                </TableCell>
                <TableCell className="text-center">
                  {getStatusBadge(order.status)}
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleViewDetail(order.id)}
                    className="text-blue-600 hover:bg-blue-50"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* DETAIL DIALOG */}
      <Dialog open={showDetail} onOpenChange={setShowDetail}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Chi tiết đơn hàng: {selectedOrder?.order_number}
            </DialogTitle>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Thông tin chung */}
              <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded border text-sm">
                <div>
                  <p className="text-gray-500">Khách hàng</p>
                  <p className="font-medium text-gray-800">
                    {selectedOrder.customer_name || "Khách lẻ"}
                    {selectedOrder.customer_phone &&
                      ` - ${selectedOrder.customer_phone}`}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Thời gian</p>
                  <p className="font-medium text-gray-800">
                    {formatDate(selectedOrder.created_at)}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Người bán</p>
                  <p className="font-medium text-gray-800">
                    {selectedOrder.staff_name}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500">Thanh toán</p>
                  <p className="capitalize font-medium text-gray-800">
                    {selectedOrder.payment_method}
                  </p>
                </div>
              </div>

              {/* Danh sách sản phẩm */}
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2 text-gray-700">
                  <ShoppingBag className="h-4 w-4" /> Sản phẩm
                </h4>
                <div className="border rounded overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-100 hover:bg-gray-100">
                        <TableHead>Sản phẩm</TableHead>
                        <TableHead className="text-right">SL</TableHead>
                        <TableHead className="text-right">Đơn giá</TableHead>
                        <TableHead className="text-right">Thành tiền</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedOrder.items?.map((item, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <div className="font-medium">
                              {item.product_name}
                            </div>
                            <div className="text-xs text-gray-500 font-mono">
                              {item.product_sku}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-bold">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(item.unit_price)}
                          </TableCell>
                          <TableCell className="text-right font-medium text-gray-900">
                            {formatCurrency(item.total)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>

              {/* Tổng kết tiền */}
              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Tạm tính:</span>
                  <span>{formatCurrency(selectedOrder.subtotal)}</span>
                </div>

                <div className="flex justify-between text-sm text-gray-600">
                  <span>Thuế (10%):</span>
                  <span>{formatCurrency(selectedOrder.tax)}</span>
                </div>

                {/* Hiển thị giảm giá nếu có */}
                {selectedOrder.discount > 0 && (
                  <div className="flex justify-between text-sm text-rose-600">
                    <span>Giảm giá:</span>
                    <span>-{formatCurrency(selectedOrder.discount)}</span>
                  </div>
                )}

                <div className="flex justify-between text-xl font-bold mt-2 pt-2 border-t border-dashed border-gray-200">
                  <span>Tổng cộng:</span>
                  <span className="text-emerald-600">
                    {formatCurrency(selectedOrder.total)}
                  </span>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowDetail(false)}>
                  Đóng
                </Button>
                <Button onClick={handlePrintReceipt}>
                  <Printer className="h-4 w-4 mr-1" /> In hóa đơn
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
