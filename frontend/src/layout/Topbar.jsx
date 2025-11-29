import React from "react";
import { Package } from "lucide-react";

const Topbar = () => {
  return (
    <div className="sticky top-0 z-40 flex items-center justify-between w-full p-4">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-2 shrink-0 group cursor-pointer">
          <div className="w-10 h-10 bg-gray-100 flex items-center justify-center rounded-lg">
            <Package className="w-8 h-8 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Lospec</h1>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Topbar;
