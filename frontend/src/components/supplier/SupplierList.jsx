import { useState, useEffect } from "react";
import api from "../../config/api"; // Import từ file config vừa tạo lại
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Phone,
  Mail,
  MapPin,
  Building2,
} from "lucide-react";
import { toast } from "sonner";
import { SupplierFormDialog } from "./SupplierFormDialog";
import { ConfirmDeleteDialog } from "../ConfirmDeleteDialog";

export function SupplierList() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // States cho Form Dialog
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // States cho Delete Dialog
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [supplierToDelete, setSupplierToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/suppliers");
      setSuppliers(data || []);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Không thể tải danh sách nhà cung cấp");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setSelectedSupplier(null);
    setIsFormOpen(true);
  };

  const handleEdit = (supplier) => {
    setSelectedSupplier(supplier);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (supplier) => {
    setSupplierToDelete(supplier);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!supplierToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/suppliers/${supplierToDelete.id}`);
      toast.success("Đã xóa nhà cung cấp");
      fetchSuppliers(); // Reload
      setDeleteOpen(false);
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Lỗi khi xóa (Có thể đang có dữ liệu liên quan)");
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredSuppliers = suppliers.filter(
    (s) =>
      s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.contact_person?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.phone?.includes(searchTerm)
  );

  return (
    <div className="space-y-4">
      {/* Header & Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-lg border shadow-sm">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Tìm theo tên, SĐT, người liên hệ..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchSuppliers}
            title="Làm mới"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            onClick={handleAdd}
            className="bg-emerald-600 hover:bg-emerald-700 gap-2"
          >
            <Plus className="h-4 w-4" /> Thêm Nhà cung cấp
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden border-slate-200">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50">
              <TableHead>Tên Nhà cung cấp</TableHead>
              <TableHead>Thông tin liên hệ</TableHead>
              <TableHead>Địa chỉ</TableHead>
              <TableHead className="text-right">Hành động</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-600" />
                </TableCell>
              </TableRow>
            ) : filteredSuppliers.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-10 text-slate-500"
                >
                  <Building2 className="h-10 w-10 mx-auto mb-2 text-slate-300" />
                  Chưa có nhà cung cấp nào
                </TableCell>
              </TableRow>
            ) : (
              filteredSuppliers.map((item) => (
                <TableRow key={item.id} className="hover:bg-slate-50">
                  <TableCell>
                    <div className="font-semibold text-slate-800">
                      {item.name}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      MST: {item.tax_code || "---"}
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2 text-slate-700">
                        <UserIcon className="h-3 w-3" />{" "}
                        <span>{item.contact_person || "---"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <Phone className="h-3 w-3" />{" "}
                        <span>{item.phone || "---"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-500">
                        <Mail className="h-3 w-3" />{" "}
                        <span>{item.email || "---"}</span>
                      </div>
                    </div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-start gap-2 text-sm text-slate-600 max-w-xs">
                      <MapPin className="h-3 w-3 mt-1 shrink-0" />
                      <span>{item.address || "---"}</span>
                    </div>
                  </TableCell>

                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-blue-600 hover:bg-blue-50"
                        onClick={() => handleEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-rose-600 hover:bg-rose-50"
                        onClick={() => handleDeleteClick(item)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* --- Dialogs --- */}
      <SupplierFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        supplier={selectedSupplier}
        onSuccess={fetchSuppliers}
      />

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={confirmDelete}
        title="Xóa nhà cung cấp?"
        itemName={supplierToDelete?.name}
        description="Lưu ý: Nếu nhà cung cấp này đã có lịch sử giao dịch (nhập kho), bạn chỉ nên ẩn đi thay vì xóa."
        loading={isDeleting}
      />
    </div>
  );
}

// Icon helper nhỏ
function UserIcon({ className }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
