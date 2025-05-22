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
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthContext } from '../../navigation/AppNavigator';
import AdminSideMenu from '../../components/admin/AdminSideMenu';
import AdminBlogModal from '../../components/admin/AdminBlogModal';
import AdminBlogDetailModal from '../../components/admin/AdminBlogDetailModal';
import Toast from 'react-native-toast-message';

const AdminBlogs = ({ navigation }: any) => {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [filteredBlogs, setFilteredBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [selectedBlog, setSelectedBlog] = useState<any>(null);
  const [blogDetailVisible, setBlogDetailVisible] = useState(false);
  const [blogModalVisible, setBlogModalVisible] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [username, setUsername] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tất cả');

  const { signOut } = useContext(AuthContext);

  // Load username và danh sách blog khi component mount
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
    fetchBlogs();
  }, []);

  // Fetch danh sách blog từ API
  const fetchBlogs = async (search = '', status = 'Tất cả') => {
    try {
      setLoading(true);
      
      const token = await AsyncStorage.getItem('token');
      
      // Xây dựng query string cho tìm kiếm và filter
      let queryParams = '';
      if (search) queryParams += `q=${encodeURIComponent(search)}&`;
      if (status !== 'Tất cả') queryParams += `status=${encodeURIComponent(status === 'Đã xuất bản' ? 'published' : 'draft')}`;
      
      const url = `http://192.168.1.13:5000/api/admin/blogs${queryParams ? '?' + queryParams : ''}`;
      
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
        throw new Error(errorData.message || 'Không thể lấy danh sách bài viết');
      }

      const data = await response.json();
      setBlogs(data.blogs);
      setFilteredBlogs(data.blogs);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: error instanceof Error ? error.message : 'Không thể tải danh sách bài viết',
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
    fetchBlogs();
  };

  // Tìm kiếm blog
  const handleSearch = () => {
    fetchBlogs(searchQuery, statusFilter);
  };

  // Lọc theo trạng thái
  const handleFilterChange = (status: string) => {
    setStatusFilter(status);
    fetchBlogs(searchQuery, status);
  };

  // Mở modal thêm blog mới
  const handleAddBlog = () => {
    setIsEdit(false);
    setSelectedBlog(null);
    setBlogModalVisible(true);
  };

  // Mở modal edit blog
  const handleEditBlog = (blog: any) => {
    setIsEdit(true);
    setSelectedBlog(blog);
    setBlogModalVisible(true);
  };

  // Mở modal xem chi tiết blog
  const handleViewBlogDetail = (blog: any) => {
    setSelectedBlog(blog);
    setBlogDetailVisible(true);
  };

  // Xử lý sau khi thêm/sửa thành công
  const handleSuccess = (blog: any, isEditMode: boolean) => {
    setBlogModalVisible(false);
    
    // Cập nhật state sau khi thêm/sửa blog
    if (isEditMode) {
      setBlogs(prevBlogs => 
        prevBlogs.map(item => item.blog_id === blog.blog_id ? blog : item)
      );
      setFilteredBlogs(prevBlogs => 
        prevBlogs.map(item => item.blog_id === blog.blog_id ? blog : item)
      );
      
      Toast.show({
        type: 'success',
        text1: 'Thành công',
        text2: 'Đã cập nhật bài viết',
        position: 'bottom',
      });
    } else {
      setBlogs(prevBlogs => [blog, ...prevBlogs]);
      setFilteredBlogs(prevBlogs => [blog, ...prevBlogs]);
      
      Toast.show({
        type: 'success',
        text1: 'Thành công',
        text2: 'Đã thêm bài viết mới',
        position: 'bottom',
      });
    }
  };

  // Thay đổi trạng thái blog (draft/published)
  const handleUpdateStatus = async (blogId: number, newStatus: string) => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(`http://192.168.1.13:5000/api/admin/blogs/${blogId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          status: newStatus === 'Đã xuất bản' ? 'published' : 'draft' 
        })
      });

      if (response.ok) {
        Toast.show({
          type: 'success',
          text1: 'Thành công',
          text2: `Đã ${newStatus === 'Đã xuất bản' ? 'xuất bản' : 'lưu nháp'} bài viết`,
          position: 'bottom',
        });
        
        // Cập nhật state blogs với trạng thái mới
        const updatedBlogs = blogs.map(blog => 
          blog.blog_id === blogId 
            ? { ...blog, status: newStatus === 'Đã xuất bản' ? 'published' : 'draft' }
            : blog
        );
        setBlogs(updatedBlogs);
        setFilteredBlogs(updatedBlogs);
        
        // Cập nhật selectedBlog nếu đang được hiển thị
        if (selectedBlog && selectedBlog.blog_id === blogId) {
          setSelectedBlog({ 
            ...selectedBlog, 
            status: newStatus === 'Đã xuất bản' ? 'published' : 'draft'
          });
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
      console.error('Error updating blog status:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi kết nối',
        text2: 'Không thể kết nối đến máy chủ',
        position: 'bottom',
      });
    }
  };

  // Xóa blog
  const handleDeleteBlog = async (blogId: number) => {
    try {
      const token = await AsyncStorage.getItem('token');
      
      const response = await fetch(`http://192.168.1.13:5000/api/admin/blogs/${blogId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        Toast.show({
          type: 'success',
          text1: 'Thành công',
          text2: 'Đã xóa bài viết',
          position: 'bottom',
        });
        
        // Cập nhật state sau khi xóa
        const updatedBlogs = blogs.filter(blog => blog.blog_id !== blogId);
        setBlogs(updatedBlogs);
        setFilteredBlogs(updatedBlogs);
        
        // Đóng modal nếu đang mở
        if (blogDetailVisible && selectedBlog?.blog_id === blogId) {
          setBlogDetailVisible(false);
        }
      } else {
        const errorData = await response.json();
        Toast.show({
          type: 'error',
          text1: 'Lỗi',
          text2: errorData.message || 'Không thể xóa bài viết',
          position: 'bottom',
        });
      }
    } catch (error) {
      console.error('Error deleting blog:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi kết nối',
        text2: 'Không thể kết nối đến máy chủ',
        position: 'bottom',
      });
    }
  };

  // Render từng blog trong danh sách
  const renderBlogItem = ({ item }: { item: any }) => {
    // Truncate title và content nếu quá dài
    const truncatedTitle = item.title.length > 50 
      ? item.title.substring(0, 50) + '...' 
      : item.title;
    
    const truncatedContent = item.excerpt;
    
    return (
      <TouchableOpacity 
        style={styles.blogItem}
        onPress={() => handleViewBlogDetail(item)}
      >
        <View style={styles.blogHeader}>
          <Text style={styles.blogTitle} numberOfLines={1}>{truncatedTitle}</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: item.status === 'published' ? '#4caf50' : '#ff9800' }
          ]}>
            <Text style={styles.statusText}>
              {item.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
            </Text>
          </View>
        </View>
        
        <View style={styles.blogRow}>
          {item.image_url ? (
            <Image source={{ uri: item.image_url }} style={styles.blogImage} />
          ) : (
            <View style={styles.noImageContainer}>
              <Icon name="image" size={24} color="#666" />
            </View>
          )}
          
          <View style={styles.blogInfo}>
            <Text style={styles.blogContent} numberOfLines={2}>{truncatedContent}</Text>
            <View style={styles.blogMeta}>
              <View style={styles.author}>
                <Icon name="user" size={12} color="#999" />
                <Text style={styles.authorName}>{item.username}</Text>
              </View>
              <View style={styles.date}>
                <Icon name="calendar" size={12} color="#999" />
                <Text style={styles.dateText}>{item.created_at}</Text>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.blogActions}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.viewButton]} 
            onPress={(e) => {
              e.stopPropagation();
              handleViewBlogDetail(item);
            }}
          >
            <Icon name="eye" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Xem</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.editButton]} 
            onPress={(e) => {
              e.stopPropagation();
              handleEditBlog(item);
            }}
          >
            <Icon name="edit" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Sửa</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.statusButton]} 
            onPress={(e) => {
              e.stopPropagation();
              const newStatus = item.status === 'published' ? 'Bản nháp' : 'Đã xuất bản';
              Alert.alert(
                "Thay đổi trạng thái",
                `Đổi trạng thái thành "${newStatus}"?`,
                [
                  { text: "Hủy", style: "cancel" },
                  { text: "Đồng ý", onPress: () => handleUpdateStatus(item.blog_id, newStatus) }
                ]
              );
            }}
          >
            <Icon name={item.status === 'published' ? 'eye-slash' : 'eye'} size={16} color="#fff" />
            <Text style={styles.actionButtonText}>
              {item.status === 'published' ? 'Ẩn' : 'Xuất bản'}
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Render khi không có kết quả
  const renderEmptyList = () => {
    if (loading) return null;
    
    return (
      <View style={styles.emptyList}>
        <Icon name="file-text-o" size={50} color="#666" />
        <Text style={styles.emptyText}>
          {(searchQuery || statusFilter !== 'Tất cả') 
            ? 'Không tìm thấy bài viết nào phù hợp' 
            : 'Chưa có bài viết nào'}
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
        
        <Text style={styles.headerTitle}>Quản lý bài viết</Text>
        
        <TouchableOpacity 
          style={styles.addButton}
          onPress={handleAddBlog}
        >
          <Icon name="plus" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon name="search" size={18} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm bài viết..."
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
                fetchBlogs('', statusFilter);
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
            statusFilter === 'Đã xuất bản' && styles.activeFilterButton
          ]}
          onPress={() => handleFilterChange('Đã xuất bản')}
        >
          <Text style={[
            styles.filterButtonText,
            statusFilter === 'Đã xuất bản' && styles.activeFilterButtonText
          ]}>Đã xuất bản</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            statusFilter === 'Bản nháp' && styles.activeFilterButton
          ]}
          onPress={() => handleFilterChange('Bản nháp')}
        >
          <Text style={[
            styles.filterButtonText,
            statusFilter === 'Bản nháp' && styles.activeFilterButtonText
          ]}>Bản nháp</Text>
        </TouchableOpacity>
      </View>

      {/* Danh sách blog */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#fbc02d" />
        </View>
      ) : (
        <FlatList
          data={filteredBlogs}
          renderItem={renderBlogItem}
          keyExtractor={(item) => item.blog_id.toString()}
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

      {/* Blog Detail Modal */}
      <AdminBlogDetailModal
        visible={blogDetailVisible}
        blog={selectedBlog}
        onClose={() => setBlogDetailVisible(false)}
        onEdit={() => {
          setBlogDetailVisible(false);
          handleEditBlog(selectedBlog);
        }}
        onDelete={(blogId) => {
          Alert.alert(
            "Xác nhận xóa",
            "Bạn có chắc chắn muốn xóa bài viết này không?",
            [
              { text: "Hủy", style: "cancel" },
              { 
                text: "Xóa", 
                style: "destructive",
                onPress: () => {
                  handleDeleteBlog(blogId);
                  setBlogDetailVisible(false);
                }
              }
            ]
          );
        }}
        onUpdateStatus={(blogId, newStatus) => {
          handleUpdateStatus(blogId, newStatus);
        }}
      />

      {/* Blog Add/Edit Modal */}
      <AdminBlogModal
        visible={blogModalVisible}
        blog={selectedBlog}
        isEdit={isEdit}
        onClose={() => setBlogModalVisible(false)}
        onSuccess={handleSuccess}
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
    padding: 8,
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
  blogItem: {
    backgroundColor: '#2a2a32',
    borderRadius: 10,
    marginBottom: 16,
    padding: 16,
  },
  blogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  blogTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    flex: 1,
    marginRight: 8,
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
  blogRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  blogImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#1f1f27',
  },
  noImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#1f1f27',
    justifyContent: 'center',
    alignItems: 'center',
  },
  blogInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  blogContent: {
    color: '#ccc',
    fontSize: 14,
    flex: 1,
  },
  blogMeta: {
    flexDirection: 'row',
    marginTop: 8,
    justifyContent: 'space-between',
  },
  author: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorName: {
    color: '#999',
    fontSize: 12,
    marginLeft: 4,
  },
  date: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateText: {
    color: '#999',
    fontSize: 12,
    marginLeft: 4,
  },
  blogActions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
    marginRight: 8,
  },
  viewButton: {
    backgroundColor: '#2196f3',
  },
  editButton: {
    backgroundColor: '#4caf50',
  },
  statusButton: {
    backgroundColor: '#ff9800',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
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

export default AdminBlogs;