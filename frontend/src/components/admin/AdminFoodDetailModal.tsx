import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

interface AdminFoodDetailModalProps {
  visible: boolean;
  food: any;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onToggleStatus: () => void;
}

const AdminFoodDetailModal = ({
  visible,
  food,
  onClose,
  onEdit,
  onDelete,
  onToggleStatus
}: AdminFoodDetailModalProps) => {
  
  if (!visible || !food) return null;
  
  // Format giá tiền
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
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
            <Text style={styles.modalTitle}>Chi tiết món ăn</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="times" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            <View style={styles.foodImageContainer}>
              {food.image ? (
                <Image 
                  source={{ uri: `http://192.168.1.13:5000/foods/${food.image}` }} 
                  style={styles.foodImage} 
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.noImage}>
                  <Icon name="image" size={50} color="#666" />
                  <Text style={styles.noImageText}>Không có ảnh</Text>
                </View>
              )}
              
              <View style={[
                styles.statusBadge,
                { backgroundColor: food.status === 1 ? '#4caf50' : '#f44336' }
              ]}>
                <Text style={styles.statusText}>
                  {food.status === 1 ? 'Đang bán' : 'Đã ẩn'}
                </Text>
              </View>
            </View>
            
            <View style={styles.foodDetails}>
              <Text style={styles.foodName}>{food.food_name}</Text>
              <Text style={styles.foodCategory}>Danh mục: {food.category_name}</Text>
              <Text style={styles.foodPrice}>{formatPrice(food.price)}</Text>
              
              <View style={styles.separator} />
              
              <Text style={styles.sectionTitle}>Mô tả</Text>
              <Text style={styles.foodDescription}>
                {food.description || 'Không có mô tả'}
              </Text>
            </View>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={[styles.footerButton, styles.toggleButton, 
                { backgroundColor: food.status === 1 ? '#f44336' : '#4caf50' }
              ]} 
              onPress={onToggleStatus}
            >
              <Icon 
                name={food.status === 1 ? 'eye-slash' : 'eye'} 
                size={18} 
                color="#fff" 
                style={styles.buttonIcon} 
              />
              <Text style={styles.buttonText}>
                {food.status === 1 ? 'Ẩn món' : 'Hiện món'}
              </Text>
            </TouchableOpacity>
            
            <View style={styles.buttonGroup}>
              <TouchableOpacity 
                style={[styles.footerButton, styles.deleteButton]} 
                onPress={onDelete}
              >
                <Icon name="trash" size={18} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Xóa</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.footerButton, styles.editButton]} 
                onPress={onEdit}
              >
                <Icon name="pencil" size={18} color="#fff" style={styles.buttonIcon} />
                <Text style={styles.buttonText}>Sửa</Text>
              </TouchableOpacity>
            </View>
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
    maxHeight: '85%',
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
    maxHeight: '80%',
  },
  foodImageContainer: {
    position: 'relative',
    width: '100%',
    height: 200,
  },
  foodImage: {
    width: '100%',
    height: '100%',
  },
  noImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#3a3a42',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    color: '#999',
    marginTop: 8,
  },
  statusBadge: {
    position: 'absolute',
    top: 15,
    right: 15,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 5,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  foodDetails: {
    padding: 15,
  },
  foodName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  foodCategory: {
    color: '#bbb',
    fontSize: 16,
    marginBottom: 8,
  },
  foodPrice: {
    color: '#fbc02d',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  separator: {
    height: 1,
    backgroundColor: '#3a3a42',
    marginVertical: 15,
  },
  sectionTitle: {
    color: '#fbc02d',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  foodDescription: {
    color: '#ccc',
    fontSize: 15,
    lineHeight: 22,
  },
  modalFooter: {
    flexDirection: 'column',
    padding: 15,
    backgroundColor: '#1f1f27',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 5,
    flex: 1,
  },
  toggleButton: {
    backgroundColor: '#f44336',
  },
  deleteButton: {
    backgroundColor: '#f44336',
    marginRight: 10,
  },
  editButton: {
    backgroundColor: '#2196f3',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default AdminFoodDetailModal;