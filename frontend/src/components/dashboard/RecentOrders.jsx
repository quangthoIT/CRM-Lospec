import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowRight } from "lucide-react";

export function RecentOrders({ orders = [] }) {
  const navigate = useNavigate();

  const formatCurrency = (val) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val || 0);

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Đơn hàng mới nhất</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="text-sm text-blue-600"
          onClick={() => navigate("/pos")}
        >
          Xem tất cả <ArrowRight className="ml-1 h-3 w-3" />
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <Table className="bg-white border border-gray-200 shadow-lg">
          <TableHeader>
            <TableRow className="bg-gray-200">
              <TableHead>Mã đơn</TableHead>
              <TableHead className="text-center">Khách hàng</TableHead>
              <TableHead className="text-right">Tổng tiền</TableHead>
              <TableHead className="text-center">Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.length > 0 ? (
              orders.map((order) => (
                <TableRow key={order.id} className="hover:bg-gray-100">
                  <TableCell className="font-mono font-medium text-xs">
                    {order.order_number}
                  </TableCell>
                  <TableCell className="text-sm text-center">
                    {order.customer_name || "Khách lẻ"}
                  </TableCell>
                  <TableCell className="text-right font-bold text-emerald-600 text-sm">
                    {formatCurrency(order.total)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant="secondary"
                      className="text-[10px] bg-emerald-100 text-emerald-700 shadow-none"
                    >
                      Hoàn thành
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-6 text-slate-500 text-sm"
                >
                  Chưa có đơn hàng nào
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
