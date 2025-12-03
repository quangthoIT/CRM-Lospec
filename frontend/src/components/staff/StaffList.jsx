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
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Search,
  Plus,
  RefreshCw,
  UserCog,
  Ban,
  Edit,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { StaffFormDialog } from "./StaffFormDialog";
import { ConfirmDeleteDialog } from "../ConfirmDeleteDialog";

export function StaffList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/users");
      setUsers(data || []);
    } catch (error) {
      console.error(error);
      toast.error("Không thể tải danh sách nhân viên");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setIsFormOpen(true);
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setIsFormOpen(true);
  };

  const handleDeleteClick = (user) => {
    setUserToDelete(user);
    setDeleteOpen(true);
  };

  const confirmLockUser = async () => {
    if (!userToDelete) return;
    try {
      await api.delete(`/users/${userToDelete.id}`);
      toast.success("Đã khóa tài khoản nhân viên");
      fetchUsers();
      setDeleteOpen(false);
    } catch (error) {
      toast.error("Lỗi khi khóa tài khoản");
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadge = (role) => {
    switch (role) {
      case "admin":
        return (
          <Badge className="bg-purple-100 text-purple-700 border-purple-200">
            Admin
          </Badge>
        );
      case "manager":
        return (
          <Badge className="bg-blue-100 text-blue-700 border-blue-200">
            Quản lý
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-700 border-gray-200">
            Nhân viên
          </Badge>
        );
    }
  };

  return (
    <div className="space-y-4">
      {/* Tools */}
      <div className="flex justify-between items-center bg-white p-4 rounded-lg border shadow-sm gap-4">
        <Input
          placeholder="Tìm tên, email..."
          className="pl-10"
          value={searchTerm}
          icon={<Search size={20} />}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={fetchUsers}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button variant="default" onClick={handleCreate}>
            <Plus className="h-4 w-4" /> Thêm nhân viên
          </Button>
        </div>
      </div>

      {/* Table */}
      <Table className="bg-white border border-gray-200 shadow-lg">
        <TableHeader>
          <TableRow className="bg-gray-200">
            <TableHead></TableHead>
            <TableHead>Họ và tên</TableHead>
            <TableHead>Email / Liên hệ</TableHead>
            <TableHead className="text-center">Vai trò</TableHead>
            <TableHead className="text-center">Trạng thái</TableHead>
            <TableHead className="text-center">Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8">
                Đang tải...
              </TableCell>
            </TableRow>
          ) : filteredUsers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                Chưa có nhân viên nào
              </TableCell>
            </TableRow>
          ) : (
            filteredUsers.map((user) => (
              <TableRow key={user.id} className="hover:bg-gray-50">
                <TableCell className="flex justify-center">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.avatar_url} />
                    <AvatarFallback>{user.full_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="font-medium">{user.full_name}</TableCell>
                <TableCell>
                  <div className="text-sm">{user.email}</div>
                  <div className="text-xs text-gray-500">{user.phone}</div>
                </TableCell>
                <TableCell className="text-center">
                  {getRoleBadge(user.role)}
                </TableCell>
                <TableCell className="text-center">
                  {user.is_active ? (
                    <Badge className="bg-emerald-50 text-emerald-600 border-emerald-200 shadow-none">
                      Hoạt động
                    </Badge>
                  ) : (
                    <Badge
                      variant="destructive"
                      className="bg-gray-100 text-gray-500 border-gray-200 shadow-none"
                    >
                      Đã khóa
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-blue-600 hover:bg-blue-50"
                    onClick={() => handleEdit(user)}
                    title="Chỉnh sửa"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-rose-600 hover:bg-rose-50"
                    onClick={() => handleDeleteClick(user)}
                    title="Xóa / Khóa tài khoản"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      <StaffFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        user={selectedUser}
        onSuccess={fetchUsers}
      />

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={confirmLockUser}
        title="Khóa tài khoản nhân viên?"
        description={`Bạn có chắc chắn muốn khóa tài khoản của ${userToDelete?.full_name}? Họ sẽ không thể đăng nhập được nữa.`}
        itemName={userToDelete?.full_name}
      />
    </div>
  );
}
