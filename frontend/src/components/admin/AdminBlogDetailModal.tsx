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

interface AdminBlogDetailModalProps {
  visible: boolean;
  blog: any;
  onClose: () => void;
  onEdit: () => void;
  onDelete: (blogId: number) => void;
  onUpdateStatus: (blogId: number, newStatus: string) => void;
}

const AdminBlogDetailModal = ({
  visible,
  blog,
  onClose,
  onEdit,
  onDelete,
  onUpdateStatus
}: AdminBlogDetailModalProps) => {
  if (!visible || !blog) return null;

  const formatContent = (content: string) => {
    // Chia nội dung thành các đoạn để trình bày đẹp hơn
    return content.split('\n').map((paragraph, idx) => (
      <Text key={idx} style={styles.paragraph}>
        {paragraph}
      </Text>
    ));
  };

  const statusText = blog.status === 'published' ? 'Đã xuất bản' : 'Bản nháp';
  const newStatus = blog.status === 'published' ? 'Bản nháp' : 'Đã xuất bản';

  const handleDeleteBlog = (blogId: number) => {
    onDelete(blogId);
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
            <Text style={styles.modalTitle}>Chi tiết bài viết</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="times" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Ảnh đại diện */}
            {blog.image_url && (
              <Image 
                source={{ uri: blog.image_url }}
                style={styles.image}
              />
            )}

            {/* Tiêu đề */}
            <Text style={styles.title}>{blog.title}</Text>

            {/* Nội dung */}
            {formatContent(blog.content)}

            {/* Tác giả */}
            <Text style={styles.author}>Tác giả: {blog.username}</Text>

            {/* Trạng thái */}
            <Text style={styles.status}>Trạng thái: {statusText}</Text>
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity style={styles.button} onPress={onEdit}>
              <Text style={styles.buttonText}>Chỉnh sửa</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => {
                Alert.alert(
                  "Xác nhận xóa",
                  "Bạn có chắc chắn muốn xóa bài viết này không?",
                  [
                    { text: "Hủy", style: "cancel" },
                    { 
                      text: "Xóa", 
                      style: "destructive",
                      onPress: () => {
                        handleDeleteBlog(blog.blog_id);
                        onClose();
                      }
                    }
                  ]
                );
              }}
            >
              <Text style={styles.buttonText}>Xóa</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.button}
              onPress={() => onUpdateStatus(blog.blog_id, newStatus)}
            >
              <Text style={styles.buttonText}>
                {blog.status === 'published' ? 'Hủy xuất bản' : 'Xuất bản'}
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#23232a',
    borderRadius: 10,
    overflow: 'hidden',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1f1f27',
    padding: 15,
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 15,
  },
  image: {
    width: '100%',
    height: 200,
    marginBottom: 15,
    borderRadius: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#fff',
  },
  paragraph: {
    fontSize: 16,
    marginBottom: 10,
    color: '#ccc',
    lineHeight: 24,
  },
  author: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 10,
    color: '#fbc02d',
    marginTop: 15,
  },
  status: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#fff',
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 15,
    backgroundColor: '#1f1f27',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    backgroundColor: '#fbc02d',
  },
  buttonText: {
    color: '#23232a',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AdminBlogDetailModal;