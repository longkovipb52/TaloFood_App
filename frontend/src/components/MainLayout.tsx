import React, { useState, useEffect, useContext } from 'react'; // Thêm useEffect và useContext
import { View, TouchableOpacity, Image, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import SideMenu from './SideMenu';
import CartModal from './CartModal';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCart } from '../context/CartProvider';
import { AuthContext } from '../navigation/AppNavigator';

const MainLayout = ({ children, navigation }: any) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  // Sử dụng CartContext từ CartProvider
  const { cartItems, cartCount, handleRemoveFromCart, handleUpdateQuantity } = useCart();

  // Sử dụng AuthContext từ AppNavigator
  const { signOut } = useContext(AuthContext);

  // Thêm useEffect để lấy thông tin ảnh đại diện
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        // Lấy userId từ AsyncStorage
        const userIdValue = await AsyncStorage.getItem('userId');
        if (userIdValue) {
          setUserId(userIdValue);
          
          // Fetch thông tin user từ API
          const response = await fetch(`http://192.168.1.13:5000/api/user/${userIdValue}`);
          const data = await response.json();
          
          // Nếu user có profile_image, lưu đường dẫn
          if (data.user && data.user.profile_image) {
            setProfileImage(`http://192.168.1.13:5000/profile_images/${data.user.profile_image}`);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  const handleCheckout = () => {
    setShowCart(false);
    navigation.navigate('Checkout');
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Header */}
      <View style={styles.header}>
        {/* Logo */}
        <TouchableOpacity onPress={() => navigation.navigate('Home')}>
          <View style={styles.logoContainer}>
            <Image source={require('../assets/logo.png')} style={styles.logo} resizeMode="contain" />
          </View>
        </TouchableOpacity>

        {/* Cart Icon */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity
            style={styles.iconContainer}
            onPress={() => setShowCart(true)}
          >
            <Icon name="shopping-cart" size={24} color="#fbc02d" />
            {cartCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{cartCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Account Icon - Thay bằng Profile Image nếu có */}
          <TouchableOpacity
            style={styles.iconContainer}
            onPress={() => setShowAccount(!showAccount)}
          >
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <Icon name="user-circle" size={24} color="#fbc02d" />
            )}
          </TouchableOpacity>

          {/* Menu Icon */}
          <TouchableOpacity
            style={styles.iconContainer}
            onPress={() => setShowMenu(!showMenu)}
          >
            <Icon name="bars" size={24} color="#fbc02d" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Nội dung */}
      <View style={{ flex: 1 }}>
        {children}
      </View>

      {/* Account Dropdown */}
      {showAccount && (
        <View style={styles.accountDropdown}>
          <TouchableOpacity
            style={styles.accountItem}
            onPress={() => {
              setShowAccount(false);
              navigation.navigate('OrderHistory');
            }}
          >
            <Icon name="history" size={18} color="#fbc02d" style={{ marginRight: 8 }} />
            <Text style={styles.accountText}>Lịch sử đơn hàng</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.accountItem}
            onPress={() => {
              setShowAccount(false);
              navigation.navigate('Profile');
            }}
          >
            <Icon name="id-card" size={18} color="#fbc02d" style={{ marginRight: 8 }} />
            <Text style={styles.accountText}>Thông tin cá nhân</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.accountItem}
            onPress={async () => {
              setShowAccount(false);
              await signOut(); // Gọi hàm signOut từ context
            }}
          >
            <Icon name="sign-out" size={18} color="#fbc02d" style={{ marginRight: 8 }} />
            <Text style={styles.accountText}>Đăng xuất</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* SIDEMENU */}
      {showMenu && (
        <SideMenu navigation={navigation} onClose={() => setShowMenu(false)}>
          {/* Thêm vào menu điều hướng */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => {
              navigation.navigate('OrderHistory');
              // Đóng menu nếu cần
              setShowMenu(false);
            }}
          >
            <Icon name="history" size={18} color="#fbc02d" style={{ marginRight: 8 }} />
            <Text style={styles.menuItemText}>Lịch sử đơn hàng</Text>
          </TouchableOpacity>
        </SideMenu>
      )}

      {/* CART MODAL */}
      <CartModal
        visible={showCart}
        onClose={() => setShowCart(false)}
        cartItems={cartItems}
        onRemove={handleRemoveFromCart}
        onCheckout={handleCheckout}
        onUpdateQuantity={handleUpdateQuantity}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    height: 60, // Tăng chiều cao header một chút
    backgroundColor: '#23232a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    elevation: 8,
    zIndex: 20,
  },
  logoContainer: {
    height: 40,
    width: 120, // Điều chỉnh độ rộng logo để hiển thị đầy đủ
    justifyContent: 'center',
  },
  logo: {
    height: '100%',
    width: '100%',
    // Bỏ borderRadius để logo hiển thị đầy đủ không bị cắt
    // Bỏ borderWidth để không có viền làm ảnh hưởng đến logo
  },
  iconContainer: {
    marginLeft: 16,
  },
  profileImage: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#fbc02d',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#e53935',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
    zIndex: 2,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
  },
  accountDropdown: {
    position: 'absolute',
    top: 58,
    right: 18,
    backgroundColor: '#23232a',
    borderRadius: 10,
    paddingVertical: 8,
    width: 190,
    elevation: 10,
    zIndex: 50,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  accountText: {
    color: '#fff',
    fontSize: 15,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemText: {
    color: '#fff',
    fontSize: 15,
  },
});

export default MainLayout;