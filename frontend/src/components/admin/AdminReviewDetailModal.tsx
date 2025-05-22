import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

interface AdminReviewDetailModalProps {
  visible: boolean;
  review: any;
  onClose: () => void;
  onDelete: (reviewId: number) => void;
}

const AdminReviewDetailModal = ({
  visible,
  review,
  onClose,
  onDelete
}: AdminReviewDetailModalProps) => {
  if (!visible || !review) return null;

  const handleDelete = () => {
    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc chắn muốn xóa đánh giá này không?",
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Xóa", 
          style: "destructive",
          onPress: () => {
            onDelete(review.review_id);
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
            <Text style={styles.modalTitle}>Chi tiết đánh giá</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="times" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* User Info Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Người dùng</Text>
              
              <View style={styles.userInfoContainer}>
                {review.profile_image ? (
                  <Image source={{ uri: review.profile_image }} style={styles.userAvatar} />
                ) : (
                  <View style={styles.defaultAvatar}>
                    <Icon name="user" size={24} color="#fff" />
                  </View>
                )}
                
                <View style={styles.userDetails}>
                  <Text style={styles.username}>{review.username}</Text>
                  <Text style={styles.userEmail}>{review.email || 'Không có email'}</Text>
                </View>
              </View>
            </View>

            {/* Food Info Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Món ăn được đánh giá</Text>
              
              <View style={styles.foodInfoContainer}>
                {review.food_image ? (
                  <Image source={{ uri: review.food_image }} style={styles.foodImage} />
                ) : (
                  <View style={styles.noFoodImage}>
                    <Icon name="image" size={24} color="#666" />
                  </View>
                )}
                
                <View style={styles.foodDetails}>
                  <Text style={styles.foodName}>{review.food_name}</Text>
                  <Text style={styles.foodPrice}>
                    {review.new_price !== review.price ? (
                      <>
                        <Text style={styles.discountedPrice}>{new Intl.NumberFormat('vi-VN').format(review.new_price)}đ</Text>
                        <Text style={styles.originalPrice}> {new Intl.NumberFormat('vi-VN').format(review.price)}đ</Text>
                      </>
                    ) : (
                      new Intl.NumberFormat('vi-VN').format(review.price) + 'đ'
                    )}
                  </Text>
                </View>
              </View>
            </View>

            {/* Rating Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Đánh giá</Text>
              
              <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Icon
                    key={`detail-star-${star}`}
                    name={star <= review.star_rating ? 'star' : 'star-o'}
                    size={24}
                    color="#fbc02d"
                    style={styles.starIcon}
                  />
                ))}
                <Text style={styles.ratingText}>{review.star_rating}/5</Text>
              </View>
              
              <Text style={styles.commentTitle}>Nhận xét:</Text>
              <Text style={styles.commentText}>{review.comment}</Text>
              
              <Text style={styles.reviewDate}>Đánh giá vào: {review.created_at}</Text>
            </View>

            {/* Order Info Section */}
            {review.bill_id && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Thông tin đơn hàng</Text>
                
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Mã đơn hàng:</Text>
                  <Text style={styles.infoValue}>#{review.bill_id}</Text>
                </View>
              </View>
            )}
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={handleDelete}
            >
              <Icon name="trash" size={18} color="#fff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Xóa đánh giá</Text>
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
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#fbc02d',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  userInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#2a2a32',
    borderRadius: 8,
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  defaultAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userDetails: {
    marginLeft: 15,
    flex: 1,
  },
  username: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  userEmail: {
    color: '#ccc',
    fontSize: 14,
  },
  foodInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#2a2a32',
    borderRadius: 8,
  },
  foodImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  noFoodImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  foodDetails: {
    marginLeft: 15,
    flex: 1,
  },
  foodName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  foodPrice: {
    color: '#ccc',
    fontSize: 14,
    flexDirection: 'row',
  },
  discountedPrice: {
    color: '#4caf50',
    fontWeight: 'bold',
  },
  originalPrice: {
    color: '#999',
    textDecorationLine: 'line-through',
    fontSize: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  starIcon: {
    marginRight: 5,
  },
  ratingText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  commentTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  commentText: {
    color: '#eee',
    fontSize: 15,
    lineHeight: 22,
    backgroundColor: '#2a2a32',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#fbc02d',
  },
  reviewDate: {
    color: '#888',
    fontSize: 12,
    marginTop: 10,
    textAlign: 'right',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingVertical: 5,
    borderBottomWidth: 0.5,
    borderBottomColor: '#444',
  },
  infoLabel: {
    color: '#ccc',
    fontSize: 14,
    width: 120,
  },
  infoValue: {
    color: '#fff',
    fontSize: 14,
    flex: 1,
  },
  modalFooter: {
    padding: 15,
    backgroundColor: '#1f1f27',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  deleteButton: {
    backgroundColor: '#f44336',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
});

export default AdminReviewDetailModal;