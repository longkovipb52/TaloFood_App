import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MainLayout from '../components/MainLayout';
import { COLORS } from '../theme/colors';
import Toast from 'react-native-toast-message';
import ReviewModal from '../components/ReviewModal';

const ReviewScreen = ({ navigation }: any) => {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // State for review editing
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedReview, setSelectedReview] = useState<any>(null);

  useEffect(() => {
    const getUserId = async () => {
      const id = await AsyncStorage.getItem('userId');
      setUserId(id);
      if (id) {
        fetchReviews(id);
      }
    };
    
    getUserId();
  }, []);

  const fetchReviews = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`http://192.168.1.13:5000/api/reviews/user/${id}`);
      const data = await response.json();
      
      if (response.ok) {
        setReviews(data.reviews || []);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Lỗi',
          text2: 'Không thể tải lịch sử đánh giá',
          position: 'bottom',
        });
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi kết nối',
        text2: 'Không thể tải lịch sử đánh giá',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    if (userId) {
      fetchReviews(userId);
    } else {
      setRefreshing(false);
    }
  };

  const handleEditReview = (review: any) => {
    // Đảm bảo thu thập đầy đủ thông tin cần thiết
    console.log('Selecting review for edit:', review); // Debug log
    
    setSelectedReview({
      food_id: review.id_food,
      food_name: review.food_name,
      rating: review.star_rating,
      comment: review.comment,
      billInfoId: review.billinfo_id,
      reviewId: review.review_id
    });
    setEditModalVisible(true);
  };

  const handleDeleteReview = (reviewId: number) => {
    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc chắn muốn xóa đánh giá này không?",
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Xóa", 
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(`http://192.168.1.13:5000/api/reviews/${reviewId}`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userId }),
              });

              const result = await response.json();

              if (response.ok) {
                // Remove the deleted review from the state
                setReviews(reviews.filter(review => review.review_id !== reviewId));
                
                Toast.show({
                  type: 'success',
                  text1: 'Đã xóa đánh giá',
                  position: 'bottom',
                });
              } else {
                Toast.show({
                  type: 'error',
                  text1: 'Lỗi',
                  text2: result.message || 'Không thể xóa đánh giá',
                  position: 'bottom',
                });
              }
            } catch (error) {
              console.error('Error deleting review:', error);
              Toast.show({
                type: 'error',
                text1: 'Lỗi kết nối',
                text2: 'Không thể xóa đánh giá',
                position: 'bottom',
              });
            }
          }
        }
      ]
    );
  };

  const onCloseModal = () => {
    setEditModalVisible(false);
    setSelectedReview(null);
    // Refresh reviews list after editing
    if (userId) {
      fetchReviews(userId);
    }
  };

  const renderReviewItem = ({ item }: { item: any }) => (
    <View style={styles.reviewCard}>
      <View style={styles.reviewHeader}>
        <Image 
          source={{ uri: item.image_url || 'https://via.placeholder.com/100' }} 
          style={styles.foodImage} 
        />
        <View style={styles.reviewHeaderInfo}>
          <Text style={styles.foodName}>{item.food_name}</Text>
          <View style={styles.ratingContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Icon 
                key={star} 
                name={star <= item.star_rating ? 'star' : 'star-o'} 
                size={16} 
                color="#fbc02d" 
                style={{ marginRight: 2 }}
              />
            ))}
            <Text style={styles.dateText}>{item.created_at}</Text>
          </View>
        </View>
      </View>

      <Text style={styles.commentText}>{item.comment}</Text>
      
      <View style={styles.reviewActions}>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => handleEditReview(item)}
        >
          <Icon name="pencil" size={14} color="#fff" style={{ marginRight: 5 }} />
          <Text style={styles.editButtonText}>Sửa</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeleteReview(item.review_id)}
        >
          <Icon name="trash" size={14} color="#fff" style={{ marginRight: 5 }} />
          <Text style={styles.deleteButtonText}>Xóa</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <MainLayout navigation={navigation}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải đánh giá...</Text>
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout navigation={navigation}>
      <View style={styles.container}>
        <Text style={styles.title}>Lịch Sử Đánh Giá</Text>
        
        {reviews.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="star-o" size={60} color="#555" />
            <Text style={styles.emptyText}>Bạn chưa có đánh giá nào</Text>
            <TouchableOpacity 
              style={styles.browseButton}
              onPress={() => navigation.navigate('Menu')}
            >
              <Text style={styles.browseButtonText}>Khám phá món ăn</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={reviews}
            keyExtractor={(item) => item.review_id.toString()}
            renderItem={renderReviewItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={handleRefresh}
          />
        )}
      </View>

      {selectedReview && (
        <ReviewModal
          visible={editModalVisible}
          onClose={onCloseModal}
          foodItem={{
            food_id: selectedReview.food_id,
            food_name: selectedReview.food_name
          }}
          userId={userId}
          existingReview={{
            rating: selectedReview.rating,
            comment: selectedReview.comment,
            billInfoId: selectedReview.billInfoId,
            reviewId: selectedReview.reviewId
          }}
          isEdit={true} // Đảm bảo cài đặt flag này là true
          orderId={null} // Không cần orderId khi sửa đánh giá hiện có
        />
      )}
    </MainLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#23232a',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fbc02d',
    marginBottom: 20,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#23232a',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
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
    marginBottom: 20,
  },
  browseButton: {
    backgroundColor: '#fbc02d',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#23232a',
    fontWeight: 'bold',
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 20,
  },
  reviewCard: {
    backgroundColor: '#2a2a32',
    borderRadius: 10,
    padding: 16,
    marginBottom: 16,
  },
  reviewHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  foodImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  reviewHeaderInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  foodName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    color: '#999',
    fontSize: 12,
    marginLeft: 8,
  },
  commentText: {
    color: '#eee',
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 16,
  },
  reviewActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  editButton: {
    backgroundColor: '#4CAF50',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginRight: 10,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  deleteButton: {
    backgroundColor: '#F44336',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  deleteButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});

export default ReviewScreen;