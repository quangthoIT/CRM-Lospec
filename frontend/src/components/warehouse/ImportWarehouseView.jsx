import { useState, useEffect } from "react";
import api from "../../config/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, RefreshCw, Search } from "lucide-react";
import { toast } from "sonner";
import { WarehouseTransactionDialog } from "./WarehouseTransactionDialog";
import { WarehouseDetailDialog } from "./WarehouseDetailDialog";
import { WarehouseTable } from "./WarehouseTable";

export function ImportWarehouseView() {
  const [invoices, setInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // States xem chi tiết
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [poRes, prodRes, supRes] = await Promise.all([
        api.get("/warehouse/purchase-orders"),
        api.get("/products"),
        api.get("/suppliers"),
      ]);
      setInvoices(poRes.data || []);
      setProducts(prodRes.data || []);
      setSuppliers(supRes.data || []);
    } catch (err) {
      console.error("Fetch error:", err);
      toast.error("Không thể tải dữ liệu kho");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (invoiceId) => {
    setDetailOpen(true);
    setSelectedInvoice(null);
    try {
      const { data } = await api.get(`/warehouse/purchase-orders/${invoiceId}`);
      setSelectedInvoice(data);
    } catch (error) {
      toast.error("Lỗi tải chi tiết");
      setDetailOpen(false);
    }
  };

  const filteredInvoices = invoices.filter(
    (inv) =>
      inv.po_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inv.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-900">Lịch sửa nhập kho</h2>
          <p className="text-gray-600 text-sm">
            Quản lý các phiếu nhập hàng từ nhà cung cấp
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="default" onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4" /> Tạo phiếu nhập
          </Button>
        </div>
      </div>

      <Input
        placeholder="Tìm mã phiếu, nhà cung cấp..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        icon={<Search size={20} />}
      />

      {/* Table */}
      <WarehouseTable
        data={filteredInvoices}
        loading={loading}
        type="import"
        onViewDetail={handleViewDetail}
      />

      {/* Create Dialog */}
      <WarehouseTransactionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        type="import"
        products={products}
        suppliers={suppliers}
        onSuccess={fetchData}
      />

      {/* ✅ Detail Dialog (Dùng chung) */}
      <WarehouseDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        data={selectedInvoice}
        type="import"
      />
    </div>
  );
}
