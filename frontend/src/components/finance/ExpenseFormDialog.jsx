import { useState, useEffect } from "react";
import api from "../../config/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export function ExpenseFormDialog({ open, onOpenChange, onSuccess, expense }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category: "utilities",
    payment_method: "cash",
    expense_date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  useEffect(() => {
    if (open) {
      if (expense) {
        setFormData({
          title: expense.title,
          amount: expense.amount,
          category: expense.category,
          payment_method: expense.payment_method,
          expense_date: expense.expense_date
            ? new Date(expense.expense_date).toISOString().split("T")[0]
            : "",
          notes: expense.notes || "",
        });
      } else {
        setFormData({
          title: "",
          amount: "",
          category: "utilities",
          payment_method: "cash",
          expense_date: new Date().toISOString().split("T")[0],
          notes: "",
        });
      }
    }
  }, [open, expense]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.amount) {
      return toast.error("Vui lòng nhập tên khoản chi và số tiền");
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        amount: Number(formData.amount),
      };

      if (expense) {
        await api.put(`/finances/expenses/${expense.id}`, payload);
        toast.success("Cập nhật phiếu chi thành công");
      } else {
        await api.post("/finances/expenses", payload);
        toast.success("Đã tạo phiếu chi thành công");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving expense:", error);
      toast.error(error.response?.data?.message || "Lỗi khi lưu phiếu chi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {expense ? "Cập nhật phiếu chi" : "Tạo phiếu chi mới"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>
              Tên khoản chi <span className="text-rose-500">*</span>
            </Label>
            <Input
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="VD: Tiền điện tháng 10..."
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Số tiền <span className="text-rose-500">*</span>
              </Label>
              <Input
                type="number"
                min="0"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Ngày chi</Label>
              <Input
                type="date"
                value={formData.expense_date}
                onChange={(e) =>
                  setFormData({ ...formData, expense_date: e.target.value })
                }
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Danh mục</Label>
              <Select
                value={formData.category}
                onValueChange={(val) =>
                  setFormData({ ...formData, category: val })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="utilities">
                    Điện, Nước, Internet
                  </SelectItem>
                  <SelectItem value="rent">Thuê mặt bằng</SelectItem>
                  <SelectItem value="salary">Lương nhân viên</SelectItem>
                  <SelectItem value="marketing">Marketing</SelectItem>
                  <SelectItem value="equipment">Thiết bị & Sửa chữa</SelectItem>
                  <SelectItem value="import">Nhập hàng</SelectItem>
                  <SelectItem value="other">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Hình thức thanh toán</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(val) =>
                  setFormData({ ...formData, payment_method: val })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Tiền mặt</SelectItem>
                  <SelectItem value="transfer">Chuyển khoản</SelectItem>
                  <SelectItem value="card">Thẻ</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Ghi chú</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Chi tiết thêm..."
              rows={2}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={loading} variant="default">
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-1 h-4 w-4" />
              )}
              {expense ? "Cập nhật" : "Lưu phiếu chi"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
