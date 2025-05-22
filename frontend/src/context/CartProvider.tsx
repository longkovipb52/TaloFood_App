import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

// Định nghĩa kiểu dữ liệu cho item trong giỏ hàng
interface CartItem {
  food_id: number;
  food_name: string;
  new_price: number;
  image_url: string;
  quantity: number;
  [key: string]: any; // Cho phép các thuộc tính khác
}

interface CartContextType {
  cartItems: CartItem[];
  cartCount: number;
  handleAddToCart: (item: Omit<CartItem, 'quantity'>) => void;
  handleRemoveFromCart: (foodId: number) => void;
  handleUpdateQuantity: (foodId: number, newQuantity: number) => void;
  handleAddMultipleToCart: (item: any, quantity: number) => void;
  clearCart: () => void;
}

export const CartContext = createContext<CartContextType | null>(null);

export const useCart = (): CartContextType => {
  // Không dùng throw error, thay vào đó trả về default implementation
  const context = useContext(CartContext);
  if (!context) {
    console.warn('useCart được gọi bên ngoài CartProvider! Trả về giá trị mặc định.');
    
    // Trả về các hàm trống thay vì throw error
    return {
      cartItems: [],
      cartCount: 0,
      handleAddToCart: (item) => { console.log('Default handleAddToCart called with:', item) },
      handleRemoveFromCart: () => {},
      handleUpdateQuantity: () => {},
      handleAddMultipleToCart: () => {},
      clearCart: () => {}
    };
  }
  return context;
};

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [cartCount, setCartCount] = useState(0);

  // Load giỏ hàng từ local storage
  useEffect(() => {
    const loadCartFromStorage = async () => {
      try {
        const savedCart = await AsyncStorage.getItem('cartItems');
        if (savedCart) {
          const parsedCart = JSON.parse(savedCart);
          setCartItems(parsedCart);
          setCartCount(parsedCart.reduce((sum: number, item: CartItem) => sum + item.quantity, 0));
        }
      } catch (e) {
        console.log('Lỗi khi load giỏ hàng:', e);
      }
    };
    
    loadCartFromStorage();
  }, []);

  // Lưu giỏ hàng vào local storage mỗi khi thay đổi
  useEffect(() => {
    const saveCartToStorage = async () => {
      try {
        await AsyncStorage.setItem('cartItems', JSON.stringify(cartItems));
      } catch (e) {
        console.log('Lỗi khi lưu giỏ hàng:', e);
      }
    };
    
    saveCartToStorage();
  }, [cartItems]);

  // Sửa lại hàm handleAddToCart
  const handleAddToCart = (item: Omit<CartItem, 'quantity'>) => {
    console.log("Adding to cart:", item);
    setCartItems(prev => {
      const found = prev.find((i) => i.food_id === item.food_id);
      if (found) {
        Toast.show({
          type: 'success',
          text1: 'Đã cập nhật giỏ hàng',
          text2: `${item.food_name} (+1)`,
          visibilityTime: 2000,
          position: 'bottom',
        });
        return prev.map((i) =>
          i.food_id === item.food_id ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      
      Toast.show({
        type: 'success',
        text1: 'Đã thêm vào giỏ hàng',
        text2: item.food_name,
        visibilityTime: 2000, 
        position: 'bottom',
      });
      // Thêm "as CartItem" để chỉ rõ kiểu dữ liệu cho TypeScript
      return [...prev, { ...item, quantity: 1 } as CartItem];
    });
    setCartCount(c => c + 1);
  };

  const handleRemoveFromCart = (food_id: number) => {
    setCartItems(prev => {
      const itemToRemove = prev.find(i => i.food_id === food_id);
      if (itemToRemove) {
        setCartCount(c => Math.max(0, c - itemToRemove.quantity));
        Toast.show({
          type: 'info',
          text1: 'Đã xóa khỏi giỏ hàng',
          text2: itemToRemove.food_name,
          visibilityTime: 2000,
          position: 'bottom',
        });
      }
      return prev.filter(i => i.food_id !== food_id);
    });
  };

  const handleUpdateQuantity = (foodId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(foodId);
      return;
    }
    
    setCartItems(prev => {
      const itemToUpdate = prev.find(item => item.food_id === foodId);
      if (itemToUpdate) {
        const oldQuantity = itemToUpdate.quantity;
        setCartCount(c => c + (newQuantity - oldQuantity));
      }
      return prev.map(item => 
        item.food_id === foodId ? { ...item, quantity: newQuantity } : item
      );
    });
  };

  const handleAddMultipleToCart = (item: any, quantity: number) => {
    if (quantity <= 0) return;
    
    setCartItems(prev => {
      const found = prev.find((i) => i.food_id === item.food_id);
      if (found) {
        // Nếu sản phẩm đã tồn tại, cập nhật số lượng
        return prev.map((i) =>
          i.food_id === item.food_id 
            ? { ...i, quantity: i.quantity + quantity } 
            : i
        );
      }
      
      // Nếu là sản phẩm mới, thêm vào giỏ
      return [...prev, { ...item, quantity } as CartItem];
    });
    
    // Cập nhật tổng số lượng sản phẩm
    setCartCount(c => c + quantity);
  };
  
  const clearCart = () => {
    setCartItems([]);
    setCartCount(0);
  };

  return (
    <CartContext.Provider value={{
      cartItems,
      cartCount,
      handleAddToCart,
      handleRemoveFromCart,
      handleUpdateQuantity,
      handleAddMultipleToCart,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  );
};