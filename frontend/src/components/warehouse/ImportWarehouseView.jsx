import { useState, useEffect } from "react";
import api from "../../config/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  RefreshCw,
  Truck,
  Search,
  CheckCircle,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { WarehouseTransactionDialog } from "./WarehouseTransactionDialog";
import { WarehouseDetailDialog } from "./WarehouseDetailDialog";
import { WarehouseTable } from "./WarehouseTable";
import { ConfirmActionDialog } from "../ConfirmActionDialog";

export function ImportWarehouseView() {
  const [invoices, setInvoices] = useState([]);
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // State Dialog Tạo mới
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // State Dialog Chi tiết
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // State Dialog Xác nhận Duyệt
  const [approveOpen, setApproveOpen] = useState(false);
  const [approving, setApproving] = useState(false);

  // State Dialog Xác nhận Xóa
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

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

  // Xem chi tiết phiếu
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

  // --- LOGIC DUYỆT PHIẾU ---
  const handleOpenApprove = () => {
    setApproveOpen(true);
  };

  const handleConfirmApprove = async () => {
    if (!selectedInvoice) return;
    setApproving(true);
    try {
      await api.put(`/warehouse/purchase-orders/${selectedInvoice.id}/approve`);
      toast.success("Đã duyệt phiếu và nhập kho thành công!");
      setApproveOpen(false);
      setDetailOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi duyệt phiếu");
    } finally {
      setApproving(false);
    }
  };

  // --- LOGIC XÓA PHIẾU ---
  // Xử lý khi bấm nút xóa ở bảng
  const handleDeleteFromTable = (item) => {
    setItemToDelete(item);
    setDeleteOpen(true);
  };

  // Xử lý khi bấm nút xóa trong dialog chi tiết
  const handleDeleteFromDetail = () => {
    setItemToDelete(selectedInvoice);
    setDeleteOpen(true);
  };

  // Gọi API xóa
  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/warehouse/purchase-orders/${itemToDelete.id}`);
      toast.success("Đã xóa phiếu nhập nháp!");

      setDeleteOpen(false);
      setDetailOpen(false);
      setItemToDelete(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || "Lỗi khi xóa phiếu");
    } finally {
      setDeleting(false);
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
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            Quản lý nhập kho
          </h2>
          <p className="text-sm text-gray-500">
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
        onDelete={handleDeleteFromTable}
      />

      {/* Dialog Tạo Mới */}
      <WarehouseTransactionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        type="import"
        products={products}
        suppliers={suppliers}
        onSuccess={fetchData}
      />

      {/* Dialog Chi Tiết */}
      <WarehouseDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        data={selectedInvoice}
        type="import"
        footerAction={
          // Chỉ hiện nút thao tác nếu trạng thái chưa hoàn thành (pending)
          selectedInvoice?.status !== "received" ? (
            //  Nút Xóa trong Dialog Chi tiết
            // <Button
            //   variant="destructive"
            //   onClick={handleDeleteFromDetail}
            //   className="gap-2"
            // >
            //   <Trash2 className="h-4 w-4" /> Xóa phiếu
            // </Button>

            <Button onClick={handleOpenApprove} variant="default">
              <CheckCircle className="h-4 w-4" /> Duyệt & Nhập kho
            </Button>
          ) : null
        }
      />

      {/* Dialog Xác Nhận Duyệt */}
      <ConfirmActionDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        onConfirm={handleConfirmApprove}
        loading={approving}
        title="Xác nhận nhập kho?"
        description={`Hệ thống sẽ cộng tồn kho cho các sản phẩm trong phiếu ${selectedInvoice?.po_number}. Hành động này không thể hoàn tác.`}
        confirmText="Xác nhận Nhập"
      />

      {/* ✅ Dialog Xác Nhận Xóa (Mới thêm) */}
      <ConfirmActionDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        title="Xóa phiếu nhập?"
        description={`Bạn có chắc chắn muốn xóa phiếu nhập nháp ${
          itemToDelete?.po_number || selectedInvoice?.po_number
        }?`}
        confirmText="Xóa phiếu"
        variant="destructive"
      />
    </div>
  );
}
