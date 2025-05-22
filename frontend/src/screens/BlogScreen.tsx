import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  Image, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl,
  Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import MainLayout from '../components/MainLayout';
import { COLORS } from '../theme/colors';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32; // 16px padding on each side

const BlogScreen = ({ navigation }: any) => {
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await fetch('http://192.168.1.13:5000/api/blogs');
      const data = await response.json();
      
      if (response.ok) {
        setBlogs(data.blogs || []);
      } else {
        Toast.show({
          type: 'error',
          text1: 'Lỗi',
          text2: 'Không thể tải danh sách bài viết',
          position: 'bottom',
        });
      }
    } catch (error) {
      console.error('Error fetching blogs:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi kết nối',
        text2: 'Không thể kết nối đến máy chủ',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  useEffect(() => {
    fetchBlogs();
  }, []);
  
  const handleRefresh = () => {
    setRefreshing(true);
    fetchBlogs();
  };
  
  // Hàm format date để hiển thị thân thiện hơn
  const formatDate = (dateString: string) => {
    return dateString; // Đã được format từ API rồi
  };
  
  const renderBlogItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.blogCard}
      onPress={() => navigation.navigate('BlogDetail', { blogId: item.blog_id })}
    >
      <Image 
        source={{ uri: item.image_url || 'https://via.placeholder.com/400x200?text=TaloFood+Blog' }} 
        style={styles.blogImage}
        resizeMode="cover"
      />
      
      <View style={styles.blogContent}>
        <Text style={styles.blogTitle} numberOfLines={2}>{item.title}</Text>
        
        <View style={styles.authorContainer}>
          <Image 
            source={{ 
              uri: item.author_image || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(item.username) 
            }} 
            style={styles.authorImage}
          />
          <View>
            <Text style={styles.authorName}>{item.username}</Text>
            <Text style={styles.blogDate}>{formatDate(item.created_at)}</Text>
          </View>
        </View>
        
        <Text style={styles.blogExcerpt} numberOfLines={3}>
          {item.excerpt}
        </Text>
        
        <View style={styles.readMoreContainer}>
          <Text style={styles.readMoreText}>Đọc tiếp</Text>
          <Icon name="arrow-right" size={12} color={COLORS.primary} style={{ marginLeft: 4 }} />
        </View>
      </View>
      
      <View style={styles.overlay} />
    </TouchableOpacity>
  );

  if (loading && !refreshing) {
    return (
      <MainLayout navigation={navigation}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải bài viết...</Text>
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout navigation={navigation}>
      <View style={styles.container}>
        <Text style={styles.headerTitle}>Blog TaloFood</Text>
        <Text style={styles.headerSubtitle}>Tin tức & Kiến thức ẩm thực</Text>
        
        {blogs.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Icon name="newspaper-o" size={60} color="#555" />
            <Text style={styles.emptyText}>Chưa có bài viết nào</Text>
          </View>
        ) : (
          <FlatList
            data={blogs}
            keyExtractor={(item) => item.blog_id.toString()}
            renderItem={renderBlogItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                colors={[COLORS.primary]}
                tintColor={COLORS.primary}
              />
            }
          />
        )}
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
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#ccc',
    marginBottom: 24,
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
  },
  listContent: {
    paddingBottom: 20,
  },
  blogCard: {
    backgroundColor: '#2a2a32',
    borderRadius: 12,
    marginBottom: 24,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    width: CARD_WIDTH,
    position: 'relative',
  },
  blogImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#3a3a42',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  blogContent: {
    padding: 16,
  },
  blogTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 10,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#eee',
  },
  blogDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  blogExcerpt: {
    fontSize: 15,
    color: '#ccc',
    lineHeight: 22,
    marginBottom: 16,
  },
  readMoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  readMoreText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
  },
});

export default BlogScreen;