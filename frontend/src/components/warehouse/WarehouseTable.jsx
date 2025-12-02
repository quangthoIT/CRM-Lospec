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
import { Eye, RefreshCw, FileText, Calendar } from "lucide-react";

export function WarehouseTable({
  data = [],
  loading = false,
  type = "import", // "import" | "export"
  onViewDetail,
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
            </TableCell>
          </TableRow>
        ) : data.length === 0 ? (
          <TableRow>
            <TableCell colSpan={7} className="text-center py-8 text-gray-500">
              Chưa có dữ liệu
            </TableCell>
          </TableRow>
        ) : (
          data.map((item) => (
            <TableRow key={item.id} className="hover:bg-gray-50">
              {/* 1. Mã phiếu */}
              <TableCell className="font-mono font-medium text-gray-700">
                <div className="flex items-center gap-2">
                  {/* Dùng po_number cho Import, code cho Export */}
                  {item.po_number || item.code}
                </div>
              </TableCell>

              {/* 2. Ngày */}
              <TableCell>
                {formatDate(
                  item.actual_delivery || item.date || item.created_at
                )}
              </TableCell>

              {/* 3 & 4. Cột riêng biệt */}
              {isImport ? (
                <>
                  <TableCell>{item.supplier_name || "---"}</TableCell>
                  <TableCell className="text-sm text-gray-500 text-center">
                    {item.created_by || "Admin"}
                  </TableCell>
                </>
              ) : (
                <>
                  <TableCell className="max-w-xs truncate" title={item.notes}>
                    {item.notes || "Xuất kho"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary">{item.totalQuantity}</Badge>
                  </TableCell>
                </>
              )}

              {/* 5. Tổng tiền */}
              <TableCell
                className={`font-bold text-center ${
                  isImport ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {formatCurrency(item.total || item.totalValue)}
              </TableCell>

              {/* 6. Trạng thái */}
              <TableCell className="text-center">
                <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                  Hoàn thành
                </Badge>
              </TableCell>

              {/* 7. Action */}
              <TableCell className="text-center">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onViewDetail(isImport ? item.id : item)}
                >
                  <Eye className="h-4 w-4 text-blue-600" />
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
