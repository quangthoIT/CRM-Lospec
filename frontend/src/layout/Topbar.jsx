import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  LogOut,
  User,
  Settings,
  Store,
  Menu,
  ChevronDown,
  Package,
} from "lucide-react";

export function TopBar({ sidebarOpen, setSidebarOpen }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Helper hiển thị tên quyền hạn đẹp hơn
  const getRoleName = (role) => {
    switch (role) {
      case "admin":
        return "Quản trị viên";
      case "manager":
        return "Quản lý";
      case "staff":
        return "Nhân viên";
      default:
        return "Người dùng";
    }
  };

  // Helper lấy chữ cái đầu của tên để làm Avatar fallback
  const getInitials = (name) => {
    if (!name) return "U";
    return name.charAt(0).toUpperCase();
  };

  return (
    <header className="h-18 bg-emerald-600 flex items-center justify-around md:justify-between max-w-6xl mx-auto sticky">
      {/* --- LEFT: LOGO & TOGGLE --- */}
      <div className="flex items-center gap-4">
        {/* Logo */}
        <div
          className="flex items-center gap-1 cursor-pointer"
          onClick={() => navigate("/dashboard")}
        >
          <div className="bg-emerald-600 p-1 rounded-lg">
            <Package className="h-10 w-10 text-gray-50" />
          </div>
          <div className="hidden md:block">
            <h1 className="text-xl font-bold text-gray-50 leading-none">
              LOSPEC
            </h1>
            <p className="text-[11px] text-gray-200 font-medium tracking-widest">
              POS SYSTEM
            </p>
          </div>
        </div>
      </div>

      {/* --- RIGHT: USER PROFILE --- */}
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex items-center gap-3 cursor-pointer hover:bg-emerald-500 p-1.5 rounded-full transition-colors pr-3 md:border md:border-gray-200">
              {/* Avatar */}
              <Avatar className="h-10 w-10 border border-gray-200">
                <AvatarImage src={user?.avatar_url} alt={user?.full_name} />
                <AvatarFallback className="bg-emerald-100 text-emerald-700 font-bold">
                  {getInitials(user?.full_name)}
                </AvatarFallback>
              </Avatar>

              {/* Info (Hidden on mobile) */}
              <div className="hidden md:flex flex-col items-start">
                <p className="text-sm font-semibold text-gray-50 leading-tight">
                  {user?.full_name || "Người dùng"}
                </p>
                <p className="text-[10px] text-gray-200 font-medium uppercase">
                  {getRoleName(user?.role)}
                </p>
              </div>

              <ChevronDown className="h-4 w-4 text-gray-100 hidden md:block" />
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Tài khoản của tôi</DropdownMenuLabel>
            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={() => navigate("/profile")}
              className="cursor-pointer"
            >
              <User className="mr-2 h-4 w-4" />
              <span>Thông tin cá nhân</span>
            </DropdownMenuItem>

            {/* Chỉ Admin mới thấy Settings */}
            {user?.role === "admin" && (
              <DropdownMenuItem
                onClick={() => navigate("/settings")}
                className="cursor-pointer"
              >
                <Settings className="mr-2 h-4 w-4" />
                <span>Cấu hình hệ thống</span>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onClick={logout}
              className="text-rose-600 focus:text-rose-600 cursor-pointer"
            >
              <LogOut className="mr-2 h-4 w-4" />
              <span>Đăng xuất</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Nút mở Sidebar trên Mobile (nếu cần sau này) */}
        <Button
          variant="ghost"
          className="md:hidden text-gray-50 hover:bg-emerald-500 transition-colors h-14 w-14"
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Menu className="h-12 w-12" />
        </Button>
      </div>
    </header>
  );
}
