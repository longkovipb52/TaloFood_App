/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React from 'react';
import { NavigationContainer, DefaultTheme, Theme } from '@react-navigation/native';
import { StatusBar, SafeAreaView } from 'react-native';
import AppNavigator from './frontend/src/navigation/AppNavigator';
import { CartProvider } from './frontend/src/context/CartProvider';
import Toast from 'react-native-toast-message';
import { COLORS } from './frontend/src/theme/colors';

// Tạo theme cho NavigationContainer
const navigationTheme: Theme = {
  dark: true,
  colors: {
    primary: COLORS.primary,
    background: COLORS.background.dark,
    card: COLORS.background.darker,
    text: COLORS.text.light,
    border: COLORS.border,
    notification: COLORS.primary,
  },
  fonts: {
    ...DefaultTheme.fonts,
  },
};

const App = () => {
  return (
    <CartProvider>
      <StatusBar backgroundColor={COLORS.background.darker} barStyle="light-content" />
      <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.background.dark }}>
        <NavigationContainer theme={navigationTheme}>
          <AppNavigator />
          <Toast />
        </NavigationContainer>
      </SafeAreaView>
    </CartProvider>
  );
};

export default App;
