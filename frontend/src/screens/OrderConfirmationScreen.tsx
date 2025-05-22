import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MainLayout from '../components/MainLayout';
import ReviewModal from '../components/ReviewModal';
import { COLORS } from '../theme/colors';

const OrderConfirmationScreen = ({ navigation, route }: any) => {
  const { orderId } = route.params || {};
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [reviewedItems, setReviewedItems] = useState<{[key: number]: boolean}>({});
  const [existingReview, setExistingReview] = useState<any>(null);
  
  // Khai báo biến isDelivered tại đây, trước khi được sử dụng trong useEffect
  const isDelivered = orderDetails?.status === 'Đã giao';

  useEffect(() => {
    const getUserId = async () => {
      const id = await AsyncStorage.getItem('userId');
      setUserId(id);
    };
    
    getUserId();
    
    if (orderId) {
      fetchOrderDetails();
    } else {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (userId && isDelivered && orderDetails?.items) {
      checkExistingReviews();
    }
  }, [userId, orderDetails, isDelivered]);

  const fetchOrderDetails = async () => {
    try {
      const response = await fetch(`http://192.168.1.13:5000/api/orders/${orderId}`);
      const data = await response.json();
      setOrderDetails(data.order);
    } catch (error) {
      console.error('Error fetching order details:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Cập nhật hàm kiểm tra đánh giá hiện có
  const checkExistingReviews = async () => {
    const reviewStatus: {[key: number]: boolean} = {};
    
    for (const item of orderDetails.items) {
      try {
        // Thêm orderId vào API để kiểm tra đánh giá cho món ăn trong đơn hàng này
        const response = await fetch(`http://192.168.1.13:5000/api/reviews/check/${userId}/${item.id_food}/${orderId}`);
        const data = await response.json();
        reviewStatus[item.id_food] = data.exists;
      } catch (error) {
        console.error(`Error checking review for food ${item.id_food}:`, error);
      }
    }
    
    setReviewedItems(reviewStatus);
  };

  // Cập nhật hàm xử lý khi nhấn nút đánh giá
  const handleReviewPress = async (food: any) => {
    setSelectedFood(food);
    
    if (reviewedItems[food.food_id]) {
      try {
        // Truyền thêm orderId khi kiểm tra đánh giá
        const response = await fetch(`http://192.168.1.13:5000/api/reviews/check/${userId}/${food.food_id}/${orderId}`);
        const data = await response.json();
        
        if (data.exists && data.review) {
          setExistingReview({
            rating: data.review.star_rating,
            comment: data.review.comment,
            billInfoId: data.billInfoId
          });
        }
      } catch (error) {
        console.error('Error fetching existing review:', error);
      }
    } else {
      setExistingReview(null);
    }
    
    setReviewModalVisible(true);
  };

  if (loading) {
    return (
      <MainLayout navigation={navigation}>
        <View style={[styles.container, styles.loadingContainer]}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải thông tin đơn hàng...</Text>
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout navigation={navigation}>
      <ScrollView style={styles.container}>
        <View style={styles.confirmationBox}>
          <Icon name="check-circle" size={80} color="#4CAF50" style={styles.icon} />
          
          <Text style={styles.title}>Chi tiết đơn hàng</Text>
          
          <Text style={styles.message}>
            {orderId ? 'Xem chi tiết đơn hàng của bạn tại TaloFood.' : 'Không tìm thấy thông tin đơn hàng.'}
          </Text>
          
          <View style={styles.orderInfo}>
            <Text style={styles.orderIdLabel}>Mã Đơn Hàng:</Text>
            <Text style={styles.orderId}>#{orderId || 'N/A'}</Text>
          </View>

          {orderDetails && (
            <>
              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Trạng thái đơn hàng</Text>
                <View style={[styles.statusBadge, 
                  orderDetails.status === 'Chờ xác nhận' ? styles.statusPending : 
                  orderDetails.status === 'Đã thanh toán' ? styles.statusPaid :
                  orderDetails.status === 'Đã xác nhận' ? styles.statusConfirmed :
                  orderDetails.status === 'Đang giao' ? styles.statusDelivering :
                  orderDetails.status === 'Đã giao' ? styles.statusDelivered : styles.statusCancelled
                ]}>
                  <Text style={styles.statusText}>{orderDetails.status}</Text>
                </View>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Thông tin thanh toán</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Tổng tiền:</Text>
                  <Text style={styles.infoValue}>{Number(orderDetails.total_amount).toLocaleString('vi-VN')}đ</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Phương thức:</Text>
                  <Text style={styles.infoValue}>{orderDetails.payment_method}</Text>
                </View>
              </View>

              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Thông tin người nhận</Text>
                {orderDetails.name && (
                  <View style={styles.infoRow}>
                    <Text style={styles.infoLabel}>Tên:</Text>
                    <Text style={styles.infoValue}>{orderDetails.name}</Text>
                  </View>
                )}
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>SĐT:</Text>
                  <Text style={styles.infoValue}>{orderDetails.phone}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Địa chỉ:</Text>
                  <Text style={styles.infoValue}>{orderDetails.address}</Text>
                </View>
              </View>

              {orderDetails.items && orderDetails.items.length > 0 && (
                <View style={styles.infoSection}>
                  <Text style={styles.sectionTitle}>Tóm tắt đơn hàng</Text>
                  {orderDetails.items.map((item: any, index: number) => (
                    <View key={index} style={styles.itemRow}>
                      <View style={styles.itemInfo}>
                        <Text style={styles.itemName}>{item.food_name} x{item.count}</Text>
                        <Text style={styles.itemPrice}>{Number(item.price * item.count).toLocaleString('vi-VN')}đ</Text>
                      </View>
                      
                      {isDelivered && (
                        <TouchableOpacity 
                          style={[
                            styles.reviewButton,
                            reviewedItems[item.id_food] ? styles.editReviewButton : styles.reviewButton
                          ]}
                          onPress={() => handleReviewPress({
                            food_id: item.id_food,
                            food_name: item.food_name
                          })}
                        >
                          <Icon 
                            name={reviewedItems[item.id_food] ? "pencil" : "star"} 
                            size={14} 
                            color={reviewedItems[item.id_food] ? "#4CAF50" : "#fbc02d"} 
                          />
                          <Text style={[
                            styles.reviewButtonText, 
                            reviewedItems[item.id_food] ? styles.editReviewButtonText : styles.reviewButtonText
                          ]}>
                            {reviewedItems[item.id_food] ? "Sửa đánh giá" : "Đánh giá"}
                          </Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              )}

              <View style={styles.infoSection}>
                <Text style={styles.sectionTitle}>Thời gian</Text>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Ngày đặt:</Text>
                  <Text style={styles.infoValue}>
                    {new Date(orderDetails.created_at).toLocaleDateString('vi-VN')}
                  </Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Giao dự kiến:</Text>
                  <Text style={styles.infoValue}>
                    {new Date(orderDetails.ngaygiao).toLocaleDateString('vi-VN')}
                  </Text>
                </View>
              </View>
            </>
          )}
          
          <Text style={styles.note}>
            Cảm ơn bạn đã sử dụng dịch vụ của TaloFood. Nếu bạn có bất kỳ câu hỏi nào, 
            vui lòng liên hệ với chúng tôi qua số điện thoại 0123 456 789.
          </Text>
        </View>
        
        <TouchableOpacity
          style={styles.viewOrderButton}
          onPress={() => navigation.navigate('OrderHistory')}
        >
          <Text style={styles.viewOrderText}>XEM LỊCH SỬ ĐƠN HÀNG</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.continueButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.continueText}>TIẾP TỤC MUA HÀNG</Text>
        </TouchableOpacity>
      </ScrollView>
      
      {selectedFood && (
        <ReviewModal
          visible={reviewModalVisible}
          onClose={() => {
            setReviewModalVisible(false);
            setExistingReview(null);
            checkExistingReviews();
          }}
          foodItem={selectedFood}
          userId={userId}
          existingReview={existingReview}
          orderId={orderId} // Thay route bằng orderId
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
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  confirmationBox: {
    backgroundColor: '#2c2c34',
    borderRadius: 12,
    padding: 24,
    marginTop: 32,
    alignItems: 'center',
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: '#ddd',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  orderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 16,
    width: '100%',
    marginBottom: 24,
  },
  orderIdLabel: {
    fontSize: 16,
    color: '#fff',
    marginRight: 10,
  },
  orderId: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fbc02d',
  },
  infoSection: {
    width: '100%',
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    paddingBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    color: '#bbb',
    fontSize: 14,
  },
  infoValue: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 4,
  },
  itemPrice: {
    color: '#fbc02d',
    fontWeight: 'bold',
    fontSize: 15,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a32',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  reviewButtonText: {
    color: '#fbc02d',
    marginLeft: 5,
    fontWeight: 'bold',
    fontSize: 12,
  },
  editReviewButton: {
    backgroundColor: '#263238',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  editReviewButtonText: {
    color: '#4CAF50',
  },
  statusBadge: {
    borderRadius: 50,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
  },
  statusPending: {
    backgroundColor: '#FF9800',
  },
  statusPaid: {
    backgroundColor: '#2196F3',
  },
  statusConfirmed: {
    backgroundColor: '#9C27B0',
  },
  statusDelivering: {
    backgroundColor: '#3F51B5',
  },
  statusDelivered: {
    backgroundColor: '#4CAF50',
  },
  statusCancelled: {
    backgroundColor: '#F44336',
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  note: {
    fontSize: 14,
    color: '#bbb',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
    marginTop: 8,
  },
  viewOrderButton: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  viewOrderText: {
    color: '#fbc02d',
    fontSize: 16,
    fontWeight: 'bold',
  },
  continueButton: {
    backgroundColor: '#fbc02d',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 32,
  },
  continueText: {
    color: '#23232a',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default OrderConfirmationScreen;