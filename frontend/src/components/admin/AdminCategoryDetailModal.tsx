import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  FlatList
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AdminCategoryDetailModalProps {
  visible: boolean;
  category: any;
  onClose: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const AdminCategoryDetailModal = ({
  visible,
  category,
  onClose,
  onEdit,
  onDelete
}: AdminCategoryDetailModalProps) => {
  const [foods, setFoods] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    if (visible && category) {
      fetchCategoryDetails();
    }
  }, [visible, category]);

  if (!visible || !category) return null;
  
  const fetchCategoryDetails = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(`http://192.168.1.13:5000/api/admin/categories/${category.foodcategory_id}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setFoods(data.foods || []);
      } else {
        console.error('Error fetching category details:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching category details:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Render từng món ăn trong danh mục
  const renderFoodItem = ({ item }: { item: any }) => {
    return (
      <View style={styles.foodItem}>
        <View style={styles.foodImageContainer}>
          {item.image ? (
            <Image 
              source={{ uri: `http://192.168.1.13:5000/foods/${item.image}` }} 
              style={styles.foodImage} 
            />
          ) : (
            <View style={styles.noFoodImage}>
              <Icon name="image" size={16} color="#666" />
            </View>
          )}
        </View>
        
        <View style={styles.foodInfo}>
          <Text style={styles.foodName} numberOfLines={1}>{item.food_name}</Text>
          <Text style={styles.foodPrice}>{new Intl.NumberFormat('vi-VN').format(item.price)}đ</Text>
        </View>
        
        <View style={[styles.statusIndicator, { backgroundColor: item.status === 1 ? '#4caf50' : '#f44336' }]} />
      </View>
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
            <Text style={styles.modalTitle}>Chi tiết danh mục</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="times" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Thông tin danh mục */}
            <View style={styles.categoryDetails}>
              <View style={styles.categoryImageContainer}>
                {category.image ? (
                  <Image 
                    source={{ uri: `http://192.168.1.13:5000/category_images/${category.image}` }} 
                    style={styles.categoryImage} 
                  />
                ) : (
                  <View style={styles.noCategoryImage}>
                    <Icon name="cutlery" size={40} color="#666" />
                    <Text style={styles.noImageText}>Không có ảnh</Text>
                  </View>
                )}
              </View>
              
              <Text style={styles.categoryName}>{category.foodcategory_name}</Text>
              
              <View style={styles.foodCountContainer}>
                <Icon name="list" size={16} color="#fbc02d" style={{ marginRight: 8 }} />
                <Text style={styles.foodCount}>{category.food_count || 0} món ăn trong danh mục này</Text>
              </View>
            </View>
            
            <View style={styles.separator} />
            
            {/* Danh sách món ăn thuộc danh mục */}
            <View style={styles.foodsSection}>
              <Text style={styles.sectionTitle}>Danh sách món ăn</Text>
              
              {loading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#fbc02d" />
                </View>
              ) : (
                foods.length === 0 ? (
                  <Text style={styles.emptyText}>Không có món ăn nào trong danh mục này</Text>
                ) : (
                  <View style={styles.foodsList}>
                    {foods.map((food) => (
                      <View key={food.food_id} style={styles.foodItem}>
                        <View style={styles.foodImageContainer}>
                          {food.image ? (
                            <Image 
                              source={{ uri: `http://192.168.1.13:5000/foods/${food.image}` }} 
                              style={styles.foodImage} 
                            />
                          ) : (
                            <View style={styles.noFoodImage}>
                              <Icon name="image" size={16} color="#666" />
                            </View>
                          )}
                        </View>
                        
                        <View style={styles.foodInfo}>
                          <Text style={styles.foodName} numberOfLines={1}>{food.food_name}</Text>
                          <Text style={styles.foodPrice}>{new Intl.NumberFormat('vi-VN').format(food.price)}đ</Text>
                        </View>
                        
                        <View style={[styles.statusIndicator, { backgroundColor: food.status === 1 ? '#4caf50' : '#f44336' }]} />
                      </View>
                    ))}
                  </View>
                )
              )}
            </View>
          </ScrollView>
          
          <View style={styles.modalFooter}>
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
  categoryDetails: {
    padding: 15,
    alignItems: 'center',
  },
  categoryImageContainer: {
    width: 120,
    height: 120,
    marginBottom: 15,
    borderRadius: 10,
    overflow: 'hidden',
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  noCategoryImage: {
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
  categoryName: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  foodCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a32',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  foodCount: {
    color: '#ccc',
    fontSize: 14,
  },
  separator: {
    height: 1,
    backgroundColor: '#3a3a42',
    marginHorizontal: 15,
  },
  foodsSection: {
    padding: 15,
  },
  sectionTitle: {
    color: '#fbc02d',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  loadingContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  foodsList: {
    marginTop: 10,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a32',
    marginBottom: 8,
    padding: 8,
    borderRadius: 8,
  },
  foodImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 10,
  },
  foodImage: {
    width: '100%',
    height: '100%',
  },
  noFoodImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#3a3a42',
    justifyContent: 'center',
    alignItems: 'center',
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  foodPrice: {
    color: '#fbc02d',
    fontSize: 12,
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#1f1f27',
    justifyContent: 'space-between',
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

export default AdminCategoryDetailModal;