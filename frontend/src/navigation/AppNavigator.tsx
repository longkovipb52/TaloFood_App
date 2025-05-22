import React, { useState, useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';

// Màn hình người dùng
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import MenuScreen from '../screens/MenuScreen';
import ProfileScreen from '../screens/ProfileScreen';
import OrderHistoryScreen from '../screens/OrderHistoryScreen';
import OrderConfirmationScreen from '../screens/OrderConfirmationScreen';
import CheckoutScreen from '../screens/CheckoutScreen';
import ReviewScreen from '../screens/ReviewScreen';
import ContactScreen from '../screens/ContactScreen';
import BlogScreen from '../screens/BlogScreen';
import BlogDetailScreen from '../screens/BlogDetailScreen';
import AboutScreen from '../screens/AboutScreen';

// Màn hình admin
import AdminHomeScreen from '../screens/admin/AdminHomeScreen';
import AdminUsers from '../screens/admin/AdminUsers';
import AdminOrders from '../screens/admin/AdminOrders';
import AdminFoods from '../screens/admin/AdminFoods';
import AdminCategories from '../screens/admin/AdminCategories';
import AdminContacts from '../screens/admin/AdminContacts';
import AdminBlogs from '../screens/admin/AdminBlogs';
import AdminReviews from '../screens/admin/AdminReviews';
import AdminReports from '../screens/admin/AdminReports';

const Stack = createStackNavigator();

// Định nghĩa kiểu dữ liệu cho AuthContext
interface AuthContextType {
  signIn: (token: string, role: string) => Promise<void>;
  signOut: () => Promise<void>;
}

// Tạo Context với giá trị mặc định
export const AuthContext = React.createContext<AuthContextType>({
  signIn: async () => {},
  signOut: async () => {},
});

const AppNavigator = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  
  const authContext = React.useMemo(() => ({
    signIn: async (token: string, role: string) => {
      setUserToken(token);
      setUserRole(role);
    },
    signOut: async () => {
      // Xóa thông tin người dùng từ AsyncStorage
      await AsyncStorage.removeItem('userId');
      await AsyncStorage.removeItem('username');
      await AsyncStorage.removeItem('userRole'); 
      await AsyncStorage.removeItem('token');
      
      // Cập nhật state
      setUserToken(null);
      setUserRole(null);
    }
  }), []);
  
  useEffect(() => {
    const bootstrapAsync = async () => {
      let token = null;
      let role = null;
      
      try {
        token = await AsyncStorage.getItem('token');
        role = await AsyncStorage.getItem('userRole');
      } catch (e) {
        console.log('Failed to load user token or role:', e);
      }
      
      setUserToken(token);
      setUserRole(role);
      setIsLoading(false);
    };
    
    bootstrapAsync();
  }, []);
  
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#23232a' }}>
        <ActivityIndicator size="large" color="#fbc02d" />
      </View>
    );
  }

  return (
    <AuthContext.Provider value={authContext}>
      <Stack.Navigator>
        {userToken == null ? (
          // Màn hình khi chưa đăng nhập
          <>
            <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
          </>
        ) : userRole === '1' ? (
          // Màn hình cho admin
          <>
            <Stack.Screen name="AdminHome" component={AdminHomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="AdminUsers" component={AdminUsers} options={{ headerShown: false }} />
            <Stack.Screen name="AdminOrders" component={AdminOrders} options={{ headerShown: false }} />
            <Stack.Screen name="AdminFoods" component={AdminFoods} options={{ headerShown: false }} />
            <Stack.Screen name="AdminCategories" component={AdminCategories} options={{ headerShown: false }} />
            <Stack.Screen name="AdminContacts" component={AdminContacts} options={{ headerShown: false }} />
            <Stack.Screen name="AdminBlogs" component={AdminBlogs} options={{ headerShown: false }} />
            <Stack.Screen name="AdminReviews" component={AdminReviews} options={{ headerShown: false }} />
            <Stack.Screen name="AdminReports" component={AdminReports} options={{ headerShown: false }} />
          </>
        ) : (
          // Màn hình cho người dùng thường
          <>
            <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Menu" component={MenuScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Profile" component={ProfileScreen} options={{ headerShown: false }} />
            <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} options={{ headerShown: false }} />
            <Stack.Screen name="OrderConfirmation" component={OrderConfirmationScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Review" component={ReviewScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Contact" component={ContactScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Blog" component={BlogScreen} options={{ headerShown: false }} />
            <Stack.Screen name="BlogDetail" component={BlogDetailScreen} options={{ headerShown: false }} />
            <Stack.Screen name="About" component={AboutScreen} options={{ headerShown: false }} />
          </>
        )}
      </Stack.Navigator>
    </AuthContext.Provider>
  );
};

export default AppNavigator;