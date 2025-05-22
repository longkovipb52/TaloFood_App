import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Image,
  Alert,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { launchImageLibrary } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AdminBlogModalProps {
  visible: boolean;
  blog: any;
  isEdit: boolean;
  onClose: () => void;
  onSuccess: (blog: any, isEdit: boolean) => void;
}

const AdminBlogModal = ({
  visible,
  blog,
  isEdit,
  onClose,
  onSuccess
}: AdminBlogModalProps) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<any>(null);
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      if (isEdit && blog) {
        setTitle(blog.title || '');
        setContent(blog.content || '');
        setImage(blog.image_url || null);
        setStatus(blog.status || 'draft');
        setImageFile(null);
      } else {
        // Reset form for new blog
        setTitle('');
        setContent('');
        setImage(null);
        setStatus('draft');
        setImageFile(null);
      }
    }
  }, [visible, isEdit, blog]);

  const pickImage = async () => {
    try {
      const options = {
        mediaType: 'photo' as const,
        includeBase64: false,
        maxHeight: 1200,
        maxWidth: 1200,
      };
      
      const result = await launchImageLibrary(options);
      
      if (result.didCancel) {
        return;
      }
      
      if (result.errorCode) {
        Alert.alert('Lỗi', 'Không thể chọn ảnh: ' + result.errorMessage);
        return;
      }
      
      if (result.assets && result.assets.length > 0) {
        const selectedAsset = result.assets[0];
        setImage(selectedAsset.uri || null);
        
        if (selectedAsset.uri) {
          setImageFile({
            uri: Platform.OS === 'android' ? selectedAsset.uri : selectedAsset.uri.replace('file://', ''),
            type: selectedAsset.type || 'image/jpeg',
            name: selectedAsset.fileName || `blog_${Date.now()}.jpg`,
          });
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh');
    }
  };

  const removeImage = () => {
    setImage(null);
    setImageFile(null);
  };

  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề bài viết');
      return false;
    }
    
    if (title.trim().length < 5) {
      Alert.alert('Lỗi', 'Tiêu đề bài viết quá ngắn (tối thiểu 5 ký tự)');
      return false;
    }
    
    if (!content.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập nội dung bài viết');
      return false;
    }
    
    if (content.trim().length < 20) {
      Alert.alert('Lỗi', 'Nội dung bài viết quá ngắn (tối thiểu 20 ký tự)');
      return false;
    }
    
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');
      
      // Tạo FormData
      const formData = new FormData();
      formData.append('title', title);
      formData.append('content', content);
      formData.append('status', status);
      
      if (imageFile) {
        formData.append('image', imageFile);
      } else if (isEdit && !image && blog.image) {
        formData.append('removeImage', 'true');
      }
      
      const url = isEdit
        ? `http://192.168.1.13:5000/api/admin/blogs/${blog.blog_id}`
        : 'http://192.168.1.13:5000/api/admin/blogs';
      
      const method = isEdit ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          // Không chỉ định Content-Type để browser tự xử lý với FormData
        },
        body: formData,
      });
      
      const result = await response.json();
      
      if (response.ok) {
        onSuccess(result.blog, isEdit);
      } else {
        Alert.alert('Lỗi', result.message || 'Không thể lưu bài viết');
      }
    } catch (error) {
      console.error('Error saving blog:', error);
      Alert.alert('Lỗi', 'Không thể kết nối đến máy chủ');
    } finally {
      setLoading(false);
    }
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
            <Text style={styles.modalTitle}>
              {isEdit ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
            </Text>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <Icon name="times" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalBody}>
            {/* Tiêu đề */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tiêu đề</Text>
              <TextInput
                style={styles.input}
                value={title}
                onChangeText={setTitle}
                placeholder="Nhập tiêu đề bài viết"
                placeholderTextColor="#999"
                maxLength={200}
              />
            </View>
            
            {/* Ảnh */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ảnh đại diện</Text>
              
              {image ? (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: image }} style={styles.previewImage} />
                  <TouchableOpacity
                    style={styles.removeImageButton}
                    onPress={removeImage}
                  >
                    <Icon name="trash" size={18} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.imagePickerButton}
                  onPress={pickImage}
                >
                  <Icon name="camera" size={20} color="#fff" />
                  <Text style={styles.imagePickerText}>Chọn ảnh</Text>
                </TouchableOpacity>
              )}
            </View>
            
            {/* Nội dung */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nội dung</Text>
              <TextInput
                style={styles.contentInput}
                value={content}
                onChangeText={setContent}
                placeholder="Nhập nội dung bài viết"
                placeholderTextColor="#999"
                multiline
                textAlignVertical="top"
              />
            </View>
            
            {/* Trạng thái */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Trạng thái</Text>
              <View style={styles.statusButtons}>
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    status === 'draft' && styles.selectedStatusButton
                  ]}
                  onPress={() => setStatus('draft')}
                >
                  <Text style={[
                    styles.statusButtonText,
                    status === 'draft' && styles.selectedStatusButtonText
                  ]}>Bản nháp</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.statusButton,
                    status === 'published' && styles.selectedStatusButton
                  ]}
                  onPress={() => setStatus('published')}
                >
                  <Text style={[
                    styles.statusButtonText,
                    status === 'published' && styles.selectedStatusButtonText
                  ]}>Xuất bản</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.button, styles.saveButton, loading && styles.disabledButton]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Lưu</Text>
              )}
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
    maxHeight: '90%',
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
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#fbc02d',
    marginBottom: 8,
    fontSize: 16,
    fontWeight: 'bold',
  },
  input: {
    backgroundColor: '#2a2a32',
    borderRadius: 5,
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  contentInput: {
    backgroundColor: '#2a2a32',
    borderRadius: 5,
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    minHeight: 200,
  },
  imagePickerButton: {
    backgroundColor: '#2a2a32',
    borderRadius: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  imagePickerText: {
    color: '#fff',
    marginLeft: 8,
    fontSize: 16,
  },
  imageContainer: {
    position: 'relative',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 5,
  },
  previewImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusButtons: {
    flexDirection: 'row',
  },
  statusButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#2a2a32',
    marginRight: 10,
    borderRadius: 5,
  },
  selectedStatusButton: {
    backgroundColor: '#fbc02d',
  },
  statusButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  selectedStatusButtonText: {
    color: '#23232a',
    fontWeight: 'bold',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#1f1f27',
    justifyContent: 'flex-end',
  },
  button: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
    minWidth: 100,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    marginRight: 10,
  },
  saveButton: {
    backgroundColor: '#fbc02d',
  },
  disabledButton: {
    opacity: 0.6,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  saveButtonText: {
    color: '#23232a',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AdminBlogModal;