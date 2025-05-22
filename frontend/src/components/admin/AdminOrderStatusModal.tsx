import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

interface AdminOrderStatusModalProps {
  visible: boolean;
  order: any;
  onClose: () => void;
  onStatusUpdated: (orderId: number, newStatus: string) => void;
}

const AdminOrderStatusModal = ({
  visible,
  order,
  onClose,
  onStatusUpdated
}: AdminOrderStatusModalProps) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Danh sách các trạng thái đơn hàng
  const statusOptions = [
    'Chờ xác nhận',
    'Đã xác nhận',
    'Đang giao',
    'Đã giao',
    'Đã thanh toán',
    'Đã hủy',
  ];

  // Reset trạng thái khi mở modal
  React.useEffect(() => {
    if (visible && order) {
      setSelectedStatus(order.status);
    }
  }, [visible, order]);

  // Cập nhật trạng thái đơn hàng
  const handleUpdateStatus = async () => {
    if (!order || selectedStatus === order.status) {
      onClose();
      return;
    }

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(`http://192.168.1.13:5000/api/admin/orders/${order.bill_id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: selectedStatus })
      });

      const data = await response.json();
      
      if (response.ok) {
        onStatusUpdated(order.bill_id, selectedStatus);
        onClose();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Lỗi',
          text2: data.message || 'Không thể cập nhật trạng thái đơn hàng',
          position: 'bottom',
        });
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi kết nối',
        text2: 'Không thể kết nối đến máy chủ',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
    }
  };

  // Hiển thị màu sắc theo trạng thái
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
            <Text style={styles.modalTitle}>Cập nhật trạng thái đơn hàng</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="times" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <Text style={styles.orderInfo}>
              Đơn hàng: #{order.bill_id} - {order.name || 'Không có tên'}
            </Text>
            
            <Text style={styles.currentStatus}>
              Trạng thái hiện tại: 
              <Text style={{ color: getStatusColor(order.status) }}> {order.status}</Text>
            </Text>
            
            <Text style={styles.selectLabel}>Chọn trạng thái mới:</Text>
            
            <View style={styles.statusOptions}>
              {statusOptions.map((status) => (
                <TouchableOpacity
                  key={status}
                  style={[
                    styles.statusOption,
                    selectedStatus === status && styles.selectedStatus,
                    { borderColor: getStatusColor(status) }
                  ]}
                  onPress={() => setSelectedStatus(status)}
                >
                  <View style={[styles.statusDot, { backgroundColor: getStatusColor(status) }]} />
                  <Text 
                    style={[
                      styles.statusText,
                      selectedStatus === status && styles.selectedStatusText
                    ]}
                  >
                    {status}
                  </Text>
                  {selectedStatus === status && (
                    <Icon name="check" size={16} color={getStatusColor(status)} style={styles.checkIcon} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.updateButton,
                selectedStatus === order.status && styles.disabledButton
              ]} 
              onPress={handleUpdateStatus}
              disabled={loading || selectedStatus === order.status}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.updateButtonText}>Cập nhật</Text>
              )}
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
    width: '90%',
    maxHeight: '80%',
    borderRadius: 10,
    overflow: 'hidden',
  },
  modalHeader: {
    backgroundColor: '#1f1f27',
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 15,
  },
  orderInfo: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 10,
    fontWeight: 'bold',
  },
  currentStatus: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 20,
  },
  selectLabel: {
    color: '#fbc02d',
    fontSize: 16,
    marginBottom: 10,
  },
  statusOptions: {
    marginBottom: 10,
  },
  statusOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#2a2a32',
    marginBottom: 10,
    borderRadius: 8,
    borderLeftWidth: 4,
  },
  selectedStatus: {
    backgroundColor: 'rgba(251, 192, 45, 0.1)',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
  selectedStatusText: {
    fontWeight: 'bold',
  },
  checkIcon: {
    marginLeft: 5,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#1f1f27',
  },
  cancelButton: {
    backgroundColor: '#3a3a42',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  updateButton: {
    backgroundColor: '#2196f3',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 6,
    minWidth: 100,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#3a3a42',
    opacity: 0.6,
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default AdminOrderStatusModal;