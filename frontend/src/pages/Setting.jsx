import { useState, useEffect } from "react";
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
import { Store, CreditCard, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Setting() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
            Quản lý cài đặt hệ thống cửa hàng
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
        <TabsList>
          <TabsTrigger value="general" className="gap-2">
            <Store className="h-4 w-4" /> Thông tin cửa hàng
          </TabsTrigger>
          <TabsTrigger value="payment" className="gap-2">
            <CreditCard className="h-4 w-4" /> Thanh toán & Thuế
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
                  Tài khoản ngân hàng (Nhận chuyển khoản)
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
      </Tabs>
    </div>
  );
}
