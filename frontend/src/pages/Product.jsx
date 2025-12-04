import { ProductFormDialog } from "@/components/product/ProductFormDialog";
import { ProductList } from "@/components/product/ProductList";
import { useState } from "react";

const Product = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // State này dùng để trigger reload list mỗi khi thêm/sửa thành công
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Mở form để Thêm mới
  const handleAddClick = () => {
    setSelectedProduct(null);
    setIsDialogOpen(true);
  };

  // Mở form để Sửa
  const handleEditClick = (product) => {
    setSelectedProduct(product);
    setIsDialogOpen(true);
  };

  // Callback khi lưu thành công
  const handleSuccess = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return (
    <div className="mx-auto">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý sản phẩm</h1>
        <p className="text-gray-600">Quản lý danh mục, giá cả và tồn kho</p>
      </div>

      {/* Component Danh sách */}
      <ProductList
        onEdit={handleEditClick}
        onAddClick={handleAddClick}
        refreshTrigger={refreshTrigger}
      />

      {/* Component Form */}
      <ProductFormDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        product={selectedProduct}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default Product;
