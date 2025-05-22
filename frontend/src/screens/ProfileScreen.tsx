import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Image, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import MainLayout from '../components/MainLayout';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { launchImageLibrary, ImagePickerResponse } from 'react-native-image-picker';
import Toast from 'react-native-toast-message';

const ProfileScreen = ({ navigation }: any) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [userData, setUserData] = useState<any>({
    username: '',
    email: '',
    phone: '',
    address: '',
    profile_image: null
  });
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Sửa đoạn useEffect lấy dữ liệu như sau:
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userIdValue = await AsyncStorage.getItem('userId');
        if (userIdValue) {
          setUserId(userIdValue);
          
          console.log('userId loaded:', userIdValue);
          
          const response = await fetch(`http://192.168.1.13:5000/api/user/${userIdValue}`);
          
          console.log('API Response status:', response.status);
          
          const data = await response.json();
          console.log('User data received:', data);
          
          // Kiểm tra cấu trúc dữ liệu - truy cập trực tiếp hoặc qua data.user
          const userData = data.user || data;
          
          if (userData) {
            // Cập nhật state với dữ liệu mới
            setUserData({
              username: userData.username || '',
              email: userData.email || '',
              phone: userData.phone || '',
              address: userData.address || '',
              profile_image: userData.profile_image 
                ? `http://192.168.1.13:5000/profile_images/${userData.profile_image}` 
                : null
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUserData();
  }, []);

  // Thêm useEffect mới để kiểm tra khi userData thay đổi
  useEffect(() => {
    console.log('userData đã được cập nhật:', userData);
  }, [userData]);

  // Hàm cập nhật thông tin cá nhân - không cần thay đổi nhiều vì phần backend không cho phép thay đổi username
  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      
      if (!userData.email || !userData.phone || !userData.address) {
        Toast.show({
          type: 'info',
          text1: 'Vui lòng nhập đầy đủ thông tin',
          position: 'bottom',
        });
        setLoading(false);
        return;
      }

      const response = await fetch(`http://192.168.1.13:5000/api/user/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          email: userData.email,
          phone: userData.phone,
          address: userData.address,
          // Không gửi username vì backend sẽ không cập nhật trường này
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        Toast.show({
          type: 'success',
          text1: 'Thành công',
          text2: 'Cập nhật thông tin thành công',
          position: 'bottom',
        });
      } else {
        Toast.show({
          type: 'error',
          text1: 'Lỗi',
          text2: data.message || 'Cập nhật thông tin thất bại',
          position: 'bottom',
        });
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không thể kết nối đến máy chủ',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
    }
  };

  // Hàm đổi mật khẩu
  const handleChangePassword = async () => {
    try {
      setLoading(true);
      
      // Kiểm tra nhập liệu
      if (!currentPassword || !newPassword || !confirmPassword) {
        Toast.show({
          type: 'info',
          text1: 'Vui lòng nhập đầy đủ thông tin',
          position: 'bottom',
        });
        setLoading(false);
        return;
      }
      
      if (newPassword !== confirmPassword) {
        Toast.show({
          type: 'info',
          text1: 'Mật khẩu mới không khớp',
          position: 'bottom',
        });
        setLoading(false);
        return;
      }

      // Kiểm tra định dạng mật khẩu mới
      const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,}$/;
      if (!passwordRegex.test(newPassword)) {
        Toast.show({
          type: 'info',
          text1: 'Mật khẩu không đủ mạnh',
          text2: 'Cần ít nhất 6 ký tự, 1 chữ in hoa, 1 chữ số và 1 ký tự đặc biệt',
          position: 'bottom',
        });
        setLoading(false);
        return;
      }

      // Sửa URL API và headers
      const response = await fetch('http://192.168.1.13:5000/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          userId,
          currentPassword,
          newPassword
        })
      });

      // Kiểm tra nếu response không phải JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Lỗi không phải định dạng JSON:', text);
        throw new Error('Server trả về định dạng không hợp lệ');
      }
      
      const data = await response.json();
      
      if (response.ok) {
        Toast.show({
          type: 'success',
          text1: 'Thành công',
          text2: 'Đổi mật khẩu thành công',
          position: 'bottom',
        });
        
        // Reset các trường nhập
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        
        // Chuyển về tab thông tin cơ bản
        setActiveTab('basic');
      } else {
        Toast.show({
          type: 'error',
          text1: 'Lỗi',
          text2: data.message || 'Đổi mật khẩu thất bại',
          position: 'bottom',
        });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      Toast.show({
        type: 'error',
        text1: 'Lỗi',
        text2: 'Không thể kết nối đến máy chủ',
        position: 'bottom',
      });
    } finally {
      setLoading(false);
    }
  };

  // Hàm chọn ảnh từ thư viện
  const handleChoosePhoto = () => {
    launchImageLibrary({ mediaType: 'photo', quality: 0.5 }, async (response: ImagePickerResponse) => {
      if (response.didCancel) {
        return;
      }
      
      if (response.errorCode) {
        Toast.show({
          type: 'error',
          text1: 'Lỗi',
          text2: 'Không thể chọn ảnh',
          position: 'bottom',
        });
        return;
      }
      
      if (response.assets && response.assets.length > 0) {
        const selectedImage = response.assets[0];
        
        // Tạo form data để upload ảnh
        const formData = new FormData();
        formData.append('profileImage', {
          name: selectedImage.fileName,
          type: selectedImage.type,
          uri: selectedImage.uri
        });
        formData.append('userId', userId);
        
        try {
          const response = await fetch('http://192.168.1.13:5000/api/user/upload-profile-image', {
            method: 'POST',
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            body: formData
          });
          
          // Kiểm tra nếu response không phải JSON
          const contentType = response.headers.get('content-type');
          if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('Lỗi không phải định dạng JSON:', text);
            throw new Error('Server trả về định dạng không hợp lệ');
          }
          
          const result = await response.json();
          
          if (response.ok) {
            setUserData({
              ...userData,
              profile_image: `http://192.168.1.13:5000/profile_images/${result.filename}`
            });
            
            Toast.show({
              type: 'success',
              text1: 'Thành công',
              text2: 'Cập nhật ảnh đại diện thành công',
              position: 'bottom',
            });
          } else {
            Toast.show({
              type: 'error',
              text1: 'Lỗi',
              text2: result.message || 'Cập nhật ảnh thất bại',
              position: 'bottom',
            });
          }
        } catch (error) {
          console.error('Upload error:', error);
          Toast.show({
            type: 'error',
            text1: 'Lỗi',
            text2: 'Không thể kết nối đến máy chủ',
            position: 'bottom',
          });
        }
      }
    });
  };

  return (
    <MainLayout navigation={navigation}>
      <ScrollView style={styles.container}>
        <Text style={styles.title}>Thông Tin Cá Nhân</Text>
        
        {/* Ảnh đại diện */}
        <View style={styles.profileImageContainer}>
          <View style={styles.imageWrapper}>
            {userData.profile_image ? (
              <Image 
                source={{ uri: userData.profile_image }}
                style={styles.profileImage} 
              />
            ) : (
              <View style={[styles.profileImage, styles.defaultAvatarContainer]}>
                <Icon name="user" size={60} color="#888" />
              </View>
            )}
            <TouchableOpacity style={styles.cameraButton} onPress={handleChoosePhoto}>
              <Icon name="camera" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'basic' && styles.activeTab]} 
            onPress={() => setActiveTab('basic')}
          >
            <Text style={[styles.tabText, activeTab === 'basic' && styles.activeTabText]}>
              Thông Tin Cơ Bản
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'password' && styles.activeTab]} 
            onPress={() => setActiveTab('password')}
          >
            <Text style={[styles.tabText, activeTab === 'password' && styles.activeTabText]}>
              Đổi Mật Khẩu
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Basic Information Tab */}
        {activeTab === 'basic' && (
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tên Đăng Nhập</Text>
              <TextInput
                style={[styles.input, { 
                  color: '#fff', // Đảm bảo chữ màu trắng
                  backgroundColor: '#444' // Nền tối hơn để làm nổi bật
                }]}
                value={userData.username}
                editable={false}
              />
              <Text style={styles.noteText}>Không thể thay đổi tên đăng nhập</Text>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, { color: '#fff' }]} // Đảm bảo chữ màu trắng
                value={userData.email}
                onChangeText={(text) => setUserData({...userData, email: text})}
                placeholderTextColor="#666"
                keyboardType="email-address"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Số Điện Thoại</Text>
              <TextInput
                style={styles.input}
                value={userData.phone}
                onChangeText={(text) => setUserData({...userData, phone: text})}
                placeholderTextColor="#999"
                keyboardType="phone-pad"
              />
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Địa Chỉ</Text>
              <TextInput
                style={styles.input}
                value={userData.address}
                onChangeText={(text) => setUserData({...userData, address: text})}
                placeholderTextColor="#999"
                multiline
              />
            </View>
            
            <TouchableOpacity 
              style={styles.button}
              onPress={handleUpdateProfile}
              disabled={loading}
            >
              <Text style={styles.buttonText}>LƯU THAY ĐỔI</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Password Change Tab */}
        {activeTab === 'password' && (
          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mật Khẩu Hiện Tại</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Nhập mật khẩu hiện tại"
                  placeholderTextColor="#999"
                  secureTextEntry={!showCurrentPassword}
                />
                <TouchableOpacity 
                  style={styles.passwordIcon}
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  <Icon name={showCurrentPassword ? "eye-slash" : "eye"} size={20} color="#888" />
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mật Khẩu Mới</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Nhập mật khẩu mới"
                  placeholderTextColor="#999"
                  secureTextEntry={!showNewPassword}
                />
                <TouchableOpacity 
                  style={styles.passwordIcon}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  <Icon name={showNewPassword ? "eye-slash" : "eye"} size={20} color="#888" />
                </TouchableOpacity>
              </View>
              <Text style={styles.noteText}>
                Mật khẩu phải có ít nhất 6 ký tự, 1 chữ in hoa, 1 chữ số và 1 ký tự đặc biệt
              </Text>
            </View>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Xác Nhận Mật Khẩu Mới</Text>
              <View style={styles.passwordInputContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Nhập lại mật khẩu mới"
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
            
            <TouchableOpacity 
              style={styles.button}
              onPress={handleChangePassword}
              disabled={loading}
            >
              <Text style={styles.buttonText}>ĐỔI MẬT KHẨU</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </MainLayout>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#23232a',
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fbc02d',
    textAlign: 'center',
    marginVertical: 24,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  imageWrapper: {
    position: 'relative',
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#fbc02d',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: 'rgba(251, 192, 45, 0.8)',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#fbc02d',
  },
  tabText: {
    fontSize: 16,
    color: '#888',
  },
  activeTabText: {
    color: '#fbc02d',
    fontWeight: 'bold',
  },
  formContainer: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    color: '#fff', // Đảm bảo text màu trắng
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#444', // Thêm viền để dễ nhìn hơn
  },
  noteText: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
    fontStyle: 'italic',
  },
  passwordInputContainer: {
    position: 'relative',
  },
  passwordInput: {
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 12,
    paddingRight: 50,
    color: '#fff',
    fontSize: 16,
  },
  passwordIcon: {
    position: 'absolute',
    right: 15,
    top: '50%',
    transform: [{ translateY: -12 }],
  },
  button: {
    backgroundColor: '#fbc02d',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#23232a',
  },
  defaultAvatarContainer: {
    backgroundColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ProfileScreen;