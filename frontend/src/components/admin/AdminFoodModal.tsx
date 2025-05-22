import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  ActivityIndicator,
  Alert,
  Switch,
  Platform
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { launchImageLibrary, ImageLibraryOptions, MediaType } from 'react-native-image-picker';
import DropDownPicker from 'react-native-dropdown-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

interface AdminFoodModalProps {
  visible: boolean;
  food: any;
  categories: any[];
  onClose: () => void;
  onSuccess: (food: any, isEdit: boolean) => void;
  isEdit: boolean;
}

// Thêm định nghĩa kiểu dữ liệu cho category items
interface CategoryItem {
  label: string;
  value: string;
}

const AdminFoodModal = ({
  visible,
  food,
  categories,
  onClose,
  onSuccess,
  isEdit
}: AdminFoodModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<any>(null);
  const [status, setStatus] = useState(1);
  const [loading, setLoading] = useState(false);
  const [openDropdown, setOpenDropdown] = useState(false);
  const [categoryItems, setCategoryItems] = useState<CategoryItem[]>([]);

  // Khởi tạo form khi modal mở
  useEffect(() => {
    if (visible) {
      if (isEdit && food) {
        setName(food.food_name);
        setDescription(food.description || '');
        setPrice(food.price.toString());
        setCategoryId(food.id_category.toString());
        setImage(food.image ? `http://192.168.1.13:5000/foods/${food.image}` : null);
        setStatus(food.status);
      } else {
        // Reset form khi thêm mới
        setName('');
        setDescription('');
        setPrice('');
        setCategoryId(categories.length > 0 ? categories[0].id_category.toString() : '');
        setImage(null);
        setImageFile(null);
        setStatus(1);
      }
    }
  }, [visible, isEdit, food, categories]);

  // Cập nhật danh mục cho DropDownPicker
  useEffect(() => {
    if (visible && categories.length > 0) {
      // Chuyển đổi định dạng categories cho DropDownPicker
      const items: CategoryItem[] = categories.map(category => ({
        label: category.category_name,
        value: category.id_category.toString()
      }));
      setCategoryItems(items);
    }
  }, [visible, categories]);

  // Thay thế hàm pickImage
  const pickImage = async () => {
    try {
      const options: ImageLibraryOptions = {
        mediaType: 'photo' as MediaType,
        quality: 0.8,
        maxWidth: 500,
        maxHeight: 500,
      };
      
      launchImageLibrary(options, (response) => {
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
              name: selectedImage.fileName || `food_${Date.now()}.jpg`,
            });
          }
        }
      });
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Lỗi', 'Không thể chọn ảnh. Vui lòng thử lại.');
    }
  };

  // Validate form
  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên món ăn');
      return false;
    }

    if (!price.trim() || isNaN(Number(price)) || Number(price) <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập giá hợp lệ');
      return false;
    }

    if (!categoryId) {
      Alert.alert('Lỗi', 'Vui lòng chọn danh mục');
      return false;
    }

    return true;
  };

  // Lưu món ăn
  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');

      // Tạo form data để upload ảnh
      const formData = new FormData();
      formData.append('food_name', name);
      formData.append('description', description);
      formData.append('price', price);
      formData.append('id_category', categoryId);
      formData.append('status', status.toString());

      if (imageFile) {
        formData.append('image', imageFile);
      }

      const url = isEdit
        ? `http://192.168.1.13:5000/api/admin/foods/${food.food_id}`
        : 'http://192.168.1.13:5000/api/admin/foods';

      const method = isEdit ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        onSuccess(result.food, isEdit);
      } else {
        Alert.alert('Lỗi', result.message || 'Không thể lưu món ăn. Vui lòng thử lại.');
      }
    } catch (error) {
      console.error('Error saving food:', error);
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
              {isEdit ? 'Sửa món ăn' : 'Thêm món ăn mới'}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="times" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Ảnh món ăn */}
            <TouchableOpacity 
              style={styles.imageSelector}
              onPress={pickImage}
            >
              {image ? (
                <Image source={{ uri: image }} style={styles.foodImage} />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <Icon name="camera" size={40} color="#666" />
                  <Text style={styles.imagePlaceholderText}>
                    Chạm để chọn ảnh
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Tên món ăn */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Tên món ăn *</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Nhập tên món ăn"
                placeholderTextColor="#999"
              />
            </View>

            {/* Danh mục - sử dụng DropDownPicker */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Danh mục *</Text>
              <View style={{ zIndex: 1000 }}>
                <DropDownPicker
                  open={openDropdown}
                  value={categoryId}
                  items={categoryItems}
                  setOpen={setOpenDropdown}
                  setValue={setCategoryId}
                  setItems={setCategoryItems as any} // Hoặc sửa kiểu cụ thể cho đúng
                  placeholder="Chọn danh mục"
                  style={styles.dropdownStyle}
                  textStyle={styles.dropdownTextStyle}
                  dropDownContainerStyle={styles.dropdownContainerStyle}
                  listItemContainerStyle={styles.dropdownItemStyle}
                  placeholderStyle={styles.dropdownPlaceholderStyle}
                />
              </View>
            </View>

            {/* Giá tiền */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Giá tiền (VNĐ) *</Text>
              <TextInput
                style={styles.input}
                value={price}
                onChangeText={setPrice}
                placeholder="Nhập giá tiền"
                placeholderTextColor="#999"
                keyboardType="numeric"
              />
            </View>

            {/* Mô tả */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Mô tả</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={description}
                onChangeText={setDescription}
                placeholder="Nhập mô tả món ăn"
                placeholderTextColor="#999"
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Trạng thái */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Trạng thái</Text>
              <View style={styles.statusContainer}>
                <Text style={styles.statusText}>
                  {status === 1 ? 'Hiển thị' : 'Ẩn'}
                </Text>
                <Switch
                  value={status === 1}
                  onValueChange={value => setStatus(value ? 1 : 0)}
                  trackColor={{ false: '#555', true: '#4caf50' }}
                  thumbColor={status === 1 ? '#fff' : '#f4f3f4'}
                />
              </View>
            </View>
          </ScrollView>
          
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
                  {isEdit ? 'Cập nhật' : 'Thêm món ăn'}
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
  imageSelector: {
    width: '100%',
    height: 180,
    backgroundColor: '#2a2a32',
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 20,
  },
  foodImage: {
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
  textArea: {
    minHeight: 100,
  },
  pickerContainer: {
    backgroundColor: '#2a2a32',
    borderRadius: 6,
    overflow: 'hidden',
  },
  statusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#2a2a32',
    padding: 12,
    borderRadius: 6,
  },
  statusText: {
    color: '#fff',
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
  dropdownStyle: {
    backgroundColor: '#2a2a32',
    borderColor: '#444',
    borderRadius: 6,
  },
  dropdownTextStyle: {
    color: '#fff',
    fontSize: 16,
  },
  dropdownContainerStyle: {
    backgroundColor: '#2a2a32',
    borderColor: '#444',
  },
  dropdownItemStyle: {
    justifyContent: 'flex-start',
  },
  dropdownPlaceholderStyle: {
    color: '#999',
    fontSize: 16,
  },
});

export default AdminFoodModal;