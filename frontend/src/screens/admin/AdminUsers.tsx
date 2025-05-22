import React, { useState, useEffect, useContext } from 'react';
import { 
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, Image, RefreshControl, StatusBar
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../../navigation/AppNavigator';
import AdminSideMenu from '../../components/admin/AdminSideMenu';
import AdminUserModal from '../../components/admin/AdminUserModal';
import AdminUserDetailModal from '../../components/admin/AdminUserDetailModal';

const AdminUsers = ({ navigation }: any) => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [username, setUsername] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [userModalVisible, setUserModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isEditMode, setIsEditMode] = useState(false);

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
    fetchUsers();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      const lowercasedQuery = searchQuery.toLowerCase();
      const filtered = users.filter(user => 
        user.username.toLowerCase().includes(lowercasedQuery) ||
        user.email.toLowerCase().includes(lowercasedQuery) ||
        user.phone.includes(searchQuery)
      );
      setFilteredUsers(filtered);
    } else {
      setFilteredUsers(users);
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Lấy token từ AsyncStorage
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch('http://192.168.1.13:5000/api/admin/users', {
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
        throw new Error('Không thể lấy danh sách người dùng');
      }

      const data = await response.json();
      // Lọc ra các user không phải admin (id_role !== 1)
      const nonAdminUsers = data.users.filter((user: any) => user.id_role !== 1);
      setUsers(nonAdminUsers);
      setFilteredUsers(nonAdminUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không thể tải danh sách người dùng',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUsers();
  };

  const handleAddUser = () => {
    setSelectedUser(null);
    setIsEditMode(false);
    setUserModalVisible(true);
  };

  const handleEditUser = (user: any) => {
    setSelectedUser(user);
    setIsEditMode(true);
    setUserModalVisible(true);
  };

  const handleViewUserDetail = (user: any) => {
    setSelectedUser(user);
    setDetailModalVisible(true);
  };

  const handleDeleteUser = (userId: number) => {
    Alert.alert(
      "Xác nhận xóa",
      "Bạn có chắc muốn xóa người dùng này?",
      [
        { text: "Hủy", style: "cancel" },
        { 
          text: "Xóa", 
          style: "destructive",
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('token');
              
              const response = await fetch(`http://192.168.1.13:5000/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });

              if (response.ok) {
                Toast.show({
                  type: 'success',
                  text1: 'Xóa thành công',
                  text2: 'Người dùng đã được xóa',
                  position: 'bottom',
                });
                // Cập nhật danh sách users sau khi xóa
                setUsers(users.filter(user => user.account_id !== userId));
              } else {
                const errorData = await response.json();
                Toast.show({
                  type: 'error',
                  text1: 'Lỗi',
                  text2: errorData.message || 'Không thể xóa người dùng',
                  position: 'bottom',
                });
              }
            } catch (error) {
              console.error('Error deleting user:', error);
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

  const renderUserItem = ({ item }: { item: any }) => {
    // Tạo đường dẫn ảnh đại diện nếu có
    const profileImage = item.profile_image 
      ? `http://192.168.1.13:5000/profile_images/${item.profile_image}` 
      : null;
    
    return (
      <View style={styles.userCard}>
        <TouchableOpacity 
          style={styles.userCardContent}
          onPress={() => handleViewUserDetail(item)}
        >
          <View style={styles.avatarContainer}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]}>
                <Icon name="user" size={24} color="#1f1f27" />
              </View>
            )}
          </View>
          
          <View style={styles.userInfo}>
            <Text style={styles.username}>{item.username}</Text>
            <Text style={styles.userDetail}>{item.email}</Text>
            <Text style={styles.userDetail}>{item.phone}</Text>
          </View>
        </TouchableOpacity>
        
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => handleEditUser(item)}
          >
            <Icon name="pencil" size={16} color="#fbc02d" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteUser(item.account_id)}
          >
            <Icon name="trash" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#1f1f27" barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => setShowMenu(true)}>
            <Icon name="bars" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Quản lý người dùng</Text>
        </View>
        
        <TouchableOpacity onPress={handleAddUser}>
          <Icon name="plus-circle" size={24} color="#fbc02d" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={16} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Tìm kiếm người dùng..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="times-circle" size={16} color="#666" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* User List */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fbc02d" />
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          renderItem={renderUserItem}
          keyExtractor={(item) => item.account_id.toString()}
          contentContainerStyle={styles.usersList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="users" size={50} color="#666" />
              <Text style={styles.emptyText}>
                {searchQuery ? 'Không tìm thấy người dùng' : 'Chưa có người dùng nào'}
              </Text>
            </View>
          }
        />
      )}

      {/* AdminSideMenu */}
      {showMenu && (
        <AdminSideMenu 
          navigation={navigation} 
          onClose={() => setShowMenu(false)}
          username={username}
        />
      )}

      {/* User Add/Edit Modal */}
      <AdminUserModal 
        visible={userModalVisible}
        onClose={() => setUserModalVisible(false)}
        user={selectedUser}
        isEdit={isEditMode}
        onSuccess={() => {
          setUserModalVisible(false);
          fetchUsers();
        }}
      />

      {/* User Detail Modal */}
      <AdminUserDetailModal 
        visible={detailModalVisible}
        onClose={() => setDetailModalVisible(false)}
        user={selectedUser}
        onEdit={() => {
          setDetailModalVisible(false);
          handleEditUser(selectedUser);
        }}
        onDelete={() => {
          setDetailModalVisible(false);
          handleDeleteUser(selectedUser.account_id);
        }}
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
    backgroundColor: '#1f1f27',
    paddingTop: 40,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    elevation: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    backgroundColor: '#2a2a32',
    borderRadius: 8,
    padding: 10,
    margin: 16,
    alignItems: 'center',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: '#fff',
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  usersList: {
    padding: 16,
  },
  userCard: {
    backgroundColor: '#2a2a32',
    borderRadius: 10,
    marginBottom: 16,
    overflow: 'hidden',
  },
  userCardContent: {
    flexDirection: 'row',
    padding: 16,
  },
  avatarContainer: {
    marginRight: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    backgroundColor: '#fbc02d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  username: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userDetail: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 2,
  },
  actionsContainer: {
    flexDirection: 'row',
    backgroundColor: '#1f1f27',
    padding: 10,
    justifyContent: 'flex-end',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a32',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  deleteButton: {
    backgroundColor: '#f44336',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 50,
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
    marginTop: 10,
  },
});

export default AdminUsers;