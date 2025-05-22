import React, { useState, useEffect, useContext } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, Platform, RefreshControl, StatusBar, ScrollView
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../../navigation/AppNavigator';
import AdminSideMenu from '../../components/admin/AdminSideMenu';
import AdminOrderDetailModal from '../../components/admin/AdminOrderDetailModal';
import AdminOrderStatusModal from '../../components/admin/AdminOrderStatusModal';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

const AdminOrders = ({ navigation }: any) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredOrders, setFilteredOrders] = useState<any[]>([]);
  const [username, setUsername] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [orderDetailVisible, setOrderDetailVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [filterStatus, setFilterStatus] = useState("Tất cả");

  const { signOut } = useContext(AuthContext);
  
  const orderStatuses = [
    "Tất cả", "Chờ xác nhận", "Đã xác nhận", "Đang giao", "Đã giao", 
    "Đã thanh toán", "Đã hủy"
  ];

  // Load username from AsyncStorage và fetch orders khi component mount
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
    fetchOrders();
  }, []);

  // Lọc đơn hàng theo từ khóa và trạng thái
  useEffect(() => {
    let filtered = orders;

    // Lọc theo trạng thái
    if (filterStatus !== "Tất cả") {
      filtered = filtered.filter(order => order.status === filterStatus);
    }

    // Lọc theo từ khóa tìm kiếm
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order => 
        order.bill_id.toString().includes(query) ||
        order.name?.toLowerCase().includes(query) || 
        order.phone?.includes(query) ||
        order.address?.toLowerCase().includes(query)
      );
    }

    setFilteredOrders(filtered);
  }, [searchQuery, filterStatus, orders]);

  // Fetch danh sách đơn hàng từ API
  const fetchOrders = async () => {
    try {
      setLoading(true);
      
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch('http://192.168.1.13:5000/api/admin/orders', {
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
        }

        const errorData = await response.json();
        throw new Error(errorData.message || 'Không thể lấy danh sách đơn hàng');
      }

      const data = await response.json();
      
      // Sắp xếp đơn hàng theo thời gian mới nhất
      const sortedOrders = data.orders.sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      
      setOrders(sortedOrders);
      setFilteredOrders(sortedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: error instanceof Error ? error.message : 'Không thể tải danh sách đơn hàng',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Làm mới dữ liệu
  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  // Xem chi tiết đơn hàng
  const handleViewOrderDetail = (order: any) => {
    setSelectedOrder(order);
    setOrderDetailVisible(true);
  };

  // Mở modal cập nhật trạng thái
  const handleUpdateStatus = (order: any) => {
    setSelectedOrder(order);
    setStatusModalVisible(true);
  };

  // Xử lý khi trạng thái đơn hàng được cập nhật thành công
  const handleStatusUpdated = (orderId: number, newStatus: string) => {
    // Cập nhật state đơn hàng với trạng thái mới
    setOrders(orders.map(order => 
      order.bill_id === orderId 
        ? { ...order, status: newStatus }
        : order
    ));

    Toast.show({
      type: 'success',
      text1: 'Cập nhật thành công',
      text2: `Đơn hàng #${orderId} đã được cập nhật thành "${newStatus}"`,
      position: 'bottom',
    });
  };

  // Format ngày tháng hiển thị
  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'N/A';
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy HH:mm', { locale: vi });
    } catch (error) {
      return 'N/A';
    }
  };

  // Lấy màu sắc dựa vào trạng thái đơn hàng
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Chờ xác nhận':
        return '#ff9800';
      case 'Đã xác nhận':
        return '#2196f3';
      case 'Đang giao':
        return '#9c27b0';
      case 'Đã giao':
        return '#4caf50';
      case 'Đã thanh toán':
        return '#4caf50';
      case 'Đã hủy':
        return '#f44336';
      default:
        return '#888';
    }
  };

  // Render từng đơn hàng trong danh sách
  const renderOrderItem = ({ item }: { item: any }) => {
    return (
      <View style={styles.orderCard}>
        <TouchableOpacity 
          style={styles.orderCardContent}
          onPress={() => handleViewOrderDetail(item)}
        >
          <View style={styles.orderHeader}>
            <Text style={styles.orderId}>#{item.bill_id}</Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          </View>
          
          <View style={styles.orderInfo}>
            <View style={styles.infoRow}>
              <Icon name="user" size={16} color="#aaa" style={styles.infoIcon} />
              <Text style={styles.infoText}>
                {item.name || 'Không có tên'}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Icon name="phone" size={16} color="#aaa" style={styles.infoIcon} />
              <Text style={styles.infoText}>
                {item.phone || 'Không có số điện thoại'}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Icon name="map-marker" size={16} color="#aaa" style={styles.infoIcon} />
              <Text style={styles.infoText} numberOfLines={1} ellipsizeMode="tail">
                {item.address || 'Không có địa chỉ'}
              </Text>
            </View>
            
            <View style={styles.infoRow}>
              <Icon name="calendar" size={16} color="#aaa" style={styles.infoIcon} />
              <Text style={styles.infoText}>
                {formatDate(item.created_at)}
              </Text>
            </View>
          </View>
          
          <View style={styles.orderFooter}>
            <Text style={styles.totalAmount}>
              {Number(item.total_amount).toLocaleString('vi-VN')}đ
            </Text>
            
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => handleUpdateStatus(item)}
            >
              <Icon name="pencil" size={16} color="#fff" />
              <Text style={styles.editButtonText}>Cập nhật</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1f1f27" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => setShowMenu(true)}>
            <Icon name="bars" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quản lý đơn hàng</Text>
        </View>
        
        <View style={styles.headerRight}>
          <Text style={styles.orderCount}>{filteredOrders.length} đơn hàng</Text>
        </View>
      </View>

      {/* Search Bar & Filters */}
      <View style={styles.filtersContainer}>
        <View style={styles.searchContainer}>
          <Icon name="search" size={16} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo mã, tên, SĐT, địa chỉ..."
            placeholderTextColor="#666"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="times-circle" size={16} color="#666" />
            </TouchableOpacity>
          ) : null}
        </View>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.statusFilters}
          contentContainerStyle={styles.statusFilterContent}
        >
          {orderStatuses.map(status => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterChip,
                filterStatus === status && styles.activeFilterChip
              ]}
              onPress={() => setFilterStatus(status)}
            >
              <Text 
                style={[
                  styles.filterChipText,
                  filterStatus === status && styles.activeFilterChipText
                ]}
              >
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Order List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fbc02d" />
        </View>
      ) : (
        <FlatList
          data={filteredOrders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.bill_id.toString()}
          contentContainerStyle={styles.ordersList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="shopping-cart" size={50} color="#666" />
              <Text style={styles.emptyText}>
                {searchQuery || filterStatus !== "Tất cả" 
                  ? 'Không tìm thấy đơn hàng phù hợp' 
                  : 'Chưa có đơn hàng nào'
                }
              </Text>
            </View>
          }
        />
      )}

      {/* AdminSideMenu */}
      {showMenu && (
        <AdminSideMenu 
          navigation={navigation} 
          onClose={() => setShowMenu(false)}
          username={username}
        />
      )}

      {/* Order Detail Modal */}
      <AdminOrderDetailModal 
        visible={orderDetailVisible}
        order={selectedOrder}
        onClose={() => setOrderDetailVisible(false)}
        onUpdateStatus={() => {
          setOrderDetailVisible(false);
          handleUpdateStatus(selectedOrder);
        }}
      />

      {/* Order Status Update Modal */}
      <AdminOrderStatusModal 
        visible={statusModalVisible}
        order={selectedOrder}
        onClose={() => setStatusModalVisible(false)}
        onStatusUpdated={handleStatusUpdated}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#23232a',
  },
  header: {
    backgroundColor: '#1f1f27',
    paddingTop: 40,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerRight: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  orderCount: {
    color: '#fbc02d',
    fontSize: 14,
    fontWeight: 'bold',
  },
  filtersContainer: {
    backgroundColor: '#1f1f27',
    paddingBottom: 12,
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#2a2a32',
    borderRadius: 8,
    padding: 10,
    margin: 16,
    marginBottom: 8,
    alignItems: 'center',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#fff',
    fontSize: 16,
  },
  statusFilters: {
    paddingHorizontal: 8,
  },
  statusFilterContent: {
    paddingHorizontal: 8,
  },
  filterChip: {
    backgroundColor: '#2a2a32',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  activeFilterChip: {
    backgroundColor: '#fbc02d',
  },
  filterChipText: {
    color: '#fff',
    fontSize: 14,
  },
  activeFilterChipText: {
    color: '#1f1f27',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ordersList: {
    padding: 16,
  },
  orderCard: {
    backgroundColor: '#2a2a32',
    borderRadius: 10,
    marginBottom: 16,
    overflow: 'hidden',
    elevation: 2,
  },
  orderCardContent: {
    padding: 16,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  orderId: {
    color: '#fbc02d',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  orderInfo: {
    marginVertical: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    width: 20,
    textAlign: 'center',
    marginRight: 8,
  },
  infoText: {
    color: '#ccc',
    fontSize: 14,
    flex: 1,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#3a3a42',
  },
  totalAmount: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  editButton: {
    backgroundColor: '#2196f3',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  editButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 50,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginTop: 10,
    textAlign: 'center',
  },
});

export default AdminOrders;