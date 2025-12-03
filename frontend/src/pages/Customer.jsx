import { CustomerList } from "@/components/customer/CustomerList";


const CustomerPage = () => {
  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Quản lý Khách hàng</h1>
        <p className="text-sm text-slate-500">Danh sách khách hàng thân thiết và lịch sử mua sắm</p>
      </div>

      <CustomerList />
    </div>
  );
};

export default CustomerPage;