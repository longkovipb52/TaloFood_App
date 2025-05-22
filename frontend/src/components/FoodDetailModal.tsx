import React, { useState, useEffect } from 'react';
import { Modal, View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import Toast from 'react-native-toast-message';
import { useCart, CartContextType } from '../hooks/useCart';

interface FoodDetailModalProps {
  visible: boolean;
  food: any;
  onClose: () => void;
}

const FoodDetailModal = ({ visible, food, onClose }: FoodDetailModalProps) => {
  const { handleAddMultipleToCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  // Reset quantity khi food thay đổi
  useEffect(() => {
    setQuantity(1);
  }, [food]);
  
  // Sử dụng useEffect để xử lý việc kiểm tra food thay vì trong quá trình render
  useEffect(() => {
    if (visible && (!food || !food.food_name)) {
      // Chỉ đóng modal nếu nó đang hiển thị và không có dữ liệu hợp lệ
      onClose();
    }
  }, [visible, food, onClose]);

  // Nếu không có food, chỉ đơn giản là không render nội dung
  if (!food) {
    return null;
  }

  const handleDecrease = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const handleIncrease = () => {
    setQuantity(quantity + 1);
  };

  const handleAddToCart = () => {
    handleAddMultipleToCart(food, quantity);
    Toast.show({
      type: 'success',
      text1: 'Đã thêm vào giỏ hàng',
      text2: `${food.food_name} (${quantity})`,
      visibilityTime: 2000,
      position: 'bottom',
    });
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          {/* Nút đóng */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Icon name="close" size={24} color="#fff" />
          </TouchableOpacity>
          
          {/* Hình ảnh món ăn */}
          <Image source={{ uri: food.image_url }} style={styles.foodImage} />
          
          {/* Phần thông tin */}
          <View style={styles.infoSection}>
            {/* Nhãn danh mục & đã bán */}
            <View style={styles.badgeContainer}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{food.category}</Text>
              </View>
              
              {food.total_sold && (
                <View style={styles.soldBadge}>
                  <Text style={styles.soldText}>{food.total_sold} Đã Bán</Text>
                </View>
              )}
            </View>
            
            {/* Tên món ăn */}
            <Text style={styles.foodName}>{food.food_name}</Text>
            
            {/* Đánh giá sao */}
            <View style={styles.ratingContainer}>
              {[1,2,3,4,5].map(i => (
                <Icon 
                  key={i} 
                  name={i <= Math.round(food.average_rating || 0) ? 'star' : 'star-o'} 
                  size={20} 
                  color="#fbc02d" 
                />
              ))}
              <Text style={styles.ratingText}>
                {`(${typeof food.average_rating === 'number' ? food.average_rating.toFixed(1) : '0.0'} Đánh Giá)`}
              </Text>
            </View>
            
            {/* Giá */}
            <View style={styles.priceContainer}>
              <Text style={styles.priceNew}>{food.new_price?.toLocaleString()}đ</Text>
              {typeof food.price === 'number' && food.price > food.new_price && (
                <>
                  <Text style={styles.priceOld}>{food.price?.toLocaleString()}đ</Text>
                  <View style={styles.discountBadge}>
                    <Text style={styles.discountText}>
                      {Math.round(((food.price - food.new_price) / food.price) * 100)}%
                    </Text>
                  </View>
                </>
              )}
            </View>
            
            {/* Mô tả sản phẩm */}
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionTitle}>Mô Tả Sản Phẩm</Text>
              <Text style={styles.descriptionText}>{food.description}</Text>
            </View>
            
            {/* Điều chỉnh số lượng */}
            <View style={styles.quantityContainer}>
              <Text style={styles.quantityLabel}>Số Lượng:</Text>
              <View style={styles.quantityControls}>
                <TouchableOpacity 
                  style={styles.quantityBtn} 
                  onPress={handleDecrease}
                >
                  <Icon name="minus" size={16} color="#23232a" />
                </TouchableOpacity>
                
                <Text style={styles.quantityText}>{quantity}</Text>
                
                <TouchableOpacity 
                  style={styles.quantityBtn} 
                  onPress={handleIncrease}
                >
                  <Icon name="plus" size={16} color="#23232a" />
                </TouchableOpacity>
              </View>
            </View>
            
            {/* Nút thêm vào giỏ hàng */}
            <TouchableOpacity style={styles.addToCartBtn} onPress={handleAddToCart}>
              <Icon name="shopping-cart" size={20} color="#23232a" style={{marginRight: 8}} />
              <Text style={styles.addToCartText}>THÊM VÀO GIỎ HÀNG</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxHeight: '90%',
    backgroundColor: '#23232a',
    borderRadius: 16,
    overflow: 'hidden',
  },
  closeButton: {
    position: 'absolute',
    right: 15,
    top: 15,
    zIndex: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  infoSection: {
    padding: 16,
  },
  badgeContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: '#444',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    marginRight: 8,
  },
  categoryText: {
    color: '#fbc02d',
    fontWeight: 'bold',
    fontSize: 13,
  },
  soldBadge: {
    backgroundColor: '#fbc02d',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  soldText: {
    color: '#23232a',
    fontWeight: 'bold',
    fontSize: 13,
  },
  foodName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  ratingText: {
    marginLeft: 8,
    color: '#aaa',
    fontSize: 14,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  priceNew: {
    color: '#fbc02d',
    fontSize: 26,
    fontWeight: 'bold',
    marginRight: 10,
  },
  priceOld: {
    color: '#aaa',
    fontSize: 18,
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  discountBadge: {
    backgroundColor: '#e53935',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  descriptionContainer: {
    marginBottom: 20,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  descriptionText: {
    color: '#ddd',
    lineHeight: 20,
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityBtn: {
    backgroundColor: '#fbc02d',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 16,
  },
  addToCartBtn: {
    flexDirection: 'row',
    backgroundColor: '#fbc02d',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addToCartText: {
    color: '#23232a',
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default FoodDetailModal;