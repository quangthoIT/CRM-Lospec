// src/components/finance/FinanceStatsCards.jsx

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet } from "lucide-react";

export function FinanceStatsCards({ stats, formatCurrency }) {
  const cards = [
    {
      title: "Tổng thu (Doanh số)",
      value: stats.income,
      icon: <TrendingUp className="h-6 w-6 text-gray-900" />,
      bg: "bg-white",
      border: "border-gray-200",
      textColor: "text-gray-900",
    },
    {
      title: "Tổng chi (Vận hành)",
      value: stats.expense,
      icon: <TrendingDown className="h-6 w-6 text-blue-600" />,
      bg: "bg-blue-50",
      border: "border-blue-200",
      textColor: "text-blue-700",
    },
    {
      title: "Lợi nhuận ròng (Ước tính)",
      value: stats.profit,
      icon:
        stats.profit >= 0 ? (
          <Wallet className="h-6 w-6 text-emerald-600" />
        ) : (
          <Wallet className="h-6 w-6 text-rose-600" />
        ),
      bg: stats.profit >= 0 ? "bg-emerald-50" : "bg-rose-50",
      border: stats.profit >= 0 ? "border-emerald-200" : "border-rose-200",
      textColor: stats.profit >= 0 ? "text-emerald-700" : "text-rose-700",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((c, i) => (
        <Card key={i} className={`${c.border} ${c.bg}`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className={`text-lg ${c.textColor}`}>
              {c.title}
            </CardTitle>
            {c.icon}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${c.textColor}`}>
              {formatCurrency(c.value)}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
