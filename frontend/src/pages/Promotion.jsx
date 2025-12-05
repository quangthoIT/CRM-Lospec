import { PromotionList } from "@/components/promotion/PromotionList";

export default function PromotionPage() {
  return (
    <div className="mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Khuyến mãi & Marketing
        </h1>
        <p className="text-gray-600">
          Tạo và quản lý các mã giảm giá, chương trình ưu đãi
        </p>
      </div>

      <PromotionList />
    </div>
  );
}
