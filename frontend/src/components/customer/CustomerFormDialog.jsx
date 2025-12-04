import { useState, useEffect } from "react";
import api from "../../config/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, CheckCircle } from "lucide-react";

export function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    dateOfBirth: "",
    gender: "male",
    membershipTier: "bronze",
    notes: "",
  });

  // Helper: Map từ DB sang UI
  const mapTypeToTier = (type) => {
    if (type === "vip") return "diamond";
    if (type === "wholesale") return "gold";
    return "bronze";
  };

  // Helper: Map từ UI sang DB
  const mapTierToType = (tier) => {
    if (tier === "diamond") return "vip";
    if (tier === "gold") return "wholesale";
    return "regular";
  };

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || "",
        phone: customer.phone || "",
        email: customer.email || "",
        address: customer.address || "",
        city: customer.city || "",
        dateOfBirth: customer.birth_date
          ? customer.birth_date.split("T")[0]
          : "",
        gender: customer.gender || "male",
        membershipTier: mapTypeToTier(customer.customer_type),
        notes: customer.notes || "",
      });
    } else {
      setFormData({
        name: "",
        phone: "",
        email: "",
        address: "",
        city: "",
        dateOfBirth: "",
        gender: "male",
        membershipTier: "bronze",
        notes: "",
      });
    }
  }, [customer, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      return toast.error("Vui lòng nhập tên khách hàng");
    }

    setLoading(true);
    try {
      const payload = {
        name: formData.name,
        phone: formData.phone,
        email: formData.email || null,
        address: formData.address || null,
        city: formData.city || null,
        birth_date: formData.dateOfBirth || null,
        gender: formData.gender || null,
        customer_type: mapTierToType(formData.membershipTier),
        notes: formData.notes || null,
        is_active: true,
      };

      if (customer) {
        await api.put(`/customers/${customer.id}`, payload);
        toast.success("Cập nhật khách hàng thành công");
      } else {
        await api.post("/customers", payload);
        toast.success("Thêm khách hàng thành công");
      }

      if (onSuccess) onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving customer:", error);
      toast.error(error.response?.data?.message || "Lỗi khi lưu thông tin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {customer ? "Chỉnh sửa khách hàng" : "Thêm khách hàng mới"}
          </DialogTitle>
          <DialogDescription>
            {customer
              ? "Cập nhật thông tin khách hàng"
              : "Điền thông tin để thêm khách hàng mới vào hệ thống"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            {/* Name */}
            <div className="col-span-1">
              <Label htmlFor="name">
                Họ tên <span className="text-rose-600">*</span>
              </Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Nguyễn Văn A"
                required
              />
            </div>

            {/* Phone */}
            <div className="col-span-1">
              <Label htmlFor="phone">
                Số điện thoại <span className="text-rose-600">*</span>
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="0912345678"
                required
              />
            </div>

            {/* Email */}
            <div className="col-span-1">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="email@example.com"
              />
            </div>

            {/* Gender */}
            <div className="col-span-1">
              <Label htmlFor="gender">Giới tính</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) =>
                  setFormData({ ...formData, gender: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn giới tính" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Nam</SelectItem>
                  <SelectItem value="female">Nữ</SelectItem>
                  <SelectItem value="other">Khác</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Date of Birth */}
            <div className="col-span-1">
              <Label htmlFor="dateOfBirth">Ngày sinh</Label>
              <Input
                id="dateOfBirth"
                type="date"
                value={formData.dateOfBirth}
                onChange={(e) =>
                  setFormData({ ...formData, dateOfBirth: e.target.value })
                }
              />
            </div>

            {/* Membership Tier */}
            <div className="col-span-1">
              <Label htmlFor="membershipTier">Hạng thành viên</Label>
              <Select
                value={formData.membershipTier}
                onValueChange={(value) =>
                  setFormData({ ...formData, membershipTier: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bronze">Đồng (Thường)</SelectItem>
                  <SelectItem value="gold">Vàng</SelectItem>
                  <SelectItem value="diamond">Kim Cương (VIP)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Address */}
            <div className="col-span-1">
              <Label htmlFor="address">Địa chỉ</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                placeholder="Số nhà, đường..."
              />
            </div>

            {/* City */}
            <div className="col-span-1">
              <Label htmlFor="city">Tỉnh/Thành phố</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                placeholder="Hà Nội, TP.HCM..."
              />
            </div>

            {/* Notes */}
            <div className="col-span-2">
              <Label htmlFor="notes">Ghi chú</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Ghi chú về khách hàng..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter className="flex justify-end gap-2">
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
              {customer ? "Cập nhật" : "Thêm mới"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
