import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MapPin, User, FileText } from "lucide-react";

export function WarehouseDetailDialog({
  open,
  onOpenChange,
  data,
  type = "import", // "import" | "export"
  footerAction, // Prop để nhận nút bấm (ví dụ nút Duyệt) từ cha nếu cần
}) {
  if (!data) return null;

  const isImport = type === "import";

  const formatCurrency = (val) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val || 0);

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    return new Date(dateStr).toLocaleDateString("vi-VN");
  };

  // Chuẩn hóa dữ liệu đầu vào để hiển thị
  const displayData = {
    code: isImport ? data.po_number : data.code,
    date: isImport ? data.actual_delivery || data.created_at : data.date,
    partnerLabel: isImport ? "Nhà cung cấp" : "Lý do / Ghi chú",
    partnerValue: isImport ? data.supplier_name : data.notes,
    items: data.items || [],
    totalQuantity: isImport
      ? (data.items || []).reduce((sum, i) => sum + i.quantity, 0)
      : data.totalQuantity,
    totalAmount: isImport ? data.total : data.totalValue,
    creator: isImport ? data.created_by : null, // Export hiện tại chưa lưu creator trong view này
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Chi tiết phiếu {isImport ? "nhập" : "xuất"}: {displayData.code}
          </DialogTitle>
          <DialogDescription>
            Ngày {isImport ? "tạo" : "xuất"}: {formatDate(displayData.date)}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* --- Thông tin Header --- */}
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded border">
            <div>
              <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                {isImport ? (
                  <User className="h-3 w-3" />
                ) : (
                  <FileText className="h-3 w-3" />
                )}
                {displayData.partnerLabel}
              </p>
              <p className="font-medium text-slate-800 wrap-break-word">
                {displayData.partnerValue || "---"}
              </p>
            </div>

            {/* Nếu là Import thì hiển thị Ghi chú riêng, Export thì ghi chú đã nằm ở partnerValue */}
            {isImport && (
              <div>
                <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                  <FileText className="h-3 w-3" /> Ghi chú
                </p>
                <p className="font-medium text-slate-800">
                  {data.notes || "Không có"}
                </p>
              </div>
            )}

            {!isImport && (
              <div>
                <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> Địa điểm
                </p>
                <p className="font-medium text-slate-800">Kho Tổng</p>
              </div>
            )}
          </div>

          {/* --- Bảng sản phẩm --- */}
          <div className="border rounded overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50">
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead className="text-right">Số lượng</TableHead>
                  <TableHead className="text-right">Đơn giá</TableHead>
                  <TableHead className="text-right">Thành tiền</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayData.items.map((item, i) => (
                  <TableRow key={i}>
                    <TableCell>
                      <div className="font-medium">{item.product_name}</div>
                      <div className="text-xs text-slate-500 font-mono">
                        {item.sku}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-bold">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.unit_price)}
                    </TableCell>
                    <TableCell
                      className={`text-right font-medium ${
                        isImport ? "text-emerald-600" : "text-rose-600"
                      }`}
                    >
                      {formatCurrency(
                        item.total || item.quantity * item.unit_price
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* --- Tổng kết --- */}
          <div className="flex justify-between items-center pt-2 border-t">
            <div className="text-sm text-slate-500">
              {displayData.creator && (
                <span>Người tạo: {displayData.creator} | </span>
              )}
              Tổng số lượng: <strong>{displayData.totalQuantity}</strong>
            </div>
            <div className="text-xl font-bold text-slate-800">
              Tổng tiền: {formatCurrency(displayData.totalAmount)}
            </div>
          </div>

          {/* --- Nút bấm thêm (nếu có) --- */}
          {footerAction && (
            <div className="flex justify-end pt-2">{footerAction}</div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
