import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCart } from '../context/CartProvider';  // Sửa lại đường dẫn import
import MainLayout from '../components/MainLayout';
import Toast from 'react-native-toast-message';
import Icon from 'react-native-vector-icons/FontAwesome';

const CheckoutScreen = ({ navigation }: any) => {
  const { cartItems, handleRemoveFromCart, clearCart } = useCart();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('cod'); // Default payment method
  const [isLoading, setIsLoading] = useState(false);
  const [userData, setUserData] = useState<any>({});

  // Tính tổng tiền đơn hàng
  const totalAmount = cartItems.reduce((sum: number, item: any) => sum + item.new_price * item.quantity, 0);

  // Load thông tin người dùng khi vào màn hình
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const userIdValue = await AsyncStorage.getItem('userId');
        if (userIdValue) {
          setUserId(userIdValue);
          
          // Fetch user data from API
          const response = await fetch(`http://192.168.1.13:5000/api/user/${userIdValue}`);
          const data = await response.json();
          
          if (data.user) {
            setUserData(data.user);
            setName(data.user.username || '');
            setPhone(data.user.phone || '');
            setAddress(data.user.address || '');
          }
        }
      } catch (error) {
        console.error('Error loading user info:', error);
      }
    };

    loadUserInfo();
  }, []);

  // Xác nhận đặt hàng
  const handlePlaceOrder = async () => {
    // Kiểm tra dữ liệu
    if (!name || !phone || !address) {
      Toast.show({
        type: 'info',
        text1: 'Thông tin không đầy đủ',
        text2: 'Vui lòng điền đầy đủ thông tin giao hàng',
        position: 'bottom',
      });
      return;
    }

    if (cartItems.length === 0) {
      Toast.show({
        type: 'info',
        text1: 'Giỏ hàng trống',
        text2: 'Vui lòng thêm sản phẩm vào giỏ hàng',
        position: 'bottom',
      });
      return;
    }

    try {
      setIsLoading(true);

      // Chuẩn bị dữ liệu đơn hàng
      const orderData = {
        userId: userId,
        name: name,
        phone: phone,
        address: address,
        paymentMethod: paymentMethod,
        items: cartItems.map((item: any) => ({
          foodId: item.food_id,
          quantity: item.quantity,
          price: item.new_price
        })),
        totalAmount: totalAmount
      };

      // Gửi đơn hàng lên API
      const response = await fetch('http://192.168.1.13:5000/api/orders/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const result = await response.json();

      if (response.ok) {
        // Xóa giỏ hàng
        clearCart();
        
        // Hiển thị thông báo thành công
        Toast.show({
          type: 'success',
          text1: 'Đặt hàng thành công',
          text2: 'Cảm ơn bạn đã đặt hàng!',
          position: 'bottom',
        });

        // Chuyển đến màn hình xác nhận đơn hàng hoặc màn hình chính
        navigation.navigate('OrderConfirmation', { orderId: result.orderId });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Đặt hàng thất bại',
          text2: result.message || 'Có lỗi xảy ra, vui lòng thử lại',
          position: 'bottom',
        });
      }
    } catch (error) {
      console.error('Error placing order:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi kết nối',
        text2: 'Không thể kết nối đến máy chủ',
        position: 'bottom',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Thanh Toán</Text>
      
      {/* THÔNG TIN GIAO HÀNG */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Thông Tin Giao Hàng</Text>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Họ Và Tên Người Nhận</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Nhập tên người nhận"
            placeholderTextColor="#999"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Số Điện Thoại</Text>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Nhập số điện thoại"
            placeholderTextColor="#999"
            keyboardType="phone-pad"
          />
        </View>
        
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Địa Chỉ Giao Hàng</Text>
          <TextInput
            style={[styles.input, { textAlignVertical: 'top' }]}
            value={address}
            onChangeText={setAddress}
            placeholder="Nhập địa chỉ giao hàng"
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
          />
        </View>
      </View>
      
      {/* PHƯƠNG THỨC THANH TOÁN */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Phương Thức Thanh Toán</Text>
        
        <TouchableOpacity
          style={[
            styles.paymentOption,
            paymentMethod === 'cod' && styles.paymentOptionSelected
          ]}
          onPress={() => setPaymentMethod('cod')}
        >
          <View style={styles.radioButton}>
            {paymentMethod === 'cod' && <View style={styles.radioButtonInner} />}
          </View>
          <Icon name="money" size={20} color="#fbc02d" style={styles.paymentIcon} />
          <Text style={styles.paymentText}>Thanh Toán Khi Nhận Hàng (COD)</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.paymentOption,
            paymentMethod === 'paypal' && styles.paymentOptionSelected,
            { opacity: 0.5 } // Disabled for now
          ]}
          // onPress={() => setPaymentMethod('paypal')} // Disabled for now
        >
          <View style={styles.radioButton}>
            {paymentMethod === 'paypal' && <View style={styles.radioButtonInner} />}
          </View>
          <Icon name="paypal" size={20} color="#0070ba" style={styles.paymentIcon} />
          <Text style={styles.paymentText}>PayPal (Đang phát triển)</Text>
        </TouchableOpacity>
      </View>
      
      {/* ĐƠN HÀNG CỦA BẠN */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Đơn Hàng Của Bạn</Text>
        
        {cartItems.map((item: any) => (
          <View key={item.food_id} style={styles.orderItem}>
            <Image 
              source={{ uri: item.image_url }} 
              style={styles.itemImage} 
            />
            <View style={styles.itemDetails}>
              <Text style={styles.itemName}>{item.food_name}</Text>
              <Text style={styles.itemPrice}>
                {item.new_price.toLocaleString()} VND x {item.quantity}
              </Text>
            </View>
            <Text style={styles.itemTotal}>
              {(item.new_price * item.quantity).toLocaleString()} VND
            </Text>
          </View>
        ))}
        
        <View style={styles.divider} />
        
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tạm Tính:</Text>
          <Text style={styles.totalValue}>{totalAmount.toLocaleString()} VND</Text>
        </View>
        
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tổng Cộng:</Text>
          <Text style={styles.grandTotal}>{totalAmount.toLocaleString()} VND</Text>
        </View>
      </View>
      
      {/* NÚT ĐẶT HÀNG */}
      <TouchableOpacity
        style={[styles.placeOrderButton, isLoading && styles.disabledButton]}
        onPress={handlePlaceOrder}
        disabled={isLoading}
      >
        <Text style={styles.placeOrderText}>
          {isLoading ? 'ĐANG XỬ LÝ...' : 'XÁC NHẬN ĐẶT HÀNG'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#23232a',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fbc02d',
    textAlign: 'center',
    marginVertical: 16,
  },
  section: {
    backgroundColor: '#2c2c34',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fbc02d',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    color: '#fff',
    borderWidth: 1,
    borderColor: '#444',
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#444',
  },
  paymentOptionSelected: {
    borderColor: '#fbc02d',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#fbc02d',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fbc02d',
  },
  paymentIcon: {
    marginRight: 10,
  },
  paymentText: {
    color: '#fff',
    fontSize: 16,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  itemDetails: {
    flex: 1,
  },
  itemName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  itemPrice: {
    color: '#ccc',
    fontSize: 12,
  },
  itemTotal: {
    color: '#fbc02d',
    fontSize: 14,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#444',
    marginVertical: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  totalLabel: {
    color: '#fff',
    fontSize: 16,
  },
  totalValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  grandTotal: {
    color: '#fbc02d',
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeOrderButton: {
    backgroundColor: '#fbc02d',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  disabledButton: {
    opacity: 0.7,
  },
  placeOrderText: {
    color: '#23232a',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CheckoutScreen;