import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import Toast from 'react-native-toast-message';

interface ReviewModalProps {
  visible: boolean;
  onClose: () => void;
  foodItem: {
    food_id: number;
    food_name: string;
  };
  userId: string | null;
  existingReview?: {
    rating: number;
    comment: string;
    billInfoId?: number;
    reviewId?: number; // Thêm reviewId để xác định đánh giá cần sửa
  } | null;
  orderId: number | null; // Có thể null nếu là chỉnh sửa từ màn hình lịch sử
  isEdit?: boolean; // Flag để xác định đây là chỉnh sửa hay tạo mới
}

const ReviewModal = ({ visible, onClose, foodItem, userId, existingReview = null, orderId, isEdit = false }: ReviewModalProps) => {
  const [rating, setRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (existingReview) {
      setRating(existingReview.rating);
      setComment(existingReview.comment);
    } else {
      setRating(0);
      setComment('');
    }
  }, [existingReview, visible]);

  const handleSubmit = async () => {
    if (rating === 0) {
      Toast.show({
        type: 'info',
        text1: 'Vui lòng chọn số sao',
        position: 'bottom',
      });
      return;
    }

    if (!comment.trim()) {
      Toast.show({
        type: 'info',
        text1: 'Vui lòng nhập nhận xét',
        position: 'bottom',
      });
      return;
    }

    try {
      setSubmitting(true);
      
      // Tạo đối tượng dữ liệu để gửi lên server với tất cả thuộc tính có thể có
      const reviewData: {
        userId: string | null;
        foodId: number;
        rating: number;
        comment: string;
        isEdit: boolean;
        reviewId?: number;
        billId?: number | null;
        billInfoId?: number;
      } = {
        userId,
        foodId: foodItem.food_id,
        rating,
        comment,
        isEdit: isEdit,
        reviewId: existingReview?.reviewId
      };
      
      // Nếu không phải chế độ edit thì mới cần billId
      if (!isEdit) {
        reviewData.billId = orderId;
        reviewData.billInfoId = existingReview?.billInfoId;
      }
      
      console.log('Sending data:', reviewData); // Debug log
      
      const response = await fetch('http://192.168.1.13:5000/api/reviews/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reviewData),
      });

      const result = await response.json();

      if (response.ok) {
        Toast.show({
          type: 'success',
          text1: isEdit ? 'Đã cập nhật đánh giá' : 'Đã thêm đánh giá thành công',
          position: 'bottom',
        });
        setRating(0);
        setComment('');
        onClose();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Đánh giá không thành công',
          text2: result.message || 'Đã có lỗi xảy ra',
          position: 'bottom',
        });
        console.error('Error response:', result); // Debug log
      }
    } catch (error) {
      console.error('Error submitting review:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi kết nối',
        text2: 'Không thể gửi đánh giá',
        position: 'bottom',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetAndClose = () => {
    setRating(0);
    setComment('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={resetAndClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <TouchableOpacity style={styles.closeButton} onPress={resetAndClose}>
            <Icon name="times" size={20} color="#888" />
          </TouchableOpacity>

          <Text style={styles.modalTitle}>
            {existingReview ? 'Sửa Đánh Giá' : 'Đánh Giá Sản Phẩm'}
          </Text>
          
          <Text style={styles.foodName}>{foodItem?.food_name}</Text>
          
          <Text style={styles.ratingLabel}>Đánh Giá Của Bạn:</Text>
          <View style={styles.starsContainer}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRating(star)}
                style={styles.starButton}
              >
                <Icon
                  name={rating >= star ? 'star' : 'star-o'}
                  size={32}
                  color={rating >= star ? '#fbc02d' : '#888'}
                />
              </TouchableOpacity>
            ))}
          </View>
          
          <Text style={styles.commentLabel}>Nhận Xét:</Text>
          <TextInput
            style={styles.commentInput}
            placeholder="Nhập Nhận Xét Của Bạn Về Món Ăn Này..."
            placeholderTextColor="#888"
            value={comment}
            onChangeText={setComment}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={resetAndClose}
              disabled={submitting}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.submitButton, submitting && styles.disabledButton]} 
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? 'Đang gửi...' : existingReview ? 'Cập Nhật' : 'Gửi Đánh Giá'}
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
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#1e1e26',
    borderRadius: 10,
    padding: 20,
    paddingTop: 25,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: 15,
    right: 15,
    padding: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fbc02d',
    textAlign: 'center',
    marginBottom: 20,
  },
  foodName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 15,
  },
  ratingLabel: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 10,
  },
  starsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
  },
  starButton: {
    padding: 5,
    marginHorizontal: 5,
  },
  commentLabel: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 10,
  },
  commentInput: {
    backgroundColor: '#2a2a32',
    borderRadius: 8,
    color: '#fff',
    padding: 12,
    height: 120,
    marginBottom: 20,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#3a3a42',
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#fbc02d',
    padding: 12,
    borderRadius: 8,
    marginLeft: 10,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#23232a',
    fontWeight: 'bold',
    fontSize: 16,
  },
  disabledButton: {
    opacity: 0.6,
  },
});

export default ReviewModal;