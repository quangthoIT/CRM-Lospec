import { useState, useEffect } from "react";
import api from "../../config/api"; // Import từ file config vừa tạo lại
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, CheckCircle, Percent, Banknote } from "lucide-react";
import { toast } from "sonner";

export function PromotionFormDialog({
  open,
  onOpenChange,
  promotion,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);

  // Default state
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    type: "percentage", // percentage | fixed
    value: "",
    min_order_value: 0,
    max_discount: 0,
    start_date: "",
    end_date: "",
    usage_limit: 0,
    is_active: true,
  });

  useEffect(() => {
    if (open) {
      if (promotion) {
        // Format date cho input datetime-local (YYYY-MM-DDTHH:mm)
        const formatDateTime = (dateStr) => {
          if (!dateStr) return "";
          return new Date(dateStr).toISOString().slice(0, 16);
        };

        setFormData({
          code: promotion.code,
          name: promotion.name,
          type: promotion.type,
          value: promotion.value,
          min_order_value: promotion.min_order_value || 0,
          max_discount: promotion.max_discount || 0,
          start_date: formatDateTime(promotion.start_date),
          end_date: formatDateTime(promotion.end_date),
          usage_limit: promotion.usage_limit || 0,
          is_active: promotion.is_active,
        });
      } else {
        // Default Create
        const now = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(now.getDate() + 7);

        setFormData({
          code: "",
          name: "",
          type: "percentage",
          value: "",
          min_order_value: 0,
          max_discount: 0,
          start_date: now.toISOString().slice(0, 16),
          end_date: nextWeek.toISOString().slice(0, 16),
          usage_limit: 0, // 0 = unlimited
          is_active: true,
        });
      }
    }
  }, [open, promotion]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.code || !formData.name || !formData.value) {
      return toast.error("Vui lòng điền các trường bắt buộc");
    }

    setLoading(true);
    try {
      const payload = {
        ...formData,
        code: formData.code.toUpperCase(), // Mã luôn viết hoa
        value: Number(formData.value),
        min_order_value: Number(formData.min_order_value),
        max_discount: Number(formData.max_discount),
        usage_limit: Number(formData.usage_limit),
      };

      if (promotion) {
        await api.put(`/promotions/${promotion.id}`, payload);
        toast.success("Cập nhật chương trình thành công");
      } else {
        await api.post("/promotions", payload);
        toast.success("Tạo chương trình khuyến mãi thành công");
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi lưu khuyến mãi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {promotion ? "Cập nhật khuyến mãi" : "Tạo chương trình khuyến mãi"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Code & Name */}
            <div className="space-y-2">
              <Label>
                Mã Coupon <span className="text-rose-500">*</span>
              </Label>
              <Input
                name="code"
                value={formData.code}
                onChange={handleChange}
                placeholder="VD: SALE50"
                className="uppercase font-mono font-bold"
                disabled={!!promotion} // Không sửa mã khi edit
              />
            </div>
            <div className="space-y-2">
              <Label>
                Tên chương trình <span className="text-rose-500">*</span>
              </Label>
              <Input
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="VD: Giảm giá khai trương"
              />
            </div>

            {/* Type & Value */}
            <div className="space-y-2">
              <Label>Loại giảm giá</Label>
              <Select
                value={formData.type}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, type: val }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percentage">Theo phần trăm (%)</SelectItem>
                  <SelectItem value="fixed">Số tiền cố định (VNĐ)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                Giá trị giảm {formData.type === "percentage" ? "(%)" : "(VNĐ)"}{" "}
                <span className="text-rose-500">*</span>
              </Label>
              <div className="relative">
                <Input
                  type="number"
                  name="value"
                  value={formData.value}
                  onChange={handleChange}
                  className="pl-9 font-bold"
                  min="0"
                  max={formData.type === "percentage" ? "100" : undefined}
                />
                <div className="absolute left-3 top-2.5 text-slate-400">
                  {formData.type === "percentage" ? (
                    <Percent className="h-4 w-4" />
                  ) : (
                    <Banknote className="h-4 w-4" />
                  )}
                </div>
              </div>
            </div>

            {/* Min Order & Max Discount */}
            <div className="space-y-2">
              <Label>Đơn hàng tối thiểu</Label>
              <Input
                type="number"
                name="min_order_value"
                value={formData.min_order_value}
                onChange={handleChange}
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label
                className={formData.type === "fixed" ? "text-slate-400" : ""}
              >
                Giảm tối đa (Chỉ áp dụng cho %)
              </Label>
              <Input
                type="number"
                name="max_discount"
                value={formData.max_discount}
                onChange={handleChange}
                min="0"
                disabled={formData.type === "fixed"}
                className={formData.type === "fixed" ? "bg-slate-100" : ""}
              />
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label>
                Thời gian bắt đầu <span className="text-rose-500">*</span>
              </Label>
              <Input
                type="datetime-local"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label>
                Thời gian kết thúc <span className="text-rose-500">*</span>
              </Label>
              <Input
                type="datetime-local"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
              />
            </div>

            {/* Usage Limit & Status */}
            <div className="space-y-2">
              <Label>Giới hạn lượt dùng (0 = Vô hạn)</Label>
              <Input
                type="number"
                name="usage_limit"
                value={formData.usage_limit}
                onChange={handleChange}
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select
                value={formData.is_active ? "true" : "false"}
                onValueChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    is_active: val === "true",
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Đang hoạt động</SelectItem>
                  <SelectItem value="false">Tạm dừng</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              type="button"
              onClick={() => onOpenChange(false)}
            >
              Hủy
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-1 h-4 w-4" />
              )}
              Lưu chương trình
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
