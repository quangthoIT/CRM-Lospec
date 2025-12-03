import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImportWarehouseView } from "../components/warehouse/ImportWarehouseView";
import { ExportWarehouseView } from "../components/warehouse/ExportWarehouseView";
import { StockAlertsView } from "../components/warehouse/StockAlertsView";

export default function Warehouse() {
  const [activeTab, setActiveTab] = useState("import");

  return (
    <div className="mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý kho hàng</h1>
        <p className="text-gray-600">Nhập kho, xuất kho và theo dõi tồn kho.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="import">Quản lý nhập kho</TabsTrigger>
          <TabsTrigger value="export">Quản lý xuất kho</TabsTrigger>
          <TabsTrigger value="alerts">Cảnh báo tồn kho</TabsTrigger>
        </TabsList>

        <div className="mt-4 bg-white rounded-lg shadow-md p-4">
          <TabsContent value="import">
            <ImportWarehouseView />
          </TabsContent>

          <TabsContent value="export">
            <ExportWarehouseView />
          </TabsContent>

          <TabsContent value="alerts">
            <StockAlertsView />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
