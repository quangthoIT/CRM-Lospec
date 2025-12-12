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
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis,
} from "@/components/ui/pagination";
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
import { Search, Package, Edit, Trash2, Plus, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { ConfirmDeleteDialog } from "../ConfirmDeleteDialog";

export function ProductList({ onEdit, refreshTrigger, onAddClick }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Client-side filtering states
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination State
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 1,
  });

  // Delete states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // --- Fetch Data from API ---
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/products", {
        params: {
          page: pagination.page,
          limit: pagination.limit,
          search: search,
          category: categoryFilter === "all" ? undefined : categoryFilter,
        },
      });

      setProducts(data.data || []);
      setPagination((prev) => ({
        ...prev,
        ...data.pagination,
      }));
    } catch (error) {
      console.error(error);
      toast.error("Lỗi tải danh sách sản phẩm");
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchProducts();
    }, 300);
    return () => clearTimeout(timer);
  }, [pagination.page, search, categoryFilter, refreshTrigger]);

  // --- Filter Logic ---
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

  const renderPaginationItems = () => {
    const { page, totalPages } = pagination;
    const items = [];

    // Luôn hiện trang 1
    items.push(
      <PaginationItem key={1}>
        <PaginationLink
          onClick={() => handlePageChange(1)}
          isActive={page === 1}
        >
          1
        </PaginationLink>
      </PaginationItem>
    );

    // Logic hiển thị ...
    if (page > 3) {
      items.push(
        <PaginationItem key="start-ellipsis">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Các trang xung quanh trang hiện tại
    for (
      let i = Math.max(2, page - 1);
      i <= Math.min(totalPages - 1, page + 1);
      i++
    ) {
      items.push(
        <PaginationItem key={i}>
          <PaginationLink
            onClick={() => handlePageChange(i)}
            isActive={page === i}
          >
            {i}
          </PaginationLink>
        </PaginationItem>
      );
    }

    if (page < totalPages - 2) {
      items.push(
        <PaginationItem key="end-ellipsis">
          <PaginationEllipsis />
        </PaginationItem>
      );
    }

    // Luôn hiện trang cuối nếu > 1
    if (totalPages > 1) {
      items.push(
        <PaginationItem key={totalPages}>
          <PaginationLink
            onClick={() => handlePageChange(totalPages)}
            isActive={page === totalPages}
          >
            {totalPages}
          </PaginationLink>
        </PaginationItem>
      );
    }

    return items;
  };

  // --- Delete Logic ---
  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await api.delete(`/products/${productToDelete.id}`);
      toast.success("Đã xóa sản phẩm");
      fetchProducts();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Lỗi khi xóa sản phẩm.");
    } finally {
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const categories = [
    "Đồ uống", // Trà, Cà phê, Rượu (Sim, Cần...)
    "Thực phẩm khô", // Thịt trâu gác bếp, Khô gà, Tôm khô, Hạt điều
    "Bánh kẹo", // Bánh pía, Kẹo dừa, Mè xửng, Bánh đậu xanh
    "Gia vị", // Nước mắm, Muối tôm, Tiêu, Tỏi Lý Sơn, Mắm nêm
    "Thực phẩm tươi", // Nem chua, Chả mực, Cốm tươi
    "Thủ công mỹ nghệ", // Gốm sứ, Lụa tơ tằm, Mây tre đan
    "Sức khỏe & Quà tặng", // Yến sào, Mật ong, Nấm linh chi
  ];

  const unitLabels = {
    piece: "Cái",
    pack: "Gói", // Chè, kẹo
    bag: "Túi", // Tỏi, gạo
    box: "Hộp", // Bánh đậu xanh, hạt điều
    bottle: "Chai", // Nước mắm, rượu, mật ong
    jar: "Hũ", // Mắm tôm, chao, các loại sốt đặc
    can: "Lon", // Các loại đồ hộp hoặc bia đặc sản
    kg: "Kg",
    gram: "Gram",
    liter: "Lít",
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val);

  return (
    <div className="space-y-4">
      {/* --- Filter Bar --- */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
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
      {loading ? (
        <div className="h-56 flex items-center justify-center text-gray-600">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" /> Đang tải dữ
          liệu...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="h-56 flex flex-col items-center justify-center text-gray-600">
          <Package className="h-12 w-12 mb-2" />
          <p>Không tìm thấy sản phẩm nào.</p>
        </div>
      ) : (
        <Table className="bg-white border border-gray-200 shadow-lg">
          <TableHeader>
            <TableRow className="bg-gray-200">
              <TableHead>Hình ảnh</TableHead>
              <TableHead>Tên sản phẩm</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead className="text-center">Danh mục</TableHead>
              <TableHead className="text-center">Đơn vị</TableHead>
              <TableHead className="text-center">Tồn kho</TableHead>
              <TableHead className="text-center">Giá bán</TableHead>
              <TableHead className="text-center">Trạng thái</TableHead>
              <TableHead className="text-center">Thao tác</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.map((p) => (
              <TableRow key={p.id} className="hover:bg-gray-100">
                <TableCell>
                  <div className="h-12 w-12 rounded bg-gray-200 overflow-hidden border">
                    {p.image_url ? (
                      <img
                        src={p.image_url}
                        alt={p.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "https://placehold.co/40x40?text=IMG";
                        }}
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                <TableCell className="text-center">
                  <Badge variant="secondary">{p.category}</Badge>
                </TableCell>
                <TableCell className="text-center">
                  {unitLabels[p.unit] || p.unit}
                </TableCell>
                <TableCell className="text-center">
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
                <TableCell className="font-medium text-center text-emerald-600">
                  {formatCurrency(p.price)}
                </TableCell>
                <TableCell className="text-center">
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

                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-blue-600 hover:bg-blue-100"
                    onClick={() => onEdit(p)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-rose-600 hover:bg-rose-100"
                    onClick={() => {
                      setProductToDelete(p);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      {products.length > 0 && (
        <div className="py-4 border-t border-slate-100">
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => handlePageChange(pagination.page - 1)}
                  className={
                    pagination.page <= 1
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>

              {renderPaginationItems()}

              <PaginationItem>
                <PaginationNext
                  onClick={() => handlePageChange(pagination.page + 1)}
                  className={
                    pagination.page >= pagination.totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
          <div className="text-center text-xs text-slate-400 mt-2">
            Hiển thị {products.length} / {pagination.totalItems} sản phẩm
          </div>
        </div>
      )}

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
