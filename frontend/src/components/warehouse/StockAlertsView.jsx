import { useState, useEffect } from "react";
import api from "../../config/api";
import { Card } from "@/components/ui/card";
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
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/products");
      setProducts(data || []);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Lỗi khi tải dữ liệu tồn kho");
    } finally {
      setLoading(false);
    }
  };

  const getAlertLevel = (quantity, minStock) => {
    const threshold = minStock !== null ? minStock : 10;
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

  const alertItems = products.filter((p) => {
    const threshold = p.min_stock !== null ? p.min_stock : 10;
    return (p.stock_quantity || 0) <= threshold;
  });

  const criticalItems = alertItems.filter((p) => (p.stock_quantity || 0) === 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 flex flex-row items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-slate-700 font-medium">Tổng sản phẩm</p>
            <p className="text-2xl font-bold text-slate-800">
              {products.length}
            </p>
          </div>
          <div className="p-3 bg-slate-100 rounded-full">
            <Package className="h-6 w-6 text-slate-500" />
          </div>
        </Card>

        <Card className="p-4 bg-yellow-50 border-yellow-100 flex flex-row items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-yellow-700 font-medium">Cần nhập hàng</p>
            <p className="text-2xl font-bold text-yellow-700">
              {alertItems.length}
            </p>
          </div>
          <div className="p-3 bg-yellow-100 rounded-full">
            <AlertTriangle className="h-6 w-6 text-yellow-700" />
          </div>
        </Card>

        <Card className="p-4 bg-rose-50 border-rose-100 flex flex-row items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-rose-700 font-medium">Hết hàng</p>
            <p className="text-2xl font-bold text-rose-600">
              {criticalItems.length}
            </p>
          </div>
          <div className="p-3 bg-rose-100 rounded-full">
            <AlertCircle className="h-6 w-6 text-rose-600" />
          </div>
        </Card>
      </div>

      <Card className="overflow-hidden border-slate-200">
        <div className="p-4 border-b bg-white">
          <h3 className="font-semibold text-slate-800 text-lg">
            Danh sách cảnh báo tồn kho
          </h3>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500">
            Đang tải dữ liệu...
          </div>
        ) : alertItems.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <div className="p-4 bg-emerald-50 rounded-full mb-3">
              <CheckCircle className="h-12 w-12 text-emerald-500" />
            </div>
            <h3 className="text-lg font-medium text-emerald-700">
              Kho hàng ổn định
            </h3>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead>SKU</TableHead>
                <TableHead>Sản phẩm</TableHead>
                <TableHead className="text-center">Tồn hiện tại</TableHead>
                <TableHead className="text-center">Tồn tối thiểu</TableHead>
                <TableHead className="text-center">Thiếu hụt</TableHead>
                <TableHead>Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alertItems.map((p) => {
                const minStock = p.min_stock || 10;
                const alert = getAlertLevel(p.stock_quantity, minStock);
                const Icon = alert.icon;
                const shortage = Math.max(
                  0,
                  minStock - (p.stock_quantity || 0)
                );

                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-mono text-xs">{p.sku}</TableCell>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-center font-bold">
                      {p.stock_quantity}
                    </TableCell>
                    <TableCell className="text-center text-slate-500">
                      {minStock}
                    </TableCell>
                    <TableCell className="text-center text-rose-600 font-medium">
                      -{shortage}
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${alert.color} border-0 flex w-fit items-center gap-1`}
                      >
                        <Icon className="h-3 w-3" /> {alert.label}
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
