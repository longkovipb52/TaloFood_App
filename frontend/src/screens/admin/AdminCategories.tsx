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
  Image
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../../navigation/AppNavigator';
import AdminSideMenu from '../../components/admin/AdminSideMenu';
import AdminCategoryModal from '../../components/admin/AdminCategoryModal';
import AdminCategoryDetailModal from '../../components/admin/AdminCategoryDetailModal';
import Toast from 'react-native-toast-message';

const AdminCategories = ({ navigation }: any) => {
  const [categories, setCategories] = useState<any[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [categoryDetailVisible, setCategoryDetailVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [username, setUsername] = useState('');

  const { signOut } = useContext(AuthContext);

  // Load username và danh sách danh mục khi component mount
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
  }, []);

  // Filter categories khi search query thay đổi
  useEffect(() => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const filtered = categories.filter(category => 
        category.foodcategory_name.toLowerCase().includes(query)
      );
      setFilteredCategories(filtered);
    } else {
      setFilteredCategories(categories);
    }
  }, [searchQuery, categories]);

  // Fetch danh sách danh mục từ API
  const fetchCategories = async () => {
    try {
      setLoading(true);
      
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch('http://192.168.1.13:5000/api/admin/categories', {
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
        throw new Error(errorData.message || 'Không thể lấy danh sách danh mục');
      }

      const data = await response.json();
      setCategories(data.categories);
      setFilteredCategories(data.categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: error instanceof Error ? error.message : 'Không thể tải danh sách danh mục',
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
    fetchCategories();
  };

  // Mở modal thêm danh mục mới
  const handleAddCategory = () => {
    setSelectedCategory(null);
    setIsEditMode(false);
    setCategoryModalVisible(true);
  };

  // Mở modal chi tiết danh mục
  const handleViewCategoryDetail = (category: any) => {
    setSelectedCategory(category);
    setCategoryDetailVisible(true);
  };

  // Mở modal chỉnh sửa danh mục
  const handleEditCategory = () => {
    setIsEditMode(true);
    setCategoryDetailVisible(false);
    setCategoryModalVisible(true);
  };

  // Xóa danh mục
  const handleDeleteCategory = () => {
    Alert.alert(
      "Xác nhận xóa",
      `Bạn có chắc chắn muốn xóa danh mục "${selectedCategory.foodcategory_name}" không?`,
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Xóa", 
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              
              const response = await fetch(`http://192.168.1.13:5000/api/admin/categories/${selectedCategory.foodcategory_id}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });

              const data = await response.json();

              if (response.ok) {
                Toast.show({
                  type: 'success',
                  text1: 'Thành công',
                  text2: 'Đã xóa danh mục',
                  position: 'bottom',
                });
                
                // Cập nhật danh sách danh mục
                setCategories(categories.filter(cat => cat.foodcategory_id !== selectedCategory.foodcategory_id));
                setCategoryDetailVisible(false);
              } else {
                if (data.foodCount && data.foodCount > 0) {
                  Alert.alert(
                    "Không thể xóa danh mục",
                    `Danh mục này đang được sử dụng bởi ${data.foodCount} món ăn. Vui lòng chuyển các món ăn sang danh mục khác trước khi xóa.`
                  );
                } else {
                  Toast.show({
                    type: 'error',
                    text1: 'Lỗi',
                    text2: data.message || 'Không thể xóa danh mục',
                    position: 'bottom',
                  });
                }
              }
            } catch (error) {
              console.error('Error deleting category:', error);
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

  // Render từng danh mục trong danh sách
  const renderCategoryItem = ({ item }: { item: any }) => {
    return (
      <TouchableOpacity 
        style={styles.categoryCard}
        onPress={() => handleViewCategoryDetail(item)}
      >
        <View style={styles.categoryImageContainer}>
          {item.image ? (
            <Image 
              source={{ uri: `http://192.168.1.13:5000/category_images/${item.image}` }} 
              style={styles.categoryImage} 
            />
          ) : (
            <View style={styles.noImage}>
              <Icon name="cutlery" size={24} color="#666" />
            </View>
          )}
        </View>
        
        <View style={styles.categoryInfo}>
          <Text style={styles.categoryName}>{item.foodcategory_name}</Text>
          <View style={styles.foodCountContainer}>
            <Icon name="list" size={14} color="#fbc02d" style={styles.countIcon} />
            <Text style={styles.foodCount}>{item.food_count || 0} món ăn</Text>
          </View>
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
          {searchQuery ? 'Không tìm thấy danh mục nào phù hợp' : 'Không có danh mục nào'}
        </Text>
      </View>
    );
  };

  // Xử lý thêm/sửa danh mục thành công
  const handleCategorySuccess = (category: any, isEdit: boolean) => {
    setCategoryModalVisible(false);
    
    if (isEdit) {
      // Cập nhật danh mục đã sửa trong danh sách
      const updatedCategories = categories.map(cat => 
        cat.foodcategory_id === category.foodcategory_id ? category : cat
      );
      setCategories(updatedCategories);
    } else {
      // Thêm danh mục mới vào danh sách
      setCategories([category, ...categories]);
    }
    
    Toast.show({
      type: 'success',
      text1: 'Thành công',
      text2: isEdit ? 'Đã cập nhật danh mục' : 'Đã thêm danh mục mới',
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
        
        <Text style={styles.headerTitle}>Quản lý danh mục</Text>
        
        <TouchableOpacity
          style={styles.addButton}
          onPress={handleAddCategory}
        >
          <Icon name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon name="search" size={18} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm danh mục..."
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

      {/* Danh sách danh mục */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fbc02d" />
        </View>
      ) : (
        <FlatList
          data={filteredCategories}
          renderItem={renderCategoryItem}
          keyExtractor={(item) => item.foodcategory_id.toString()}
          numColumns={2}
          contentContainerStyle={styles.categoryList}
          columnWrapperStyle={styles.categoryRow}
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

      {/* Category Detail Modal */}
      <AdminCategoryDetailModal
        visible={categoryDetailVisible}
        category={selectedCategory}
        onClose={() => setCategoryDetailVisible(false)}
        onEdit={handleEditCategory}
        onDelete={handleDeleteCategory}
      />

      {/* Add/Edit Category Modal */}
      <AdminCategoryModal
        visible={categoryModalVisible}
        category={isEditMode ? selectedCategory : null}
        onClose={() => setCategoryModalVisible(false)}
        onSuccess={handleCategorySuccess}
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
  categoryList: {
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
  categoryRow: {
    justifyContent: 'space-between',
  },
  categoryCard: {
    width: '48%',
    backgroundColor: '#2a2a32',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 2,
  },
  categoryImageContainer: {
    height: 120,
    position: 'relative',
  },
  categoryImage: {
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
  categoryInfo: {
    padding: 12,
  },
  categoryName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  foodCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countIcon: {
    marginRight: 6,
  },
  foodCount: {
    color: '#ccc',
    fontSize: 14,
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

export default AdminCategories;