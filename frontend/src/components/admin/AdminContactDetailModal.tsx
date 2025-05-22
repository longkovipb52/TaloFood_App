import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

interface AdminContactDetailModalProps {
  visible: boolean;
  contact: any;
  onClose: () => void;
  onUpdateStatus: (contactId: number, status: string) => void;
  onDelete: (contactId: number) => void;
}

const AdminContactDetailModal = ({
  visible,
  contact,
  onClose,
  onUpdateStatus,
  onDelete
}: AdminContactDetailModalProps) => {
  if (!visible || !contact) return null;

  const handleToggleStatus = () => {
    const newStatus = contact.status === 'Đã xử lý' ? 'Chưa xử lý' : 'Đã xử lý';
    
    Alert.alert(
      "Xác nhận thay đổi",
      `Bạn có chắc chắn muốn đổi trạng thái thành "${newStatus}"?`,
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Xác nhận", 
          onPress: () => onUpdateStatus(contact.contact_id, newStatus)
        }
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc chắn muốn xóa liên hệ này không?",
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Xóa", 
          style: "destructive",
          onPress: () => {
            onDelete(contact.contact_id);
            onClose();
          }
        }
      ]
    );
  };

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
            <Text style={styles.modalTitle}>Chi tiết liên hệ</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="times" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Trạng thái */}
            <View style={styles.statusSection}>
              <Text style={styles.sectionTitle}>Trạng thái</Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: contact.status === 'Đã xử lý' ? '#4caf50' : '#ff9800' }
              ]}>
                <Text style={styles.statusBadgeText}>{contact.status}</Text>
              </View>
            </View>
            
            {/* Thông tin người dùng */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Thông tin người gửi</Text>
              
              <View style={styles.infoRow}>
                <Icon name="user" size={18} color="#fbc02d" style={styles.infoIcon} />
                <Text style={styles.infoLabel}>Tên người dùng:</Text>
                <Text style={styles.infoValue}>{contact.username}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Icon name="envelope" size={18} color="#fbc02d" style={styles.infoIcon} />
                <Text style={styles.infoLabel}>Email:</Text>
                <Text style={styles.infoValue}>{contact.email || 'Chưa cập nhật'}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Icon name="phone" size={18} color="#fbc02d" style={styles.infoIcon} />
                <Text style={styles.infoLabel}>Điện thoại:</Text>
                <Text style={styles.infoValue}>{contact.phone || 'Chưa cập nhật'}</Text>
              </View>
            </View>
            
            {/* Nội dung tin nhắn */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Nội dung liên hệ</Text>
              <View style={styles.messageContainer}>
                <Text style={styles.message}>{contact.Message}</Text>
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={[styles.footerButton, styles.deleteButton]} 
              onPress={handleDelete}
            >
              <Icon name="trash" size={18} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Xóa</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.footerButton, 
                contact.status === 'Đã xử lý' ? styles.markUnprocessedButton : styles.markProcessedButton
              ]} 
              onPress={handleToggleStatus}
            >
              <Icon 
                name={contact.status === 'Đã xử lý' ? 'times-circle' : 'check-circle'} 
                size={18} 
                color="#fff" 
                style={styles.buttonIcon} 
              />
              <Text style={styles.buttonText}>
                {contact.status === 'Đã xử lý' ? 'Đánh dấu chưa xử lý' : 'Đánh dấu đã xử lý'}
              </Text>
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
  statusSection: {
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: '#fbc02d',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIcon: {
    width: 24,
    textAlign: 'center',
    marginRight: 8,
  },
  infoLabel: {
    color: '#ccc',
    fontSize: 14,
    width: 110,
  },
  infoValue: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  messageContainer: {
    backgroundColor: '#2a2a32',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#fbc02d',
  },
  message: {
    color: '#fff',
    fontSize: 16,
    lineHeight: 22,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#1f1f27',
  },
  footerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 5,
    marginHorizontal: 5,
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  markProcessedButton: {
    backgroundColor: '#4caf50',
  },
  markUnprocessedButton: {
    backgroundColor: '#ff9800',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default AdminContactDetailModal;