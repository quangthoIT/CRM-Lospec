import { useState, useEffect } from "react";
import api from "../../config/api";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CheckCircle, Store, Trash2 } from "lucide-react";
import { toast } from "sonner";

export function WarehouseTransactionDialog({
  open,
  onOpenChange,
  type = "import", // "import" | "export"
  products = [],
  suppliers = [], // Chỉ dùng cho import
  onSuccess,
}) {
  const isImport = type === "import";
  const DEFAULT_BRANCH = { id: "CN-MAIN", name: "Kho Tổng (Mặc định)" };

  // Form State
  const [partnerId, setPartnerId] = useState(""); // Supplier ID (Import) hoặc Branch ID (Export)
  const [transactionDate, setTransactionDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [items, setItems] = useState([]);
  const [notes, setNotes] = useState("");

  // Line Item State
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [tempPrice, setTempPrice] = useState(0);

  // ✅ Sử dụng transactionNumber chung cho cả PO Number (Nhập) và Export Number (Xuất)
  const [transactionNumber, setTransactionNumber] = useState("");

  const productList = Array.isArray(products) ? products : products?.data || [];

  const [loading, setLoading] = useState(false);

  // Reset form khi mở dialog
  useEffect(() => {
    if (open) {
      setItems([]);
      setNotes("");
      setTransactionDate(new Date().toISOString().split("T")[0]);
      setPartnerId(isImport ? "" : DEFAULT_BRANCH.id);
      setTransactionNumber("");
      setSelectedProduct("");
      setQuantity(1);
      setTempPrice(0);
    }
  }, [open, type]);

  const formatCurrency = (val) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val || 0);

  // Xử lý thêm sản phẩm
  const handleAddItem = () => {
    if (!selectedProduct) return toast.error("Vui lòng chọn sản phẩm");
    if (quantity <= 0) return toast.error("Số lượng phải > 0");

    const product = productList.find((p) => p.id === selectedProduct);
    if (!product) return;

    // Validate tồn kho (Chỉ áp dụng cho Export)
    if (!isImport) {
      const currentInCart =
        items.find((i) => i.product_id === selectedProduct)?.quantity || 0;
      if (quantity + currentInCart > (product.stock_quantity || 0)) {
        return toast.warning(
          `Không đủ tồn kho (Hiện có: ${product.stock_quantity})`
        );
      }
    }

    const newItem = {
      product_id: product.id,
      product_name: product.name,
      sku: product.sku,
      quantity: Number(quantity),
      unit_price: Number(tempPrice),
      total: Number(quantity) * Number(tempPrice),
    };

    const existingIdx = items.findIndex(
      (i) => i.product_id === newItem.product_id
    );
    if (existingIdx >= 0) {
      const newItems = [...items];
      newItems[existingIdx].quantity += newItem.quantity;
      newItems[existingIdx].total += newItem.total;
      setItems(newItems);
    } else {
      setItems([...items, newItem]);
    }

    // Reset dòng nhập
    setSelectedProduct("");
    setQuantity(1);
    setTempPrice(0);
  };

  const handleRemoveItem = (index) => {
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const handleSubmit = async () => {
    if (isImport && !partnerId)
      return toast.error("Vui lòng chọn nhà cung cấp");
    if (items.length === 0) return toast.error("Chưa có sản phẩm nào");

    setLoading(true);
    try {
      let payload = {
        products: items,
        notes: notes,
      };

      if (isImport) {
        payload = {
          ...payload,
          supplier_id: partnerId,
          // ✅ Sửa lỗi: Dùng transactionNumber thay vì poNumber chưa định nghĩa
          po_number: transactionNumber || undefined,
        };
        await api.post("/warehouse/import", payload);
      } else {
        payload = {
          ...payload,
          branch_id: partnerId,
          // Có thể gửi thêm export_number nếu backend hỗ trợ manual code
          // export_number: transactionNumber || undefined
        };
        await api.post("/warehouse/export", payload);
      }

      toast.success(
        isImport
          ? "Tạo phiếu nhập kho thành công (Chờ duyệt)!"
          : "Tạo phiếu xuất kho thành công (Chờ duyệt)!"
      );
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Transaction error:", error);
      toast.error(error.response?.data?.message || "Lỗi giao dịch kho");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isImport ? "Tạo phiếu nhập kho" : "Tạo phiếu xuất kho"}
          </DialogTitle>
          <DialogDescription>
            {isImport
              ? "Tạo phiếu nhập hàng từ nhà cung cấp"
              : "Tạo phiếu xuất hàng khỏi kho"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-2">
          {/* --- HEADER FORM --- */}
          <div className="grid grid-cols-2 gap-4">
            {isImport ? (
              <div className="space-y-2">
                <Label>
                  Nhà cung cấp <span className="text-rose-500">*</span>
                </Label>
                <Select value={partnerId} onValueChange={setPartnerId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Chọn NCC" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-2 opacity-70 pointer-events-none">
                <Label>Chi nhánh xuất</Label>
                <div className="flex h-10 w-full items-center rounded-md border border-gray-200 bg-gray-50 px-3 text-sm text-gray-500">
                  <Store className="mr-2 h-4 w-4" />
                  {DEFAULT_BRANCH.name}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>{isImport ? "Ngày nhập" : "Ngày xuất"}</Label>
              <Input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Mã phiếu (Tùy chọn)</Label>
              <Input
                value={transactionNumber}
                onChange={(e) => setTransactionNumber(e.target.value)}
                placeholder="Tự động tạo nếu để trống"
              />
            </div>

            <div className="space-y-2">
              <Label>{isImport ? "Ghi chú" : "Lý do xuất kho"}</Label>
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={
                  isImport ? "Ghi chú nhập hàng..." : "VD: Bán lẻ, Xuất hủy..."
                }
              />
            </div>
          </div>

          {/* --- ADD PRODUCTS --- */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-4">
            <div className="flex flex-col space-y-2">
              <Label>Chọn sản phẩm</Label>
              <Select
                value={selectedProduct}
                onValueChange={(val) => {
                  setSelectedProduct(val);
                  const p = productList.find((i) => i.id === val);
                  // Import: Gợi ý giá vốn (cost). Export: Gợi ý giá bán (price)
                  if (p) setTempPrice(isImport ? p.cost || 0 : p.price || 0);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Tìm kiếm sản phẩm..." />
                </SelectTrigger>
                <SelectContent>
                  {productList.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      <div className="flex justify-between w-full gap-2">
                        <span>{p.name}</span>
                        <span className="text-gray-400 text-xs">
                          (Tồn: {p.stock_quantity})
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 items-end justify-between">
              <div className="space-y-2">
                <Label>Số lượng</Label>
                <Input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>{isImport ? "Giá nhập" : "Giá xuất"}</Label>
                <Input
                  type="number"
                  min="0"
                  value={tempPrice}
                  onChange={(e) => setTempPrice(Number(e.target.value))}
                />
              </div>
              <div>
                <Button onClick={handleAddItem} variant="secondary">
                  Thêm
                </Button>
              </div>
            </div>

            {/* --- CART TABLE --- */}
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã SKU</TableHead>
                  <TableHead>Tên sản phẩm</TableHead>
                  <TableHead className="text-right">SL</TableHead>
                  <TableHead className="text-right">Đơn giá</TableHead>
                  <TableHead className="text-right">Thành tiền</TableHead>
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="font-mono text-xs">
                      {item.sku}
                    </TableCell>
                    <TableCell>{item.product_name}</TableCell>
                    <TableCell className="text-right">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(item.unit_price)}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(item.total)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(idx)}
                      >
                        <Trash2 className="h-4 w-4 text-rose-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-gray-400 py-4"
                    >
                      Chưa có sản phẩm nào
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>

            <div className="flex justify-end border-t pt-4 text-lg">
              <span className="text-gray-600 mr-2">Tổng giá trị:</span>
              <span className="font-bold text-emerald-600">
                {formatCurrency(items.reduce((s, i) => s + i.total, 0))}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Hủy bỏ
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className={`${
                isImport
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-rose-600 hover:bg-rose-700"
              }`}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              {isImport ? "Tạo phiếu nhập kho" : "Tạo phiếu xuất kho"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
