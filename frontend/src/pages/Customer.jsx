import { CustomerList } from "@/components/customer/CustomerList";

const CustomerPage = () => {
  return (
    <div className="mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý khách hàng</h1>
        <p className="text-gray-600">
          Danh sách khách hàng thân thiết và lịch sử mua sắm
        </p>
      </div>

      <CustomerList />
    </div>
  );
};

export default CustomerPage;
