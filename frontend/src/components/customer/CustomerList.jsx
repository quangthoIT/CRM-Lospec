import { useState, useEffect } from "react";
import api from "../../config/api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Search,
  UserPlus,
  Eye,
  Edit,
  Trash2,
  Star,
  Phone,
  Mail,
  ShoppingBag,
  TrendingUp,
  Award,
  Loader2,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { CustomerFormDialog } from "./CustomerFormDialog";
import { ConfirmDeleteDialog } from "../ConfirmDeleteDialog";

export function CustomerList() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [tierFilter, setTierFilter] = useState("all");

  const [showFormDialog, setShowFormDialog] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);

  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingCustomer, setDeletingCustomer] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [search, tierFilter]);

  // Helpers Map
  const mapTypeToTier = (type) => {
    if (type === "vip") return "diamond";
    if (type === "wholesale") return "gold";
    return "bronze";
  };

  const mapTierToType = (tier) => {
    if (tier === "diamond") return "vip";
    if (tier === "gold") return "wholesale";
    return "regular";
  };

  // Lấy danh sách khách hàng
  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/customers", {
        params: {
          search: search,
          type: tierFilter === "all" ? undefined : mapTierToType(tierFilter),
        },
      });

      const normalizedCustomers = Array.isArray(data)
        ? data.map((customer) => ({
            id: customer.id,
            code: customer.id?.substring(0, 8).toUpperCase(),
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            address: customer.address,
            city: customer.city,
            dateOfBirth: customer.birth_date,
            gender: customer.gender,
            customer_type: customer.customer_type,
            membershipTier: mapTypeToTier(customer.customer_type),
            loyaltyPoints: Number(customer.loyalty_points || 0),
            totalOrders: Number(customer.total_orders || 0),
            totalSpent: Number(customer.total_spent || 0),
            notes: customer.notes,
            createdAt: customer.created_at,
          }))
        : [];

      setCustomers(normalizedCustomers);
    } catch (error) {
      console.error("Error fetching customers:", error);
      toast.error("Không thể tải danh sách khách hàng");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  // Xem chi tiết
  const viewCustomerDetail = async (customer) => {
    try {
      const { data } = await api.get(`/customers/${customer.id}`);
      setSelectedCustomer({ ...customer, ...data });
      setShowDetailDialog(true);
    } catch (error) {
      toast.error("Lỗi tải chi tiết khách hàng");
    }
  };

  // Xóa khách hàng
  const handleDelete = async () => {
    if (!deletingCustomer) return;
    setIsDeleting(true);

    try {
      await api.delete(`/customers/${deletingCustomer.id}`);
      toast.success("Xóa khách hàng thành công");
      setShowDeleteDialog(false);
      setDeletingCustomer(null);
      fetchCustomers();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(error.response?.data?.message || "Lỗi khi xóa khách hàng");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(value);

  const getTierColor = (tier) => {
    const colors = {
      bronze: "bg-amber-100 text-amber-700 border border-amber-400",
      gold: "bg-yellow-100 text-yellow-700 border border-yellow-400",
      diamond: "bg-cyan-100 text-cyan-700 border border-cyan-400",
    };
    return colors[tier] || "bg-gray-100 text-gray-700";
  };

  const getTierLabel = (tier) => {
    const labels = { bronze: "Đồng", gold: "Vàng", diamond: "Kim Cương" };
    return labels[tier] || "Thường";
  };

  return (
    <div className="space-y-4">
      {/* Header*/}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-lg border shadow-sm">
        <Input
          placeholder="Tìm theo tên, SĐT..."
          value={search}
          icon={<Search size="20" />}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchCustomers()}
        />
        {/* Filter */}
        <div className="flex gap-2">
          <Select
            value={tierFilter}
            onValueChange={(val) => {
              setTierFilter(val);
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Hạng thành viên" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả hạng</SelectItem>
              <SelectItem value="bronze">Đồng</SelectItem>
              <SelectItem value="gold">Vàng</SelectItem>
              <SelectItem value="diamond">Kim Cương</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={() => {
            setEditingCustomer(null);
            setShowFormDialog(true);
          }}
          variant="default"
        >
          <UserPlus className="h-4 w-4 mr-2" /> Thêm khách hàng
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 flex flex-row items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-gray-600">Tổng khách hàng</p>
            <p className="text-3xl font-bold text-gray-900">
              {customers.length}
            </p>
          </div>
          <div className="p-2 bg-emerald-100 rounded-md">
            <UserPlus className="h-5 w-5 text-emerald-600" />
          </div>
        </Card>
        <Card className="p-4 flex flex-row items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-gray-600">Khách VIP/Sỉ</p>
            <p className="text-3xl font-bold text-gray-900">
              {
                customers.filter((c) =>
                  ["gold", "diamond"].includes(c.membershipTier)
                ).length
              }
            </p>
          </div>
          <div className="p-2 bg-purple-100 rounded-md">
            <Star className="h-5 w-5 text-purple-600" />
          </div>
        </Card>
        <Card className="p-4 flex flex-row items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-gray-600">Tổng đơn hàng</p>
            <p className="text-3xl font-bold text-gray-900">
              {customers.reduce((sum, c) => sum + c.totalOrders, 0)}
            </p>
          </div>
          <div className="p-2 bg-blue-100 rounded-md">
            <ShoppingBag className="h-5 w-5 text-blue-600" />
          </div>
        </Card>
        <Card className="p-4 flex flex-row items-center justify-between shadow-sm">
          <div>
            <p className="text-sm text-gray-600">Tổng doanh thu</p>
            <p className="text-3xl font-bold text-gray-900">
              {formatCurrency(
                customers.reduce((sum, c) => sum + c.totalSpent, 0)
              )}
            </p>
          </div>
          <div className="p-2 bg-amber-100 rounded-md">
            <TrendingUp className="h-5 w-5 text-amber-600" />
          </div>
        </Card>
      </div>

      {/* Table */}
      <Table className="bg-white border border-gray-200 shadow-lg">
        <TableHeader>
          <TableRow className="bg-gray-200">
            <TableHead>Mã KH</TableHead>
            <TableHead>Tên khách hàng</TableHead>
            <TableHead>Liên hệ</TableHead>
            <TableHead>Địa chỉ</TableHead>
            <TableHead className="text-center">Hạng</TableHead>
            <TableHead className="text-center">Tổng chi</TableHead>
            <TableHead className="text-center">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8">
                <Loader2 className="mx-auto animate-spin text-emerald-600" />
              </TableCell>
            </TableRow>
          ) : customers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-gray-600">
                Không tìm thấy khách hàng
              </TableCell>
            </TableRow>
          ) : (
            customers.map((customer) => (
              <TableRow key={customer.id} className="hover:bg-gray-100">
                <TableCell className="font-mono text-gray-600 text-xs">
                  {customer.code}
                </TableCell>
                <TableCell>
                  <div className="font-medium">{customer.name}</div>
                  {customer.dateOfBirth && (
                    <div className="text-xs text-gray-400">
                      Ngày sinh:{" "}
                      {new Date(customer.dateOfBirth).toLocaleDateString(
                        "vi-VN"
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div className="text-xs flex items-center text-gray-600 gap-2">
                    <Phone className="h-3 w-3" /> {customer.phone || "---"}
                  </div>
                  {customer.email && (
                    <div className="text-xs text-gray-600 flex items-center gap-2">
                      <Mail className="h-3 w-3" /> {customer.email}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <div
                    className="text-xs truncate"
                    title={
                      customer.address +
                      (customer.city ? `, ${customer.city}` : "")
                    }
                  >
                    {customer.address
                      ? `${customer.address}${
                          customer.city ? `, ${customer.city}` : ""
                        }`
                      : "---"}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Badge className={getTierColor(customer.membershipTier)}>
                    {getTierLabel(customer.membershipTier)}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium text-emerald-600 text-center">
                  {formatCurrency(customer.totalSpent)}
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-blue-600 hover:bg-blue-100"
                    onClick={() => viewCustomerDetail(customer)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-600 hover:bg-gray-200"
                    onClick={() => {
                      setEditingCustomer(customer);
                      setShowFormDialog(true);
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-rose-600 hover:bg-rose-100"
                    onClick={() => {
                      setDeletingCustomer(customer);
                      setShowDeleteDialog(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <CustomerFormDialog
        open={showFormDialog}
        onOpenChange={setShowFormDialog}
        customer={editingCustomer}
        onSuccess={fetchCustomers}
      />

      {/* Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Hồ sơ khách hàng</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 bg-white p-4 rounded-md border">
                <div>
                  <p className="text-xs text-gray-600">Họ tên</p>
                  <p className="font-medium text-base text-gray-900">
                    {selectedCustomer.name}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Số điện thoại</p>
                  <p className="font-medium text-base text-gray-900">
                    {selectedCustomer.phone}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Email</p>
                  <p className="text-sm text-gray-900">
                    {selectedCustomer.email || "---"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Địa chỉ</p>
                  <p className="text-sm text-gray-900">
                    {selectedCustomer.address}
                    {selectedCustomer.city ? `, ${selectedCustomer.city}` : ""}
                  </p>
                </div>
                <div>
                  <Badge
                    className={getTierColor(selectedCustomer.membershipTier)}
                  >
                    {getTierLabel(selectedCustomer.membershipTier)}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Ngày sinh</p>
                  <p className="text-sm text-gray-900">
                    {selectedCustomer.dateOfBirth
                      ? new Date(
                          selectedCustomer.dateOfBirth
                        ).toLocaleDateString("vi-VN")
                      : "---"}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3 flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" /> Lịch sử mua hàng gần đây
                </h4>
                <Table className="bg-white border border-gray-200 shadow-lg">
                  <TableHeader>
                    <TableRow className="bg-gray-200">
                      <TableHead>Mã đơn</TableHead>
                      <TableHead>Ngày mua</TableHead>
                      <TableHead className="text-center">Tổng tiền</TableHead>
                      <TableHead className="text-center">Trạng thái</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedCustomer.recent_orders?.length > 0 ? (
                      selectedCustomer.recent_orders.map((order) => (
                        <TableRow key={order.id} className="hover:bg-gray-100">
                          <TableCell className="font-mono text-xs">
                            {order.order_number}
                          </TableCell>
                          <TableCell>
                            {new Date(order.created_at).toLocaleDateString(
                              "vi-VN"
                            )}
                          </TableCell>
                          <TableCell className="text-center font-medium">
                            {formatCurrency(order.total)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">{order.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={4}
                          className="text-center py-4 text-gray-600"
                        >
                          Chưa có đơn hàng nào
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <DialogFooter>
                <Button onClick={() => setShowDetailDialog(false)}>Đóng</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <ConfirmDeleteDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        title="Xóa khách hàng?"
        itemName={deletingCustomer?.name}
        description="Bạn có chắc muốn xóa khách hàng này? Hành động này không thể hoàn tác và sẽ ẩn khách hàng khỏi danh sách."
        loading={isDeleting}
      />
    </div>
  );
}
