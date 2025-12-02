import { useState, useEffect } from "react";
import api from "../../config/api"; // Import từ file config vừa tạo lại
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export function SupplierFormDialog({
  open,
  onOpenChange,
  supplier, // Nếu có supplier -> Chế độ Sửa
  onSuccess,
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    contact_person: "",
    phone: "",
    email: "",
    address: "",
    tax_code: "",
  });

  // Reset form hoặc điền dữ liệu khi mở
  useEffect(() => {
    if (open) {
      if (supplier) {
        setFormData({
          name: supplier.name || "",
          contact_person: supplier.contact_person || "",
          phone: supplier.phone || "",
          email: supplier.email || "",
          address: supplier.address || "",
          tax_code: supplier.tax_code || "",
        });
      } else {
        setFormData({
          name: "",
          contact_person: "",
          phone: "",
          email: "",
          address: "",
          tax_code: "",
        });
      }
    }
  }, [open, supplier]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name) return toast.error("Tên nhà cung cấp là bắt buộc");

    setLoading(true);
    try {
      if (supplier) {
        // Update
        await api.put(`/suppliers/${supplier.id}`, formData);
        toast.success("Cập nhật nhà cung cấp thành công");
      } else {
        // Create
        await api.post("/suppliers", formData);
        toast.success("Thêm nhà cung cấp mới thành công");
      }
      onSuccess(); // Reload list
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving supplier:", error);
      toast.error(error.response?.data?.message || "Lỗi khi lưu thông tin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {supplier ? "Cập nhật nhà cung cấp" : "Thêm nhà cung cấp mới"}
          </DialogTitle>
          <DialogDescription>
            Điền thông tin chi tiết về đối tác cung ứng hàng hóa.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="name">
              Tên Nhà cung cấp <span className="text-rose-500">*</span>
            </Label>
            <Input
              id="name"
              name="name"
              placeholder="VD: Công ty TNHH ABC..."
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contact_person">Người liên hệ</Label>
              <Input
                id="contact_person"
                name="contact_person"
                placeholder="VD: Anh Nam"
                value={formData.contact_person}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tax_code">Mã số thuế</Label>
              <Input
                id="tax_code"
                name="tax_code"
                placeholder="VD: 031..."
                value={formData.tax_code}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="phone">Số điện thoại</Label>
              <Input
                id="phone"
                name="phone"
                placeholder="09xxx..."
                value={formData.phone}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="contact@abc.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Địa chỉ</Label>
            <Textarea
              id="address"
              name="address"
              placeholder="Địa chỉ văn phòng/kho..."
              rows={2}
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy bỏ
            </Button>
            <Button variant="default" type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {supplier ? "Lưu thay đổi" : "Thêm mới"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
