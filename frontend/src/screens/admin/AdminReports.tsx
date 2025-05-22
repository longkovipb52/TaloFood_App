import React, { useState, useEffect, useContext } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  ActivityIndicator, 
  Dimensions,
  RefreshControl,
  StatusBar,
  Alert
} from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome';
import { AuthContext } from '../../navigation/AppNavigator';
import AdminSideMenu from '../../components/admin/AdminSideMenu';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

const AdminReports = ({ navigation }: any) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [username, setUsername] = useState('');
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'revenue', 'products', 'customers'
  const [period, setPeriod] = useState('month'); // 'day', 'week', 'month', 'year'
  
  // States cho từng loại báo cáo
  const [overviewStats, setOverviewStats] = useState<any>({
    revenue: 0,
    orders: { total: 0, completed: 0, pending: 0, cancelled: 0 },
    newUsers: 0,
    itemsSold: 0,
    rating: 0
  });
  
  const [revenueStats, setRevenueStats] = useState<any>({
    revenue: [],
    paymentMethods: []
  });
  
  const [productStats, setProductStats] = useState<any>({
    topProducts: [],
    categories: []
  });
  
  const [customerStats, setCustomerStats] = useState<any>({
    topCustomers: [],
    ratings: [],
    orderTimes: []
  });
  
  const { signOut } = useContext(AuthContext);

  // Load dữ liệu người dùng khi component mount
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
    fetchReportData();
  }, []);

  // Load dữ liệu báo cáo khi thay đổi tab hoặc period
  useEffect(() => {
    fetchReportData();
  }, [activeTab, period]);

  // Fetch dữ liệu báo cáo
  const fetchReportData = async () => {
    try {
      setLoading(true);
      
      const token = await AsyncStorage.getItem('token');
      
      if (!token) {
        Alert.alert(
          "Lỗi xác thực",
          "Không tìm thấy thông tin đăng nhập. Vui lòng đăng nhập lại.",
          [{ text: "Đăng nhập lại", onPress: () => signOut() }]
        );
        return;
      }
      
      let endpoint = '';
      
      switch (activeTab) {
        case 'overview':
          endpoint = `/api/admin/reports/overview?period=${period}`;
          break;
        case 'revenue':
          endpoint = `/api/admin/reports/revenue?period=${period}`;
          break;
        case 'products':
          endpoint = `/api/admin/reports/products?period=${period}&limit=10`;
          break;
        case 'customers':
          endpoint = `/api/admin/reports/customers?period=${period}`;
          break;
        default:
          endpoint = `/api/admin/reports/overview?period=${period}`;
      }
      
      const response = await fetch(`http://192.168.1.13:5000${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          Alert.alert(
            "Lỗi xác thực",
            "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
            [{ text: "Đăng nhập lại", onPress: () => signOut() }]
          );
          return;
        }
        
        const errorData = await response.json();
        throw new Error(errorData.message || 'Không thể lấy dữ liệu báo cáo');
      }
      
      const data = await response.json();
      
      switch (activeTab) {
        case 'overview':
          setOverviewStats(data);
          break;
        case 'revenue':
          setRevenueStats(data);
          break;
        case 'products':
          setProductStats(data);
          break;
        case 'customers':
          setCustomerStats(data);
          break;
      }
    } catch (error) {
      console.error('Error fetching report data:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: error instanceof Error ? error.message : 'Không thể tải dữ liệu báo cáo',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle tab change
  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };
  
  // Handle period change
  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod);
  };
  
  // Pull-to-refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchReportData();
  };
  
  // Format số tiền VND
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', { 
      style: 'currency', 
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0 
    }).format(value || 0);
  };

  // Render card hiển thị thông tin thống kê
  const renderStatCard = (title: string, value: any, icon: string, color: string, subtitle?: string) => (
    <View style={styles.statCard}>
      <View style={styles.statIconContainer}>
        <Icon name={icon} size={24} color={color} />
      </View>
      <View style={styles.statContent}>
        <Text style={styles.statValue}>{value}</Text>
        <Text style={styles.statTitle}>{title}</Text>
        {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
      </View>
    </View>
  );
  
  // Render tab Tổng quan
  const renderOverviewTab = () => {
    const orderStatusData = [
      {
        name: "Hoàn thành",
        population: overviewStats.orders.completed,
        color: "#4CAF50",
        legendFontColor: "#fff",
      },
      {
        name: "Đang xử lý",
        population: overviewStats.orders.pending,
        color: "#FF9800",
        legendFontColor: "#fff",
      },
      {
        name: "Đã hủy",
        population: overviewStats.orders.cancelled,
        color: "#F44336",
        legendFontColor: "#fff",
      }
    ];
    
    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Tổng quan</Text>
        <View style={styles.infoRow}>
          {renderStatCard("Doanh thu", formatCurrency(overviewStats.revenue), "money", "#4CAF50")}
          {renderStatCard("Đơn hàng", overviewStats.orders.total, "shopping-cart", "#FF9800")}
        </View>
        <View style={styles.infoRow}>
          {renderStatCard("Khách hàng mới", overviewStats.newUsers, "user-plus", "#2196F3")}
          {renderStatCard("Sản phẩm bán ra", overviewStats.itemsSold, "cutlery", "#9C27B0")}
        </View>
        
        <Text style={styles.sectionTitle}>Trạng thái đơn hàng</Text>
        <View style={styles.chartContainer}>
          {overviewStats.orders.total > 0 ? (
            <PieChart
              data={orderStatusData}
              width={width - 40}
              height={200}
              chartConfig={{
                backgroundColor: "#1A1A22",
                backgroundGradientFrom: "#1A1A22",
                backgroundGradientTo: "#1A1A22",
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              absolute
            />
          ) : (
            <View style={styles.emptyChartContainer}>
              <Text style={styles.emptyChartText}>Không có dữ liệu đơn hàng</Text>
            </View>
          )}
        </View>
        
        <View style={styles.infoRow}>
          <View style={[styles.statCard, { flex: 1 }]}>
            <View style={[styles.ratingContainer, { justifyContent: 'center' }]}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Icon
                  key={`star-${star}`}
                  name={star <= Math.round(overviewStats.rating) ? "star" : "star-o"}
                  size={20}
                  color="#FBC02D"
                  style={{ marginHorizontal: 3 }}
                />
              ))}
            </View>
            <Text style={[styles.statTitle, { textAlign: 'center', marginTop: 8 }]}>
              Đánh giá trung bình: {parseFloat(overviewStats.rating || 0).toFixed(1)}/5
            </Text>
          </View>
        </View>
      </View>
    );
  };
  
  // Render tab Doanh thu
  const renderRevenueTab = () => {
    // Chuẩn bị dữ liệu cho biểu đồ doanh thu
    const labels = revenueStats.revenue.map((item: any) => item.label) || [];
    const data = revenueStats.revenue.map((item: any) => item.amount) || [];
    
    // Dữ liệu cho biểu đồ phương thức thanh toán
    const paymentLabels = revenueStats.paymentMethods.map((item: any) => item.payment_method) || [];
    const paymentData = revenueStats.paymentMethods.map((item: any) => item.amount) || [];
    const paymentColors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336'];
    
    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Biểu đồ doanh thu</Text>
        <View style={styles.chartContainer}>
          {data.length > 0 ? (
            <LineChart
              data={{
                labels,
                datasets: [{ data }]
              }}
              width={width - 40}
              height={220}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: "#1A1A22",
                backgroundGradientFrom: "#1A1A22",
                backgroundGradientTo: "#1A1A22",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(255, 188, 2, ${opacity})`,
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
          ) : (
            <View style={styles.emptyChartContainer}>
              <Text style={styles.emptyChartText}>Không có dữ liệu doanh thu</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.sectionTitle}>Phương thức thanh toán</Text>
        <View style={styles.chartContainer}>
          {paymentData.length > 0 ? (
            <BarChart
              data={{
                labels: paymentLabels,
                datasets: [{ data: paymentData }]
              }}
              width={width - 40}
              height={220}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: "#1A1A22",
                backgroundGradientFrom: "#1A1A22",
                backgroundGradientTo: "#1A1A22",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                barPercentage: 0.7,
              }}
              style={{
                marginVertical: 8,
                borderRadius: 16
              }}
            />
          ) : (
            <View style={styles.emptyChartContainer}>
              <Text style={styles.emptyChartText}>Không có dữ liệu thanh toán</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.sectionTitle}>Chi tiết doanh thu</Text>
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 2 }]}>Thời gian</Text>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>Đơn hàng</Text>
            <Text style={[styles.tableHeaderText, { flex: 2 }]}>Doanh thu</Text>
          </View>
          
          {revenueStats.revenue.length > 0 ? revenueStats.revenue.map((item: any, index: number) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2 }]}>{item.label}</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>{item.orders}</Text>
              <Text style={[styles.tableCell, { flex: 2 }]}>{formatCurrency(item.amount)}</Text>
            </View>
          )) : (
            <View style={styles.emptyTableRow}>
              <Text style={styles.emptyTableText}>Không có dữ liệu</Text>
            </View>
          )}
        </View>
      </View>
    );
  };
  
  // Render tab Sản phẩm
  const renderProductsTab = () => {
    // Dữ liệu cho biểu đồ danh mục
    const categoryLabels = productStats.categories.map((cat: any) => cat.foodcategory_name) || [];
    const categoryData = productStats.categories.map((cat: any) => cat.quantity_sold) || [];
    
    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Danh mục sản phẩm</Text>
        <View style={styles.chartContainer}>
          {categoryData.length > 0 ? (
            <BarChart
              data={{
                labels: categoryLabels,
                datasets: [{ data: categoryData }]
              }}
              width={width - 40}
              height={220}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: "#1A1A22",
                backgroundGradientFrom: "#1A1A22",
                backgroundGradientTo: "#1A1A22",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
                barPercentage: 0.7,
              }}
              style={{
                marginVertical: 8,
                borderRadius: 16
              }}
            />
          ) : (
            <View style={styles.emptyChartContainer}>
              <Text style={styles.emptyChartText}>Không có dữ liệu danh mục</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.sectionTitle}>Top 10 sản phẩm bán chạy</Text>
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 3 }]}>Sản phẩm</Text>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>SL bán</Text>
            <Text style={[styles.tableHeaderText, { flex: 2 }]}>Doanh thu</Text>
          </View>
          
          {productStats.topProducts.length > 0 ? productStats.topProducts.map((product: any, index: number) => (
            <View key={product.food_id} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 3 }]}>
                {index + 1}. {product.food_name}
              </Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>{product.quantity_sold}</Text>
              <Text style={[styles.tableCell, { flex: 2 }]}>{formatCurrency(product.revenue)}</Text>
            </View>
          )) : (
            <View style={styles.emptyTableRow}>
              <Text style={styles.emptyTableText}>Không có dữ liệu</Text>
            </View>
          )}
        </View>
      </View>
    );
  };
  
  // Render tab Khách hàng
  const renderCustomersTab = () => {
    // Dữ liệu cho biểu đồ đánh giá
    const ratingLabels = customerStats.ratings.map((item: any) => `${item.star_rating} sao`) || [];
    const ratingData = customerStats.ratings.map((item: any) => item.count) || [];
    
    return (
      <View style={styles.tabContent}>
        <Text style={styles.sectionTitle}>Đánh giá từ khách hàng</Text>
        <View style={styles.chartContainer}>
          {ratingData.length > 0 ? (
            <BarChart
              data={{
                labels: ratingLabels,
                datasets: [{ data: ratingData }]
              }}
              width={width - 40}
              height={220}
              yAxisLabel=""
              yAxisSuffix=""
              chartConfig={{
                backgroundColor: "#1A1A22",
                backgroundGradientFrom: "#1A1A22",
                backgroundGradientTo: "#1A1A22",
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(255, 193, 7, ${opacity})`,
                barPercentage: 0.7,
              }}
              style={{
                marginVertical: 8,
                borderRadius: 16
              }}
            />
          ) : (
            <View style={styles.emptyChartContainer}>
              <Text style={styles.emptyChartText}>Không có dữ liệu đánh giá</Text>
            </View>
          )}
        </View>
        
        <Text style={styles.sectionTitle}>Top khách hàng</Text>
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 3 }]}>Khách hàng</Text>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>Đơn hàng</Text>
            <Text style={[styles.tableHeaderText, { flex: 2 }]}>Chi tiêu</Text>
          </View>
          
          {customerStats.topCustomers.length > 0 ? customerStats.topCustomers.map((customer: any, index: number) => (
            <View key={customer.account_id} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 3 }]}>
                {index + 1}. {customer.username}
              </Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>{customer.order_count}</Text>
              <Text style={[styles.tableCell, { flex: 2 }]}>{formatCurrency(customer.total_spent)}</Text>
            </View>
          )) : (
            <View style={styles.emptyTableRow}>
              <Text style={styles.emptyTableText}>Không có dữ liệu</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1f1f27" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setShowMenu(true)}
        >
          <Icon name="bars" size={22} color="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Thống kê & Báo cáo</Text>
        
        <TouchableOpacity onPress={() => {
          Alert.alert(
            "Xuất báo cáo",
            "Chọn loại báo cáo để xuất",
            [
              { text: "Doanh thu", onPress: () => console.log("Xuất báo cáo doanh thu") },
              { text: "Sản phẩm", onPress: () => console.log("Xuất báo cáo sản phẩm") },
              { text: "Khách hàng", onPress: () => console.log("Xuất báo cáo khách hàng") },
              { text: "Hủy", style: "cancel" }
            ]
          );
        }}>
          <Icon name="download" size={22} color="#fff" />
        </TouchableOpacity>
      </View>
      
      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'overview' && styles.activeTab]}
          onPress={() => handleTabChange('overview')}
        >
          <Text style={[styles.tabText, activeTab === 'overview' && styles.activeTabText]}>
            Tổng quan
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'revenue' && styles.activeTab]}
          onPress={() => handleTabChange('revenue')}
        >
          <Text style={[styles.tabText, activeTab === 'revenue' && styles.activeTabText]}>
            Doanh thu
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'products' && styles.activeTab]}
          onPress={() => handleTabChange('products')}
        >
          <Text style={[styles.tabText, activeTab === 'products' && styles.activeTabText]}>
            Sản phẩm
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'customers' && styles.activeTab]}
          onPress={() => handleTabChange('customers')}
        >
          <Text style={[styles.tabText, activeTab === 'customers' && styles.activeTabText]}>
            Khách hàng
          </Text>
        </TouchableOpacity>
      </View>
      
      {/* Period Filter */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <TouchableOpacity
            style={[styles.filterButton, period === 'day' && styles.activeFilterButton]}
            onPress={() => handlePeriodChange('day')}
          >
            <Text style={[styles.filterButtonText, period === 'day' && styles.activeFilterButtonText]}>
              Hôm nay
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, period === 'week' && styles.activeFilterButton]}
            onPress={() => handlePeriodChange('week')}
          >
            <Text style={[styles.filterButtonText, period === 'week' && styles.activeFilterButtonText]}>
              Tuần này
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, period === 'month' && styles.activeFilterButton]}
            onPress={() => handlePeriodChange('month')}
          >
            <Text style={[styles.filterButtonText, period === 'month' && styles.activeFilterButtonText]}>
              Tháng này
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, period === 'year' && styles.activeFilterButton]}
            onPress={() => handlePeriodChange('year')}
          >
            <Text style={[styles.filterButtonText, period === 'year' && styles.activeFilterButtonText]}>
              Năm nay
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.filterButton, period === 'all' && styles.activeFilterButton]}
            onPress={() => handlePeriodChange('all')}
          >
            <Text style={[styles.filterButtonText, period === 'all' && styles.activeFilterButtonText]}>
              Tất cả
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
      
      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fbc02d" />
        </View>
      ) : (
        <ScrollView 
          style={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={["#fbc02d"]} />
          }
        >
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'revenue' && renderRevenueTab()}
          {activeTab === 'products' && renderProductsTab()}
          {activeTab === 'customers' && renderCustomersTab()}
        </ScrollView>
      )}
      
      {/* Side Menu */}
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#23232a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1f1f27',
  },
  menuButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#2a2a32',
    marginTop: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 3,
    borderBottomColor: '#fbc02d',
  },
  tabText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fbc02d',
    fontWeight: 'bold',
  },
  filterContainer: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#1f1f27',
    marginBottom: 2,
  },
  filterButton: {
    backgroundColor: '#2a2a32',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 10,
  },
  activeFilterButton: {
    backgroundColor: '#fbc02d',
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  activeFilterButtonText: {
    color: '#23232a',
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statCard: {
    backgroundColor: '#2a2a32',
    borderRadius: 10,
    padding: 16,
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statContent: {
    flex: 1,
  },
  statValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statTitle: {
    color: '#aaa',
    fontSize: 14,
  },
  statSubtitle: {
    color: '#777',
    fontSize: 12,
    marginTop: 4,
  },
  chartContainer: {
    alignItems: 'center',
    marginVertical: 16,
    backgroundColor: '#2a2a32',
    borderRadius: 10,
    padding: 16,
  },
  emptyChartContainer: {
    height: 200,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChartText: {
    color: '#777',
    fontSize: 16,
  },
  tableContainer: {
    backgroundColor: '#2a2a32',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1f1f27',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  tableHeaderText: {
    color: '#fbc02d',
    fontWeight: 'bold',
    fontSize: 14,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  tableCell: {
    color: '#fff',
    fontSize: 14,
  },
  emptyTableRow: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyTableText: {
    color: '#777',
    fontSize: 14,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export default AdminReports;