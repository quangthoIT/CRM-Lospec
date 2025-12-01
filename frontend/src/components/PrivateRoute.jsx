import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";

const PrivateRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
      </div>
    );
  }

  // Nếu chưa login - Đưa về trang Login, lưu lại trang hiện tại
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Nếu User bị khóa - Đưa về trang Unauthorized
  if (user.is_active === false) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Nếu có quy định role mà user không đủ quyền - Đưa về Unauthorized
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default PrivateRoute;
