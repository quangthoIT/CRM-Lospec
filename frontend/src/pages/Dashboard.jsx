import { useState, useEffect } from "react";
import api from "../config/api";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Import các components con
import { DashboardStats } from "../components/dashboard/DashboardStats";
import { QuickActions } from "../components/dashboard/QuickActions";
import { RecentOrders } from "../components/dashboard/RecentOrders";
import { LowStockAlert } from "../components/dashboard/LowStockAlert";

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, ordersRes, alertsRes] = await Promise.all([
        api.get("/reports/dashboard"),
        api.get("/orders"),
        api.get("/warehouse/alerts"),
      ]);

      setStats(statsRes.data);
      setRecentOrders(ordersRes.data.slice(0, 5));
      setLowStockItems(alertsRes.data.slice(0, 5));
    } catch (error) {
      console.error("Dashboard fetch error:", error);
      // toast.error("Không thể tải dữ liệu tổng quan");
    } finally {
      setLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="h-[calc(100vh-80px)] flex items-center justify-center text-slate-500">
        Đang tải dữ liệu tổng quan...
      </div>
    );
  }

  return (
    <div className="mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Tổng quan</h1>
        <p className="text-gray-600">
          Hôm nay là{" "}
          {format(new Date(), "EEEE, 'ngày' d 'tháng' M 'năm' yyyy", {
            locale: vi,
          })}
        </p>
      </div>

      {/* 2. THỐNG KÊ HÔM NAY */}
      <DashboardStats stats={stats} />

      {/* 3. MAIN CONTENT GRID */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* LEFT COLUMN: QUICK ACTIONS & RECENT ORDERS (Span 4) */}
        <div className="col-span-4 space-y-4 mt-4">
          <QuickActions />
          <RecentOrders orders={recentOrders} />
        </div>

        {/* RIGHT COLUMN: LOW STOCK & INFO (Span 3) */}
        <div className="col-span-3 space-y-4 mt-4">
          <LowStockAlert items={lowStockItems} />
        </div>
      </div>
    </div>
  );
}
