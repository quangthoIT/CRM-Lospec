import { useState, useEffect } from "react";
import api from "@/config/api"; // Axios instance
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Search,
  Package,
  Edit,
  Trash2,
  Plus,
  RefreshCw,
  SearchCheck,
} from "lucide-react";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "../ConfirmDeleteDialog";

export function ProductList({ onEdit, refreshTrigger, onAddClick }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Client-side filtering states
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Delete states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- 1. Fetch Data from API ---
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/products");
      // data trả về là mảng sản phẩm
      setProducts(data || []);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Không thể tải danh sách sản phẩm.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [refreshTrigger]); // Reload khi Parent yêu cầu

  // --- 2. Filter Logic (Client-side) ---
  const filteredProducts = products.filter((p) => {
    const matchSearch =
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode?.includes(search);

    const matchCategory =
      categoryFilter === "all" || p.category === categoryFilter;

    const matchStatus =
      statusFilter === "all" ||
      (statusFilter === "active" ? p.is_active : !p.is_active);

    return matchSearch && matchCategory && matchStatus;
  });

  // --- 3. Delete Logic ---
  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await api.delete(`/products/${productToDelete.id}`);
      toast.success("Đã xóa sản phẩm");
      fetchProducts(); // Reload lại list gốc
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Lỗi khi xóa sản phẩm.");
    } finally {
      setDeleteDialogOpen(false);
      setProductToDelete(null);
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

  const unitLabels = {
    piece: "Cái",
    pack: "Gói",
    kg: "Kg",
    liter: "Lít",
    box: "Hộp",
    bottle: "Chai",
    bag: "Túi",
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val);

  return (
    <div className="space-y-4">
      {/* --- Filter Bar --- */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50 p-4 rounded-lg shadow-sm border">
        <div className="flex flex-1 gap-2 w-full">
          <div className="relative flex-1 max-w-sm">
            <Input
              placeholder="Tìm tên, SKU, barcode..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search size={20} />}
            />
          </div>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Danh mục" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả danh mục</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {cat}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Trạng thái" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              <SelectItem value="active">Đang bán</SelectItem>
              <SelectItem value="inactive">Ngừng bán</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchProducts}
            title="Tải lại"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>

          <Button variant="default" onClick={onAddClick}>
            <Plus className="h-4 w-4 mr-1" /> Thêm mới
          </Button>
        </div>
      </div>

      {/* --- Table --- */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="h-64 flex items-center justify-center text-slate-500">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" /> Đang tải dữ
            liệu...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500">
            <Package className="h-12 w-12 text-slate-300 mb-2" />
            <p>Không tìm thấy sản phẩm nào.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead>Hình ảnh</TableHead>
                  <TableHead>Tên sản phẩm</TableHead>
                  <TableHead>SKU</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead>Đơn vị</TableHead>
                  <TableHead>Tồn kho</TableHead>
                  <TableHead>Giá bán</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-center">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <div className="h-12 w-12 rounded bg-gray-200 overflow-hidden border">
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="h-full w-full object-cover"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src =
                                "https://placehold.co/40x40?text=IMG";
                            }}
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-xs text-slate-400">
                            No Img
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-normal">
                        {p.category}
                      </Badge>
                    </TableCell>
                    <TableCell>{unitLabels[p.unit] || p.unit}</TableCell>
                    <TableCell>
                      <span
                        className={
                          p.stock_quantity <= p.min_stock
                            ? "text-rose-600 font-bold"
                            : ""
                        }
                      >
                        {p.stock_quantity}
                      </span>
                    </TableCell>
                    <TableCell className="font-medium text-emerald-600">
                      {formatCurrency(p.price)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={p.is_active ? "outline" : "secondary"}
                        className={
                          p.is_active
                            ? "border-emerald-600 text-emerald-700 bg-emerald-50"
                            : ""
                        }
                      >
                        {p.is_active ? "Đang bán" : "Ngừng bán"}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          onClick={() => onEdit(p)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                          onClick={() => {
                            setProductToDelete(p);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>

      {/* --- Delete Dialog --- */}
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        itemName={productToDelete?.name}
        loading={isDeleting}
      />
    </div>
  );
}
