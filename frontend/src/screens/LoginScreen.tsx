import React, { useState, useContext } from 'react'; // Thêm useContext
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/FontAwesome';
import Toast from 'react-native-toast-message';
import { CommonActions } from '@react-navigation/native';
import { AuthContext } from '../navigation/AppNavigator'; // Thêm import này

const LoginScreen = ({ navigation }: any) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Sử dụng AuthContext
  const { signIn } = useContext(AuthContext);

  const handleLogin = async () => {
    if (!username || !password) {
      setError('Vui lòng nhập đầy đủ thông tin');
      Toast.show({
        type: 'info',
        text1: 'Thông tin không đầy đủ',
        position: 'bottom',
        visibilityTime: 2000
      });
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const res = await fetch('http://192.168.1.13:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      
      if (res.ok) {
        // Lưu thông tin người dùng vào AsyncStorage
        await AsyncStorage.setItem('userId', data.user.account_id.toString());
        await AsyncStorage.setItem('username', data.user.username);
        await AsyncStorage.setItem('userRole', data.user.id_role.toString());
        await AsyncStorage.setItem('token', data.token);
        
        Toast.show({
          type: 'success',
          text1: 'Đăng nhập thành công',
          text2: `Xin chào, ${username}!`,
          position: 'bottom',
        });
        
        // Sử dụng signIn từ context để cập nhật trạng thái đăng nhập
        await signIn(data.token, data.user.id_role.toString());
        
        // Không cần dùng navigation.dispatch nữa, AppNavigator sẽ tự động
        // điều hướng dựa trên trạng thái userToken và userRole
      } else {
        // Thất bại - hiển thị Toast lỗi
        Toast.show({
          type: 'error',
          text1: 'Đăng nhập thất bại',
          text2: data.message || 'Sai tên đăng nhập hoặc mật khẩu',
          position: 'bottom',
          visibilityTime: 3000
        });
        setError(data.message || 'Đăng nhập thất bại');
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
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.form}>
        <Image source={require('../assets/logo.png')} style={styles.logo} />
        <Text style={styles.title}>ĐĂNG NHẬP TALOFOOD</Text>
        <Text style={styles.label}>Tên đăng nhập</Text>
        <TextInput
          style={[styles.input, { color: '#333' }]}
          placeholder="Nhập tên đăng nhập"
          placeholderTextColor="#999"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          editable={!loading}
        />
        
        <Text style={styles.label}>Mật khẩu</Text>
        <View style={styles.passwordInputContainer}>
          <TextInput
            style={[styles.passwordInput, { color: '#333' }]}
            placeholder="Nhập mật khẩu"
            placeholderTextColor="#999"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            editable={!loading}
          />
          <TouchableOpacity 
            style={styles.passwordIcon}
            onPress={() => setShowPassword(!showPassword)}
            disabled={loading}
          >
            <Icon 
              name={showPassword ? 'eye-slash' : 'eye'} 
              size={20} 
              color="#999" 
            />
          </TouchableOpacity>
        </View>
        
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        
        <TouchableOpacity 
          style={[styles.loginButton, loading && styles.disabledButton]}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <Text style={styles.loginButtonText}>ĐĂNG NHẬP</Text>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.registerLink}
          onPress={() => navigation.navigate('Register')}
          disabled={loading}
        >
          <Text style={styles.registerLinkText}>Chưa có tài khoản? Đăng ký ngay</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#23232a',
    justifyContent: 'center',
    padding: 20,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  logo: {
    width: 100,
    height: 100,
    alignSelf: 'center',
    marginBottom: 20,
    borderRadius: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fbc02d',
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 12,
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
  },
  passwordInputContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  passwordInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 12,
    backgroundColor: '#f9f9f9',
  },
  passwordIcon: {
    position: 'absolute',
    right: 12,
    top: 12,
    zIndex: 1,
  },
  errorText: {
    color: '#f44336',
    marginBottom: 15,
    textAlign: 'center',
  },
  loginButton: {
    backgroundColor: '#fbc02d',
    paddingVertical: 15,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 5,
  },
  disabledButton: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: '#23232a',
    fontWeight: 'bold',
    fontSize: 16,
  },
  registerLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  registerLinkText: {
    color: '#fbc02d',
    fontWeight: '500',
  }
});

export default LoginScreen;