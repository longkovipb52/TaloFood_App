import React, { useState, useEffect } from 'react';
import { 
  Modal, View, Text, StyleSheet, TextInput, TouchableOpacity, 
  ScrollView, ActivityIndicator, TouchableWithoutFeedback, Keyboard
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-toast-message';

interface AdminUserModalProps {
  visible: boolean;
  onClose: () => void;
  user: any;
  isEdit: boolean;
  onSuccess: () => void;
}

const AdminUserModal = ({ visible, onClose, user, isEdit, onSuccess }: AdminUserModalProps) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Reset form khi modal được đóng
  useEffect(() => {
    if (!visible) {
      resetForm();
    }
  }, [visible]);

  // Điền thông tin user vào form khi ở chế độ sửa
  useEffect(() => {
    if (isEdit && user) {
      setUsername(user.username || '');
      setEmail(user.email || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
      // Không điền mật khẩu vì không hiển thị mật khẩu cũ
    }
  }, [isEdit, user, visible]);

  const resetForm = () => {
    setUsername('');
    setEmail('');
    setPhone('');
    setAddress('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const validateForm = () => {
    if (!username) {
      Toast.show({
        type: 'info',
        text1: 'Tên đăng nhập không được để trống',
        position: 'bottom',
      });
      return false;
    }

    if (!email) {
      Toast.show({
        type: 'info',
        text1: 'Email không được để trống',
        position: 'bottom',
      });
      return false;
    }

    if (!phone) {
      Toast.show({
        type: 'info',
        text1: 'Số điện thoại không được để trống',
        position: 'bottom',
      });
      return false;
    }

    if (!address) {
      Toast.show({
        type: 'info',
        text1: 'Địa chỉ không được để trống',
        position: 'bottom',
      });
      return false;
    }

    // Kiểm tra mật khẩu chỉ khi thêm mới hoặc khi sửa và có nhập mật khẩu
    if (!isEdit || (isEdit && password)) {
      if (!isEdit && !password) {
        Toast.show({
          type: 'info',
          text1: 'Mật khẩu không được để trống',
          position: 'bottom',
        });
        return false;
      }

      if (password !== confirmPassword) {
        Toast.show({
          type: 'info',
          text1: 'Mật khẩu xác nhận không khớp',
          position: 'bottom',
        });
        return false;
      }

      // Kiểm tra định dạng mật khẩu
      const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
      if (!passwordRegex.test(password)) {
        Toast.show({
          type: 'info',
          text1: 'Mật khẩu không đủ mạnh',
          text2: 'Cần ít nhất 6 ký tự, 1 chữ in hoa, 1 chữ số và 1 ký tự đặc biệt',
          position: 'bottom',
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('token');

      let url = 'http://192.168.1.13:5000/api/admin/users';
      let method = 'POST';

      // Chuẩn bị dữ liệu gửi lên
      const userData = {
        username,
        email,
        phone,
        address
      } as any;

      // Thêm mật khẩu nếu có
      if (password) {
        userData.password = password;
        userData.confirmPassword = confirmPassword;
      }

      // Nếu là chế độ sửa, thay đổi URL và method
      if (isEdit && user) {
        url = `http://192.168.1.13:5000/api/admin/users/${user.account_id}`;
        method = 'PUT';
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const responseData = await response.json();

      if (response.ok) {
        Toast.show({
          type: 'success',
          text1: isEdit ? 'Cập nhật thành công' : 'Thêm người dùng thành công',
          position: 'bottom',
        });
        onSuccess();
      } else {
        Toast.show({
          type: 'error',
          text1: 'Lỗi',
          text2: responseData.message || 'Không thể thực hiện thao tác',
          position: 'bottom',
        });
      }
    } catch (error) {
      console.error('Error submitting user data:', error);
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

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEdit ? 'Chỉnh sửa người dùng' : 'Thêm người dùng mới'}
              </Text>
              <TouchableOpacity onPress={onClose}>
                <Icon name="times" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Tên đăng nhập</Text>
                <TextInput
                  style={styles.input}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Nhập tên đăng nhập"
                  placeholderTextColor="#999"
                  editable={!isEdit} // Không cho phép sửa username nếu là mode edit
                />
                {isEdit && (
                  <Text style={styles.noteText}>Không thể thay đổi tên đăng nhập</Text>
                )}
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Nhập email"
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Số điện thoại</Text>
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="Nhập số điện thoại"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Địa chỉ</Text>
                <TextInput
                  style={styles.input}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Nhập địa chỉ"
                  placeholderTextColor="#999"
                  multiline
                />
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  {isEdit ? 'Mật khẩu mới (để trống nếu không đổi)' : 'Mật khẩu'}
                </Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={password}
                    onChangeText={setPassword}
                    placeholder={isEdit ? "Nhập mật khẩu mới" : "Nhập mật khẩu"}
                    placeholderTextColor="#999"
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity
                    style={styles.passwordIcon}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Icon name={showPassword ? "eye-slash" : "eye"} size={20} color="#888" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.passwordHint}>
                  Mật khẩu phải có ít nhất 6 ký tự, 1 chữ in hoa, 1 chữ số và 1 ký tự đặc biệt
                </Text>
              </View>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Xác nhận mật khẩu</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Nhập lại mật khẩu"
                    placeholderTextColor="#999"
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity
                    style={styles.passwordIcon}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Icon name={showConfirmPassword ? "eye-slash" : "eye"} size={20} color="#888" />
                  </TouchableOpacity>
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
                style={styles.submitButton} 
                onPress={handleSubmit}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitButtonText}>
                    {isEdit ? 'Cập nhật' : 'Thêm'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableWithoutFeedback>
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
    marginBottom: 15,
  },
  label: {
    color: '#fff',
    marginBottom: 8,
    fontSize: 16,
  },
  input: {
    backgroundColor: '#2a2a32',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  noteText: {
    color: '#999',
    fontSize: 12,
    marginTop: 5,
    fontStyle: 'italic',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    backgroundColor: '#2a2a32',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    paddingRight: 40,
  },
  passwordIcon: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{ translateY: -10 }],
  },
  passwordHint: {
    color: '#999',
    fontSize: 12,
    marginTop: 5,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 15,
    backgroundColor: '#1f1f27',
  },
  cancelButton: {
    padding: 12,
    borderRadius: 8,
    marginRight: 10,
    backgroundColor: '#4a4a52',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#fbc02d',
    padding: 12,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#23232a',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AdminUserModal;