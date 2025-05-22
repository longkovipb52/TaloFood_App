import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { launchImageLibrary, ImageLibraryOptions, MediaType } from 'react-native-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

interface AdminCategoryModalProps {
  visible: boolean;
  category: any;
  onClose: () => void;
  onSuccess: (category: any, isEdit: boolean) => void;
  isEdit: boolean;
}

const AdminCategoryModal = ({
  visible,
  category,
  onClose,
  onSuccess,
  isEdit
}: AdminCategoryModalProps) => {
  const [categoryName, setCategoryName] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Initialize form when modal opens
  useEffect(() => {
    if (visible) {
      if (isEdit && category) {
        setCategoryName(category.foodcategory_name);
        setImage(category.image ? `http://192.168.1.13:5000/category_images/${category.image}` : null);
      } else {
        // Reset form when adding new
        setCategoryName('');
        setImage(null);
        setImageFile(null);
      }
    }
  }, [visible, isEdit, category]);

  // Pick image from library
  const pickImage = async () => {
    try {
      // Kiểm tra quyền trước khi mở thư viện ảnh
      const options: ImageLibraryOptions = {
        mediaType: 'photo' as MediaType,
        includeBase64: false,
        maxHeight: 500,
        maxWidth: 500,
      };

      // Sử dụng cách gọi Promise để dễ bắt lỗi hơn
      launchImageLibrary(options)
        .then((response) => {
          if (response.didCancel) {
            console.log('User cancelled image picker');
          } else if (response.errorCode) {
            console.log('ImagePicker Error: ', response.errorMessage);
            Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
          } else if (response.assets && response.assets.length > 0) {
            const selectedImage = response.assets[0];
            if (selectedImage.uri) {
              setImage(selectedImage.uri);
              setImageFile({
                uri: selectedImage.uri,
                type: selectedImage.type || 'image/jpeg',
                name: selectedImage.fileName || `category_${Date.now()}.jpg`,
              });
            }
          }
        })
        .catch((error) => {
          console.error('Error picking image:', error);
          Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
        });
    } catch (error) {
      console.error('Error initializing image picker:', error);
      Alert.alert('Lỗi', 'Không thể khởi tạo trình chọn ảnh. Vui lòng thử lại sau.');
    }
  };

  // Validate form
  const validateForm = () => {
    if (!categoryName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên danh mục');
      return false;
    }
    return true;
  };

  // Save category
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');

      // Tạo FormData
      const formData = new FormData();
      formData.append('foodcategory_name', categoryName);

      // Cách xử lý ảnh khác nhau cho thêm mới và cập nhật
      if (imageFile) {
        // Trường hợp người dùng đã chọn ảnh mới
        console.log('Appending image file:', imageFile);
        formData.append('image', {
          uri: imageFile.uri,
          type: imageFile.type || 'image/jpeg',
          name: imageFile.name || `category_${Date.now()}.jpg`,
        });
      } else if (isEdit && !image && category.image) {
        // Trường hợp cập nhật: xóa ảnh hiện tại
        formData.append('removeImage', 'true');
      }

      // In ra để kiểm tra FormData
      console.log('FormData created with keys:', Object.keys(formData));
      
      const url = isEdit
        ? `http://192.168.1.13:5000/api/admin/categories/${category.foodcategory_id}`
        : 'http://192.168.1.13:5000/api/admin/categories';

      const method = isEdit ? 'PUT' : 'POST';

      // Sửa cách gọi API
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          // Không chỉ định Content-Type để browser tự xử lý
        },
        body: formData,
      });

      console.log('Response status:', response.status);
      
      if (response.ok) {
        const result = await response.json();
        console.log('Response body:', result);
        onSuccess(result.category, isEdit);
      } else {
        let errorMessage = 'Không thể lưu danh mục';
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        Alert.alert('Lỗi', errorMessage);
      }
    } catch (error) {
      console.error('Error saving category:', error);
      Alert.alert(
        'Lỗi kết nối',
        'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng và thử lại.'
      );
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
              {isEdit ? 'Sửa danh mục' : 'Thêm danh mục mới'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="times" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.modalBody}>
            {/* Category image */}
            <TouchableOpacity 
              style={styles.imageSelector}
              onPress={pickImage}
            >
              {image ? (
                <Image source={{ uri: image }} style={styles.categoryImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Icon name="camera" size={40} color="#666" />
                  <Text style={styles.imagePlaceholderText}>
                    Chạm để chọn ảnh
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Category name */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Tên danh mục *</Text>
              <TextInput
                style={styles.input}
                value={categoryName}
                onChangeText={setCategoryName}
                placeholder="Nhập tên danh mục"
                placeholderTextColor="#999"
              />
            </View>
          </View>
          
          <View style={styles.modalFooter}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.cancelButtonText}>Hủy</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>
                  {isEdit ? 'Cập nhật' : 'Thêm danh mục'}
                </Text>
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
  imageSelector: {
    width: '100%',
    height: 180,
    backgroundColor: '#2a2a32',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 20,
  },
  categoryImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    color: '#999',
    marginTop: 10,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#fbc02d',
    fontSize: 16,
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#2a2a32',
    color: '#fff',
    borderRadius: 6,
    padding: 12,
    fontSize: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#1f1f27',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#3a3a42',
    borderRadius: 6,
    marginRight: 10,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButton: {
    flex: 1,
    padding: 12,
    backgroundColor: '#fbc02d',
    borderRadius: 6,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AdminCategoryModal;