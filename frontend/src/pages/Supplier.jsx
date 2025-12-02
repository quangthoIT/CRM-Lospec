import { SupplierList } from "@/components/supplier/SupplierList";

const Supplier = () => {
  return (
    <div className="mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Quản lý nhà cung cấp
        </h1>
        <p className="text-gray-600">Danh sách đối tác và nguồn hàng</p>
      </div>

      <SupplierList />
    </div>
  );
};

export default Supplier;
