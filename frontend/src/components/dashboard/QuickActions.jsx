import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { CreditCard, Truck, Users, Clock } from "lucide-react";

export function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      <Button
        variant="outline"
        className="h-20 flex flex-col gap-2 bg-white border-gray-200 hover:border-emerald-500 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
        onClick={() => navigate("/pos")}
      >
        <CreditCard className="h-6 w-6" />
        <span className="text-xs font-medium">Bán hàng (POS)</span>
      </Button>
      <Button
        variant="outline"
        className="h-20 flex flex-col gap-2 bg-white border-gray-200 hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-all"
        onClick={() => navigate("/warehouses")}
      >
        <Truck className="h-6 w-6" />
        <span className="text-xs font-medium">Nhập kho</span>
      </Button>
      <Button
        variant="outline"
        className="h-20 flex flex-col gap-2 bg-white border-gray-200 hover:border-orange-500 hover:text-orange-600 hover:bg-orange-50 transition-all"
        onClick={() => navigate("/customers")}
      >
        <Users className="h-6 w-6" />
        <span className="text-xs font-medium">Thêm Khách</span>
      </Button>
      <Button
        variant="outline"
        className="h-20 flex flex-col gap-2 bg-white border-gray-200 hover:border-purple-500 hover:text-purple-600 hover:bg-purple-50 transition-all"
        onClick={() => navigate("/attendance")}
      >
        <Clock className="h-6 w-6" />
        <span className="text-xs font-medium">Chấm công</span>
      </Button>
    </div>
  );
}
