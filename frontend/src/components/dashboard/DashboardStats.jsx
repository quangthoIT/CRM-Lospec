import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  ShoppingCart,
  Users,
  AlertTriangle,
  TrendingUp,
  Package,
} from "lucide-react";

export function DashboardStats({ stats }) {
  const formatCurrency = (val) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val || 0);

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="border-l-4 border-l-emerald-600 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-medium text-gray-700">
            Doanh thu hôm nay
          </CardTitle>
          <div className="h-8 w-8 rounded-full bg-emerald-100 flex items-center justify-center">
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {formatCurrency(stats?.today?.revenue)}
          </div>
          <p className="text-xs text-gray-600 mt-1">
            Đang cập nhật theo thời gian thực
          </p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-blue-500 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-medium text-gray-700">
            Đơn hàng hôm nay
          </CardTitle>
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
            <ShoppingCart className="h-4 w-4 text-blue-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            {stats?.today?.orders} đơn
          </div>
          <p className="text-xs text-gray-600 mt-1">Đã hoàn thành thanh toán</p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-orange-500 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-medium text-gray-700">
            Khách hàng mới
          </CardTitle>
          <div className="h-8 w-8 rounded-full bg-orange-100 flex items-center justify-center">
            <Users className="h-4 w-4 text-orange-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-gray-900">
            +{stats?.newCustomers}
          </div>
          <p className="text-xs text-gray-600 mt-1">Trong tháng này</p>
        </CardContent>
      </Card>

      <Card className="border-l-4 border-l-rose-500 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg font-medium text-gray-700">
            Cảnh báo tồn kho
          </CardTitle>
          <div className="h-8 w-8 rounded-full bg-rose-100 flex items-center justify-center">
            <AlertTriangle className="h-4 w-4 text-rose-600" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-rose-600">
            {stats?.lowStock} sản phẩm
          </div>
          <p className="text-xs text-gray-600 mt-1">Cần nhập hàng bổ sung</p>
        </CardContent>
      </Card>
    </div>
  );
}
