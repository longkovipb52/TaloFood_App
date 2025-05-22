import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Share,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import MainLayout from '../components/MainLayout';
import { COLORS } from '../theme/colors';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

const BlogDetailScreen = ({ navigation, route }: any) => {
  const { blogId } = route.params;
  const [blog, setBlog] = useState<any>(null);
  const [relatedBlogs, setRelatedBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBlogDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://192.168.1.13:5000/api/blogs/${blogId}`);
        const data = await response.json();
        
        if (response.ok) {
          setBlog(data.blog);
          setRelatedBlogs(data.relatedBlogs || []);
        } else {
          Toast.show({
            type: 'error',
            text1: 'Lỗi',
            text2: 'Không thể tải bài viết',
            position: 'bottom',
          });
        }
      } catch (error) {
        console.error('Error fetching blog details:', error);
        Toast.show({
          type: 'error',
          text1: 'Lỗi kết nối',
          text2: 'Không thể kết nối đến máy chủ',
          position: 'bottom',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchBlogDetails();
  }, [blogId]);

  const handleShareBlog = async () => {
    try {
      await Share.share({
        message: `Đọc bài viết ${blog.title} trên ứng dụng TaloFood! Tải ứng dụng để đọc thêm.`,
        url: Platform.OS === 'ios' ? `talofood://blog/${blogId}` : undefined, // Deep linking URL (iOS)
        title: blog.title, // Android only
      });
    } catch (error) {
      console.error('Error sharing blog:', error);
    }
  };

  const formatContent = (content: string) => {
    // Chia nội dung thành các đoạn để trình bày đẹp hơn
    return content.split('\n').map((paragraph, idx) => (
      <Text key={idx} style={styles.paragraph}>
        {paragraph}
      </Text>
    ));
  };

  if (loading) {
    return (
      <MainLayout navigation={navigation}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Đang tải bài viết...</Text>
        </View>
      </MainLayout>
    );
  }

  if (!blog) {
    return (
      <MainLayout navigation={navigation}>
        <View style={styles.errorContainer}>
          <Icon name="exclamation-circle" size={60} color="#e74c3c" />
          <Text style={styles.errorText}>Không thể tải bài viết</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Quay lại</Text>
          </TouchableOpacity>
        </View>
      </MainLayout>
    );
  }

  return (
    <MainLayout navigation={navigation}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header Image */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: blog.image_url || 'https://via.placeholder.com/800x400?text=TaloFood+Blog' }}
            style={styles.headerImage}
            resizeMode="cover"
          />
          
          <TouchableOpacity
            style={styles.backIconButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.shareIconButton}
            onPress={handleShareBlog}
          >
            <Icon name="share-alt" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          {/* Title */}
          <Text style={styles.title}>{blog.title}</Text>
          
          {/* Author & Date */}
          <View style={styles.authorContainer}>
            <Image 
              source={{ 
                uri: blog.author_image || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(blog.username) 
              }} 
              style={styles.authorImage}
            />
            <View>
              <Text style={styles.authorName}>{blog.username}</Text>
              <Text style={styles.blogDate}>
                Đăng ngày {blog.created_at}
                {blog.updated_at !== blog.created_at && ` • Cập nhật ${blog.updated_at}`}
              </Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.divider} />
          
          {/* Content */}
          <View style={styles.blogContent}>
            {formatContent(blog.content)}
          </View>
          
          {/* Related Posts */}
          {relatedBlogs.length > 0 && (
            <View style={styles.relatedContainer}>
              <Text style={styles.relatedTitle}>Bài Viết Liên Quan</Text>
              
              <View style={styles.relatedList}>
                {relatedBlogs.map((relatedBlog) => (
                  <TouchableOpacity
                    key={relatedBlog.blog_id}
                    style={styles.relatedItem}
                    onPress={() => {
                      // Điều hướng đến cùng màn hình với blogId khác
                      navigation.replace('BlogDetail', { blogId: relatedBlog.blog_id });
                    }}
                  >
                    <Image
                      source={{ uri: relatedBlog.image_url || 'https://via.placeholder.com/100?text=Blog' }}
                      style={styles.relatedImage}
                      resizeMode="cover"
                    />
                    <View style={styles.relatedInfo}>
                      <Text style={styles.relatedItemTitle} numberOfLines={2}>
                        {relatedBlog.title}
                      </Text>
                      <Text style={styles.relatedItemDate}>{relatedBlog.created_at}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>
    </MainLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#23232a',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#23232a',
    padding: 20,
  },
  errorText: {
    color: '#fff',
    fontSize: 18,
    marginTop: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#23232a',
    fontWeight: 'bold',
    fontSize: 16,
  },
  imageContainer: {
    position: 'relative',
    width: width,
    height: 250,
  },
  headerImage: {
    width: '100%',
    height: '100%',
  },
  backIconButton: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareIconButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.5)',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  authorImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  authorName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  blogDate: {
    fontSize: 14,
    color: '#999',
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: '#3a3a42',
    marginBottom: 20,
  },
  blogContent: {
    marginBottom: 30,
  },
  paragraph: {
    fontSize: 16,
    lineHeight: 24,
    color: '#eee',
    marginBottom: 16,
  },
  relatedContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#3a3a42',
  },
  relatedTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 16,
  },
  relatedList: {
    gap: 16,
  },
  relatedItem: {
    flexDirection: 'row',
    backgroundColor: '#2a2a32',
    borderRadius: 8,
    overflow: 'hidden',
  },
  relatedImage: {
    width: 100,
    height: 80,
  },
  relatedInfo: {
    flex: 1,
    padding: 10,
    justifyContent: 'center',
  },
  relatedItemTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    marginBottom: 6,
  },
  relatedItemDate: {
    fontSize: 12,
    color: '#999',
  },
});

export default BlogDetailScreen;