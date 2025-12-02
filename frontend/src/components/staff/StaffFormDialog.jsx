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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

export function StaffFormDialog({ open, onOpenChange, user, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    phone: "",
    role: "staff",
    password: "",
    is_active: true,
  });

  // Reset form khi mở
  useEffect(() => {
    if (open) {
      if (user) {
        // Mode Edit
        setFormData({
          email: user.email || "",
          full_name: user.full_name || "",
          phone: user.phone || "",
          role: user.role || "staff",
          password: "",
          is_active: user.is_active,
        });
      } else {
        // Mode Create
        setFormData({
          email: "",
          full_name: "",
          phone: "",
          role: "staff",
          password: "",
          is_active: true,
        });
      }
    }
  }, [open, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate cơ bản
    if (!formData.email || !formData.full_name) {
      return toast.error("Vui lòng điền tên và email");
    }
    if (!user && !formData.password) {
      return toast.error("Vui lòng nhập mật khẩu cho nhân viên mới");
    }

    setLoading(true);
    try {
      if (user) {
        // --- EDIT ---
        await api.put(`/users/${user.id}`, {
          full_name: formData.full_name,
          phone: formData.phone,
          role: formData.role,
          is_active: formData.is_active,
        });
        toast.success("Cập nhật nhân viên thành công");
      } else {
        // --- CREATE ---
        await api.post("/users", formData);
        toast.success("Tạo nhân viên mới thành công");
      }
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("User save error:", error);
      toast.error(error.response?.data?.message || "Lỗi khi lưu nhân viên");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {user ? "Cập nhật nhân viên" : "Thêm nhân viên mới"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>
              Họ và tên <span className="text-rose-500">*</span>
            </Label>
            <Input
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              placeholder="Nguyễn Văn A"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>
                Email (Tài khoản) <span className="text-rose-500">*</span>
              </Label>
              <Input
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@example.com"
                disabled={!!user}
                className={user ? "bg-slate-100" : ""}
              />
            </div>
            <div className="space-y-2">
              <Label>Số điện thoại</Label>
              <Input
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="0912..."
              />
            </div>
          </div>

          {!user && (
            <div className="space-y-2">
              <Label>
                Mật khẩu khởi tạo <span className="text-rose-500">*</span>
              </Label>
              <Input
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Phân quyền (Vai trò)</Label>
              <Select
                value={formData.role}
                onValueChange={(val) =>
                  setFormData((prev) => ({ ...prev, role: val }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="staff">Nhân viên (Staff)</SelectItem>
                  <SelectItem value="manager">Quản lý (Manager)</SelectItem>
                  <SelectItem value="admin">Quản trị viên (Admin)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select
                value={formData.is_active ? "active" : "inactive"}
                onValueChange={(val) =>
                  setFormData((prev) => ({
                    ...prev,
                    is_active: val === "active",
                  }))
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Đang hoạt động</SelectItem>
                  <SelectItem value="inactive">Đã khóa</SelectItem>
                </SelectContent>
              </Select>
            </div>
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
              {loading && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              <CheckCircle className="mr-1 h-4 w-4" /> Lưu thông tin
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
