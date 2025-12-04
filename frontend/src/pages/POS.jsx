import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { POSView } from "../components/pos/POSView";
import { POSOrderHistory } from "../components/pos/POSOrderHistory";
import { ShoppingCart, History } from "lucide-react";

export default function POS() {
  const [activeTab, setActiveTab] = useState("pos");

  return (
    <div className="mx-auto">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="h-full flex flex-col"
      >
        <div className="flex justify-between items-center">
          <div className="mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              Bán hàng & Thu ngân
            </h1>
            <p className="text-gray-600">
              Tạo đơn hàng bán lẻ và quản lý lịch sử giao dịch
            </p>
          </div>
          <TabsList className="grid w-[400px] grid-cols-2">
            <TabsTrigger value="pos" className="gap-2">
              <ShoppingCart className="h-4 w-4" /> Bán hàng
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <History className="h-4 w-4" /> Lịch sử đơn hàng
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="flex-1 overflow-hidden">
          <TabsContent value="pos" className="h-full">
            <POSView />
          </TabsContent>

          <TabsContent value="history" className="h-full overflow-auto">
            <POSOrderHistory />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
