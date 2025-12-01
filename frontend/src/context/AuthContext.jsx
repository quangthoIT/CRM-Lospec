import { createContext, useContext, useEffect, useState } from "react";
import api from "../config/api";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- Load user từ Token khi F5 trang ---
  const loadUser = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // Gọi endpoint: GET /api/users/me
      const { data } = await api.get("/users/me");
      setUser(data);
    } catch (error) {
      console.error("Load user failed:", error);
      localStorage.removeItem("token");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  // --- Đăng Nhập ---
  const login = async (email, password) => {
    try {
      // Endpoint: POST /api/users/login
      const { data } = await api.post("/users/login", { email, password });

      // Backend trả về: { token, user }
      localStorage.setItem("token", data.token);
      setUser(data.user);

      return data.user;
    } catch (error) {
      // Ném lỗi ra để Component Login hiển thị thông báo
      const message = error.response?.data?.message || "Đăng nhập thất bại";
      throw new Error(message);
    }
  };

  // --- Đăng Ký ---
  const register = async (payload) => {
    try {
      // Endpoint: POST /api/users/register
      const { data } = await api.post("/users/register", payload);

      // Backend trả về: { message, token, user }
      if (data.token) {
        localStorage.setItem("token", data.token);
        setUser(data.user);
      }
      return data;
    } catch (error) {
      const message = error.response?.data?.message || "Đăng ký thất bại";
      throw new Error(message);
    }
  };

  // --- Đăng Xuất ---
  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
    window.location.href = "/login";
  };

  // --- Refresh data ---
  const refreshProfile = async () => {
    try {
      const { data } = await api.get("/users/me");
      setUser(data);
    } catch (error) {
      console.error("Refresh profile error", error);
    }
  };

  const value = {
    user,
    userProfile: user,
    loading,
    login,
    register,
    logout,
    refreshProfile,
    // Helper check quyền nhanh
    isAdmin: user?.role === "admin",
    isManager: user?.role === "manager",
    isStaff: user?.role === "staff",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth phải được sử dụng trong AuthProvider");
  }
  return context;
};