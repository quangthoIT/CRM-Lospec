import { Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";

const MainLayout = () => {
  const { userProfile } = useAuth(); // Lấy thông tin user để hiển thị lên Header/Sidebar

  return (
    <div className="flex flex-col h-screen">
      {/* Header bên trên */}
      <header className="bg-emerald-600 border-b border-gray-200 shadow-lg">
        <Topbar />
      </header>
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar bên trái */}
        <aside className="bg-emerald-600 w-48 md:w-64 border-r border-gray-200 shadow-xl">
          <Sidebar />
        </aside>

        {/* Nội dung chính bên phải */}
        <main className="flex-1 bg-gray-100 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
