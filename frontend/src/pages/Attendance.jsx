import { useState, useEffect } from "react";
import api from "../config/api";
import { useAuth } from "../context/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { LogIn, LogOut, Clock, CheckCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

// --- COMPONENT CHÍNH ---
const Attendance = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("my-attendance");

  return (
    <div className="mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Chấm công</h1>
        <p className="text-gray-600">Quản lý giờ làm việc và lịch sử ra vào</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 max-w-[400px]">
          <TabsTrigger value="my-attendance">Cá nhân</TabsTrigger>
          {/* Chỉ Admin/Manager mới thấy Tab này */}
          {["admin", "manager"].includes(user?.role) && (
            <TabsTrigger value="all-staff">Bảng công toàn bộ</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="my-attendance" className="mt-4 space-y-6">
          <MyAttendanceSection />
        </TabsContent>

        <TabsContent value="all-staff" className="mt-4">
          <AllStaffAttendanceSection />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// --- PHẦN 1: CHẤM CÔNG CÁ NHÂN ---
function MyAttendanceSection() {
  const [history, setHistory] = useState([]);
  const [todayStatus, setTodayStatus] = useState("loading"); // "none", "checked-in", "completed"
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMyHistory();
  }, []);

  const fetchMyHistory = async () => {
    try {
      const { data } = await api.get("/users/attendance/my-history");
      setHistory(data || []);

      // Lấy bản ghi mới nhất
      // (Giả sử API trả về sắp xếp giảm dần theo thời gian, bản ghi đầu tiên là mới nhất)
      const latestRecord = data && data.length > 0 ? data[0] : null;

      if (latestRecord && !latestRecord.check_out) {
        // Nếu có bản ghi chưa check-out -> Đang trong ca
        setTodayStatus("checked-in");
      } else if (latestRecord) {
        // Nếu bản ghi mới nhất đã check-out, kiểm tra xem có phải hôm nay không
        const recordDate = new Date(latestRecord.date).toDateString();
        const todayDate = new Date().toDateString();

        if (recordDate === todayDate) {
          setTodayStatus("completed");
        } else {
          setTodayStatus("none");
        }
      } else {
        setTodayStatus("none");
      }
    } catch (error) {
      console.error(error);
      setTodayStatus("none");
    }
  };

  const handleAction = async (type) => {
    setLoading(true);
    try {
      const endpoint =
        type === "in"
          ? "/users/attendance/check-in"
          : "/users/attendance/check-out";
      await api.post(endpoint);
      toast.success(
        type === "in" ? "Check-in thành công!" : "Check-out thành công!"
      );

      // Reload lại dữ liệu ngay lập tức
      await fetchMyHistory();
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi chấm công");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-between gap-6">
      {/* Widget Chấm công */}
      <Card>
        <CardHeader>
          <CardTitle>Điểm danh hôm nay</CardTitle>
          <CardDescription>
            {new Date().toLocaleDateString("vi-VN", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center gap-4">
          <div className="text-4xl font-bold text-gray-900">
            {new Date().toLocaleTimeString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>

          {todayStatus === "none" && (
            <Button
              size="lg"
              variant="default"
              onClick={() => handleAction("in")}
              disabled={loading}
            >
              {loading ? (
                <RefreshCw className="mr-1 h-5 w-5 animate-spin" />
              ) : (
                <LogIn className="mr-1 h-5 w-5" />
              )}
              Vào Ca (Check In)
            </Button>
          )}

          {todayStatus === "checked-in" && (
            <div className="w-full space-y-3">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-md text-center text-sm font-medium animate-pulse border border-blue-100">
                Bạn đang trong ca làm việc...
              </div>
              <Button
                size="lg"
                variant="default"
                className="bg-rose-600 hover:bg-rose-700 w-full"
                onClick={() => handleAction("out")}
                disabled={loading}
              >
                {loading ? (
                  <RefreshCw className="mr-1 h-5 w-5 animate-spin" />
                ) : (
                  <LogOut className="mr-1 h-5 w-5" />
                )}
                Kết Ca (Check Out)
              </Button>
            </div>
          )}

          {todayStatus === "completed" && (
            <div className="w-full p-3 bg-emerald-50 text-emerald-600 rounded-lg text-center font-medium flex flex-col items-center gap-2 border border-emerald-200">
              <CheckCircle className="h-6 w-6" />
              <span>Đã hoàn thành công việc hôm nay</span>
              <Button variant="default" onClick={() => handleAction("in")}>
                Vào ca mới
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lịch sử cá nhân */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Lịch sử chấm công</CardTitle>
        </CardHeader>
        <CardContent>
          <Table className="bg-white border border-gray-200 shadow-lg">
            <TableHeader>
              <TableRow className="bg-gray-200">
                <TableHead className="text-center">Ngày</TableHead>
                <TableHead className="text-center">Giờ vào</TableHead>
                <TableHead className="text-center">Giờ ra</TableHead>
                <TableHead className="text-center">Tổng giờ</TableHead>
                <TableHead className="text-center">Trạng thái</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="text-center py-4 text-gray-500"
                  >
                    Chưa có dữ liệu chấm công
                  </TableCell>
                </TableRow>
              ) : (
                history.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium text-center">
                      {new Date(item.date).toLocaleDateString("vi-VN")}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.check_in
                        ? new Date(item.check_in).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "--:--"}
                    </TableCell>
                    <TableCell className="text-center">
                      {item.check_out
                        ? new Date(item.check_out).toLocaleTimeString("vi-VN", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })
                        : "--:--"}
                    </TableCell>
                    <TableCell className="font-bold text-gray-700 text-center">
                      {item.work_hours ? `${item.work_hours}h` : "-"}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant="outline"
                        className="bg-emerald-50 text-emerald-700 border-emerald-200"
                      >
                        Có mặt
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// --- PHẦN 2: BẢNG CÔNG TOÀN BỘ (ADMIN/MANAGER) ---
function AllStaffAttendanceSection() {
  const [logs, setLogs] = useState([]);
  const [dateFilter, setDateFilter] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, [dateFilter]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(
        `/users/attendance/all?date=${dateFilter}`
      );
      setLogs(data || []);
    } catch (error) {
      console.error(error);
      toast.error("Lỗi tải bảng công");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row justify-between">
        <div>
          <CardTitle>Bảng chấm công nhân viên</CardTitle>
          <CardDescription>
            Theo dõi giờ làm việc của toàn bộ nhân viên
          </CardDescription>
        </div>

        <div className="flex items-center gap-2 whitespace-nowrap">
          <p className="text-sm font-medium">Chọn ngày:</p>
          <Input
            type="date"
            className="w-40"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />
        </div>
      </CardHeader>
      <CardContent>
        <Table className="bg-white border border-gray-200 shadow-lg">
          <TableHeader>
            <TableRow className="bg-gray-200">
              <TableHead>Nhân viên</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-center">Giờ vào</TableHead>
              <TableHead className="text-center">Giờ ra</TableHead>
              <TableHead className="text-center">Giờ làm</TableHead>
              <TableHead className="text-center">Trạng thái</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-600" />
                </TableCell>
              </TableRow>
            ) : logs.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-gray-500"
                >
                  Không có dữ liệu chấm công cho ngày này
                </TableCell>
              </TableRow>
            ) : (
              logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">{log.full_name}</TableCell>
                  <TableCell className="text-gray-500 text-sm">
                    {log.email}
                  </TableCell>
                  <TableCell className="text-center">
                    {log.check_in
                      ? new Date(log.check_in).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "--"}
                  </TableCell>
                  <TableCell className="text-center">
                    {log.check_out
                      ? new Date(log.check_out).toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "--"}
                  </TableCell>
                  <TableCell className="text-center font-bold">
                    {`${log.work_hours}h` || "-"}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className="bg-emerald-50 text-emerald-600 border-emerald-600 shadow-none">
                      Có mặt
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default Attendance;
