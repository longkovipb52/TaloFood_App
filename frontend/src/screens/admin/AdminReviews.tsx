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
  Modal,
  TouchableWithoutFeedback,
  ScrollView as RNScrollView,  // Thêm alias để tránh xung đột
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../../navigation/AppNavigator';
import AdminSideMenu from '../../components/admin/AdminSideMenu';
import AdminReviewDetailModal from '../../components/admin/AdminReviewDetailModal';
import Toast from 'react-native-toast-message';

const ScrollView = RNScrollView;

const AdminReviews = ({ navigation }: any) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [filteredReviews, setFilteredReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [reviewDetailVisible, setReviewDetailVisible] = useState(false);
  const [username, setUsername] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [foodFilter, setFoodFilter] = useState('all');
  const [foods, setFoods] = useState<any[]>([]);
  const [showFoodFilterModal, setShowFoodFilterModal] = useState(false);

  const { signOut } = useContext(AuthContext);

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
    fetchReviews();
  }, []);

  const fetchReviews = async (search = '', rating = 'all', food = 'all') => {
    try {
      setLoading(true);
      
      const token = await AsyncStorage.getItem('token');
      
      let queryParams = '';
      if (search) queryParams += `q=${encodeURIComponent(search)}&`;
      if (rating !== 'all') queryParams += `rating=${encodeURIComponent(rating)}&`;
      if (food !== 'all') queryParams += `food=${encodeURIComponent(food)}`;
      
      const url = `http://192.168.1.13:5000/api/admin/reviews${queryParams ? '?' + queryParams : ''}`;
      
      const response = await fetch(url, {
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
        throw new Error(errorData.message || 'Không thể lấy danh sách đánh giá');
      }

      const data = await response.json();
      setReviews(data.reviews);
      setFilteredReviews(data.reviews);
      setFoods(data.foods || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: error instanceof Error ? error.message : 'Không thể tải danh sách đánh giá',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setSearchQuery('');
    setRatingFilter('all');
    setFoodFilter('all');
    fetchReviews();
  };

  const handleSearch = () => {
    fetchReviews(searchQuery, ratingFilter, foodFilter);
  };

  const handleRatingFilterChange = (rating: string) => {
    setRatingFilter(rating);
    fetchReviews(searchQuery, rating, foodFilter);
  };

  const handleFoodFilterChange = (foodId: string) => {
    setFoodFilter(foodId);
    fetchReviews(searchQuery, ratingFilter, foodId);
  };

  const handleViewReviewDetail = (review: any) => {
    setSelectedReview(review);
    setReviewDetailVisible(true);
  };

  const handleDeleteReview = async (reviewId: number) => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(`http://192.168.1.13:5000/api/admin/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        Toast.show({
          type: 'success',
          text1: 'Thành công',
          text2: 'Đã xóa đánh giá',
          position: 'bottom',
        });
        
        const updatedReviews = reviews.filter(review => review.review_id !== reviewId);
        setReviews(updatedReviews);
        setFilteredReviews(updatedReviews);
        
        if (reviewDetailVisible && selectedReview?.review_id === reviewId) {
          setReviewDetailVisible(false);
        }
      } else {
        const errorData = await response.json();
        Toast.show({
          type: 'error',
          text1: 'Lỗi',
          text2: errorData.message || 'Không thể xóa đánh giá',
          position: 'bottom',
        });
      }
    } catch (error) {
      console.error('Error deleting review:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi kết nối',
        text2: 'Không thể kết nối đến máy chủ',
        position: 'bottom',
      });
    }
  };

  const renderReviewItem = ({ item }: { item: any }) => {
    const truncatedComment = item.comment.length > 50 
      ? item.comment.substring(0, 50) + '...' 
      : item.comment;
    
    return (
      <TouchableOpacity 
        style={styles.reviewItem}
        onPress={() => handleViewReviewDetail(item)}
      >
        <View style={styles.reviewHeader}>
          <View style={styles.userInfo}>
            {item.profile_image ? (
              <Image source={{ uri: item.profile_image }} style={styles.userAvatar} />
            ) : (
              <View style={styles.defaultAvatar}>
                <Icon name="user" size={18} color="#fff" />
              </View>
            )}
            <Text style={styles.username}>{item.username}</Text>
          </View>
          
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Icon
                key={`${item.review_id}-star-${star}`}
                name={star <= item.star_rating ? 'star' : 'star-o'}
                size={14}
                color="#fbc02d"
                style={styles.starIcon}
              />
            ))}
          </View>
        </View>
        
        <View style={styles.foodInfoContainer}>
          <View style={styles.foodImageContainer}>
            {item.food_image ? (
              <Image source={{ uri: item.food_image }} style={styles.foodImage} />
            ) : (
              <View style={styles.noFoodImage}>
                <Icon name="image" size={14} color="#666" />
              </View>
            )}
          </View>
          
          <Text style={styles.foodName}>{item.food_name}</Text>
        </View>
        
        <Text style={styles.comment} numberOfLines={2}>{truncatedComment}</Text>
        
        <Text style={styles.reviewDate}>{item.created_at}</Text>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyList}>
        <Icon name="star-o" size={50} color="#666" />
        <Text style={styles.emptyText}>
          {(searchQuery || ratingFilter !== 'all' || foodFilter !== 'all') 
            ? 'Không tìm thấy đánh giá nào phù hợp' 
            : 'Không có đánh giá nào'}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1f1f27" barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={() => setShowMenu(true)}
        >
          <Icon name="bars" size={22} color="#fff" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Quản lý đánh giá</Text>
        
        <View style={{ width: 36 }} />
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon name="search" size={18} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm đánh giá..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => {
                setSearchQuery('');
                fetchReviews('', ratingFilter, foodFilter);
              }}
            >
              <Icon name="times-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        
        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
        >
          <Text style={styles.searchButtonText}>Tìm</Text>
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        {/* Rating Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <TouchableOpacity
            style={[
              styles.filterButton,
              ratingFilter === 'all' && styles.activeFilterButton
            ]}
            onPress={() => handleRatingFilterChange('all')}
          >
            <Text style={[
              styles.filterButtonText,
              ratingFilter === 'all' && styles.activeFilterButtonText
            ]}>Tất cả</Text>
          </TouchableOpacity>
          
          {[5, 4, 3, 2, 1].map((rating) => (
            <TouchableOpacity
              key={`rating-${rating}`}
              style={[
                styles.filterButton,
                ratingFilter === rating.toString() && styles.activeFilterButton
              ]}
              onPress={() => handleRatingFilterChange(rating.toString())}
            >
              <View style={styles.ratingButtonContent}>
                <Text style={[
                  styles.filterButtonText,
                  ratingFilter === rating.toString() && styles.activeFilterButtonText
                ]}>{rating}</Text>
                <Icon 
                  name="star" 
                  size={12} 
                  color={ratingFilter === rating.toString() ? '#23232a' : '#fbc02d'} 
                  style={{marginLeft: 4}} 
                />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        {/* Food Filter */}
        <View style={styles.foodFilterContainer}>
          <Text style={styles.filterSectionTitle}>Món ăn:</Text>
          
          <TouchableOpacity
            style={styles.foodFilterButton}
            onPress={() => setShowFoodFilterModal(true)}
          >
            <Text style={styles.foodFilterText}>
              {foodFilter === 'all' 
                ? 'Tất cả món ăn' 
                : foods.find(f => f.food_id.toString() === foodFilter)?.food_name || 'Chọn món ăn'
              }
            </Text>
            <Icon name="chevron-down" size={14} color="#aaa" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Food Filter Modal */}
      <Modal
        visible={showFoodFilterModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowFoodFilterModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowFoodFilterModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.foodFilterModal}>
                <View style={styles.foodFilterModalHeader}>
                  <Text style={styles.foodFilterModalTitle}>Chọn món ăn</Text>
                  <TouchableOpacity onPress={() => setShowFoodFilterModal(false)}>
                    <Icon name="times" size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.foodFilterList}>
                  <TouchableOpacity
                    style={[
                      styles.foodFilterItem,
                      foodFilter === 'all' && styles.activeFoodFilterItem
                    ]}
                    onPress={() => {
                      handleFoodFilterChange('all');
                      setShowFoodFilterModal(false);
                    }}
                  >
                    <Text style={[
                      styles.foodFilterItemText,
                      foodFilter === 'all' && styles.activeFoodFilterItemText
                    ]}>Tất cả món ăn</Text>
                    {foodFilter === 'all' && (
                      <Icon name="check" size={16} color="#fbc02d" />
                    )}
                  </TouchableOpacity>
                  
                  {foods.map((food) => (
                    <TouchableOpacity
                      key={food.food_id}
                      style={[
                        styles.foodFilterItem,
                        foodFilter === food.food_id.toString() && styles.activeFoodFilterItem
                      ]}
                      onPress={() => {
                        handleFoodFilterChange(food.food_id.toString());
                        setShowFoodFilterModal(false);
                      }}
                    >
                      <Text style={[
                        styles.foodFilterItemText,
                        foodFilter === food.food_id.toString() && styles.activeFoodFilterItemText
                      ]}>{food.food_name}</Text>
                      {foodFilter === food.food_id.toString() && (
                        <Icon name="check" size={16} color="#fbc02d" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fbc02d" />
        </View>
      ) : (
        <FlatList
          data={filteredReviews}
          renderItem={renderReviewItem}
          keyExtractor={(item) => item.review_id.toString()}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={renderEmptyList}
        />
      )}

      {showMenu && (
        <AdminSideMenu 
          navigation={navigation} 
          onClose={() => setShowMenu(false)}
          username={username}
        />
      )}

      <AdminReviewDetailModal
        visible={reviewDetailVisible}
        review={selectedReview}
        onClose={() => setReviewDetailVisible(false)}
        onDelete={handleDeleteReview}
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
  searchContainer: {
    padding: 12,
    flexDirection: 'row',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a32',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 8,
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
  searchButton: {
    backgroundColor: '#fbc02d',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#23232a',
    fontWeight: 'bold',
  },
  filterContainer: {
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  filterScroll: {
    marginBottom: 12,
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#2a2a32',
    marginRight: 8,
  },
  activeFilterButton: {
    backgroundColor: '#fbc02d',
  },
  filterButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  activeFilterButtonText: {
    color: '#23232a',
    fontWeight: 'bold',
  },
  ratingButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterSectionTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  foodFilterContainer: {
    marginTop: 4,
  },
  foodFilterButton: {
    backgroundColor: '#2a2a32',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  foodFilterText: {
    color: '#fff',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  foodFilterModal: {
    width: '85%',
    maxHeight: '70%',
    backgroundColor: '#23232a',
    borderRadius: 10,
    overflow: 'hidden',
  },
  foodFilterModalHeader: {
    backgroundColor: '#1f1f27',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  foodFilterModalTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  foodFilterList: {
    padding: 10,
  },
  foodFilterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  activeFoodFilterItem: {
    backgroundColor: '#2a2a32',
  },
  foodFilterItemText: {
    color: '#eee',
    fontSize: 15,
  },
  activeFoodFilterItemText: {
    color: '#fbc02d',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 12,
  },
  reviewItem: {
    backgroundColor: '#2a2a32',
    borderRadius: 10,
    marginBottom: 16,
    padding: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  defaultAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  username: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  ratingContainer: {
    flexDirection: 'row',
  },
  starIcon: {
    marginLeft: 2,
  },
  foodInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: '#555',
  },
  foodImageContainer: {
    width: 32,
    height: 32,
    borderRadius: 5,
    overflow: 'hidden',
    marginRight: 8,
  },
  foodImage: {
    width: '100%',
    height: '100%',
  },
  noFoodImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  foodName: {
    color: '#fbc02d',
    fontSize: 14,
  },
  comment: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 8,
  },
  reviewDate: {
    color: '#888',
    fontSize: 12,
    textAlign: 'right',
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

export default AdminReviews;