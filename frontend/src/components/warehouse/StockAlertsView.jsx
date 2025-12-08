import { useState, useEffect } from "react";
import api from "../../config/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertTriangle, AlertCircle, CheckCircle, Package } from "lucide-react";
import { toast } from "sonner";

export function StockAlertsView() {
  const [allProducts, setAllProducts] = useState([]);
  const [alertProducts, setAlertProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Lấy cả 2: tất cả sản phẩm + sản phẩm cảnh báo
      const [allRes, alertRes] = await Promise.all([
        api.get("/products"),
        api.get("/warehouse/alerts"),
      ]);

      setAllProducts(Array.isArray(allRes.data) ? allRes.data : []);
      setAlertProducts(Array.isArray(alertRes.data) ? alertRes.data : []);

      console.log("📦 All Products:", allRes.data);
      console.log("⚠️ Alert Products:", alertRes.data);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Lỗi khi tải dữ liệu tồn kho");
      setAllProducts([]);
      setAlertProducts([]);
    } finally {
      setLoading(false);
    }
  };

  const getAlertLevel = (quantity, minStock) => {
    const threshold =
      minStock !== null && minStock !== undefined ? minStock : 10;
    if (quantity === 0)
      return {
        level: "critical",
        label: "Hết hàng",
        icon: AlertCircle,
        color: "bg-rose-100 text-rose-700",
      };
    if (quantity <= threshold)
      return {
        level: "warning",
        label: "Sắp hết",
        icon: AlertTriangle,
        color: "bg-amber-100 text-amber-700",
      };
    return {
      level: "ok",
      label: "Bình thường",
      icon: CheckCircle,
      color: "bg-emerald-100 text-emerald-700",
    };
  };

  const criticalItems = alertProducts.filter(
    (p) => (p.stock_quantity || 0) === 0
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 bg-gray-100 border-gray-300 flex flex-row items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-gray-900 font-medium">Tổng sản phẩm</p>
            <p className="text-3xl font-bold text-gray-900">
              {allProducts.length}
            </p>
          </div>
          <div className="p-3 bg-gray-200 rounded-full">
            <Package className="h-6 w-6 text-gray-600" />
          </div>
        </Card>

        <Card className="p-4 bg-yellow-100 border-yellow-300 flex flex-row items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-yellow-700 font-medium">Cần nhập hàng</p>
            <p className="text-3xl font-bold text-yellow-700">
              {alertProducts.length}
            </p>
          </div>
          <div className="p-3 bg-yellow-200 rounded-full">
            <AlertTriangle className="h-6 w-6 text-yellow-700" />
          </div>
        </Card>

        <Card className="p-4 bg-rose-100 border-rose-300 flex flex-row items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-rose-700 font-medium">Hết hàng</p>
            <p className="text-3xl font-bold text-rose-700">
              {criticalItems.length}
            </p>
          </div>
          <div className="p-3 bg-rose-200 rounded-full">
            <AlertCircle className="h-6 w-6 text-rose-700" />
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden border-gray-200">
        <CardHeader>
          <CardTitle>Danh sách cảnh báo tồn kho</CardTitle>
        </CardHeader>

        {loading ? (
          <div className="p-8 text-center text-gray-600">
            Đang tải dữ liệu...
          </div>
        ) : alertProducts.length === 0 ? (
          <div className="p-8 text-center flex flex-col items-center">
            <div className="p-4 bg-emerald-100 rounded-full mb-3">
              <CheckCircle className="h-12 w-12 text-emerald-600" />
            </div>
            <h3 className="text-xl font-medium text-emerald-600">
              Kho hàng ổn định
            </h3>
            <p className="text-sm text-gray-500 mt-2">
              Tổng {allProducts.length} sản phẩm - Không có cảnh báo tồn kho
            </p>
          </div>
        ) : (
          <CardContent>
            <Table className="bg-white border border-gray-200 shadow-lg">
              <TableHeader>
                <TableRow className="bg-gray-200">
                  <TableHead>SKU</TableHead>
                  <TableHead>Sản phẩm</TableHead>
                  <TableHead className="text-center">Tồn hiện tại</TableHead>
                  <TableHead className="text-center">Tồn tối thiểu</TableHead>
                  <TableHead className="text-center">Thiếu hụt</TableHead>
                  <TableHead className="text-center">Trạng thái</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alertProducts.map((p) => {
                  const minStock = p.min_stock || 10;
                  const alert = getAlertLevel(p.stock_quantity, minStock);
                  const Icon = alert.icon;
                  const shortage = Math.max(
                    0,
                    minStock - (p.stock_quantity || 0)
                  );

                  return (
                    <TableRow key={p.id} className="hover:bg-gray-100">
                      <TableCell className="font-mono text-xs">
                        {p.sku}
                      </TableCell>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="text-center text-emerald-600 font-medium">
                        {p.stock_quantity || 0}
                      </TableCell>
                      <TableCell className="text-center text-gray-600">
                        {minStock}
                      </TableCell>
                      <TableCell className="text-center text-rose-600 font-medium">
                        -{shortage}
                      </TableCell>
                      <TableCell className="flex justify-center">
                        <Badge
                          className={`${alert.color} border-none flex w-fit items-center gap-1`}
                        >
                          <Icon className="h-3 w-3" /> {alert.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
