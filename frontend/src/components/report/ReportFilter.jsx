import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar as CalendarIcon, Filter } from "lucide-react";

export function ReportFilter({
  filterType,
  setFilterType,
  dateRange,
  setDateRange,
  onRefresh,
}) {
  // Xử lý logic chọn nhanh
  const handleFilterChange = (value) => {
    setFilterType(value);
    const end = new Date();
    const start = new Date();

    if (value === "7days") {
      start.setDate(end.getDate() - 7);
    } else if (value === "30days") {
      start.setDate(end.getDate() - 30);
    } else if (value === "thisMonth") {
      start.setDate(1);
    }

    if (value !== "custom") {
      setDateRange({
        startDate: start.toISOString().split("T")[0],
        endDate: end.toISOString().split("T")[0],
      });
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Chọn Preset */}
      <Select value={filterType} onValueChange={handleFilterChange}>
        <SelectTrigger className="w-40 border-gray-200 bg-white">
          <CalendarIcon className="mr-1 h-4 w-4 text-gray-600" />
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="7days">7 ngày qua</SelectItem>
          <SelectItem value="30days">30 ngày qua</SelectItem>
          <SelectItem value="thisMonth">Tháng này</SelectItem>
          <SelectItem value="custom">Tùy chỉnh...</SelectItem>
        </SelectContent>
      </Select>

      {/* Chọn Ngày Tùy Chỉnh */}
      {filterType === "custom" && (
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-gray-200 rounded px-2 py-1">
            <input
              type="date"
              className="text-sm w-32"
              value={dateRange.startDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, startDate: e.target.value })
              }
            />
          </div>
          <span className="text-sm text-gray-400">đến</span>
          <div className="flex items-center bg-white border border-gray-200 rounded px-2 py-1">
            <input
              type="date"
              className="text-sm w-32"
              value={dateRange.endDate}
              onChange={(e) =>
                setDateRange({ ...dateRange, endDate: e.target.value })
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}
