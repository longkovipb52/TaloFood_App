import React, { useState, useEffect } from 'react';
import { 
  Modal, View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  ActivityIndicator, Image
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { vi } from 'date-fns/locale';

interface AdminOrderDetailModalProps {
  visible: boolean;
  order: any;
  onClose: () => void;
  onUpdateStatus: () => void;
}

const AdminOrderDetailModal = ({ 
  visible, order, onClose, onUpdateStatus 
}: AdminOrderDetailModalProps) => {
  const [loading, setLoading] = useState(false);
  const [orderDetails, setOrderDetails] = useState<any>(null);

  useEffect(() => {
    if (visible && order) {
      fetchOrderDetails();
    }
  }, [visible, order]);

  const fetchOrderDetails = async () => {
    if (!order) return;
    
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(`http://192.168.1.13:5000/api/admin/orders/${order.bill_id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setOrderDetails(data.order);
      } else {
        console.error('Error fetching order details:', data.message);
      }
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Định dạng ngày giờ
  const formatDateTime = (dateString: string) => {
    try {
      if (!dateString) return 'N/A';
      return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: vi });
    } catch (error) {
      return dateString || 'N/A';
    }
  };

  // Định dạng ngày
  const formatDate = (dateString: string) => {
    try {
      if (!dateString) return 'N/A';
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: vi });
    } catch (error) {
      return dateString || 'N/A';
    }
  };

  // Tạo màu sắc cho badge trạng thái
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

  if (!visible || !order) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Chi tiết đơn hàng #{order.bill_id}</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="times" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#fbc02d" />
              <Text style={styles.loadingText}>Đang tải thông tin đơn hàng...</Text>
            </View>
          ) : (
            <ScrollView style={styles.modalBody}>
              {/* Thông tin trạng thái */}
              <View style={styles.statusSection}>
                <Text style={styles.sectionTitle}>Trạng thái đơn hàng</Text>
                <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) }]}>
                  <Text style={styles.statusText}>{order.status}</Text>
                </View>
              </View>

              {/* Thông tin khách hàng */}
              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Thông tin khách hàng</Text>
                
                <View style={styles.infoRow}>
                  <Icon name="user" size={18} color="#fbc02d" style={styles.infoIcon} />
                  <Text style={styles.infoLabel}>Tên:</Text>
                  <Text style={styles.infoValue}>{order.name || 'Không có thông tin'}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Icon name="phone" size={18} color="#fbc02d" style={styles.infoIcon} />
                  <Text style={styles.infoLabel}>Điện thoại:</Text>
                  <Text style={styles.infoValue}>{order.phone || 'Không có thông tin'}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Icon name="map-marker" size={18} color="#fbc02d" style={styles.infoIcon} />
                  <Text style={styles.infoLabel}>Địa chỉ:</Text>
                  <Text style={styles.infoValue}>{order.address || 'Không có thông tin'}</Text>
                </View>
              </View>
              
              {/* Thông tin đơn hàng */}
              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Thông tin đơn hàng</Text>
                
                <View style={styles.infoRow}>
                  <Icon name="calendar" size={18} color="#fbc02d" style={styles.infoIcon} />
                  <Text style={styles.infoLabel}>Ngày đặt:</Text>
                  <Text style={styles.infoValue}>{formatDateTime(order.created_at)}</Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Icon name="calendar-check-o" size={18} color="#fbc02d" style={styles.infoIcon} />
                  <Text style={styles.infoLabel}>Ngày giao:</Text>
                  <Text style={styles.infoValue}>
                    {order.ngaygiao ? formatDate(order.ngaygiao) : 'Chưa giao'}
                  </Text>
                </View>
                
                <View style={styles.infoRow}>
                  <Icon name="credit-card" size={18} color="#fbc02d" style={styles.infoIcon} />
                  <Text style={styles.infoLabel}>Thanh toán:</Text>
                  <Text style={styles.infoValue}>{order.payment_method}</Text>
                </View>
              </View>
              
              {/* Chi tiết sản phẩm */}
              {orderDetails && orderDetails.items && (
                <View style={styles.itemsSection}>
                  <Text style={styles.sectionTitle}>Sản phẩm đã mua</Text>
                  
                  {orderDetails.items.map((item: any, index: number) => (
                    <View key={index} style={styles.productItem}>
                      <View style={styles.productImageContainer}>
                        {item.image ? (
                          <Image 
                            source={{ uri: `http://192.168.1.13:5000/foods/${item.image}` }} 
                            style={styles.productImage} 
                          />
                        ) : (
                          <View style={styles.noImage}>
                            <Icon name="image" size={20} color="#666" />
                          </View>
                        )}
                      </View>
                      
                      <View style={styles.productInfo}>
                        <Text style={styles.productName}>{item.food_name}</Text>
                        <Text style={styles.productPrice}>{Number(item.price).toLocaleString('vi-VN')}đ</Text>
                        <Text style={styles.productQuantity}>x{item.count}</Text>
                      </View>
                      
                      <Text style={styles.productTotal}>
                        {Number(item.price * item.count).toLocaleString('vi-VN')}đ
                      </Text>
                    </View>
                  ))}
                  
                  <View style={styles.orderSummary}>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Tổng sản phẩm:</Text>
                      <Text style={styles.summaryValue}>
                        {orderDetails.items.reduce((sum: number, item: any) => sum + item.count, 0)}
                      </Text>
                    </View>
                    
                    <View style={styles.divider} />
                    
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Tổng tiền:</Text>
                      <Text style={styles.totalAmount}>
                        {Number(order.total_amount).toLocaleString('vi-VN')}đ
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>
          )}
          
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>Đóng</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.updateButton} 
              onPress={onUpdateStatus}
            >
              <Icon name="pencil" size={16} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.updateButtonText}>Cập nhật trạng thái</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#23232a',
    width: '94%',
    maxHeight: '90%',
    borderRadius: 10,
    overflow: 'hidden',
  },
  modalHeader: {
    backgroundColor: '#1f1f27',
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a32',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    color: '#ccc',
    marginTop: 10,
  },
  modalBody: {
    padding: 15,
  },
  statusSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#fbc02d',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
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
  infoSection: {
    backgroundColor: '#2a2a32',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  infoIcon: {
    width: 24,
    textAlign: 'center',
    marginTop: 2,
  },
  infoLabel: {
    color: '#ccc',
    width: 80,
    marginLeft: 8,
  },
  infoValue: {
    color: '#fff',
    flex: 1,
    flexWrap: 'wrap',
  },
  itemsSection: {
    backgroundColor: '#2a2a32',
    borderRadius: 8,
    padding: 12,
    marginBottom: 15,
  },
  productItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a42',
  },
  productImageContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#1f1f27',
    justifyContent: 'center',
    alignItems: 'center',
  },
  productImage: {
    width: 60,
    height: 60,
    resizeMode: 'cover',
  },
  noImage: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productInfo: {
    flex: 1,
    marginLeft: 10,
  },
  productName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  productPrice: {
    color: '#ccc',
    fontSize: 12,
    marginBottom: 4,
  },
  productQuantity: {
    color: '#fbc02d',
    fontSize: 14,
  },
  productTotal: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  orderSummary: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#3a3a42',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  summaryLabel: {
    color: '#ccc',
    fontSize: 14,
  },
  summaryValue: {
    color: '#fff',
    fontSize: 14,
  },
  divider: {
    height: 1,
    backgroundColor: '#3a3a42',
    marginVertical: 8,
  },
  totalAmount: {
    color: '#fbc02d',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#1f1f27',
    borderTopWidth: 1,
    borderTopColor: '#2a2a32',
  },
  closeButton: {
    backgroundColor: '#3a3a42',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 4,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  updateButton: {
    backgroundColor: '#2196f3',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 4,
    flexDirection: 'row',
    alignItems: 'center',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default AdminOrderDetailModal;