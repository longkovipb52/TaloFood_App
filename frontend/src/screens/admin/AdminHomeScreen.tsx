import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
  StatusBar,
  Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome';
import { PieChart } from 'react-native-chart-kit';
import { LineChart } from 'react-native-chart-kit';
import { AuthContext } from '../../navigation/AppNavigator';
import AdminSideMenu from '../../components/admin/AdminSideMenu';

const AdminHomeScreen = ({ navigation }: any) => {
  const [showMenu, setShowMenu] = useState(false);
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    totalUsers: 0,
    totalOrders: 0,
    totalProducts: 0,
    totalRevenue: 0,
    pendingOrders: 0,
    completedOrders: 0,
    cancelledOrders: 0,
    recentOrders: [],
    salesData: {
      labels: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],
      datasets: [
        {
          data: [0, 0, 0, 0, 0, 0, 0]
        }
      ]
    }
  });
  
  const { signOut } = useContext(AuthContext);
  
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch('http://192.168.1.13:5000/api/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDashboardStats(data);
      } else {
        const errorData = await response.json();
        if (response.status === 401 || response.status === 403) {
          Alert.alert(
            "Lỗi xác thực",
            errorData.message || "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
            [
              { 
                text: "Đăng nhập lại", 
                onPress: () => handleLogout() 
              }
            ]
          );
        }
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    const loadUserInfo = async () => {
      try {
        const storedUsername = await AsyncStorage.getItem('username');
        if (storedUsername) {
          setUsername(storedUsername);
        }
      } catch (error) {
        console.error('Error loading user info:', error);
      }
    };
    
    loadUserInfo();
    fetchDashboardData();
  }, []);
  
  const handleRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };
  
  const handleLogout = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  
  const orderStatusData = [
    {
      name: "Chờ xác nhận",
      count: dashboardStats.pendingOrders,
      color: "#FFC107",
      legendFontColor: "#FFC107",
      legendFontSize: 12
    },
    {
      name: "Hoàn thành",
      count: dashboardStats.completedOrders,
      color: "#4CAF50",
      legendFontColor: "#4CAF50",
      legendFontSize: 12
    },
    {
      name: "Đã hủy",
      count: dashboardStats.cancelledOrders,
      color: "#F44336",
      legendFontColor: "#F44336",
      legendFontSize: 12
    }
  ];
  
  const screenWidth = Dimensions.get("window").width;
  
  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1f1f27" barStyle="light-content" />
      
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => setShowMenu(true)}>
            <Icon name="bars" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Dashboard</Text>
        </View>
        
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.headerButton}>
            <Icon name="bell" size={20} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton} onPress={handleLogout}>
            <Icon name="sign-out" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
      
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#fbc02d"]}
            tintColor="#fbc02d"
          />
        }
      >
        <View style={styles.welcomeBanner}>
          <View style={styles.welcomeContent}>
            <Text style={styles.welcomeTitle}>Chào mừng trở lại!</Text>
            <Text style={styles.welcomeSubtitle}>{username}</Text>
            <Text style={styles.welcomeText}>
              Hôm nay có {dashboardStats.pendingOrders} đơn hàng mới cần xác nhận.
            </Text>
          </View>
          <Image 
            source={require('../../assets/logo.png')}
            style={styles.welcomeImage}
          />
        </View>
        
        <View style={styles.statCardsContainer}>
          <View style={styles.statRow}>
            <StatCard 
              title="Người dùng" 
              value={dashboardStats.totalUsers}
              iconName="users"
              iconColor="#4fc3f7"
            />
            <StatCard 
              title="Sản phẩm" 
              value={dashboardStats.totalProducts}
              iconName="cutlery" 
              iconColor="#66bb6a"
            />
          </View>
          <View style={styles.statRow}>
            <StatCard 
              title="Đơn hàng" 
              value={dashboardStats.totalOrders}
              iconName="shopping-cart" 
              iconColor="#ff7043"
            />
            <StatCard 
              title="Doanh thu" 
              value={`${(dashboardStats.totalRevenue / 1000000).toFixed(1)}Tr`}
              iconName="money" 
              iconColor="#fbc02d"
            />
          </View>
        </View>
        
        <View style={styles.chartsSection}>
          <Text style={styles.chartTitle}>Trạng thái đơn hàng</Text>
          <View style={styles.chartContainer}>
            <PieChart
              data={orderStatusData.map(item => ({
                ...item,
                population: item.count
              }))}
              width={screenWidth - 40}
              height={180}
              chartConfig={{
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                decimalPlaces: 0
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="20"
              absolute
            />
          </View>
          
          <Text style={styles.chartTitle}>Doanh thu trong tuần</Text>
          <View style={styles.chartContainer}>
            <LineChart
              data={dashboardStats.salesData}
              width={screenWidth - 40}
              height={220}
              chartConfig={{
                backgroundColor: '#2a2a32',
                backgroundGradientFrom: '#2a2a32',
                backgroundGradientTo: '#2a2a32',
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(251, 192, 45, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                style: {
                  borderRadius: 16
                },
                propsForDots: {
                  r: "6",
                  strokeWidth: "2",
                  stroke: "#fbc02d"
                }
              }}
              bezier
              style={{
                marginVertical: 8,
                borderRadius: 16
              }}
            />
          </View>
        </View>
        
        <Text style={styles.sectionTitle}>Quản lý nhanh</Text>
        <View style={styles.actionButtonsContainer}>
          <ActionButton 
            title="Tài khoản" 
            iconName="users" 
            onPress={() => navigation.navigate('AdminUsers')}
          />
          <ActionButton 
            title="Đơn hàng"
            iconName="shopping-cart" 
            onPress={() => navigation.navigate('AdminOrders')}
          />
          <ActionButton 
            title="Món ăn" 
            iconName="cutlery" 
            onPress={() => navigation.navigate('AdminFoods')}
          />
          <ActionButton 
            title="Danh mục" 
            iconName="th-list" 
            onPress={() => navigation.navigate('AdminCategories')}
          />
          <ActionButton 
            title="Đánh giá" 
            iconName="star" 
            onPress={() => navigation.navigate('AdminReviews')}
          />
          <ActionButton 
            title="Liên hệ" 
            iconName="envelope" 
            onPress={() => navigation.navigate('AdminContacts')}
          />
          <ActionButton 
            title="Blog" 
            iconName="newspaper-o" 
            onPress={() => navigation.navigate('AdminBlogs')}
          />
          <ActionButton 
            title="Báo cáo" 
            iconName="bar-chart" 
            onPress={() => navigation.navigate('AdminReports')}
          />
        </View>
        
        <View style={{ height: 20 }} />
      </ScrollView>
      
      {showMenu && (
        <AdminSideMenu 
          navigation={navigation} 
          onClose={() => setShowMenu(false)}
          username={username}
        />
      )}
    </View>
  );
};

const StatCard = ({ title, value, iconName, iconColor }: any) => (
  <View style={styles.statCard}>
    <View style={styles.statCardHeader}>
      <Text style={styles.statTitle}>{title}</Text>
      <View style={[styles.statIconContainer, { backgroundColor: iconColor + '20' }]}>
        <Icon name={iconName} size={18} color={iconColor} />
      </View>
    </View>
    <Text style={styles.statValue}>{value}</Text>
  </View>
);

const ActionButton = ({ title, iconName, onPress }: any) => (
  <TouchableOpacity style={styles.actionButton} onPress={onPress}>
    <View style={styles.actionIcon}>
      <Icon name={iconName} size={24} color="#fbc02d" />
    </View>
    <Text style={styles.actionTitle}>{title}</Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1f1f27',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1f1f27',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a32',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fbc02d',
    marginLeft: 15,
  },
  headerRight: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginLeft: 15,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  welcomeBanner: {
    backgroundColor: '#2a2a32',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeContent: {
    flex: 1,
  },
  welcomeTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: '#fbc02d',
    marginBottom: 10,
  },
  welcomeText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
  },
  welcomeImage: {
    width: 70,
    height: 70,
    marginLeft: 10,
  },
  statCardsContainer: {
    marginBottom: 20,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  statCard: {
    backgroundColor: '#2a2a32',
    borderRadius: 12,
    padding: 15,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  statTitle: {
    fontSize: 14,
    color: '#aaa',
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  chartsSection: {
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  chartContainer: {
    backgroundColor: '#2a2a32',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#2a2a32',
    width: '23%',
    aspectRatio: 1,
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  actionIcon: {
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 12,
    color: '#fff',
    textAlign: 'center',
  }
});

export default AdminHomeScreen;