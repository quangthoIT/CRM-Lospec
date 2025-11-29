import React from "react";
import { Button } from "@/components/ui/button";
import { TriangleAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Unauthorized = () => {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center p-4">
      <div className="w-28 h-28 md:w-32 md:h-32 flex items-center justify-center bg-red-600 rounded-full">
        <TriangleAlert className="w-16 h-16 md:w-20 md:h-20 text-gray-50" />
      </div>
      <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-red-600 mt-6">
        403 - Forbidden
      </h1>
      <p className="mb-6 text-gray-500 text-lg sm:text-base md:text-xl mt-3">
        Bạn không có quyền truy cập vào trang này.
      </p>
      <Button
        variant="default"
        className="px-8 py-6 text-xl"
        onClick={() => navigate(-1)}
      >
        Quay lại
      </Button>
    </div>
  );
};
export default Unauthorized;
