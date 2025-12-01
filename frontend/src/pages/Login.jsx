import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import {
  Loader2,
  Lock,
  LogIn,
  Mail,
  Package,
  Phone,
  User,
  UserPlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    confirmPassword: "",
  });

  // 1. Lấy thêm hàm register từ Context
  const { login, register } = useAuth();
  const navigate = useNavigate();

  // Hàm xử lý nhập liệu
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Hàm xử lý Đăng nhập
  const handleLogin = async () => {
    try {
      const user = await login(formData.email, formData.password);
      if (user) {
        toast.success("Đăng nhập thành công!");
        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Login Error:", err);
      // Lỗi được ném ra từ AuthContext là Error object, lấy .message
      toast.error(err.message || "Email hoặc mật khẩu không chính xác.");
    }
  };

  // Hàm xử lý Đăng ký
  const handleRegister = async () => {
    if (formData.password !== formData.confirmPassword) {
      toast.error("Mật khẩu xác nhận không khớp.");
      return;
    }

    try {
      // 2. Sử dụng hàm register từ Context
      await register({
        email: formData.email,
        password: formData.password,
        full_name: formData.fullName,
        phone: formData.phone,
        role: "staff", // Mặc định role
      });

      toast.success("Đăng ký thành công! Bạn đã được đăng nhập.");
      navigate("/dashboard");
    } catch (error) {
      console.error("Register error:", error);
      toast.error(error.message || "Đăng ký không thành công.");
    }
  };

  // Hàm xử lý chung
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        await handleRegister();
      } else {
        await handleLogin();
      }
    } catch (err) {
      // Lỗi đã được catch trong handleLogin/handleRegister
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="w-full max-w-xl p-4">
        {/* Tiêu đề */}
        <div className="text-center">
          <div className="bg-emerald-600 h-15 w-15 inline-flex items-center justify-center rounded-lg mb-4">
            <Package className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Lospec - Đặc sản quê hương
          </h1>
          <p className="text-base text-gray-500 mt-1">
            Hệ thống quản lý bán hàng & CRM thông minh
          </p>
        </div>

        <div className="bg-gray-50 p-6 shadow-lg rounded-lg mt-8">
          {/* Nút chuyển đổi Tab */}
          <div className="flex gap-4 mb-4">
            <Button
              variant={!isSignUp ? "default" : "outline"}
              className="flex-1"
              onClick={() => setIsSignUp(false)}
            >
              <LogIn className="w-5 h-5 mr-2" />
              Đăng nhập
            </Button>
            <Button
              variant={isSignUp ? "default" : "outline"}
              className="flex-1"
              onClick={() => setIsSignUp(true)}
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Đăng ký
            </Button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <Input
                  label="Họ và tên *"
                  type="text"
                  placeholder="Nguyễn Văn A"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  required
                  icon={<User size={20} />}
                />
                <Input
                  label="Số điện thoại"
                  type="text"
                  placeholder="0912..."
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  icon={<Phone size={20} />}
                />
              </div>
            )}

            <Input
              label="Email *"
              type="text"
              placeholder="admin@example.com"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              icon={<Mail size={20} />}
            />
            <Input
              label="Mật khẩu *"
              type="password"
              placeholder="••••••"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              icon={<Lock size={20} />}
            />

            {isSignUp && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                <Input
                  label="Xác nhận mật khẩu *"
                  type="password"
                  placeholder="••••••"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                  icon={<Lock size={20} />}
                />
              </div>
            )}

            {!isSignUp && (
              <div className="flex justify-end -mt-2">
                <Link
                  to="/forgot-password"
                  className="text-sm font-medium text-emerald-600 hover:text-emerald-700"
                >
                  Quên mật khẩu?
                </Link>
              </div>
            )}

            <Button
              type="submit"
              variant="default"
              className="w-full mt-2"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : isSignUp ? (
                "Tạo tài khoản mới"
              ) : (
                "Đăng nhập hệ thống"
              )}
            </Button>
          </form>

          <div className="mt-4 text-center text-xs text-gray-400">
            © 2025 Lospec CRM. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
