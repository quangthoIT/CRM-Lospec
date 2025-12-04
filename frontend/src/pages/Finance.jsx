import { useState, useEffect } from "react";
import api from "../config/api";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, TrendingUp, TrendingDown, Wallet, Filter } from "lucide-react";
import { FinanceTable } from "../components/finance/FinanceTable";
import { ExpenseFormDialog } from "../components/finance/ExpenseFormDialog";
import { toast } from "sonner";
import { FinanceStatsCards } from "@/components/finance/FinanceStatsCards";

export default function FinancePage() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");

  const [startDate, setStartDate] = useState(
    new Date(new Date().setDate(1)).toISOString().split("T")[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null); // ✅ State lưu item đang sửa

  const [stats, setStats] = useState({ income: 0, expense: 0, profit: 0 });

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [expenseRes, orderRes] = await Promise.all([
        api.get(`/finances/expenses?startDate=${startDate}&endDate=${endDate}`),
        api.get(
          `/orders?status=completed&startDate=${startDate}&endDate=${endDate}`
        ),
      ]);

      const expenseList = (expenseRes.data || []).map((e) => ({
        uniqueId: `exp-${e.id}`,
        id: e.id,
        type: "expense",
        date: e.expense_date,
        title: e.title,
        subTitle: e.notes,
        amount: Number(e.amount),
        category: e.category,
        payment_method: e.payment_method,
        created_by: e.created_by,
        created_at: e.created_at,
        // Giữ nguyên data gốc để tiện bind vào form sửa
        expense_date: e.expense_date,
        notes: e.notes,
      }));

      const orderList = (orderRes.data || [])
        .filter((o) => {
          const d = o.created_at.split("T")[0];
          return d >= startDate && d <= endDate;
        })
        .map((o) => ({
          uniqueId: `ord-${o.id}`,
          id: o.id,
          type: "income",
          date: o.created_at,
          title: `Đơn hàng ${o.order_number}`,
          subTitle: o.customer_name ? `Khách: ${o.customer_name}` : "Khách lẻ",
          amount: Number(o.total),
          category: "sales",
          payment_method: o.payment_method,
          created_by: o.staff_name,
          created_at: o.created_at,
        }));

      const mergedList = [...expenseList, ...orderList].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setTransactions(mergedList);

      const totalIncome = orderList.reduce((sum, item) => sum + item.amount, 0);
      const totalExpense = expenseList.reduce(
        (sum, item) => sum + item.amount,
        0
      );
      setStats({
        income: totalIncome,
        expense: totalExpense,
        profit: totalIncome - totalExpense,
      });
    } catch (error) {
      console.error("Error fetching finance data:", error);
      toast.error("Lỗi tải dữ liệu tài chính");
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingExpense(null); // Reset editing
    setShowExpenseForm(true);
  };

  // ✅ Hàm xử lý khi bấm nút Sửa
  const handleEdit = (item) => {
    // Chuyển item từ table format về đúng format form cần (nếu cần thiết)
    // Ở đây ta đã map đủ trong fetchData
    setEditingExpense(item);
    setShowExpenseForm(true);
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(val || 0);

  const displayedTransactions = transactions.filter((t) => {
    if (activeTab === "all") return true;
    return t.type === activeTab;
  });

  return (
    <div className="mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Tài chính & Kế toán
          </h1>
          <p className="text-sm text-gray-500">
            Quản lý dòng tiền, thu chi và lợi nhuận
          </p>{" "}
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="flex items-center bg-white border border-gray-200 rounded px-2 py-1"
          />
          <span className="text-gray-600 text-sm">đến</span>
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="flex items-center bg-white border border-gray-200 rounded px-2 py-1"
          />
        </div>
      </div>

      {/* Stats Cards */}
      <FinanceStatsCards stats={stats} formatCurrency={formatCurrency} />

      {/* Main Content */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="mt-4 space-y-2"
      >
        <div className="flex justify-between items-center">
          <TabsList>
            <TabsTrigger
              value="all"
              className="text-gray-400 data-[state=active]:text-gray-900"
            >
              Tất cả
            </TabsTrigger>
            <TabsTrigger
              value="income"
              className="text-gray-400 data-[state=active]:text-gray-900"
            >
              Nguồn thu
            </TabsTrigger>
            <TabsTrigger
              value="expense"
              className="text-gray-400 data-[state=active]:text-gray-900"
            >
              Nguồn chi
            </TabsTrigger>
          </TabsList>

          {(activeTab === "all" || activeTab === "expense") && (
            <Button
              variant="default"
              onClick={handleCreate}
              className="bg-rose-600 hover:bg-rose-700"
            >
              <Plus className="h-4 w-4" /> Tạo phiếu chi
            </Button>
          )}
        </div>

        <TabsContent value="all" className="mt-0">
          <FinanceTable
            data={displayedTransactions}
            loading={loading}
            onRefresh={fetchData}
            onEdit={handleEdit}
          />
        </TabsContent>
        <TabsContent value="income" className="mt-0">
          <FinanceTable
            data={displayedTransactions}
            loading={loading}
            onRefresh={fetchData}
            onEdit={handleEdit}
          />
        </TabsContent>
        <TabsContent value="expense" className="mt-0">
          <FinanceTable
            data={displayedTransactions}
            loading={loading}
            onRefresh={fetchData}
            onEdit={handleEdit}
          />
        </TabsContent>
      </Tabs>

      <ExpenseFormDialog
        open={showExpenseForm}
        onOpenChange={setShowExpenseForm}
        onSuccess={fetchData}
        expense={editingExpense}
      />
    </div>
  );
}
