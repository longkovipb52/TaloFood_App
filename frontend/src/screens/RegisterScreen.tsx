import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Image } from 'react-native';
import Toast from 'react-native-toast-message';

const RegisterScreen = ({ navigation }: any) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    setError('');
    
    // Kiểm tra nhập liệu
    if (!username || !email || !phone || !address || !password || !confirmPassword) {
      Toast.show({
        type: 'info',
        text1: 'Vui lòng nhập đầy đủ thông tin',
        position: 'bottom',
        visibilityTime: 2000
      });
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    
    if (password !== confirmPassword) {
      Toast.show({
        type: 'info',
        text1: 'Mật khẩu xác nhận không khớp',
        position: 'bottom',
        visibilityTime: 2000
      });
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    
    try {
      const res = await fetch('http://192.168.1.13:5000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password, confirmPassword, email, phone, address }),
      });
      const data = await res.json();
      
      if (res.ok) {
        // Thành công - hiển thị Toast
        Toast.show({
          type: 'success',
          text1: 'Đăng ký thành công',
          text2: 'Bạn có thể đăng nhập ngay bây giờ',
          position: 'bottom',
          visibilityTime: 3000
        });
        
        // Đợi toast hiện ra rồi chuyển trang
        setTimeout(() => {
          navigation.navigate('Login');
        }, 1000);
      } else {
        // Thất bại - hiển thị Toast lỗi
        Toast.show({
          type: 'error',
          text1: 'Đăng ký thất bại',
          text2: data.message || 'Tên đăng nhập có thể đã tồn tại',
          position: 'bottom',
          visibilityTime: 3000
        });
        setError(data.message || 'Đăng ký thất bại');
      }
    } catch (err) {
      Toast.show({
        type: 'error',
        text1: 'Lỗi kết nối',
        text2: 'Không thể kết nối đến máy chủ',
        position: 'bottom',
        visibilityTime: 3000
      });
      setError('Lỗi kết nối server');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.form}>
        <Image source={require('../assets/logo.png')} style={styles.logo} />
        <Text style={styles.title}>ĐĂNG KÝ TÀI KHOẢN TALOFOOD</Text>
        <View style={styles.row}>
          <View style={styles.inputWrap}>
            <Text style={styles.label}>Tên đăng nhập</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Nhập tên đăng nhập" 
              placeholderTextColor="#999" 
              value={username} 
              onChangeText={setUsername} 
               
            />
          </View>
          <View style={styles.inputWrap}>
            <Text style={styles.label}>Email</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Nhập email" 
              placeholderTextColor="#999" 
              value={email} 
              onChangeText={setEmail} 
              keyboardType="email-address" 
               
            />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.inputWrap}>
            <Text style={styles.label}>Số điện thoại</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Nhập số điện thoại" 
              placeholderTextColor="#999" 
              value={phone} 
              onChangeText={setPhone} 
              keyboardType="phone-pad" 
               
            />
          </View>
          <View style={styles.inputWrap}>
            <Text style={styles.label}>Địa chỉ</Text>
            <TextInput 
              style={styles.input} 
              placeholder="Nhập địa chỉ" 
              placeholderTextColor="#999" 
              value={address} 
              onChangeText={setAddress} 
               
            />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.inputWrap}>
            <Text style={styles.label}>Mật khẩu</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Tạo mật khẩu"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                
              />
              <TouchableOpacity 
                style={styles.passwordIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Text style={{fontSize: 18}}>{showPassword ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.inputWrap}>
            <Text style={styles.label}>Xác nhận mật khẩu</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                placeholder="Xác nhận mật khẩu"
                placeholderTextColor="#999"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
                
              />
              <TouchableOpacity 
                style={styles.passwordIcon}
                onPress={() => setShowConfirm(!showConfirm)}
              >
                <Text style={{fontSize: 18}}>{showConfirm ? '🙈' : '👁️'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <TouchableOpacity style={styles.button} onPress={handleRegister}>
          <Text style={styles.buttonText}>TIẾP TỤC</Text>
        </TouchableOpacity>
        <View style={styles.registerContainer}>
          <Text>Đã có tài khoản? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.registerText}>Đăng nhập ngay</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#ffe082', justifyContent: 'center', alignItems: 'center' },
  form: { backgroundColor: '#fff', borderRadius: 24, padding: 32, width: 360, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 12, elevation: 4, alignItems: 'stretch', marginVertical: 40 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#4e4e4e', textAlign: 'center', marginBottom: 18 },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  inputWrap: { flex: 1 },
  label: { fontWeight: 'bold', marginTop: 8, marginBottom: 2, color: '#444' },
  logo: {
    width: 120,
    height: 60,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 12,
  },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 6, backgroundColor: '#fafafa', color: '#333' },
  passwordInputContainer: {
    position: 'relative',
    marginBottom: 6,
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    paddingRight: 45,
    backgroundColor: '#fafafa',
    color: '#333',
  },
  passwordIcon: {
    position: 'absolute',
    right: 12,
    top: '50%',
    transform: [{translateY: -12}],
    zIndex: 1,
  },
  eye: { fontSize: 18, marginLeft: 8 },
  error: { color: 'red', textAlign: 'center', marginBottom: 8 },
  button: { backgroundColor: '#fbc02d', borderRadius: 8, paddingVertical: 12, alignItems: 'center', marginTop: 12, marginBottom: 8 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  registerContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 4 },
  registerText: { color: '#bfa13b', fontWeight: 'bold' },
});

export default RegisterScreen;