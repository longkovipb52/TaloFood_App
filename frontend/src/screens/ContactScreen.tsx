import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Linking,
  TouchableWithoutFeedback
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome';
import Toast from 'react-native-toast-message';
import MainLayout from '../components/MainLayout';
import { COLORS } from '../theme/colors';

const { width } = Dimensions.get('window');

const ContactScreen = ({ navigation }: any) => {
  const [message, setMessage] = useState('');
  const [contactHistory, setContactHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'history'>('form');

  const textInputRef = React.useRef<TextInput>(null);

  const focusTextInput = () => {
    // Khi nhập vào TextInput bị mất focus, gọi function này để focus lại
    if (textInputRef.current) {
      textInputRef.current.focus();
    }
  };
  
  useEffect(() => {
    const getUserId = async () => {
      const id = await AsyncStorage.getItem('userId');
      setUserId(id);
      if (id) {
        fetchContactHistory(id);
      }
    };
    
    getUserId();
  }, []);

  const fetchContactHistory = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`http://192.168.1.13:5000/api/contact/user/${id}`);
      const data = await response.json();
      
      if (response.ok) {
        setContactHistory(data.contacts || []);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Lỗi',
          text2: 'Không thể tải lịch sử liên hệ',
          position: 'bottom',
        });
      }
    } catch (error) {
      console.error('Error fetching contact history:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi kết nối',
        text2: 'Không thể tải lịch sử liên hệ',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      Toast.show({
        type: 'info',
        text1: 'Vui lòng nhập nội dung tin nhắn',
        position: 'bottom',
      });
      return;
    }
    
    if (!userId) {
      Toast.show({
        type: 'info',
        text1: 'Vui lòng đăng nhập để gửi liên hệ',
        position: 'bottom',
      });
      return;
    }

    try {
      setSubmitting(true);
      const response = await fetch('http://192.168.1.13:5000/api/contact/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          message,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        Toast.show({
          type: 'success',
          text1: 'Gửi liên hệ thành công',
          text2: 'Chúng tôi sẽ phản hồi sớm nhất có thể',
          position: 'bottom',
        });
        setMessage('');
        
        // Refresh contact history
        if (userId) {
          fetchContactHistory(userId);
        }
        
        // Switch to history tab
        setActiveTab('history');
      } else {
        Toast.show({
          type: 'error',
          text1: 'Gửi liên hệ thất bại',
          text2: result.message || 'Đã có lỗi xảy ra',
          position: 'bottom',
        });
      }
    } catch (error) {
      console.error('Error submitting contact:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi kết nối',
        text2: 'Không thể gửi tin nhắn',
        position: 'bottom',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    if (userId) {
      fetchContactHistory(userId);
    } else {
      setRefreshing(false);
    }
  };

  const renderContactItem = ({ item }: { item: any }) => {
    const statusColor = item.status === 'Đã xử lý' ? '#4CAF50' : '#FFC107';
    const statusIcon = item.status === 'Đã xử lý' ? 'check-circle' : 'clock-o';
    const formattedDate = new Date(item.created_at).toLocaleString('vi-VN');
    
    return (
      <View style={styles.contactItem}>
        <View style={styles.contactHeader}>
          <View style={styles.statusContainer}>
            <Icon name={statusIcon} size={16} color={statusColor} style={{ marginRight: 5 }} />
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
          </View>
          <Text style={styles.dateText}>{formattedDate}</Text>
        </View>
        
        <View style={styles.messageContainer}>
          <Text style={styles.messageText}>{item.Message}</Text>
        </View>
        
        {item.response && (
          <View style={styles.responseContainer}>
            <Text style={styles.responseLabel}>Phản hồi:</Text>
            <Text style={styles.responseText}>{item.response}</Text>
          </View>
        )}
      </View>
    );
  };

  const ContactForm = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.formContainer}
    >
      <View style={styles.formHeader}>
        <Icon name="envelope-open" size={24} color="#fbc02d" style={styles.formIcon} />
        <Text style={styles.formTitle}>Gửi yêu cầu hỗ trợ</Text>
      </View>
      
      <Text style={styles.formDescription}>
        Hãy cho chúng tôi biết bạn cần hỗ trợ điều gì. Đội ngũ TaloFood sẽ phản hồi trong thời gian sớm nhất!
      </Text>

      <Text style={styles.inputLabel}>Nội dung tin nhắn</Text>
      <TextInput
        ref={textInputRef}
        style={styles.messageInput}
        value={message}
        onChangeText={setMessage}
        placeholder="Nhập nội dung tin nhắn của bạn ở đây..."
        placeholderTextColor="#999"
        multiline
        numberOfLines={6}
        textAlignVertical="top"
        blurOnSubmit={false}
        autoCorrect={false}
      />
      
      <TouchableOpacity
        style={[styles.submitButton, submitting && styles.disabledButton]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        {submitting ? (
          <ActivityIndicator size="small" color="#23232a" />
        ) : (
          <>
            <Icon name="paper-plane" size={16} color="#23232a" style={{ marginRight: 8 }} />
            <Text style={styles.submitButtonText}>GỬI TIN NHẮN</Text>
          </>
        )}
      </TouchableOpacity>

      <View style={styles.contactInfoContainer}>
        <Text style={styles.contactInfoTitle}>Thông tin liên hệ khác:</Text>
        
        <TouchableOpacity 
          style={styles.contactInfoItem}
          onPress={() => Linking.openURL('tel:0123456789')}
        >
          <Icon name="phone" size={16} color="#fbc02d" style={{ marginRight: 8 }} />
          <Text style={styles.contactInfoText}>Hotline: 0123 456 789</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.contactInfoItem}
          onPress={() => Linking.openURL('mailto:support@talofood.com')}
        >
          <Icon name="envelope" size={16} color="#fbc02d" style={{ marginRight: 8 }} />
          <Text style={styles.contactInfoText}>Email: support@talofood.com</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.contactInfoItem}
          onPress={() => Linking.openURL('https://maps.google.com/?q=123 Đường Ẩm Thực, Q.1, TP.HCM')}
        >
          <Icon name="map-marker" size={16} color="#fbc02d" style={{ marginRight: 8 }} />
          <Text style={styles.contactInfoText}>Địa chỉ: 123 Đường Ẩm Thực, Q.1, TP.HCM</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );

  const ContactHistory = () => (
    <View style={styles.historyContainer}>
      <View style={styles.historyHeader}>
        <Icon name="history" size={24} color="#fbc02d" style={styles.historyIcon} />
        <Text style={styles.historyTitle}>Lịch sử liên hệ</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fbc02d" />
          <Text style={styles.loadingText}>Đang tải lịch sử liên hệ...</Text>
        </View>
      ) : contactHistory.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="inbox" size={60} color="#555" />
          <Text style={styles.emptyText}>Bạn chưa có tin nhắn liên hệ nào</Text>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => setActiveTab('form')}
          >
            <Text style={styles.createButtonText}>Tạo tin nhắn mới</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={contactHistory}
          keyExtractor={(item) => item.contact_id.toString()}
          renderItem={renderContactItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#fbc02d"]}
              tintColor={"#fbc02d"}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );

  return (
    <MainLayout navigation={navigation}>
      <View style={styles.container}>
        <Text style={styles.screenTitle}>Liên Hệ Hỗ Trợ</Text>
        
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'form' && styles.activeTab]}
            onPress={() => setActiveTab('form')}
          >
            <Icon 
              name="envelope" 
              size={18} 
              color={activeTab === 'form' ? "#fbc02d" : "#fff"} 
              style={styles.tabIcon}
            />
            <Text 
              style={[styles.tabText, activeTab === 'form' && styles.activeTabText]}
            >
              Gửi Liên Hệ
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'history' && styles.activeTab]}
            onPress={() => setActiveTab('history')}
          >
            <Icon 
              name="history" 
              size={18} 
              color={activeTab === 'history' ? "#fbc02d" : "#fff"} 
              style={styles.tabIcon}
            />
            <Text 
              style={[styles.tabText, activeTab === 'history' && styles.activeTabText]}
            >
              Lịch Sử
            </Text>
            {contactHistory.filter(item => item.status === 'Chưa xử lý').length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {contactHistory.filter(item => item.status === 'Chưa xử lý').length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {activeTab === 'form' ? <ContactForm /> : <ContactHistory />}
      </View>
    </MainLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#23232a',
    padding: 16,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fbc02d',
    marginBottom: 20,
    textAlign: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 8,
    backgroundColor: '#2a2a32',
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: '#3a3a42',
  },
  tabIcon: {
    marginRight: 6,
  },
  tabText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#fbc02d',
    fontWeight: 'bold',
  },
  badge: {
    position: 'absolute',
    right: 10,
    top: 8,
    backgroundColor: '#ff4757',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  // Form styles
  formContainer: {
    flex: 1,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  formIcon: {
    marginRight: 8,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fbc02d',
  },
  formDescription: {
    color: '#ccc',
    marginBottom: 24,
    lineHeight: 20,
  },
  inputLabel: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
  },
  messageInput: {
    backgroundColor: '#2a2a32',
    borderRadius: 8,
    color: '#fff',
    padding: 16,
    height: 150,
    marginBottom: 20,
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#fbc02d',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  submitButtonText: {
    color: '#23232a',
    fontWeight: 'bold',
    fontSize: 16,
  },
  contactInfoContainer: {
    backgroundColor: '#2a2a32',
    borderRadius: 8,
    padding: 16,
  },
  contactInfoTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  contactInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingVertical: 8,
  },
  contactInfoText: {
    color: '#ccc',
    fontSize: 14,
  },
  // History styles
  historyContainer: {
    flex: 1,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  historyIcon: {
    marginRight: 8,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fbc02d',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
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
    marginTop: 50,
  },
  emptyText: {
    color: '#fff',
    fontSize: 16,
    marginVertical: 16,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#fbc02d',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 6,
    marginTop: 10,
  },
  createButtonText: {
    color: '#23232a',
    fontWeight: 'bold',
  },
  listContent: {
    paddingBottom: 20,
  },
  contactItem: {
    backgroundColor: '#2a2a32',
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  dateText: {
    color: '#999',
    fontSize: 12,
  },
  messageContainer: {
    backgroundColor: '#3a3a42',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  messageText: {
    color: '#fff',
    fontSize: 15,
    lineHeight: 22,
  },
  responseContainer: {
    backgroundColor: '#2f3542',
    borderRadius: 8,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#fbc02d',
  },
  responseLabel: {
    color: '#fbc02d',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  responseText: {
    color: '#eee',
    fontSize: 14,
    lineHeight: 20,
  },
});

export default ContactScreen;