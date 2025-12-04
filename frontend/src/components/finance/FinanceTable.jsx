import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowUpCircle,
  ArrowDownCircle,
  Calendar,
  Trash2,
  RefreshCw,
  CreditCard,
  Banknote,
  Smartphone,
  Edit,
} from "lucide-react";
import { useState } from "react";
import api from "../../config/api";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "../ConfirmDeleteDialog";

export function FinanceTable({
  data = [],
  loading = false,
  onRefresh,
  onEdit,
}) {
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const formatCurrency = (val) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val || 0);

  const formatDate = (d) => (d ? new Date(d).toLocaleDateString("vi-VN") : "");

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/finances/expenses/${itemToDelete.id}`);
      toast.success("Đã xóa khoản chi");
      setDeleteOpen(false);
      onRefresh();
    } catch (error) {
      toast.error("Lỗi khi xóa khoản chi");
    } finally {
      setDeleting(false);
    }
  };

  const getCategoryBadge = (cat, type) => {
    if (type === "income")
      return (
        <Badge
          variant="outline"
          className="bg-emerald-50 text-emerald-700 border-emerald-200"
        >
          Doanh thu bán hàng
        </Badge>
      );

    const map = {
      utilities: "Điện/Nước/Internet",
      rent: "Mặt bằng",
      salary: "Lương",
      marketing: "Marketing",
      equipment: "Thiết bị",
      import: "Nhập hàng",
      other: "Khác",
    };
    return <Badge variant="secondary">{map[cat] || cat}</Badge>;
  };

  const getIcon = (type) =>
    type === "income" ? (
      <ArrowUpCircle className="h-5 w-5 text-emerald-500" />
    ) : (
      <ArrowDownCircle className="h-5 w-5 text-rose-500" />
    );

  const getPaymentIcon = (method) => {
    if (method === "transfer")
      return <Smartphone className="h-4 w-4 text-blue-500" />;
    if (method === "card")
      return <CreditCard className="h-4 w-4 text-purple-500" />;
    return <Banknote className="h-4 w-4 text-emerald-500" />;
  };

  return (
    <>
      <Table className="bg-white border border-gray-200 shadow-lg">
        <TableHeader>
          <TableRow className="bg-gray-200">
            <TableHead className="text-center">Loại</TableHead>
            <TableHead>Ngày</TableHead>
            <TableHead>Nội dung / Nguồn</TableHead>
            <TableHead>Danh mục</TableHead>
            <TableHead>Thanh toán</TableHead>
            <TableHead className="text-right">Số tiền</TableHead>
            <TableHead className="text-center">Người tạo</TableHead>
            <TableHead className="text-center">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-600" />
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                Không có dữ liệu giao dịch
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => (
              <TableRow key={item.uniqueId} className="hover:bg-gray-100">
                <TableCell>
                  <div className="flex items-center justify-center">
                    {getIcon(item.type)}
                  </div>
                </TableCell>
                <TableCell className="text-gray-600 text-sm">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" /> {formatDate(item.date)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium">{item.title}</div>
                  {item.subTitle && (
                    <div className="text-xs text-gray-500">{item.subTitle}</div>
                  )}
                </TableCell>
                <TableCell>
                  {getCategoryBadge(item.category, item.type)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    {getPaymentIcon(item.payment_method)}{" "}
                    {item.payment_method === "transfer"
                      ? "Chuyển khoản"
                      : item.payment_method === "card"
                      ? "Thẻ"
                      : "Tiền mặt"}
                  </div>
                </TableCell>
                <TableCell
                  className={`text-right font-bold ${
                    item.type === "income"
                      ? "text-emerald-600"
                      : "text-rose-600"
                  }`}
                >
                  {item.type === "income" ? "+" : "-"}
                  {formatCurrency(item.amount)}
                </TableCell>
                <TableCell className="text-center text-sm text-gray-500">
                  {item.created_by || "---"}
                </TableCell>
                <TableCell className="text-center">
                  {item.type === "expense" && (
                    <div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                        onClick={() => onEdit && onEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-100"
                        onClick={() => handleDeleteClick(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Xóa khoản chi?"
        description={`Bạn có chắc chắn muốn xóa khoản chi "${itemToDelete?.title}"? Số tiền này sẽ được hoàn lại vào quỹ.`}
        itemName={itemToDelete?.title}
      />
    </>
  );
}
