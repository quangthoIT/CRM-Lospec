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

const menuItems = [
  { icon: LayoutDashboard, name: "Tổng quan" },
  { icon: Box, name: "Sản phẩm" },
  { icon: ShoppingCart, name: "Bán hàng" },
  { icon: Users, name: "Khách hàng" },
  { icon: Warehouse, name: "Kho hàng" },
  { icon: Truck, name: "Nhà cung cấp" },
  { icon: Megaphone, name: "Khuyến mãi & Marketing" },
  { icon: UserCog, name: "Nhân viên & Phân quyền" },
  { icon: BarChart3, name: "Báo cáo & Phân tích" },
  { icon: Wallet, name: "Tài chính & Kế toán" },
  { icon: Settings, name: "Hệ thống & Cài đặt" },
];

const Sidebar = () => {
  const [activeItem, setActiveItem] = useState("Tổng quan");
  const onItemClick = (name) => {
    setActiveItem(name);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Menu Items */}
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.name;

            return (
              <button
                key={item.name}
                onClick={() => onItemClick(item.name)}
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
