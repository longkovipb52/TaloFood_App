import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const menuData = [
  { label: 'Home', icon: 'home', route: 'Home' },
  { label: 'About', icon: 'info-circle', route: 'About' },
  {
    label: 'Thực Đơn',
    icon: 'cutlery',
    route: 'Menu',
    children: [
      { label: 'Đồ Ăn', icon: 'spoon', route: 'Menu' },
      { label: 'Đồ Uống', icon: 'coffee', route: 'Menu' },
      { label: 'Combo', icon: 'gift', route: 'Menu' },
    ],
  },
  { label: 'Review', icon: 'star', route: 'Review' },
  { label: 'Contact', icon: 'envelope', route: 'Contact' },
  { label: 'Blog', icon: 'book', route: 'Blog' },
];

const SideMenu = ({ navigation, onClose }: any) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <View style={styles.overlay}>
      <TouchableOpacity style={styles.bg} activeOpacity={1} onPress={onClose} />
      <Animated.View style={styles.menu}>
        <ScrollView>
          {menuData.map((item, idx) => (
            <View key={item.label}>
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => {
                  if (item.children) {
                    setOpenIndex(openIndex === idx ? null : idx);
                  } else {
                    if (item.route === 'Review') {
                      navigation.navigate('Review'); // Chuyển hướng đến màn hình Review
                    } else if (item.route === 'Menu') {
                      navigation.navigate('Menu');
                    } else if (item.route === 'Contact') {
                      navigation.navigate('Contact');
                    } else {
                      navigation.navigate(item.route);
                    }
                    onClose();
                  }
                }}
              >
                <Icon name={item.icon} size={20} color="#fbc02d" style={{ width: 28 }} />
                <Text style={styles.menuText}>{item.label}</Text>
                {item.children && (
                  <Icon
                    name={openIndex === idx ? 'angle-up' : 'angle-down'}
                    size={18}
                    color="#fff"
                    style={{ marginLeft: 'auto' }}
                  />
                )}
              </TouchableOpacity>
              {item.children && openIndex === idx && (
                <View style={styles.subMenu}>
                  {item.children.map(sub => (
                    <TouchableOpacity
                      key={sub.label}
                      style={styles.subMenuItem}
                      onPress={() => {
                        navigation.navigate('Menu', { category: sub.label });
                        onClose();
                      }}
                    >
                      <Icon name={sub.icon} size={16} color="#fbc02d" style={{ width: 24 }} />
                      <Text style={styles.subMenuText}>{sub.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row', zIndex: 100 },
  bg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  menu: { width: 270, backgroundColor: '#18181c', paddingTop: 40, paddingBottom: 20, paddingHorizontal: 10, elevation: 8 },
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 8, borderBottomWidth: 1, borderBottomColor: '#23232a' },
  menuText: { color: '#fff', fontSize: 17, fontWeight: 'bold', marginLeft: 10 },
  subMenu: { backgroundColor: '#23232a', borderRadius: 8, marginLeft: 18, marginBottom: 4 },
  subMenuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 10 },
  subMenuText: { color: '#fbc02d', fontSize: 15, marginLeft: 6 },
});

export default SideMenu;