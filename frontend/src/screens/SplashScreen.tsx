import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  StatusBar,
  Animated,
  Easing
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CommonActions } from '@react-navigation/native';

const SplashScreen = ({ navigation }: any) => {
  // Animation values
  const logoScale = new Animated.Value(0.3);
  const opacity = new Animated.Value(0);

  useEffect(() => {
    // Chạy animation khi component được mount
    Animated.parallel([
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
        easing: Easing.elastic(1)
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true
      })
    ]).start();

    const timer = setTimeout(async () => {
      try {
        const token = await AsyncStorage.getItem('token');
        const userRole = await AsyncStorage.getItem('userRole');
        
        // Điều hướng dựa trên trạng thái đăng nhập và vai trò
        if (token) {
          if (userRole === '1') {
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'AdminHome' }],
              })
            );
          } else {
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Home' }],
              })
            );
          }
        } else {
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [{ name: 'Login' }],
            })
          );
        }
      } catch (error) {
        navigation.dispatch(
          CommonActions.reset({
            index: 0,
            routes: [{ name: 'Login' }],
          })
        );
      }
    }, 2500);
    
    return () => clearTimeout(timer);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#23232a" barStyle="light-content" />
      
      <Animated.Image 
        source={require('../assets/logo.png')}
        style={[
          styles.logo,
          { 
            opacity: opacity,
            transform: [{ scale: logoScale }] 
          }
        ]}
        resizeMode="contain"
      />
      
      <Animated.Text style={[styles.title, { opacity }]}>
        TALOFOOD
      </Animated.Text>
      
      <Animated.Text style={[styles.slogan, { opacity }]}>
        Hương Vị Nhanh, Trải Nghiệm Đậm Đà
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#23232a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#fbc02d',
    borderRadius: 75,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fbc02d',
    marginBottom: 10,
  },
  slogan: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginHorizontal: 30,
  }
});

export default SplashScreen;