import { useNavigate } from "react-router-dom";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, CheckCircle, Package } from "lucide-react";

export function LowStockAlert({ items = [] }) {
  const navigate = useNavigate();

  return (
    <Card className="shadow-sm border-rose-100 h-full">
      <CardHeader>
        <CardTitle className="font-bold flex items-center gap-2 text-rose-600">
          <AlertTriangle className="h-5 w-5" /> Cảnh báo tồn kho
        </CardTitle>
        <CardDescription>
          Các sản phẩm dưới định mức cần nhập thêm
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 max-h-[300px] overflow-y-auto">
        <div className="divide-y">
          {items.length > 0 ? (
            items.map((item) => (
              <div
                key={item.id}
                className="p-3 flex items-center justify-between hover:bg-rose-50 transition-colors"
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="h-10 w-10 bg-white border rounded flex items-center justify-center shrink-0">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        className="h-full w-full object-cover"
                        alt={item.name}
                      />
                    ) : (
                      <Package className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-600 font-mono">
                      {item.sku}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-rose-600">
                    {item.stock_quantity}
                  </p>
                  <p className="text-xs text-gray-600">Tồn kho</p>
                </div>
              </div>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500 text-sm">
              <div className="flex justify-center mb-2">
                <CheckCircle className="h-8 w-8 text-emerald-500 opacity-50" />
              </div>
              Tồn kho ổn định
            </div>
          )}
        </div>
        {items.length > 0 && (
          <div className="p-3 border-t bg-gray-50 text-center">
            <Button
              variant="link"
              size="sm"
              className="text-rose-600 h-auto p-0"
              onClick={() => navigate("/warehouses")}
            >
              Xem tất cả & Nhập hàng
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
