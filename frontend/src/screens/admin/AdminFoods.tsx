import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  RefreshControl,
  StatusBar,
  Image,
  ScrollView
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../../navigation/AppNavigator';
import AdminSideMenu from '../../components/admin/AdminSideMenu';
import AdminFoodModal from '../../components/admin/AdminFoodModal';
import AdminFoodDetailModal from '../../components/admin/AdminFoodDetailModal';
import Toast from 'react-native-toast-message';

const AdminFoods = ({ navigation }: any) => {
  const [foods, setFoods] = useState<any[]>([]);
  const [filteredFoods, setFilteredFoods] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [foodDetailVisible, setFoodDetailVisible] = useState(false);
  const [foodModalVisible, setFoodModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [username, setUsername] = useState('');
  const [categories, setCategories] = useState<any[]>([]);

  const { signOut } = useContext(AuthContext);

  // Load username và danh sách món ăn khi component mount
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
    fetchCategories();
    fetchFoods();
  }, []);

  // Filter foods khi search query hoặc selected category thay đổi
  useEffect(() => {
    let result = [...foods];
    
    // Filter by category
    if (selectedCategory !== 'all') {
      result = result.filter(food => food.id_category.toString() === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(food => 
        food.food_name.toLowerCase().includes(query) ||
        food.category_name.toLowerCase().includes(query)
      );
    }
    
    setFilteredFoods(result);
  }, [searchQuery, selectedCategory, foods]);

  // Fetch danh sách danh mục món ăn từ API
  const fetchCategories = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch('http://192.168.1.13:5000/api/admin/food-categories', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories);
      } else {
        console.error('Error fetching categories:', await response.text());
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Fetch danh sách món ăn từ API
  const fetchFoods = async () => {
    try {
      setLoading(true);
      
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch('http://192.168.1.13:5000/api/admin/foods', {
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
        throw new Error(errorData.message || 'Không thể lấy danh sách món ăn');
      }

      const data = await response.json();
      setFoods(data.foods);
      setFilteredFoods(data.foods);
    } catch (error) {
      console.error('Error fetching foods:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: error instanceof Error ? error.message : 'Không thể tải danh sách món ăn',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Pull-to-refresh
  const handleRefresh = () => {
    setRefreshing(true);
    fetchFoods();
  };

  // Mở modal thêm món ăn mới
  const handleAddFood = () => {
    setSelectedFood(null);
    setIsEditMode(false);
    setFoodModalVisible(true);
  };

  // Mở modal chi tiết món ăn
  const handleViewFoodDetail = (food: any) => {
    setSelectedFood(food);
    setFoodDetailVisible(true);
  };

  // Mở modal chỉnh sửa món ăn
  const handleEditFood = () => {
    setIsEditMode(true);
    setFoodDetailVisible(false);
    setFoodModalVisible(true);
  };

  // Xóa món ăn
  const handleDeleteFood = () => {
    Alert.alert(
      "Xác nhận xóa",
      `Bạn có chắc chắn muốn xóa món "${selectedFood.food_name}" không?`,
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Xóa", 
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              
              const response = await fetch(`http://192.168.1.13:5000/api/admin/foods/${selectedFood.food_id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });

              if (response.ok) {
                Toast.show({
                  type: 'success',
                  text1: 'Thành công',
                  text2: 'Đã xóa món ăn',
                  position: 'bottom',
                });
                
                // Cập nhật danh sách món ăn
                setFoods(foods.filter(food => food.food_id !== selectedFood.food_id));
                setFoodDetailVisible(false);
              } else {
                const errorData = await response.json();
                Toast.show({
                  type: 'error',
                  text1: 'Lỗi',
                  text2: errorData.message || 'Không thể xóa món ăn',
                  position: 'bottom',
                });
              }
            } catch (error) {
              console.error('Error deleting food:', error);
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

  // Cập nhật trạng thái món ăn
  const handleToggleFoodStatus = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      const newStatus = selectedFood.status === 1 ? 0 : 1;
      
      const response = await fetch(`http://192.168.1.13:5000/api/admin/foods/${selectedFood.food_id}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        Toast.show({
          type: 'success',
          text1: 'Thành công',
          text2: newStatus === 1 ? 'Đã kích hoạt món ăn' : 'Đã vô hiệu hóa món ăn',
          position: 'bottom',
        });
        
        // Cập nhật trạng thái món ăn trong danh sách
        const updatedFoods = foods.map(food => 
          food.food_id === selectedFood.food_id ? { ...food, status: newStatus } : food
        );
        setFoods(updatedFoods);
        
        // Cập nhật selectedFood để hiển thị đúng trong modal chi tiết
        setSelectedFood({ ...selectedFood, status: newStatus });
      } else {
        const errorData = await response.json();
        Toast.show({
          type: 'error',
          text1: 'Lỗi',
          text2: errorData.message || 'Không thể cập nhật trạng thái',
          position: 'bottom',
        });
      }
    } catch (error) {
      console.error('Error toggling food status:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi kết nối',
        text2: 'Không thể kết nối đến máy chủ',
        position: 'bottom',
      });
    }
  };

  // Format giá tiền
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN').format(price) + 'đ';
  };

  // Render từng món ăn trong danh sách
  const renderFoodItem = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity 
        style={styles.foodCard}
        onPress={() => handleViewFoodDetail(item)}
      >
        <View style={styles.foodImageContainer}>
          {item.image ? (
            <Image 
              source={{ uri: `http://192.168.1.13:5000/foods/${item.image}` }} 
              style={styles.foodImage} 
            />
          ) : (
            <View style={styles.noImage}>
              <Icon name="image" size={24} color="#666" />
            </View>
          )}
          
          {item.status === 0 && (
            <View style={styles.disabledBadge}>
              <Text style={styles.disabledText}>Ẩn</Text>
            </View>
          )}
        </View>
        
        <View style={styles.foodInfo}>
          <Text style={styles.foodName} numberOfLines={1}>{item.food_name}</Text>
          <Text style={styles.foodCategory}>{item.category_name}</Text>
          <Text style={styles.foodPrice}>{formatPrice(item.price)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Render khi không có kết quả tìm kiếm
  const renderEmptyList = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyList}>
        <Icon name="search" size={50} color="#666" />
        <Text style={styles.emptyText}>
          {searchQuery ? 'Không tìm thấy món ăn nào phù hợp' : 'Không có món ăn nào'}
        </Text>
      </View>
    );
  };

  // Xử lý thêm/sửa món ăn thành công
  const handleFoodSuccess = (food: any, isEdit: boolean) => {
    setFoodModalVisible(false);
    
    if (isEdit) {
      // Cập nhật món ăn đã sửa trong danh sách
      const updatedFoods = foods.map(item => 
        item.food_id === food.food_id ? food : item
      );
      setFoods(updatedFoods);
    } else {
      // Thêm món ăn mới vào danh sách
      setFoods([food, ...foods]);
    }
    
    Toast.show({
      type: 'success',
      text1: 'Thành công',
      text2: isEdit ? 'Đã cập nhật món ăn' : 'Đã thêm món ăn mới',
      position: 'bottom',
    });
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
        
        <Text style={styles.headerTitle}>Quản lý món ăn</Text>
        
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddFood}
        >
          <Icon name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search và Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon name="search" size={18} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm món ăn..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <Icon name="times-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Lọc theo danh mục */}
      <View style={styles.categoryFilterContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryFilterContent}
        >
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategory === 'all' && styles.selectedCategoryChip
            ]}
            onPress={() => setSelectedCategory('all')}
          >
            <Text 
              style={[
                styles.categoryChipText,
                selectedCategory === 'all' && styles.selectedCategoryChipText
              ]}
            >
              Tất cả
            </Text>
          </TouchableOpacity>
          
          {categories.map(category => (
            <TouchableOpacity
              key={category.id_category}
              style={[
                styles.categoryChip,
                selectedCategory === category.id_category.toString() && styles.selectedCategoryChip
              ]}
              onPress={() => setSelectedCategory(category.id_category.toString())}
            >
              <Text 
                style={[
                  styles.categoryChipText,
                  selectedCategory === category.id_category.toString() && styles.selectedCategoryChipText
                ]}
              >
                {category.category_name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Danh sách món ăn */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fbc02d" />
        </View>
      ) : (
        <FlatList
          data={filteredFoods}
          renderItem={renderFoodItem}
          keyExtractor={(item) => item.food_id.toString()}
          numColumns={2}
          contentContainerStyle={styles.foodList}
          columnWrapperStyle={styles.foodRow}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={renderEmptyList}
        />
      )}

      {/* Side Menu */}
      {showMenu && (
        <AdminSideMenu 
          navigation={navigation} 
          onClose={() => setShowMenu(false)}
          username={username}
        />
      )}

      {/* Food Detail Modal */}
      <AdminFoodDetailModal
        visible={foodDetailVisible}
        food={selectedFood}
        onClose={() => setFoodDetailVisible(false)}
        onEdit={handleEditFood}
        onDelete={handleDeleteFood}
        onToggleStatus={handleToggleFoodStatus}
      />

      {/* Add/Edit Food Modal */}
      <AdminFoodModal
        visible={foodModalVisible}
        food={isEditMode ? selectedFood : null}
        categories={categories}
        onClose={() => setFoodModalVisible(false)}
        onSuccess={handleFoodSuccess}
        isEdit={isEditMode}
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
  addButton: {
    width: 36,
    height: 36,
    backgroundColor: '#fbc02d',
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    padding: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a32',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 46,
    color: '#fff',
    fontSize: 16,
  },
  clearButton: {
    padding: 6,
  },
  categoryFilterContainer: {
    marginBottom: 10,
  },
  categoryFilterContent: {
    paddingHorizontal: 12,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#2a2a32',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  selectedCategoryChip: {
    backgroundColor: 'rgba(251, 192, 45, 0.1)',
    borderColor: '#fbc02d',
  },
  categoryChipText: {
    color: '#ccc',
    fontSize: 14,
  },
  selectedCategoryChipText: {
    color: '#fbc02d',
    fontWeight: 'bold',
  },
  foodList: {
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
  foodRow: {
    justifyContent: 'space-between',
  },
  foodCard: {
    width: '48%',
    backgroundColor: '#2a2a32',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 2,
  },
  foodImageContainer: {
    height: 140,
    position: 'relative',
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
  disabledBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(244, 67, 54, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  disabledText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  foodInfo: {
    padding: 12,
  },
  foodName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  foodCategory: {
    color: '#999',
    fontSize: 14,
    marginBottom: 6,
  },
  foodPrice: {
    color: '#fbc02d',
    fontSize: 15,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    marginTop: 40,
  },
  emptyText: {
    color: '#999',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
});

export default AdminFoods;