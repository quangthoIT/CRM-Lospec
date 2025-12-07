import { useState, useEffect } from "react";
import api from "../config/api";
import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";

// Import các components con đã tách
import { ReportFilter } from "../components/report/ReportFilter";
import { ReportStatsCards } from "../components/report/ReportStatsCards";
import { RevenueChart } from "../components/report/RevenueChart";
import { TopProductsList } from "../components/report/TopProductsList";
import { Button } from "@/components/ui/button";

export default function ReportPage() {
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // States cho bộ lọc thời gian
  const [filterType, setFilterType] = useState("7days");
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 7))
      .toISOString()
      .split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });

  useEffect(() => {
    fetchAllData();
  }, [dateRange]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const queryParams = `?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;

      const [statsRes, chartRes, topRes] = await Promise.all([
        api.get(`/reports/dashboard${queryParams}`),
        api.get(`/reports/chart${queryParams}`),
        api.get(`/reports/top-products${queryParams}`),
      ]);

      setStats(statsRes.data);
      setChartData(chartRes.data);
      setTopProducts(topRes.data);
    } catch (error) {
      console.error("Lỗi tải báo cáo:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const queryParams = `?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;

      // Gọi API với responseType là blob để nhận file
      const response = await api.get(`/reports/export${queryParams}`, {
        responseType: "blob",
      });

      // Tạo link ảo để tải xuống
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      // Đặt tên file
      link.setAttribute(
        "download",
        `BaoCao_${dateRange.startDate}_${dateRange.endDate}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success("Đã xuất báo cáo thành công!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Lỗi khi xuất báo cáo");
    } finally {
      setExporting(false);
    }
  };

  if (loading && !stats) {
    return (
      <div className="h-[calc(100vh-80px)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto">
      {/* HEADER & FILTER BAR */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Báo cáo & Thống kê
          </h1>
          <p className="text-sm text-gray-600">
            Tổng quan tình hình kinh doanh từ{" "}
            {new Date(dateRange.startDate).toLocaleDateString("vi-VN")} đến{" "}
            {new Date(dateRange.endDate).toLocaleDateString("vi-VN")}
          </p>{" "}
        </div>

        {/* Component Bộ Lọc */}

        <div className="flex gap-2">
          <ReportFilter
            filterType={filterType}
            setFilterType={setFilterType}
            dateRange={dateRange}
            setDateRange={setDateRange}
            onRefresh={fetchAllData}
          />

          <Button variant="default" onClick={handleExport} disabled={exporting}>
            {exporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            Xuất Excel (CSV)
          </Button>
        </div>
      </div>

      {/* 1. THỐNG KÊ TỔNG QUAN */}
      <ReportStatsCards stats={stats} />

      {/* 2. BIỂU ĐỒ & TOP SẢN PHẨM */}
      <div className="grid gap-4 md:grid-cols-8 h-auto mt-4">
        {/* Biểu đồ doanh thu */}
        <RevenueChart data={chartData} />

        {/* Top sản phẩm bán chạy */}
        <TopProductsList data={topProducts} />
      </div>
    </div>
  );
}
