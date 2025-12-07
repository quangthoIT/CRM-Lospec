import { useState, useEffect } from "react";
import api from "../../config/api";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CreditCard,
  Banknote,
  Package,
  CheckCircle,
  Receipt,
  RotateCcw,
  UserPlus,
  Smartphone,
  User,
  Printer,
} from "lucide-react";
import { toast } from "sonner";
import { CustomerFormDialog } from "../customer/CustomerFormDialog";
import { printReceipt } from "./ReceiptPrinter";

export function POSView() {
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Payment State
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [receivedAmount, setReceivedAmount] = useState(0);

  // Discount State
  const [discountPercent, setDiscountPercent] = useState(0);
  const [discountType, setDiscountType] = useState("percent");
  const [discountAmount, setDiscountAmount] = useState(0);

  // Customer Dialog State
  const [showCustomerForm, setShowCustomerForm] = useState(false);

  // Receipt State
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);
  const [lastOrderItems, setLastOrderItems] = useState([]);

  const selectedBranch = "Kho Tổng";

  useEffect(() => {
    fetchData();
    fetchSettings();
  }, []);

  const [settings, setSettings] = useState({
    store_name: "LOSPEC",
    store_address: "",
    store_phone: "",
    store_email: "",
    tax_rate: 0,
  });

  const fetchSettings = async () => {
    try {
      const { data } = await api.get("/settings");
      if (data) {
        setSettings({
          store_name: data.store_name || "LOSPEC",
          store_address: data.store_address || "",
          store_phone: data.store_phone || "",
          store_email: data.store_email || "",
          tax_rate: Number(data.tax_rate) || 10,
        });
      }
    } catch (error) {
      console.error("Lỗi tải cài đặt:", error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [prodRes, custRes] = await Promise.all([
        api.get("/products?limit=1000"),
        api.get("/customers"),
      ]);
      const rawProducts = Array.isArray(prodRes.data)
        ? prodRes.data
        : prodRes.data?.data || [];

      const validProducts = rawProducts.filter(
        (p) => p.is_active && p.stock_quantity > 0
      );

      setProducts(validProducts);
      setCustomers(custRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Lỗi tải dữ liệu POS");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomerCreated = (newCustomer) => {
    fetchData();
    if (newCustomer) setSelectedCustomer(newCustomer);
    setShowCustomerForm(false);
    toast.success("Đã thêm khách hàng mới");
  };

  // --- CART LOGIC ---
  const addToCart = (product) => {
    const currentInCart =
      cart.find((item) => item.productId === product.id)?.quantity || 0;
    if (currentInCart + 1 > product.stock_quantity) {
      toast.warning(`Chỉ còn ${product.stock_quantity} sản phẩm trong kho!`);
      return;
    }

    setCart((prev) => {
      const existing = prev.find((item) => item.productId === product.id);
      if (existing) {
        return prev.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [
        ...prev,
        {
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          unitPrice: Number(product.price) || 0,
          quantity: 1,
          image: product.image_url,
          stock: product.stock_quantity,
        },
      ];
    });
  };

  const updateQuantity = (productId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.productId === productId) {
            const newQty = Math.max(0, item.quantity + delta);
            if (delta > 0 && newQty > item.stock) {
              toast.warning(`Kho chỉ còn ${item.stock} sản phẩm!`);
              return item;
            }
            return { ...item, quantity: newQty };
          }
          return item;
        })
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setSelectedCustomer(null);
    setDiscountAmount(0);
    setDiscountPercent(0);
    setReceivedAmount(0);
    setPaymentMethod("cash");
  };

  // --- TÍNH TOÁN TIỀN ---
  const subtotal = cart.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );

  // Tính giá trị giảm giá thực tế
  const calculatedDiscount =
    discountType === "percent"
      ? (subtotal * discountPercent) / 100
      : discountAmount;

  // Tính thuế 10%
  const taxRate = settings.tax_rate / 100;
  const taxableAmount = Math.max(0, subtotal - calculatedDiscount);
  const tax = taxableAmount * taxRate;

  // Tổng cộng = (Subtotal - Discount) + Tax
  const total = Math.max(0, subtotal - calculatedDiscount + tax);

  const changeAmount = Math.max(0, receivedAmount - total);

  const formatCurrency = (value) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value || 0);

  // --- HÀM IN HÓA ĐƠN ---
  const handlePrintReceipt = () => {
    printReceipt({
      order: lastOrder,
      items: lastOrderItems,
      settings: settings,
      customerName: selectedCustomer?.name || "Khách lẻ",
      paymentInfo: {
        method: paymentMethod,
        receivedAmount: receivedAmount,
        changeAmount: changeAmount,
      },
    });
  };

  const handlePayment = async () => {
    if (cart.length === 0) return toast.error("Giỏ hàng trống");
    if (paymentMethod === "cash" && receivedAmount < total)
      return toast.error("Tiền khách đưa không đủ");

    setProcessing(true);
    try {
      const payload = {
        customer_id: selectedCustomer?.id || null,
        items: cart.map((item) => ({
          product_id: item.productId,
          quantity: item.quantity,
          unit_price: item.unitPrice,
          name: item.productName,
          sku: item.sku,
        })),
        discount: calculatedDiscount,
        payment_method: paymentMethod,
        notes: `Bán tại quầy`,
      };

      const { data } = await api.post("/orders", payload);

      setLastOrder(data.order);
      setLastOrderItems([...cart]);

      toast.success("Thanh toán thành công!");
      setShowPaymentDialog(false);
      setShowReceipt(true);

      // clearCart();
      fetchData();
    } catch (error) {
      console.error("Payment error:", error);
      toast.error(error.response?.data?.message || "Lỗi thanh toán");
    } finally {
      setProcessing(false);
    }
  };

  const handleCloseReceipt = () => {
    setShowReceipt(false);
    clearCart();
  };

  const filteredProducts = products.filter(
    (p) =>
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col md:flex-row gap-4">
      {/* LEFT: PRODUCTS GRID */}
      <div className="flex-1 flex flex-col gap-4 h-full min-h-0">
        <div className="flex flex-row gap-4 justify-between items-center bg-white p-4 rounded-lg shadow-sm border">
          <Input
            placeholder="Tìm tên, SKU, barcode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search size={20} />}
          />
          <Button
            variant="outline"
            size="icon"
            onClick={fetchData}
            disabled={loading}
          >
            <RotateCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        <ScrollArea className="flex-1 border rounded-md bg-white p-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <Card
                key={product.id}
                className="p-3 cursor-pointer hover:shadow-lg transition-all border-gray-300 active:scale-98 flex flex-col"
                onClick={() => addToCart(product)}
              >
                <div className="aspect-square bg-gray-200 rounded flex items-center justify-center overflow-hidden relative border">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover"
                      onError={(e) => (e.target.style.display = "none")}
                    />
                  ) : (
                    <Package className="h-16 w-16 text-gray-400" />
                  )}
                  <div className="absolute top-1 right-1">
                    <Badge
                      variant={
                        product.stock_quantity <= product.min_stock
                          ? "destructive"
                          : "default"
                      }
                      className="text-xs shadow-sm"
                    >
                      SL: {product.stock_quantity}
                    </Badge>
                  </div>
                </div>
                <h3
                  className="text-sm font-medium text-gray-900 line-clamp-2"
                  title={product.name}
                >
                  {product.name}
                </h3>
                <div className="flex flex-col lg:flex-row items-center justify-between mt-auto">
                  <span className="text-xs text-gray-600 font-mono">
                    {product.sku}
                  </span>
                  <span className="font-bold text-emerald-600">
                    {formatCurrency(product.price)}
                  </span>
                </div>
              </Card>
            ))}
            {filteredProducts.length === 0 && !loading && (
              <div className="col-span-full text-center py-20 text-gray-400">
                Không tìm thấy sản phẩm
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* RIGHT: CART SIDEBAR */}
      <Card className="w-full md:w-[340px] xl:w-[380px] flex flex-col h-full shadow-md shrink-0">
        {/* Cart Header */}
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg">Giỏ hàng</CardTitle>
            <Badge variant="secondary">{cart.length} món</Badge>
          </div>
          <div className="flex gap-2">
            <Select
              value={selectedCustomer?.id || "guest"}
              onValueChange={(val) =>
                setSelectedCustomer(
                  val === "guest" ? null : customers.find((c) => c.id === val)
                )
              }
            >
              <SelectTrigger className="flex-1 bg-white text-sm">
                <SelectValue placeholder="Khách lẻ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="guest">
                  <span className="text-gray-600 flex items-center gap-2">
                    <User className="h-3 w-3" /> Khách lẻ
                  </span>
                </SelectItem>
                {customers.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} - {c.phone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="icon"
              variant="outline"
              onClick={() => setShowCustomerForm(true)}
            >
              <UserPlus className="h-4 w-4 text-blue-600" />
            </Button>
          </div>
        </CardHeader>

        {/* Cart Items */}
        <ScrollArea className="flex-1 px-4 bg-white">
          <div className="space-y-2">
            {cart.length === 0 ? (
              <div className="h-40 flex flex-col items-center justify-center text-gray-400">
                <ShoppingCart className="h-12 w-12 mb-2 opacity-20" />
                <p className="text-sm">Giỏ hàng đang trống</p>
              </div>
            ) : (
              cart.map((item) => (
                <div
                  key={item.productId}
                  className="flex gap-2 p-2 border rounded-lg hover:bg-gray-50 transition-colors relative"
                >
                  {/* Ảnh sản phẩm */}
                  <div className="w-14 h-14 bg-gray-100 rounded-md overflow-hidden border shrink-0">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.productName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-6 w-6 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Thông tin sản phẩm */}
                  <div className="flex-1 min-w-0 flex flex-col">
                    {/* Tên và nút xóa */}
                    <div className="flex items-start gap-1 pr-10">
                      <h4
                        className="text-sm font-medium text-gray-900 line-clamp-2 leading-tight flex-1 wrap-break-word"
                        style={{ wordBreak: "break-word" }}
                        title={item.productName}
                      >
                        {item.productName}
                      </h4>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromCart(item.productId);
                        }}
                        className="absolute right-2 top-3 text-gray-600 hover:text-rose-600"
                        title="Xóa"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Giá */}
                    <div className="text-xs text-gray-600 mt-1">
                      {formatCurrency(item.unitPrice)}
                    </div>

                    {/* Quantity và Total */}
                    <div className="flex items-center justify-between mt-auto pt-1">
                      {/* Tăng giảm */}
                      <div className="flex items-center border border-gray-200 bg-white h-5">
                        <button
                          className="px-2 hover:bg-gray-200 h-full flex items-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(item.productId, -1);
                          }}
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-8 text-center text-xs font-semibold text-gray-900 select-none">
                          {item.quantity}
                        </span>
                        <button
                          className="px-2 hover:bg-gray-200 h-full flex items-center"
                          onClick={(e) => {
                            e.stopPropagation();
                            updateQuantity(item.productId, 1);
                          }}
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>

                      {/* Tổng tiền */}
                      <div className="text-sm font-bold text-emerald-600">
                        {formatCurrency(item.unitPrice * item.quantity)}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-200 shadow-inner space-y-3">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Tạm tính</span>
              <span className="font-medium">{formatCurrency(subtotal)}</span>
            </div>

            <span className="text-gray-600 shrink-0">Giảm giá:</span>
            <div className="flex items-center justify-between text-sm gap-2 mt-1">
              {/* Toggle % / VNĐ */}
              <div className="flex items-center gap-3 shrink-0">
                <Button
                  size="sm"
                  variant={discountType === "percent" ? "default" : "outline"}
                  className="h-7 w-8 px-0 text-xs"
                  onClick={() => setDiscountType("percent")}
                >
                  %
                </Button>
                <Button
                  size="sm"
                  variant={discountType === "amount" ? "default" : "outline"}
                  className="h-7 px-2 text-xs"
                  onClick={() => setDiscountType("amount")}
                >
                  VNĐ
                </Button>

                {/* Input */}
                <Input
                  type="number"
                  className="h-7 text-center text-sm w-full"
                  value={
                    discountType === "percent"
                      ? discountPercent
                      : discountAmount
                  }
                  onChange={(e) => {
                    const val = Math.max(0, Number(e.target.value));
                    if (discountType === "percent") {
                      setDiscountPercent(Math.min(100, val));
                    } else {
                      setDiscountAmount(Math.min(subtotal, val));
                    }
                  }}
                  placeholder="0"
                  min="0"
                  max={discountType === "percent" ? "100" : subtotal}
                />
              </div>

              {/* Tiền giảm */}
              <span className="text-sm font-medium text-rose-600">
                -{formatCurrency(calculatedDiscount)}
              </span>
            </div>

            <div className="flex justify-between text-sm">
              <span className="text-slate-600">
                Thuế ({settings.tax_rate}%):
              </span>
              <span className="font-medium">{formatCurrency(tax)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 mt-2">
              <span className="text-base font-bold text-gray-900">
                TỔNG CỘNG
              </span>
              <span className="text-xl font-bold text-emerald-600">
                {formatCurrency(total)}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              className="border-rose-100 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
              onClick={clearCart}
              disabled={cart.length === 0}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              variant="default"
              onClick={() => setShowPaymentDialog(true)}
              disabled={cart.length === 0}
            >
              <CreditCard className="mr-1 h-4 w-4" />
              Thanh toán
            </Button>
          </div>
        </div>
      </Card>

      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Xác nhận thanh toán</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-emerald-50 rounded-lg flex justify-between items-center border border-emerald-200">
              <span className="text-emerald-600 font-medium">
                Tổng thanh toán
              </span>
              <span className="text-2xl font-bold text-emerald-700">
                {formatCurrency(total)}
              </span>
            </div>
            {/* Payment methods... */}
            <div className="grid grid-cols-3 gap-4">
              <Button
                variant={paymentMethod === "cash" ? "default" : "outline"}
                onClick={() => setPaymentMethod("cash")}
                className="h-16 flex-col gap-1"
              >
                <Banknote className="h-4 w-4" /> Tiền mặt
              </Button>
              <Button
                variant={paymentMethod === "transfer" ? "default" : "outline"}
                onClick={() => setPaymentMethod("transfer")}
                className="h-16 flex-col gap-1"
              >
                <Smartphone className="h-4 w-4" /> Chuyển khoản
              </Button>
              <Button
                variant={paymentMethod === "card" ? "default" : "outline"}
                onClick={() => setPaymentMethod("card")}
                className="h-16 flex-col gap-1"
              >
                <CreditCard className="h-4 w-4" /> Thẻ
              </Button>
            </div>
            {paymentMethod === "cash" && (
              <div className="space-y-2 bg-gray-100 p-4 rounded border">
                <Label>Tiền khách đưa</Label>
                <Input
                  type="number"
                  value={receivedAmount}
                  onChange={(e) => setReceivedAmount(Number(e.target.value))}
                  className="text-center font-bold"
                />
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tiền thừa:</span>
                  <span className="font-bold text-emerald-600">
                    {formatCurrency(changeAmount)}
                  </span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowPaymentDialog(false)}
            >
              Quay lại
            </Button>
            <Button
              onClick={handlePayment}
              disabled={processing}
              variant="default"
            >
              {processing ? "Đang xử lý..." : "Xác nhận"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-sm text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-emerald-100 rounded-full">
              <CheckCircle className="h-10 w-10 text-emerald-600" />
            </div>
          </div>
          <DialogTitle className="text-center text-xl text-emerald-600">
            Thanh toán thành công!
          </DialogTitle>
          <DialogFooter className="justify-center gap-2 mt-4">
            <Button variant="outline" onClick={handleCloseReceipt}>
              Đóng
            </Button>
            <Button onClick={handlePrintReceipt}>
              <Printer className="mr-1 h-4 w-4" /> In hóa đơn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CustomerFormDialog
        open={showCustomerForm}
        onOpenChange={setShowCustomerForm}
        onSuccess={handleCustomerCreated}
      />
    </div>
  );
}
