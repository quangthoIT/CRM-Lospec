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
  UserIcon,
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
        <Input
          placeholder="Tìm theo tên, SĐT, người liên hệ..."
          value={searchTerm}
          icon={<Search size={20} />}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={fetchSuppliers}
            title="Làm mới"
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="default" onClick={handleAdd}>
            <Plus className="h-4 w-4" /> Thêm nhà cung cấp
          </Button>
        </div>
      </div>

      {/* Table */}
      <Table className="bg-white border border-gray-200 shadow-lg">
        <TableHeader>
          <TableRow className="bg-gray-200">
            <TableHead>Tên nhà cung cấp</TableHead>
            <TableHead>Thông tin liên hệ</TableHead>
            <TableHead>Địa chỉ</TableHead>
            <TableHead className="text-center">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-10">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-600" />
                Đang tải nhà cung cấp...
              </TableCell>
            </TableRow>
          ) : filteredSuppliers.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={4}
                className="text-center py-10 text-gray-600"
              >
                <Building2 className="h-10 w-10 mx-auto mb-2 text-gray-600" />
                Chưa có nhà cung cấp nào
              </TableCell>
            </TableRow>
          ) : (
            filteredSuppliers.map((item) => (
              <TableRow key={item.id} className="hover:bg-gray-100">
                <TableCell>
                  <div className="font-semibold text-gray-900 text-sm">
                    {item.name}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    MST: {item.tax_code || "---"}
                  </div>
                </TableCell>

                <TableCell>
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2 text-gray-600">
                      <UserIcon className="h-3 w-3" />{" "}
                      <span>{item.contact_person || "---"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Phone className="h-3 w-3" />{" "}
                      <span>{item.phone || "---"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="h-3 w-3" />{" "}
                      <span>{item.email || "---"}</span>
                    </div>
                  </div>
                </TableCell>

                <TableCell>
                  <div className="flex items-start gap-2 text-sm text-gray-600">
                    <MapPin className="h-3 w-3 mt-1 shrink-0" />
                    <span>{item.address || "---"}</span>
                  </div>
                </TableCell>

                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-blue-600 hover:bg-blue-100"
                    onClick={() => handleEdit(item)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-rose-600 hover:bg-rose-100"
                    onClick={() => handleDeleteClick(item)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

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
