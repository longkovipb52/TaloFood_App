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
  StatusBar
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../../navigation/AppNavigator';
import AdminSideMenu from '../../components/admin/AdminSideMenu';
import AdminContactDetailModal from '../../components/admin/AdminContactDetailModal';
import Toast from 'react-native-toast-message';

const AdminContacts = ({ navigation }: any) => {
  const [contacts, setContacts] = useState<any[]>([]);
  const [filteredContacts, setFilteredContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [contactDetailVisible, setContactDetailVisible] = useState(false);
  const [username, setUsername] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả');

  const { signOut } = useContext(AuthContext);

  // Load username và danh sách liên hệ khi component mount
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
    fetchContacts();
  }, []);

  // Fetch danh sách liên hệ từ API
  const fetchContacts = async (search = '', status = 'Tất cả') => {
    try {
      setLoading(true);
      
      const token = await AsyncStorage.getItem('token');
      
      // Xây dựng query string cho tìm kiếm và filter
      let queryParams = '';
      if (search) queryParams += `q=${encodeURIComponent(search)}&`;
      if (status !== 'Tất cả') queryParams += `status=${encodeURIComponent(status)}`;
      
      const url = `http://192.168.1.13:5000/api/admin/contacts${queryParams ? '?' + queryParams : ''}`;
      
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
        throw new Error(errorData.message || 'Không thể lấy danh sách liên hệ');
      }

      const data = await response.json();
      setContacts(data.contacts);
      setFilteredContacts(data.contacts);
    } catch (error) {
      console.error('Error fetching contacts:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: error instanceof Error ? error.message : 'Không thể tải danh sách liên hệ',
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
    setSearchQuery('');
    setStatusFilter('Tất cả');
    fetchContacts();
  };

  // Tìm kiếm liên hệ
  const handleSearch = () => {
    fetchContacts(searchQuery, statusFilter);
  };

  // Lọc theo trạng thái
  const handleFilterChange = (status: string) => {
    setStatusFilter(status);
    fetchContacts(searchQuery, status);
  };

  // Mở modal chi tiết liên hệ
  const handleViewContactDetail = (contact: any) => {
    setSelectedContact(contact);
    setContactDetailVisible(true);
  };

  // Cập nhật trạng thái liên hệ
  const handleUpdateStatus = async (contactId: number, newStatus: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(`http://192.168.1.13:5000/api/admin/contacts/${contactId}/status`, {
        method: 'PUT',
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
          text2: 'Đã cập nhật trạng thái liên hệ',
          position: 'bottom',
        });
        
        // Cập nhật state liên hệ với trạng thái mới
        const updatedContacts = contacts.map(contact => 
          contact.contact_id === contactId 
            ? { ...contact, status: newStatus }
            : contact
        );
        setContacts(updatedContacts);
        setFilteredContacts(updatedContacts);
        
        // Cập nhật selectedContact
        if (selectedContact && selectedContact.contact_id === contactId) {
          setSelectedContact({ ...selectedContact, status: newStatus });
        }
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
      console.error('Error updating contact status:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi kết nối',
        text2: 'Không thể kết nối đến máy chủ',
        position: 'bottom',
      });
    }
  };

  // Xóa liên hệ
  const handleDeleteContact = async (contactId: number) => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(`http://192.168.1.13:5000/api/admin/contacts/${contactId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        Toast.show({
          type: 'success',
          text1: 'Thành công',
          text2: 'Đã xóa liên hệ',
          position: 'bottom',
        });
        
        // Cập nhật state sau khi xóa
        const updatedContacts = contacts.filter(contact => contact.contact_id !== contactId);
        setContacts(updatedContacts);
        setFilteredContacts(updatedContacts);
        
        // Đóng modal nếu đang mở
        if (contactDetailVisible && selectedContact?.contact_id === contactId) {
          setContactDetailVisible(false);
        }
      } else {
        const errorData = await response.json();
        Toast.show({
          type: 'error',
          text1: 'Lỗi',
          text2: errorData.message || 'Không thể xóa liên hệ',
          position: 'bottom',
        });
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi kết nối',
        text2: 'Không thể kết nối đến máy chủ',
        position: 'bottom',
      });
    }
  };

  // Render từng liên hệ trong danh sách
  const renderContactItem = ({ item }: { item: any }) => {
    // Truncate message nếu quá dài
    const truncatedMessage = item.Message.length > 50 
      ? item.Message.substring(0, 50) + '...' 
      : item.Message;
    
    return (
      <TouchableOpacity 
        style={styles.contactItem}
        onPress={() => handleViewContactDetail(item)}
      >
        <View style={styles.contactHeader}>
          <View style={styles.userInfo}>
            <Icon name="user" size={18} color="#fbc02d" style={styles.userIcon} />
            <Text style={styles.username}>{item.username}</Text>
          </View>
          
          <View style={[
            styles.statusBadge,
            { backgroundColor: item.status === 'Đã xử lý' ? '#4caf50' : '#ff9800' }
          ]}>
            <Text style={styles.statusText}>{item.status}</Text>
          </View>
        </View>
        
        <Text style={styles.message} numberOfLines={2}>{truncatedMessage}</Text>
      </TouchableOpacity>
    );
  };

  // Render khi không có kết quả
  const renderEmptyList = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyList}>
        <Icon name="envelope-o" size={50} color="#666" />
        <Text style={styles.emptyText}>
          {(searchQuery || statusFilter !== 'Tất cả') 
            ? 'Không tìm thấy liên hệ nào phù hợp' 
            : 'Không có liên hệ nào'}
        </Text>
      </View>
    );
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
        
        <Text style={styles.headerTitle}>Quản lý liên hệ</Text>
        
        <View style={{ width: 36 }} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon name="search" size={18} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm liên hệ..."
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
                fetchContacts('', statusFilter);
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

      {/* Filter */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            statusFilter === 'Tất cả' && styles.activeFilterButton
          ]}
          onPress={() => handleFilterChange('Tất cả')}
        >
          <Text style={[
            styles.filterButtonText,
            statusFilter === 'Tất cả' && styles.activeFilterButtonText
          ]}>Tất cả</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            statusFilter === 'Chưa xử lý' && styles.activeFilterButton
          ]}
          onPress={() => handleFilterChange('Chưa xử lý')}
        >
          <Text style={[
            styles.filterButtonText,
            statusFilter === 'Chưa xử lý' && styles.activeFilterButtonText
          ]}>Chưa xử lý</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            statusFilter === 'Đã xử lý' && styles.activeFilterButton
          ]}
          onPress={() => handleFilterChange('Đã xử lý')}
        >
          <Text style={[
            styles.filterButtonText,
            statusFilter === 'Đã xử lý' && styles.activeFilterButtonText
          ]}>Đã xử lý</Text>
        </TouchableOpacity>
      </View>

      {/* Danh sách liên hệ */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fbc02d" />
        </View>
      ) : (
        <FlatList
          data={filteredContacts}
          renderItem={renderContactItem}
          keyExtractor={(item) => item.contact_id.toString()}
          contentContainerStyle={styles.listContent}
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

      {/* Contact Detail Modal */}
      <AdminContactDetailModal
        visible={contactDetailVisible}
        contact={selectedContact}
        onClose={() => setContactDetailVisible(false)}
        onUpdateStatus={handleUpdateStatus}
        onDelete={handleDeleteContact}
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
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  filterButton: {
    paddingHorizontal: 12,
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
  listContent: {
    padding: 12,
  },
  contactItem: {
    backgroundColor: '#2a2a32',
    borderRadius: 10,
    marginBottom: 16,
    padding: 16,
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userIcon: {
    marginRight: 8,
  },
  username: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  message: {
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

export default AdminContacts;