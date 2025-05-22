import React, { useContext, useRef, useEffect } from 'react';
import { 
  View, Text, TouchableOpacity, StyleSheet, Animated, 
  ScrollView, Image, Easing, Dimensions 
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { AuthContext } from '../../navigation/AppNavigator';

const { width } = Dimensions.get('window');
const MENU_WIDTH = 280;

const menuData = [
  { id: 'dashboard', title: 'Dashboard', icon: 'dashboard', screen: 'AdminHome' },
  { id: 'users', title: 'Quản lý người dùng', icon: 'users', screen: 'AdminUsers' },
  { id: 'orders', title: 'Quản lý đơn hàng', icon: 'shopping-cart', screen: 'AdminOrders' },
  { id: 'foods', title: 'Quản lý món ăn', icon: 'cutlery', screen: 'AdminFoods' },
  { id: 'categories', title: 'Quản lý danh mục', icon: 'list-alt', screen: 'AdminCategories' },
  { id: 'contacts', title: 'Quản lý liên hệ', icon: 'envelope', screen: 'AdminContacts' },
  { id: 'blogs', title: 'Quản lý bài viết', icon: 'book', screen: 'AdminBlogs' },
  { id: 'reviews', title: 'Quản lý đánh giá', icon: 'star', screen: 'AdminReviews' },
  { id: 'reports', title: 'Thống kê & Báo cáo', icon: 'bar-chart', screen: 'AdminReports' }
];

const AdminSideMenu = ({ navigation, onClose, username = '' }: any) => {
  const { signOut } = useContext(AuthContext);
  
  // Tạo các giá trị animation
  const slideAnim = useRef(new Animated.Value(-MENU_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const menuItemsAnim = useRef(menuData.map(() => new Animated.Value(0))).current;

  // Khởi động animation khi component được render
  useEffect(() => {
    // Animation cho backdrop
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // Animation cho menu trượt vào
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 300,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    
    // Animation tuần tự cho các mục menu
    menuItemsAnim.forEach((anim, index) => {
      Animated.timing(anim, {
        toValue: 1,
        duration: 300,
        delay: 100 + index * 50,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  // Hàm đóng menu với animation
  const closeWithAnimation = () => {
    // Animation cho backdrop mờ dần
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
    
    // Animation cho menu trượt ra
    Animated.timing(slideAnim, {
      toValue: -MENU_WIDTH,
      duration: 250,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      // Gọi onClose sau khi animation kết thúc
      onClose();
    });
  };

  const handleLogout = async () => {
    try {
      closeWithAnimation();
      // Đợi một chút để animation hoàn thành trước khi đăng xuất
      setTimeout(async () => {
        await signOut();
      }, 300);
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <View style={styles.overlay}>
      <Animated.View 
        style={[
          styles.bg, 
          { opacity: fadeAnim }
        ]} 
      >
        <TouchableOpacity 
          style={styles.bgTouchable} 
          activeOpacity={1} 
          onPress={closeWithAnimation} 
        />
      </Animated.View>
      
      <Animated.View 
        style={[
          styles.menu,
          { transform: [{ translateX: slideAnim }] }
        ]}
      >
        {/* Header Menu - với hiệu ứng fade in */}
        <Animated.View style={[styles.menuHeader, { opacity: fadeAnim }]}>
          <Image source={require('../../assets/logo.png')} style={styles.logo} />
          <View style={styles.userInfo}>
            <Text style={styles.username}>{username || 'Admin'}</Text>
            <Text style={styles.role}>Administrator</Text>
          </View>
        </Animated.View>
        
        {/* Divider */}
        <Animated.View style={[styles.divider, { opacity: fadeAnim }]} />
        
        {/* Menu items - với hiệu ứng xuất hiện tuần tự */}
        <ScrollView style={styles.menuItems}>
          {menuData.map((item, index) => (
            <Animated.View 
              key={item.id}
              style={{ 
                opacity: menuItemsAnim[index],
                transform: [
                  { translateX: menuItemsAnim[index].interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0]
                    })
                  }
                ]
              }}
            >
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  closeWithAnimation();
                  // Đợi animation hoàn thành rồi mới chuyển trang
                  setTimeout(() => {
                    navigation.navigate(item.screen);
                  }, 300);
                }}
              >
                <Icon name={item.icon} size={20} color="#fbc02d" style={styles.menuIcon} />
                <Text style={styles.menuText}>{item.title}</Text>
              </TouchableOpacity>
            </Animated.View>
          ))}
        </ScrollView>
        
        {/* Footer with logout button - với hiệu ứng fade in */}
        <Animated.View 
          style={[
            styles.menuFooter, 
            { 
              opacity: fadeAnim,
              transform: [
                { translateY: fadeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, 0]
                  })
                }
              ]
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.logoutButton} 
            onPress={handleLogout}
          >
            <Icon name="sign-out" size={20} color="#fff" style={styles.menuIcon} />
            <Text style={styles.logoutText}>Đăng xuất</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: { 
    position: 'absolute', 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0, 
    flexDirection: 'row', 
    zIndex: 100 
  },
  bg: { 
    flex: 1, 
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  bgTouchable: {
    width: '100%',
    height: '100%'
  },
  menu: { 
    width: MENU_WIDTH, 
    backgroundColor: '#1f1f27', 
    paddingBottom: 20,
    elevation: 8,
    flexDirection: 'column',
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 5, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 15
  },
  menuHeader: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 40
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12
  },
  userInfo: {
    flex: 1
  },
  username: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  role: {
    color: '#fbc02d',
    fontSize: 14
  },
  divider: {
    height: 1,
    backgroundColor: '#2a2a32',
    marginVertical: 10
  },
  menuItems: {
    flex: 1
  },
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 14, 
    paddingHorizontal: 20
  },
  menuIcon: {
    width: 24,
    textAlign: 'center',
    marginRight: 16
  },
  menuText: { 
    color: '#fff', 
    fontSize: 16
  },
  menuFooter: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#2a2a32'
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10
  },
  logoutText: {
    color: '#fff',
    fontSize: 16
  }
});

export default AdminSideMenu;