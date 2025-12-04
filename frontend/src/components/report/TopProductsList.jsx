import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package } from "lucide-react";

export function TopProductsList({ data }) {
  return (
    <Card className="col-span-8 lg:col-span-3 shadow-sm flex flex-col">
      <CardHeader>
        <CardTitle>Top sản phẩm bán chạy</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto pr-2">
        <div className="space-y-4">
          {data.length > 0 ? (
            data.map((prod, idx) => (
              <div
                key={prod.product_id}
                className="flex items-center p-3 bg-gray-100 rounded-lg border border-gray-100 hover:bg-gray-200 transition-colors"
              >
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold text-xs ${
                    idx === 0
                      ? "bg-yellow-200 text-yellow-700"
                      : idx === 1
                      ? "bg-orange-200 text-orange-700"
                      : idx === 2
                      ? "bg-gray-300 text-gray-700"
                      : "bg-white border text-gray-600"
                  }`}
                >
                  #{idx + 1}
                </div>
                <div className="ml-4 space-y-1 flex-1 min-w-0">
                  <p
                    className="text-sm font-medium leading-none truncate"
                    title={prod.name}
                  >
                    {prod.name}
                  </p>
                  <p className="text-xs text-gray-400 font-mono">{prod.sku}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-sm font-bold text-gray-700">
                    {prod.sold_quantity}
                  </p>
                  <p className="text-xs text-gray-600">đã bán</p>
                </div>
              </div>
            ))
          ) : (
            <div className="h-[300px] flex flex-col items-center justify-center text-gray-400 gap-2">
              <Package className="h-8 w-8 opacity-50" />
              <p>Chưa có dữ liệu bán hàng</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
