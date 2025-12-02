import { useState, useEffect } from "react";
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
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import api from "../../config/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";

export function ProductFormDialog({ open, onOpenChange, product, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(getInitialData());

  // Helper reset form
  function getInitialData() {
    return {
      name: "",
      sku: "",
      barcode: "",
      category: "",
      description: "",
      unit: "piece",
      price: 0,
      cost: 0,
      stock_quantity: 0,
      min_stock: 10,
      max_stock: 100,
      image_url: "",
      is_active: true,
    };
  }

  // Load dữ liệu khi mở dialog ở chế độ Edit
  useEffect(() => {
    if (open) {
      if (product) {
        setFormData({
          name: product.name || "",
          sku: product.sku || "",
          barcode: product.barcode || "",
          category: product.category || "",
          description: product.description || "",
          unit: product.unit || "piece",
          price: Number(product.price) || 0,
          cost: Number(product.cost) || 0,
          stock_quantity: Number(product.stock_quantity) || 0,
          min_stock: Number(product.min_stock) || 10,
          max_stock: Number(product.max_stock) || 100,
          image_url: product.image_url || "",
          is_active: product.is_active ?? true,
        });
      } else {
        setFormData(getInitialData());
      }
    }
  }, [product, open]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate dữ liệu số
      const payload = {
        ...formData,
        price: parseFloat(formData.price) || 0,
        cost: parseFloat(formData.cost) || 0,
        stock_quantity: parseInt(formData.stock_quantity) || 0,
        min_stock: parseInt(formData.min_stock) || 10,
        max_stock: parseInt(formData.max_stock) || 100,
      };

      if (product) {
        // --- EDIT (PUT) ---
        await api.put(`/products/${product.id}`, payload);
        toast.success("Cập nhật sản phẩm thành công");
      } else {
        // --- ADD (POST) ---
        await api.post("/products", payload);
        toast.success("Thêm sản phẩm mới thành công");
      }

      onSuccess(); // Reload list bên ngoài
      onOpenChange(false); // Đóng modal
    } catch (error) {
      console.error("Error saving product:", error);
      const msg = error.response?.data?.message || "Lỗi khi lưu sản phẩm";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    "Đồ uống",
    "Bánh kẹo",
    "Mì ăn liền",
    "Bánh mỳ",
    "Sản phẩm từ sữa",
    "Thực phẩm đông lạnh",
    "Thực phẩm đóng hộp",
    "Đồ gia dụng",
    "Chăm sóc cá nhân",
  ];

  const units = [
    { value: "piece", label: "Cái" },
    { value: "kg", label: "Kg" },
    { value: "liter", label: "Lít" },
    { value: "box", label: "Hộp" },
    { value: "bottle", label: "Chai" },
    { value: "pack", label: "Gói" },
    { value: "bag", label: "Túi" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {product ? "Chỉnh sửa sản phẩm" : "Thêm sản phẩm mới"}
          </DialogTitle>
          <DialogDescription>
            {product
              ? "Cập nhật thông tin chi tiết của sản phẩm."
              : "Điền thông tin để tạo sản phẩm mới vào hệ thống."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">
                Tên sản phẩm <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="name"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="VD: Coca Cola 330ml"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sku">
                SKU (Mã hàng) <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="sku"
                required
                value={formData.sku}
                onChange={(e) =>
                  setFormData({ ...formData, sku: e.target.value })
                }
                placeholder="VD: COCA-330"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode (Mã vạch)</Label>
              <Input
                id="barcode"
                value={formData.barcode}
                onChange={(e) =>
                  setFormData({ ...formData, barcode: e.target.value })
                }
                placeholder="Quét mã vạch..."
                className="w-full"
              />
            </div>

            <div className="space-y-2  min-w-0 w-full">
              <Label htmlFor="category">
                Danh mục <span className="text-rose-500">*</span>
              </Label>
              <Select
                required
                value={formData.category}
                onValueChange={(value) =>
                  setFormData({ ...formData, category: value })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn danh mục" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả</Label>
            <Textarea
              id="description"
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Mô tả chi tiết..."
              rows={2}
            />
          </div>

          <div className="flex gap-4 justify-between">
            <div className="space-y-2">
              <Label htmlFor="cost">Giá nhập</Label>
              <Input
                id="cost"
                type="number"
                min={0}
                value={formData.cost}
                onChange={(e) =>
                  setFormData({ ...formData, cost: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">
                Giá bán <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="price"
                type="number"
                required
                min={0}
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Đơn vị</Label>
              <Select
                value={formData.unit}
                onValueChange={(value) =>
                  setFormData({ ...formData, unit: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {units.map((u) => (
                    <SelectItem key={u.value} value={u.value}>
                      {u.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-4 justify-between">
            <div className="space-y-2">
              <Label htmlFor="stock_quantity">Tồn kho</Label>
              <Input
                id="stock_quantity"
                type="number"
                min={0}
                value={formData.stock_quantity}
                onChange={(e) =>
                  setFormData({ ...formData, stock_quantity: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Min Stock</Label>
              <Input
                type="number"
                value={formData.min_stock}
                onChange={(e) =>
                  setFormData({ ...formData, min_stock: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Max Stock</Label>
              <Input
                type="number"
                value={formData.max_stock}
                onChange={(e) =>
                  setFormData({ ...formData, max_stock: e.target.value })
                }
              />
            </div>
          </div>

          <div className="flex gap-4 justify-between">
            <div className="space-y-2 w-full">
              <Label>Ảnh sản phẩm (URL)</Label>
              <Input
                value={formData.image_url}
                onChange={(e) =>
                  setFormData({ ...formData, image_url: e.target.value })
                }
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Trạng thái</Label>
              <Select
                value={formData.is_active ? "active" : "inactive"}
                onValueChange={(val) =>
                  setFormData({ ...formData, is_active: val === "active" })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Đang kinh doanh</SelectItem>
                  <SelectItem value="inactive">Ngừng kinh doanh</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex gap-3 pt-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Hủy bỏ
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {product ? "Lưu thay đổi" : "Tạo sản phẩm"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
