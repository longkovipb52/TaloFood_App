import React from 'react';
import { 
  Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Image 
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

interface AdminUserDetailModalProps {
  visible: boolean;
  onClose: () => void;
  user: any;
  onEdit: () => void;
  onDelete: () => void;
}

const AdminUserDetailModal = ({ 
  visible, onClose, user, onEdit, onDelete 
}: AdminUserDetailModalProps) => {
  if (!visible || !user) return null;

  // Tạo đường dẫn ảnh đại diện nếu có
  const profileImage = user.profile_image 
    ? `http://192.168.1.13:5000/profile_images/${user.profile_image}` 
    : null;

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
            <Text style={styles.modalTitle}>Thông tin người dùng</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="times" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.profileSection}>
              {/* Avatar */}
              <View style={styles.avatarContainer}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.avatar} />
                ) : (
                  <View style={[styles.avatar, styles.avatarPlaceholder]}>
                    <Icon name="user" size={30} color="#1f1f27" />
                  </View>
                )}
              </View>
              
              <Text style={styles.username}>{user.username}</Text>
              <View style={styles.badgeContainer}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>Người dùng</Text>
                </View>
              </View>
            </View>
            
            {/* User Details */}
            <View style={styles.detailSection}>
              <View style={styles.detailItem}>
                <Icon name="envelope" size={18} color="#fbc02d" style={styles.detailIcon} />
                <Text style={styles.detailLabel}>Email:</Text>
                <Text style={styles.detailValue}>{user.email || 'Chưa cập nhật'}</Text>
              </View>
              
              <View style={styles.detailItem}>
                <Icon name="phone" size={18} color="#fbc02d" style={styles.detailIcon} />
                <Text style={styles.detailLabel}>Điện thoại:</Text>
                <Text style={styles.detailValue}>{user.phone || 'Chưa cập nhật'}</Text>
              </View>
              
              <View style={styles.detailItem}>
                <Icon name="map-marker" size={18} color="#fbc02d" style={styles.detailIcon} />
                <Text style={styles.detailLabel}>Địa chỉ:</Text>
                <Text style={styles.detailValue}>{user.address || 'Chưa cập nhật'}</Text>
              </View>
              <View style={styles.detailItem}>
                <Icon name="check-circle" size={18} color="#fbc02d" style={styles.detailIcon} />
                <Text style={styles.detailLabel}>Trạng thái:</Text>
                <Text style={styles.detailValue}>
                  {user.status === 1 ? 'Hoạt động' : 'Bị khóa'}
                </Text>
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.editButton}
              onPress={onEdit}
            >
              <Icon name="pencil" size={16} color="#23232a" />
              <Text style={styles.editButtonText}>Sửa</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={onDelete}
            >
              <Icon name="trash" size={16} color="#fff" />
              <Text style={styles.deleteButtonText}>Xóa</Text>
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
  profileSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    marginBottom: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#fbc02d',
  },
  avatarPlaceholder: {
    backgroundColor: '#fbc02d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  username: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  badgeContainer: {
    flexDirection: 'row',
  },
  badge: {
    backgroundColor: '#fbc02d',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 15,
  },
  badgeText: {
    color: '#1f1f27',
    fontWeight: 'bold',
  },
  detailSection: {
    backgroundColor: '#2a2a32',
    borderRadius: 10,
    padding: 15,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  detailIcon: {
    width: 25,
    alignItems: 'center',
  },
  detailLabel: {
    color: '#fbc02d',
    width: 80,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  detailValue: {
    color: '#fff',
    flex: 1,
    flexWrap: 'wrap',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: '#1f1f27',
  },
  editButton: {
    backgroundColor: '#fbc02d',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginRight: 10,
  },
  editButtonText: {
    color: '#23232a',
    fontWeight: 'bold',
    marginLeft: 10,
  },
  deleteButton: {
    backgroundColor: '#f44336',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    flex: 1,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default AdminUserDetailModal;