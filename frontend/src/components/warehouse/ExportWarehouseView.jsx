import { useState, useEffect } from "react";
import api from "../../config/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { WarehouseDetailDialog } from "../WarehouseDetailDialog";
import { WarehouseTransactionDialog } from "../WarehouseTransactionDialog";
import { WarehouseTable } from "../WarehouseTable";

export function ExportWarehouseView() {
  const [exports, setExports] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // States xem chi tiết
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedExport, setSelectedExport] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [expRes, prodRes] = await Promise.all([
        api.get("/warehouse/exports"),
        api.get("/products"),
      ]);
      setExports(expRes.data || []);
      setProducts(prodRes.data || []);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Lỗi tải dữ liệu xuất kho");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = (exportBatch) => {
    setSelectedExport(exportBatch);
    setDetailOpen(true);
  };

  const filteredExports = exports.filter(
    (e) =>
      (e.notes && e.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.code && e.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      {/* Header & Search */}
      <div className="flex justify-between items-center">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">Lịch sử xuất kho</h2>
          <p className="text-gray-600 text-sm">
            Quản lý các phiếu xuất kho hàng hóa
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchData} variant="outline" className="gap-2">
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            variant="default"
            className="bg-rose-600 hover:bg-rose-700"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="h-4 w-4" /> Tạo phiếu xuất
          </Button>
        </div>
      </div>

      <Input
        placeholder="Tìm mã phiếu, lý do..."
        icon={<Search size={20} />}
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Table */}
      <WarehouseTable
        data={filteredExports}
        loading={loading}
        type="export"
        onViewDetail={handleViewDetail}
      />

      {/* Create Dialog */}
      <WarehouseTransactionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        type="export"
        products={products}
        onSuccess={fetchData}
      />

      {/* ✅ Detail Dialog (Dùng chung) */}
      <WarehouseDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        data={selectedExport}
        type="export"
      />
    </div>
  );
}
