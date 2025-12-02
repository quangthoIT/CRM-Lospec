import { SupplierList } from "@/components/supplier/SupplierList";

const Supplier = () => {
  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Quản lý Nhà cung cấp
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Danh sách đối tác và nguồn hàng
          </p>
        </div>
      </div>

      <SupplierList />
    </div>
  );
};

export default Supplier;
