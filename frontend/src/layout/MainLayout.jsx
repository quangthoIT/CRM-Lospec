import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { TopBar } from "./Topbar";

const MainLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      {/* HEADER */}
      <header className="bg-emerald-600 border-b border-gray-200 shadow-md z-30 w-full">
        <TopBar
          sidebarOpen={isMobileMenuOpen}
          setSidebarOpen={setIsMobileMenuOpen}
        />
      </header>

      {/* BODY (Sidebar + Main Content) */}
      <div className="flex flex-1 overflow-hidden">
        {/* MOBILE SIDEBAR */}
        {isMobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 md:hidden transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
          ></div>
        )}

        <div
          className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-emerald-600 text-white transition-transform duration-300 ease-in-out md:hidden
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        `}
        >
          <Sidebar onCloseMobile={() => setIsMobileMenuOpen(false)} />
        </div>

        {/* DESKTOP SIDEBAR */}
        <aside className="hidden md:flex w-64 flex-col bg-emerald-600 text-white border-r border-gray-200 shadow-xl z-20 h-full overflow-y-auto">
          <Sidebar />
        </aside>

        {/* MAIN CONTENT AREA */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6 w-full">
          <div className="mx-auto max-w-7xl h-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
