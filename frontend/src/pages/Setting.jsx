import { useState, useEffect, useRef } from "react";
import api from "../config/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Store,
  CreditCard,
  Save,
  Loader2,
  Database,
  Download,
  Upload,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "../context/AuthContext";

export default function SettingPage() {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // Ref cho input file restore
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    store_name: "",
    store_phone: "",
    store_email: "",
    store_address: "",
    tax_rate: 0,
    bank_name: "",
    bank_account_no: "",
    bank_owner: "",
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/settings");
      setFormData({
        store_name: data.store_name || "",
        store_phone: data.store_phone || "",
        store_email: data.store_email || "",
        store_address: data.store_address || "",
        tax_rate: data.tax_rate || 0,
        bank_name: data.bank_name || "",
        bank_account_no: data.bank_account_no || "",
        bank_owner: data.bank_owner || "",
      });
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast.error("Lỗi tải cài đặt hệ thống");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put("/settings", formData);
      toast.success("Đã lưu cấu hình hệ thống");
    } catch (error) {
      console.error("Error saving settings:", error);
      toast.error("Lỗi khi lưu cài đặt");
    } finally {
      setSaving(false);
    }
  };

  // --- HÀM SAO LƯU ---
  const handleBackup = async () => {
    try {
      const response = await api.get("/settings/backup", {
        responseType: "blob",
      });
      // Tạo link tải xuống
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const fileName = `backup_pos_${new Date()
        .toISOString()
        .slice(0, 10)}.json`;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Đã tải xuống bản sao lưu");
    } catch (error) {
      toast.error("Lỗi khi sao lưu dữ liệu");
    }
  };

  // --- HÀM PHỤC HỒI ---
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const jsonData = JSON.parse(event.target.result);

        if (
          !window.confirm(
            "CẢNH BÁO: Hành động này sẽ XÓA TOÀN BỘ dữ liệu hiện tại và thay thế bằng bản sao lưu. Bạn có chắc chắn không?"
          )
        ) {
          return;
        }

        setRestoring(true);
        await api.post("/settings/restore", jsonData); // Gửi JSON lên server
        toast.success("Phục hồi dữ liệu thành công! Hệ thống sẽ đăng xuất.");

        setTimeout(() => {
          logout(); // Đăng xuất để tránh lỗi token cũ
        }, 2000);
      } catch (error) {
        console.error("Restore error:", error);
        toast.error("File sao lưu không hợp lệ hoặc lỗi server");
        setRestoring(false);
      }
    };
    reader.readAsText(file);
  };

  if (loading) {
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
          <h1 className="text-2xl font-bold text-gray-900">Cài đặt hệ thống</h1>
          <p className="text-sm text-gray-600">
            Quản lý thông tin cửa hàng và cấu hình chung
          </p>
        </div>
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Lưu thay đổi
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList className="w-full md:w-auto grid grid-cols-3 md:inline-flex">
          <TabsTrigger value="general" className="gap-2">
            <Store className="h-4 w-4" />{" "}
            <span className="hidden md:inline">Thông tin chung</span>
          </TabsTrigger>
          <TabsTrigger value="payment" className="gap-2">
            <CreditCard className="h-4 w-4" />{" "}
            <span className="hidden md:inline">Thanh toán</span>
          </TabsTrigger>
          <TabsTrigger value="backup" className="gap-2">
            <Database className="h-4 w-4" />{" "}
            <span className="hidden md:inline">Dữ liệu</span>
          </TabsTrigger>
        </TabsList>

        {/* --- TAB: THÔNG TIN CHUNG --- */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cửa hàng</CardTitle>
              <CardDescription>
                Thông tin này sẽ được hiển thị trên hóa đơn in ra cho khách.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Tên cửa hàng</Label>
                  <Input
                    name="store_name"
                    value={formData.store_name}
                    onChange={handleChange}
                    placeholder="VD: Siêu thị Mini Mart"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Số điện thoại</Label>
                  <Input
                    name="store_phone"
                    value={formData.store_phone}
                    onChange={handleChange}
                    placeholder="0912..."
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email liên hệ</Label>
                  <Input
                    name="store_email"
                    value={formData.store_email}
                    onChange={handleChange}
                    placeholder="contact@store.com"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Địa chỉ</Label>
                <Textarea
                  name="store_address"
                  value={formData.store_address}
                  onChange={handleChange}
                  placeholder="Số nhà, đường, phường/xã..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- TAB: THANH TOÁN --- */}
        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>Cấu hình thanh toán</CardTitle>
              <CardDescription>
                Thiết lập thuế và thông tin chuyển khoản ngân hàng.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4 border-b pb-6">
                <h3 className="font-medium text-gray-800">
                  Cấu hình thuế (VAT)
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Thuế suất mặc định (%)</Label>
                    <Input
                      type="number"
                      name="tax_rate"
                      value={formData.tax_rate}
                      onChange={handleChange}
                      min="0"
                      max="100"
                    />
                    <p className="text-xs text-gray-500">
                      Áp dụng cho tất cả đơn hàng bán lẻ.
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-medium text-gray-800">
                  Tài khoản ngân hàng
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tên ngân hàng</Label>
                    <Input
                      name="bank_name"
                      value={formData.bank_name}
                      onChange={handleChange}
                      placeholder="VD: Vietcombank, MBBank..."
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Số tài khoản</Label>
                    <Input
                      name="bank_account_no"
                      value={formData.bank_account_no}
                      onChange={handleChange}
                      placeholder="VD: 0123456789"
                    />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Tên chủ tài khoản</Label>
                    <Input
                      name="bank_owner"
                      value={formData.bank_owner}
                      onChange={handleChange}
                      placeholder="NGUYEN VAN A"
                      className="uppercase"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- TAB: SAO LƯU & PHỤC HỒI --- */}
        <TabsContent value="backup">
          <Card>
            <CardHeader>
              <CardTitle>Quản lý dữ liệu</CardTitle>
              <CardDescription>
                Sao lưu toàn bộ dữ liệu hệ thống hoặc phục hồi từ file có sẵn.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border rounded-lg bg-gray-50">
                <div>
                  <h4 className="font-medium text-gray-900 mb-1">
                    Sao lưu dữ liệu (Backup)
                  </h4>
                  <p className="text-sm text-gray-500">
                    Tải xuống toàn bộ dữ liệu (Sản phẩm, Đơn hàng, Khách
                    hàng...) dưới dạng file JSON.
                  </p>
                </div>
                <Button variant="outline" onClick={handleBackup}>
                  <Download className="mr-2 h-4 w-4" /> Tải xuống bản sao lưu
                </Button>
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg border-rose-100 bg-rose-50">
                <div>
                  <h4 className="font-medium text-rose-900 mb-1 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> Phục hồi dữ liệu
                    (Restore)
                  </h4>
                  <p className="text-sm text-rose-600">
                    Hành động này sẽ <strong>XÓA TOÀN BỘ</strong> dữ liệu hiện
                    tại và thay thế bằng dữ liệu trong file backup.
                  </p>
                </div>
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept=".json"
                    onChange={handleFileChange}
                  />
                  <Button
                    variant="destructive"
                    onClick={() => fileInputRef.current.click()}
                    disabled={restoring}
                  >
                    {restoring ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    Tải file lên & Phục hồi
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
