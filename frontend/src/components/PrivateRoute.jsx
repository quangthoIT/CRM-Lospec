import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";

const PrivateRoute = ({ allowedRoles }) => {
  const { user, userProfile, loading } = useAuth();

  // Đang loading
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
      </div>
    );
  }

  // Chưa đăng nhập
  if (!user) {
    console.log("Không có người dùng, đang chuyển hướng đến /đăng nhập");
    return <Navigate to="/login" replace />;
  }

  // Đã đăng nhập nhưng chưa có profile (backend chưa trả về)
  if (!userProfile) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
      </div>
    );
  }

  // Kiểm tra quyền truy cập
  if (allowedRoles && !allowedRoles.includes(userProfile.role)) {
    console.log("Chỉ cho phép quyền truy cập: ", allowedRoles);
    return <Navigate to="/unauthorized" replace />;
  }

  // Kiểm tra tài khoản có bị vô hiệu hóa không
  if (userProfile.is_active === false) {
    console.log("Tài khoản người dùng không hoạt động.");
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
