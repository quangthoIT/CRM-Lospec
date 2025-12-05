import { useState, useEffect } from "react";
import api from "../config/api";
import { useAuth } from "../context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { User, Lock, Save, Loader2, Camera } from "lucide-react";

export default function Profile() {
  const { user } = useAuth(); // Lấy user từ context (nhưng nên fetch lại để có dữ liệu mới nhất)
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Form States
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    email: "",
    avatar_url: "",
  });

  const [passData, setPassData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data } = await api.get("/users/me");
      setProfile(data);
      setFormData({
        full_name: data.full_name || "",
        phone: data.phone || "",
        email: data.email || "",
        avatar_url: data.avatar_url || "",
      });
    } catch (error) {
      console.error(error);
      toast.error("Lỗi tải thông tin cá nhân");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.put(`/users/${profile.id}`, {
        full_name: formData.full_name,
        phone: formData.phone,
        // email thường không cho sửa trực tiếp để tránh lỗi auth
      });
      toast.success("Cập nhật thông tin thành công");
      fetchProfile(); // Refresh
    } catch (error) {
      toast.error(
        "Lỗi cập nhật: " + (error.response?.data?.message || "Lỗi server")
      );
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passData.newPassword !== passData.confirmPassword) {
      return toast.error("Mật khẩu xác nhận không khớp");
    }
    if (passData.newPassword.length < 6) {
      return toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
    }

    setSaving(true);
    try {
      await api.put("/users/change-password", {
        currentPassword: passData.currentPassword,
        newPassword: passData.newPassword,
      });
      toast.success("Đổi mật khẩu thành công");
      setPassData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast.error(error.response?.data?.message || "Đổi mật khẩu thất bại");
    } finally {
      setSaving(false);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "admin":
        return (
          <Badge className="bg-purple-100 text-purple-700">Quản trị viên</Badge>
        );
      case "manager":
        return (
          <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200">
            Quản lý
          </Badge>
        );
      default:
        return <Badge variant="outline">Nhân viên</Badge>;
    }
  };

  if (loading) return <div className="p-8 text-center">Đang tải...</div>;

  return (
    <div className="p-6 max-w-[800px] mx-auto space-y-6">
      {/* Header Profile */}
      <div className="flex items-center gap-6 bg-white p-6 rounded-xl border shadow-sm">
        <div className="relative">
          <Avatar className="h-24 w-24 border-4 border-white shadow-md">
            <AvatarImage src={formData.avatar_url} />
            <AvatarFallback className="text-2xl bg-slate-200">
              {formData.full_name?.charAt(0)}
            </AvatarFallback>
          </Avatar>
          {/* Nút đổi avatar giả lập (để đẹp) */}
          <button className="absolute bottom-0 right-0 bg-slate-800 text-white p-1.5 rounded-full border-2 border-white hover:bg-slate-700 transition-colors">
            <Camera className="h-4 w-4" />
          </button>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">
            {profile?.full_name}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            {getRoleBadge(profile?.role)}
            <span className="text-sm text-slate-500">{profile?.email}</span>
          </div>
        </div>
      </div>

      <Tabs defaultValue="info" className="space-y-4">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="info" className="gap-2 px-6">
            <User className="h-4 w-4" /> Thông tin chung
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2 px-6">
            <Lock className="h-4 w-4" /> Bảo mật
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: THÔNG TIN */}
        <TabsContent value="info">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cá nhân</CardTitle>
              <CardDescription>
                Cập nhật tên và thông tin liên hệ của bạn.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="grid gap-2">
                  <Label>Họ và tên</Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Số điện thoại</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder="0912..."
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Email (Không thể sửa)</Label>
                  <Input
                    value={formData.email}
                    disabled
                    className="bg-slate-50 text-slate-500"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    type="submit"
                    disabled={saving}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {saving && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    <Save className="mr-1 h-4 w-4" /> Lưu thay đổi
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: BẢO MẬT */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Đổi mật khẩu</CardTitle>
              <CardDescription>
                Để bảo mật, vui lòng không chia sẻ mật khẩu cho người khác.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="grid gap-2">
                  <Label>Mật khẩu hiện tại</Label>
                  <Input
                    type="password"
                    value={passData.currentPassword}
                    onChange={(e) =>
                      setPassData({
                        ...passData,
                        currentPassword: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Mật khẩu mới</Label>
                  <Input
                    type="password"
                    value={passData.newPassword}
                    onChange={(e) =>
                      setPassData({ ...passData, newPassword: e.target.value })
                    }
                    required
                    minLength={6}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Xác nhận mật khẩu mới</Label>
                  <Input
                    type="password"
                    value={passData.confirmPassword}
                    onChange={(e) =>
                      setPassData({
                        ...passData,
                        confirmPassword: e.target.value,
                      })
                    }
                    required
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <Button type="submit" disabled={saving} variant="default">
                    {saving && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Đổi mật khẩu
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
