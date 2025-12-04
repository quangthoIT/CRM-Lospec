import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, Users, Package } from "lucide-react";

export function ReportStatsCards({ stats }) {
  const formatCurrency = (val) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val || 0);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg text-gray-700">Doanh thu</CardTitle>
          <div className="p-2 bg-gray-100 rounded-full">
            <DollarSign className="h-4 w-4 text-gray-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-700">
            {formatCurrency(stats?.period?.revenue)}
          </div>
          <p className="text-xs text-gray-600 mt-1">
            {stats?.period?.orders} đơn hàng
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg text-emerald-700">
            Lợi nhuận ước tính
          </CardTitle>
          <div className="p-2 bg-emerald-100 rounded-full">
            <TrendingUp className="h-4 w-4 text-emerald-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-emerald-700">
            {formatCurrency(stats?.period?.profit)}
          </div>
          <p className="text-xs text-gray-600 mt-1">Doanh thu - Giá vốn</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg text-blue-700">
            Khách hàng mới
          </CardTitle>
          <div className="p-2 bg-blue-100 rounded-full">
            <Users className="h-4 w-4 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-700">
            +{stats?.newCustomers}
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Trong khoảng thời gian này
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg text-rose-700">
            Cảnh báo tồn kho
          </CardTitle>
          <div className="p-2 bg-rose-100 rounded-full">
            <Package className="h-4 w-4 text-rose-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-rose-700">
            {stats?.lowStock}
          </div>
          <p className="text-xs text-gray-600 mt-1">Sản phẩm dưới định mức</p>
        </CardContent>
      </Card>
    </div>
  );
}
