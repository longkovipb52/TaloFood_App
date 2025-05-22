import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Alert, Dimensions } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome';
import Toast from 'react-native-toast-message';
import MainLayout from '../components/MainLayout';
import { COLORS } from '../theme/colors';

const { width } = Dimensions.get('window');
const TAB_COUNT = 4; // Số lượng tab trong thanh filter

const OrderHistoryScreen = ({ navigation }: any) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("Tất cả");
  
  // Danh sách các trạng thái đơn hàng
  const orderStatuses = ["Tất cả", "Chờ xác nhận", "Đã xác nhận", "Đang giao", "Đã giao", "Đã hủy"];

  // Hàm fetch đơn hàng
  const fetchOrders = async () => {
    try {
      const userIdValue = await AsyncStorage.getItem('userId');
      if (userIdValue) {
        setUserId(userIdValue);
        const response = await fetch(`http://192.168.1.13:5000/api/orders/user/${userIdValue}`);
        const data = await response.json();
        
        if (response.ok) {
          // Sắp xếp đơn hàng theo thời gian mới nhất
          const sortedOrders = data.orders.sort((a: any, b: any) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          );
          setOrders(sortedOrders);
        } else {
          Toast.show({
            type: 'error',
            text1: 'Lỗi',
            text2: data.message || 'Không thể tải lịch sử đơn hàng',
            position: 'bottom',
          });
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi kết nối',
        text2: 'Không thể tải lịch sử đơn hàng',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Gọi API khi component mount
  useEffect(() => {
    fetchOrders();
  }, []);

  // Hàm refresh data
  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  // Hàm hủy đơn hàng
  const handleCancelOrder = async (orderId: number) => {
    Alert.alert(
      "Xác nhận hủy đơn",
      "Bạn có chắc chắn muốn hủy đơn hàng này?",
      [
        { text: "Không", style: "cancel" },
        { 
          text: "Có, hủy đơn", 
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(`http://192.168.1.13:5000/api/orders/${orderId}/cancel`, {
                method: 'PUT',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId }),
              });

              const data = await response.json();

              if (response.ok) {
                Toast.show({
                  type: 'success',
                  text1: 'Hủy đơn hàng thành công',
                  position: 'bottom',
                });

                // Cập nhật trạng thái đơn hàng trong state
                setOrders(orders.map(order => 
                  order.bill_id === orderId ? { ...order, status: 'Đã hủy' } : order
                ));
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Lỗi',
                  text2: data.message || 'Không thể hủy đơn hàng',
                  position: 'bottom',
                });
              }
            } catch (error) {
              console.error('Error cancelling order:', error);
              Toast.show({
                type: 'error',
                text1: 'Lỗi kết nối',
                text2: 'Không thể kết nối đến máy chủ',
                position: 'bottom',
              });
            }
          }
        }
      ]
    );
  };

  // Lấy style badge theo trạng thái
  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'Chờ xác nhận':
        return styles.statusPending;
      case 'Đã thanh toán':
        return styles.statusPaid;
      case 'Đã xác nhận':
        return styles.statusConfirmed;
      case 'Đang giao':
        return styles.statusDelivering;
      case 'Đã giao':
        return styles.statusDelivered;
      case 'Đã hủy':
        return styles.statusCancelled;
      default:
        return styles.statusPending;
    }
  };

  // Tính toán số lượng từng loại đơn hàng
  const getOrderCountByStatus = (status: string) => {
    if (status === "Tất cả") return orders.length;
    return orders.filter(order => order.status === status).length;
  };

  // Lọc đơn hàng theo trạng thái đã chọn
  const filteredOrders = selectedStatus === "Tất cả" 
    ? orders 
    : orders.filter(order => order.status === selectedStatus);

  // Render item đơn hàng
  const renderOrderItem = ({ item }: { item: any }) => {
    const canCancel = !['Đã giao', 'Đã hủy'].includes(item.status);
    const formattedDate = new Date(item.created_at).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return (
      <View style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <Text style={styles.orderNumber}>Đơn hàng #{item.bill_id}</Text>
          <View style={[styles.statusBadge, getStatusBadgeStyle(item.status)]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>

        <View style={styles.orderDetails}>
          <Text style={styles.orderDate}>
            <Icon name="calendar" size={14} color="#aaa" /> {formattedDate}
          </Text>
          <Text style={styles.itemCount}>
            <Icon name="list" size={14} color="#aaa" /> Số món: {item.item_count || 'N/A'}
          </Text>
          <Text style={styles.orderTotal}>
            <Icon name="money" size={14} color="#fbc02d" /> {Number(item.total_amount).toLocaleString('vi-VN')}đ
          </Text>
          <Text style={styles.orderPayment}>
            <Icon name="credit-card" size={14} color="#aaa" /> {item.payment_method}
          </Text>
        </View>

        <View style={styles.orderFooter}>
          <TouchableOpacity 
            style={styles.viewButton}
            onPress={() => navigation.navigate('OrderConfirmation', { orderId: item.bill_id })}
          >
            <Text style={styles.viewButtonText}>Xem Chi Tiết</Text>
          </TouchableOpacity>
          
          {canCancel && (
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={() => handleCancelOrder(item.bill_id)}
            >
              <Text style={styles.cancelButtonText}>Hủy Đơn</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <MainLayout navigation={navigation}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải lịch sử đơn hàng...</Text>
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout navigation={navigation}>
      <View style={styles.container}>
        <Text style={styles.title}>Lịch Sử Đơn Hàng</Text>
        
        {/* Cải thiện thanh filter */}
        <View style={styles.tabContainer}>
          {orderStatuses.slice(0, TAB_COUNT + 1).map(status => (
            <TouchableOpacity
              key={status}
              style={[
                styles.tab,
                selectedStatus === status && styles.activeTab
              ]}
              onPress={() => setSelectedStatus(status)}
            >
              <Text style={[
                styles.tabText,
                selectedStatus === status && styles.activeTabText
              ]}>
                {status}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        
        <View style={styles.orderCountContainer}>
          <Text style={styles.orderCountText}>
            {filteredOrders.length} đơn hàng {selectedStatus !== "Tất cả" ? selectedStatus.toLowerCase() : ""}
          </Text>
        </View>

        {filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            {orders.length === 0 ? (
              <>
                <Icon name="shopping-bag" size={60} color="#555" />
                <Text style={styles.emptyText}>Bạn chưa có đơn hàng nào</Text>
                <TouchableOpacity 
                  style={styles.shopButton}
                  onPress={() => navigation.navigate('Home')}
                >
                  <Text style={styles.shopButtonText}>Mua sắm ngay</Text>
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Icon name="filter" size={60} color="#555" />
                <Text style={styles.emptyText}>Không có đơn hàng {selectedStatus.toLowerCase()}</Text>
              </>
            )}
          </View>
        ) : (
          <FlatList
            data={filteredOrders}
            keyExtractor={(item) => item.bill_id.toString()}
            renderItem={renderOrderItem}
            refreshing={refreshing}
            onRefresh={handleRefresh}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </MainLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#23232a',
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fbc02d',
    marginBottom: 20,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 20,
  },
  shopButton: {
    marginTop: 20,
    backgroundColor: '#fbc02d',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  shopButtonText: {
    color: '#23232a',
    fontWeight: 'bold',
  },
  listContent: {
    paddingBottom: 20,
  },
  orderCard: {
    backgroundColor: '#2c2c34',
    borderRadius: 12,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    paddingBottom: 10,
  },
  orderNumber: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusBadge: {
    borderRadius: 50,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  statusPending: {
    backgroundColor: '#FF9800',
  },
  statusPaid: {
    backgroundColor: '#2196F3',
  },
  statusConfirmed: {
    backgroundColor: '#9C27B0',
  },
  statusDelivering: {
    backgroundColor: '#3F51B5',
  },
  statusDelivered: {
    backgroundColor: '#4CAF50',
  },
  statusCancelled: {
    backgroundColor: '#F44336',
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  orderDetails: {
    marginBottom: 12,
    paddingVertical: 8,
  },
  orderDate: {
    color: '#bbb',
    marginBottom: 8,
    fontSize: 14,
  },
  itemCount: {
    color: '#bbb',
    marginBottom: 8,
    fontSize: 14,
  },
  orderTotal: {
    color: '#fbc02d',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 8,
  },
  orderPayment: {
    color: '#bbb',
    fontSize: 14,
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#444',
    paddingTop: 10,
  },
  viewButton: {
    backgroundColor: '#444',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#F44336',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginLeft: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#2c2c34',
    borderRadius: 25,
    marginBottom: 20,
    height: 50,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 5,
  },
  activeTab: {
    backgroundColor: '#fbc02d',
  },
  tabText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    textAlign: 'center',
  },
  activeTabText: {
    color: '#23232a',
  },
  orderCountContainer: {
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  orderCountText: {
    color: '#bbb',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default OrderHistoryScreen;