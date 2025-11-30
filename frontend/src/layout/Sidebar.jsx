import React, { useState } from "react";
import {
  LayoutDashboard,
  Package,
  Warehouse,
  Settings,
  ChevronRight,
  Box,
  ShoppingCart,
  Users,
  Truck,
  Megaphone,
  Wallet,
  BarChart3,
  UserCog,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

const menuItems = [
  {
    icon: LayoutDashboard,
    name: "Tổng quan",
    path: "/dashboard",
    roles: ["staff", "manager", "admin"],
  },
  {
    icon: Box,
    name: "Sản phẩm",
    path: "/products",
    roles: ["staff", "manager", "admin"],
  },
  {
    icon: ShoppingCart,
    name: "Bán hàng",
    path: "/pos",
    roles: ["staff", "manager", "admin"],
  },
  {
    icon: Users,
    name: "Khách hàng",
    path: "/customers",
    roles: ["staff", "manager", "admin"],
  },
  {
    icon: Warehouse,
    name: "Kho hàng",
    path: "/warehouses",
    roles: ["staff", "manager", "admin"],
  },
  {
    icon: Truck,
    name: "Nhà cung cấp",
    path: "/suppliers",
    roles: ["manager", "admin"],
  },
  {
    icon: Megaphone,
    name: "Khuyến mãi & Marketing",
    path: "/promotions",
    roles: ["manager", "admin"],
  },
  {
    icon: UserCog,
    name: "Nhân viên & Phân quyền",
    path: "/staff",
    roles: ["manager", "admin"],
  },
  {
    icon: BarChart3,
    name: "Báo cáo & Phân tích",
    path: "/reports",
    roles: ["manager", "admin"],
  },
  {
    icon: Wallet,
    name: "Tài chính & Kế toán",
    path: "/finances",
    roles: ["admin"],
  },
  {
    icon: Settings,
    name: "Hệ thống & Cài đặt",
    path: "/settings",
    roles: ["admin"],
  },
];

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userProfile } = useAuth();

  const handleItemClick = (path) => {
    navigate(path);
  };

  const filteredMenuItems = menuItems.filter((item) =>
    item.roles.includes(userProfile?.role)
  );

  return (
    <div className="h-full flex flex-col">
      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {filteredMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <button
                key={item.name}
                onClick={() => handleItemClick(item.path)}
                className={`
                  w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-colors
                  ${
                    isActive
                      ? "bg-emerald-50 text-emerald-600 font-semibold"
                      : "text-emerald-100 hover:bg-emerald-500"
                  }
                `}
              >
                <Icon className="h-5 w-5" />
                <span className="flex-1 text-left text-sm">{item.name}</span>
                {isActive && <ChevronRight className="h-4 w-4" />}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200">
        <div className="text-sm text-gray-100 text-center">Version 1.0.0</div>
      </div>
    </div>
  );
};

export default Sidebar;
