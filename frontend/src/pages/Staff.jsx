import { StaffList } from "@/components/staff/StaffList";

const StaffPage = () => {
  return (
    <div className="mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý nhân sự</h1>
        <p className="text-gray-600">
          Quản lý danh sách nhân viên và phân quyền hệ thống
        </p>
      </div>

      <StaffList />
    </div>
  );
};

export default StaffPage;
