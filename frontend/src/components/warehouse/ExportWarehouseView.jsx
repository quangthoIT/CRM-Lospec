import { useState, useEffect } from "react";
import api from "../../config/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Plus,
  RefreshCw,
  Search,
  History,
  CheckCircle,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { WarehouseTransactionDialog } from "./WarehouseTransactionDialog";
import { WarehouseDetailDialog } from "./WarehouseDetailDialog";
import { WarehouseTable } from "./WarehouseTable";
import { ConfirmActionDialog } from "../ConfirmActionDialog";

export function ExportWarehouseView() {
  const [exports, setExports] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Dialog Tạo Mới
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Dialog Chi Tiết
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedExport, setSelectedExport] = useState(null);

  // Dialog Xác nhận Duyệt
  const [approveOpen, setApproveOpen] = useState(false);
  const [approving, setApproving] = useState(false);

  // Dialog Xác nhận Xóa
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

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

  // --- XEM CHI TIẾT ---
  const handleViewDetail = async (exportId) => {
    setDetailOpen(true);
    setSelectedExport(null);
    try {
      const { data } = await api.get(`/warehouse/exports/${exportId}`);
      setSelectedExport(data);
    } catch (error) {
      toast.error("Lỗi tải chi tiết phiếu");
      setDetailOpen(false);
    }
  };

  // --- DUYỆT PHIẾU  ---
  const handleOpenApprove = () => {
    setApproveOpen(true);
  };

  const handleConfirmApprove = async () => {
    if (!selectedExport) return;
    setApproving(true);
    try {
      // Gọi API duyệt
      await api.put(`/warehouse/exports/${selectedExport.id}/approve`);

      toast.success("Đã duyệt phiếu và xuất kho thành công!");
      setApproveOpen(false);
      setDetailOpen(false);
      fetchData();
    } catch (error) {
      console.error("Approve error:", error);
      toast.error(error.response?.data?.message || "Lỗi khi duyệt phiếu");
    } finally {
      setApproving(false);
    }
  };

  // --- XÓA PHIẾU ---
  // Xử lý khi bấm nút xóa ở ngoài bảng
  const handleDeleteFromTable = (item) => {
    setItemToDelete(item);
    setDeleteOpen(true);
  };

  // Xử lý khi bấm nút xóa trong dialog chi tiết
  const handleDeleteFromDetail = () => {
    setItemToDelete(selectedExport);
    setDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    setDeleting(true);
    try {
      await api.delete(`/warehouse/exports/${itemToDelete.id}`);
      toast.success("Đã xóa phiếu xuất nháp!");

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

  const filteredExports = exports.filter(
    (e) =>
      (e.notes && e.notes.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (e.code && e.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
            Lịch sử xuất kho
          </h2>
          <p className="text-sm text-gray-500">
            Quản lý các phiếu xuất kho bán hàng, xuất hủy hoặc sử dụng nội bộ
          </p>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchData}>
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

      {/* TABLE */}
      <WarehouseTable
        data={filteredExports}
        loading={loading}
        type="export"
        onViewDetail={handleViewDetail}
        onDelete={handleDeleteFromTable}
      />

      {/* DIALOG TẠO MỚI */}
      <WarehouseTransactionDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        type="export"
        products={products}
        onSuccess={fetchData}
      />

      {/* DIALOG CHI TIẾT */}
      <WarehouseDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        data={selectedExport}
        type="export"
        footerAction={
          // Chỉ hiện nút thao tác nếu trạng thái chưa hoàn thành
          selectedExport?.status !== "completed" && (
            // <Button
            //   variant="destructive"
            //   onClick={handleDeleteFromDetail}
            //   className="gap-2"
            // >
            //   <Trash2 className="h-4 w-4" /> Xóa phiếu
            // </Button>
            <Button
              onClick={handleOpenApprove}
              className="bg-rose-600 hover:bg-rose-700"
            >
              <CheckCircle className="h-4 w-4" /> Duyệt & Xuất kho
            </Button>
          )
        }
      />

      {/* DIALOG XÁC NHẬN DUYỆT */}
      <ConfirmActionDialog
        open={approveOpen}
        onOpenChange={setApproveOpen}
        onConfirm={handleConfirmApprove}
        loading={approving}
        title="Xác nhận xuất kho?"
        description={`Hệ thống sẽ trừ tồn kho cho các sản phẩm trong phiếu ${selectedExport?.code}. Hành động này không thể hoàn tác.`}
        confirmText="Xác nhận Xuất"
        variant="destructive" // Màu đỏ cảnh báo
      />

      {/* DIALOG XÁC NHẬN XÓA */}
      <ConfirmActionDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        title="Xóa phiếu xuất?"
        description={`Bạn có chắc chắn muốn xóa phiếu nháp ${
          itemToDelete?.code || selectedExport?.code
        }?`}
        confirmText="Xóa phiếu"
        variant="destructive"
      />
    </div>
  );
}
