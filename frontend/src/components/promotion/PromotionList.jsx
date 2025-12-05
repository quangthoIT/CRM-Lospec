import { useState, useEffect } from "react";
import api from "../../config/api";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Copy,
  Tag,
  Clock,
  RefreshCw,
  Percent,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { PromotionFormDialog } from "./PromotionFormDialog";
import { ConfirmDeleteDialog } from "../ConfirmDeleteDialog";

export function PromotionList() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Dialog States
  const [showForm, setShowForm] = useState(false);
  const [editingPromo, setEditingPromo] = useState(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deletingPromo, setDeletingPromo] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchPromotions();
  }, []);

  const fetchPromotions = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/promotions");
      setPromotions(data || []);
    } catch (error) {
      console.error(error);
      toast.error("Lỗi tải danh sách khuyến mãi");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (promo) => {
    setEditingPromo(promo);
    setShowForm(true);
  };

  const handleCreate = () => {
    setEditingPromo(null);
    setShowForm(true);
  };

  const handleDelete = async () => {
    if (!deletingPromo) return;
    setIsDeleting(true);
    try {
      await api.delete(`/promotions/${deletingPromo.id}`);
      toast.success("Đã xóa mã khuyến mãi");
      setShowDelete(false);
      fetchPromotions();
    } catch (error) {
      toast.error("Lỗi khi xóa mã");
    } finally {
      setIsDeleting(false);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success("Đã sao chép mã: " + code);
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val);
  const formatDate = (d) => new Date(d).toLocaleDateString("vi-VN");

  // Logic hiển thị trạng thái
  const getStatus = (promo) => {
    if (!promo.is_active)
      return (
        <Badge variant="secondary" className="text-gray-500 bg-gray-100">
          Tạm dừng
        </Badge>
      );

    const now = new Date();
    const start = new Date(promo.start_date);
    const end = new Date(promo.end_date);

    if (now < start)
      return <Badge className="bg-blue-100 text-blue-700">Sắp diễn ra</Badge>;
    if (now > end)
      return (
        <Badge variant="outline" className="text-rose-600 border-rose-200">
          Đã hết hạn
        </Badge>
      );

    if (promo.usage_limit > 0 && promo.used_count >= promo.usage_limit) {
      return (
        <Badge className="bg-orange-100 text-orange-700">Hết lượt dùng</Badge>
      );
    }

    return (
      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
        Đang chạy
      </Badge>
    );
  };

  const filteredPromotions = promotions.filter(
    (p) =>
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Tools */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-lg border shadow-sm">
        <Input
          placeholder="Tìm mã hoặc tên chương trình..."
          icon={<Search size={20} />}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
        <div className="flex gap-2 w-full md:w-auto">
          <Button variant="outline" size="icon" onClick={fetchPromotions}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button
            className="bg-emerald-600 hover:bg-emerald-700 flex-1 md:flex-none gap-2"
            onClick={handleCreate}
          >
            <Plus className="h-4 w-4" /> Tạo khuyến mãi
          </Button>
        </div>
      </div>

      {/* List */}
      <Table className="bg-white border border-gray-200 shadow-lg">
        <TableHeader>
          <TableRow className="bg-gray-200">
            <TableHead>Mã Code</TableHead>
            <TableHead>Tên chương trình</TableHead>
            <TableHead>Loại giảm</TableHead>
            <TableHead>Thời gian</TableHead>
            <TableHead className="text-center">Lượt dùng</TableHead>
            <TableHead className="text-center">Trạng thái</TableHead>
            <TableHead className="text-center">Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8">
                <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-600" />
              </TableCell>
            </TableRow>
          ) : filteredPromotions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                Không có chương trình khuyến mãi nào
              </TableCell>
            </TableRow>
          ) : (
            filteredPromotions.map((promo) => (
              <TableRow key={promo.id} className="hover:bg-gray-100">
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      size="sm"
                      className="font-mono font-bold text-xs border-gray-300 bg-white text-gray-600"
                    >
                      {promo.code}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 text-gray-400 hover:text-blue-600"
                      onClick={() => copyCode(promo.code)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="font-medium text-sm">{promo.name}</div>
                  <div className="text-xs text-gray-600">
                    Đơn tối thiểu: {formatCurrency(promo.min_order_value)}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 font-bold text-sm text-emerald-600">
                    {promo.type === "percentage" ? (
                      <Percent className="h-4 w-4" />
                    ) : (
                      <Tag className="h-4 w-4" />
                    )}
                    {promo.type === "percentage"
                      ? `${promo.value}%`
                      : formatCurrency(promo.value)}
                  </div>
                  {promo.type === "percentage" && promo.max_discount > 0 && (
                    <div className="text-xs text-gray-600">
                      Tối đa: {formatCurrency(promo.max_discount)}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <span className="text-emerald-600 font-medium">Từ: </span>
                    {formatDate(promo.start_date)}
                  </div>

                  <div className="text-xs">
                    <span className="text-emerald-600 font-medium">Đến: </span>
                    {formatDate(promo.end_date)}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className="font-bold text-emerald-600 text-sm">
                    {promo.used_count}
                  </span>
                  <span className="text-gray-600 text-sm">
                    {" "}
                    / {promo.usage_limit === 0 ? "∞" : promo.usage_limit}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  {getStatus(promo)}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex justify-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(promo)}
                      className="text-blue-600 hover:bg-blue-100"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        setDeletingPromo(promo);
                        setShowDelete(true);
                      }}
                      className="text-rose-600 hover:bg-rose-100"
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

      {/* Dialogs */}
      <PromotionFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        promotion={editingPromo}
        onSuccess={fetchPromotions}
      />

      <ConfirmDeleteDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        onConfirm={handleDelete}
        loading={isDeleting}
        title="Xóa khuyến mãi?"
        description={`Bạn có chắc chắn muốn xóa mã "${deletingPromo?.code}" không?`}
        itemName={deletingPromo?.code}
      />
    </div>
  );
}
