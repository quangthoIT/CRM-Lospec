import { useState, useEffect } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ShieldAlert, Info } from "lucide-react";

const MODULES = [
  { key: "products", label: "Quản lý Sản phẩm" },
  { key: "sales", label: "Quản lý Bán hàng" },
  { key: "customers", label: "Quản lý Khách hàng" },
  { key: "warehouses", label: "Quản lý Kho hàng" },
  { key: "suppliers", label: "Quản lý Nhà cung cấp" },
  { key: "staff", label: "Quản lý Nhân viên" },
  { key: "expenses", label: "Quản lý Tài chính" },
];

export function PermissionTab() {
  const [selectedRole, setSelectedRole] = useState("manager");
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Giả lập load dữ liệu quyền khi đổi vai trò
  useEffect(() => {
    setLoading(true);
    // Thực tế sẽ gọi API: api.get(`/settings/permissions?role=${selectedRole}`)
    // Ở đây ta giả lập dữ liệu để hiển thị frontend
    setTimeout(() => {
      const mockPermissions = MODULES.map((mod) => ({
        module: mod.key,
        label: mod.label,
        // Manager full quyền, Staff hạn chế
        can_view: true,
        can_create_edit: selectedRole === "manager",
        can_delete: selectedRole === "manager" && mod.key !== "dashboard",
      }));
      setPermissions(mockPermissions);
      setLoading(false);
    }, 500);
  }, [selectedRole]);

  const handleCheckChange = (moduleKey, field, checked) => {
    setPermissions((prev) =>
      prev.map((p) => {
        if (p.module === moduleKey) {
          // Logic phụ thuộc: Nếu bỏ View thì bỏ luôn Edit/Delete
          if (field === "can_view" && !checked) {
            return {
              ...p,
              can_view: false,
              can_create_edit: false,
              can_delete: false,
            };
          }
          // Logic phụ thuộc: Nếu chọn Edit/Delete thì tự động bật View
          if (
            (field === "can_create_edit" || field === "can_delete") &&
            checked
          ) {
            return { ...p, [field]: checked, can_view: true };
          }
          return { ...p, [field]: checked };
        }
        return p;
      })
    );
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          Phân quyền người dùng
        </CardTitle>
        <CardDescription>
          Chọn một vai trò để xem và chỉnh sửa quyền truy cập cho các chức năng
          của hệ thống.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Role Selector */}
        <div className="flex flex-row items-center gap-3">
          <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
            Chọn vai trò:
          </span>
          <Select value={selectedRole} onValueChange={setSelectedRole}>
            <SelectTrigger className="w-[250px] bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="manager">Manager (Quản lý)</SelectItem>
              <SelectItem value="staff">Staff (Nhân viên)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Permission Table */}
        <div className="rounded-md border bg-white overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-100 hover:bg-gray-100">
                <TableHead className="w-[40%] font-bold text-gray-700">
                  Module Chức năng
                </TableHead>
                <TableHead className="text-center font-bold text-gray-700">
                  Xem
                </TableHead>
                <TableHead className="text-center font-bold text-gray-700">
                  Tạo / Sửa
                </TableHead>
                <TableHead className="text-center font-bold text-gray-700">
                  Xóa
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center py-8 text-gray-500"
                  >
                    Đang tải cấu hình...
                  </TableCell>
                </TableRow>
              ) : (
                permissions.map((perm) => (
                  <TableRow key={perm.module} className="hover:bg-gray-50">
                    <TableCell className="font-medium text-gray-700">
                      {perm.label}
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={perm.can_view}
                        onCheckedChange={(c) =>
                          handleCheckChange(perm.module, "can_view", c)
                        }
                        className="data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={perm.can_create_edit}
                        onCheckedChange={(c) =>
                          handleCheckChange(perm.module, "can_create_edit", c)
                        }
                        className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                      />
                    </TableCell>
                    <TableCell className="text-center">
                      <Checkbox
                        checked={perm.can_delete}
                        onCheckedChange={(c) =>
                          handleCheckChange(perm.module, "can_delete", c)
                        }
                        className="data-[state=checked]:bg-rose-600 data-[state=checked]:border-rose-600"
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center gap-2 p-3 bg-blue-50 text-blue-700 text-xs rounded border border-blue-200">
          <Info className="h-4 w-4" />
          <span>
            Lưu ý: Thay đổi quyền hạn sẽ có hiệu lực ngay lập tức đối với các
            tài khoản thuộc vai trò này.
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
