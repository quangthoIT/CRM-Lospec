import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  RefreshCw,
  FileText,
  Calendar,
  Trash2,
  Warehouse,
} from "lucide-react";

export function WarehouseTable({
  data = [],
  loading = false,
  type = "import", // "import" | "export"
  onViewDetail,
  onDelete, // Prop nhận hàm xóa
}) {
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

  return (
    <Table className="bg-white border border-gray-200 shadow-lg">
      <TableHeader>
        <TableRow className="bg-gray-200">
          <TableHead>Mã phiếu</TableHead>
          <TableHead>Ngày {isImport ? "nhập" : "xuất"}</TableHead>

          {/* Cột thay đổi tùy loại */}
          {isImport ? (
            <>
              <TableHead>Nhà cung cấp</TableHead>
              <TableHead className="text-center">Người tạo</TableHead>
            </>
          ) : (
            <>
              <TableHead>Lý do / Ghi chú</TableHead>
              <TableHead className="text-center">Tổng SL</TableHead>
            </>
          )}

          <TableHead className="text-center">Tổng tiền</TableHead>
          <TableHead className="text-center">Trạng thái</TableHead>
          <TableHead className="text-center">Thao tác</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {loading ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-600" />
              Đang tải dữ liệu...
            </TableCell>
          </TableRow>
        ) : data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-10 text-gray-600">
              <Warehouse className="h-10 w-10 mx-auto mb-2 text-gray-600" />
              Chưa có dữ liệu
            </TableCell>
          </TableRow>
        ) : (
          data.map((item) => (
            <TableRow key={item.id} className="hover:bg-gray-100">
              {/* 1. Mã phiếu */}
              <TableCell className="font-mono text-gray-600">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-gray-400" />
                  {item.po_number || item.code}
                </div>
              </TableCell>

              {/* 2. Ngày */}
              <TableCell>
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar className="h-4 w-4 text-gray-400" />
                  {formatDate(
                    item.actual_delivery || item.date || item.created_at
                  )}
                </div>
              </TableCell>

              {/* 3 & 4. Cột riêng biệt */}
              {isImport ? (
                <>
                  <TableCell className="font-medium text-gray-900">
                    {item.supplier_name || "---"}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600 text-center">
                    {item.created_by || "Admin"}
                  </TableCell>
                </>
              ) : (
                <>
                  <TableCell
                    className="max-w-xs truncate text-gray-600"
                    title={item.notes}
                  >
                    {item.notes || "Xuất kho"}
                  </TableCell>
                  <TableCell className="text-center font-medium">
                    {item.totalQuantity}
                  </TableCell>
                </>
              )}

              {/* 5. Tổng tiền */}
              <TableCell
                className={`font-medium text-center ${
                  isImport ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {formatCurrency(item.total || item.totalValue)}
              </TableCell>

              {/* 6. Trạng thái */}
              <TableCell className="text-center">
                {isImport ? (
                  item.status === "received" ? (
                    <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                      Hoàn thành
                    </Badge>
                  ) : (
                    <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                      Chờ xử lý
                    </Badge>
                  )
                ) : item.status === "completed" ? (
                  <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                    Hoàn thành
                  </Badge>
                ) : (
                  <Badge className="bg-amber-100 text-amber-700 border-amber-200">
                    Chờ xử lý
                  </Badge>
                )}
              </TableCell>

              {/* 7. Action */}
              <TableCell className="text-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onViewDetail(item.id)}
                  className="text-blue-600 hover:bg-blue-100"
                  title="Xem chi tiết"
                >
                  <Eye className="h-4 w-4" />
                </Button>

                {/* Chỉ hiện nút xóa nếu Chưa hoàn thành */}
                {onDelete &&
                  ((isImport && item.status !== "received") ||
                    (!isImport && item.status !== "completed")) && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete(item)}
                      className="text-rose-600 hover:bg-rose-100"
                      title="Xóa phiếu"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
