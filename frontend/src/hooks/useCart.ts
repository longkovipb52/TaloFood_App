import { useContext } from 'react';
import { CartContext } from '../context/CartProvider';

// Định nghĩa interface cho kiểu dữ liệu được trả về từ hook
export interface CartContextType {
  cartItems: any[];
  cartCount: number;
  handleAddToCart: (item: any) => void;
  handleRemoveFromCart: (foodId: number) => void;
  handleUpdateQuantity: (foodId: number, newQuantity: number) => void;
  handleAddMultipleToCart: (item: any, quantity: number) => void; // Thêm phương thức này
  clearCart: () => void;
}

// Hook với kiểu dữ liệu cụ thể
export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  
  // Fallback an toàn nếu context không tồn tại
  if (!context) {
    console.warn('useCart() được gọi bên ngoài CartProvider! Đang sử dụng phiên bản giả lập.');
    return {
      cartItems: [],
      cartCount: 0,
      handleAddToCart: () => {},
      handleRemoveFromCart: () => {},
      handleUpdateQuantity: () => {},
      handleAddMultipleToCart: () => {}, // Đảm bảo phương thức này luôn có
      clearCart: () => {}
    };
  }
  
  return context;
};