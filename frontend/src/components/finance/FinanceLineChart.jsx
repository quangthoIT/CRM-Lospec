import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

// Helper định dạng tiền tệ (nội bộ component để tránh lỗi import)
const formatCurrency = (value) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(value);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white border border-gray-200 rounded-md shadow-lg p-3">
      <p className="font-medium text-gray-900 mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center gap-2 text-sm">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600">{entry.name}:</span>
          <span className="font-semibold" style={{ color: entry.color }}>
            {formatCurrency(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

export function FinanceLineChart({ data, loading }) {
  if (loading) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-gray-50 rounded-lg border border-dashed">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-3"></div>
          <p className="text-gray-500 text-sm">Đang tải biểu đồ...</p>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center bg-gray-50 rounded-lg border border-dashed">
        <div className="text-center">
          <p className="text-gray-400 text-sm">
            Chưa có dữ liệu trong khoảng thời gian này
          </p>
        </div>
      </div>
    );
  }

  const chartData = data.map((item) => ({
    date: item.date,
    "Doanh thu": Number(item.income),
    "Chi phí": Number(item.expense),
    "Lợi nhuận": Number(item.net),
  }));

  return (
    <div className="w-full h-[400px] bg-white p-4 rounded-lg border shadow-sm my-4">
      <h3 className="text-lg font-semibold text-slate-800 mb-4 px-2">
        Biểu đồ dòng tiền
      </h3>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e5e7eb"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            stroke="#6b7280"
            style={{ fontSize: "12px" }}
            tickLine={false}
            axisLine={false}
            dy={10}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: "12px" }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => {
              if (value >= 1000000000)
                return `${(value / 1000000000).toFixed(1)}B`;
              if (value >= 1000000) return `${(value / 1000000).toFixed(0)}M`;
              if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
              return value;
            }}
          />
          <Tooltip
            content={<CustomTooltip />}
            cursor={{
              stroke: "#9ca3af",
              strokeWidth: 1,
              strokeDasharray: "4 4",
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: "14px", paddingTop: "20px" }}
            iconType="circle"
          />
          <Line
            type="monotone"
            dataKey="Doanh thu"
            stroke="#10b981" // Emerald-500
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
          <Line
            type="monotone"
            dataKey="Chi phí"
            stroke="#f43f5e" // Rose-500
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
          <Line
            type="monotone"
            dataKey="Lợi nhuận"
            stroke="#3b82f6" // Blue-500
            strokeWidth={3}
            dot={false}
            activeDot={{ r: 6, strokeWidth: 0 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
