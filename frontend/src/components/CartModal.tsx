import React from 'react';
import { Modal, View, Text, TouchableOpacity, FlatList, Image, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';

const CartModal = ({ visible, onClose, cartItems, onRemove, onCheckout, onUpdateQuantity }: any) => {
  const total = cartItems.reduce((sum: number, item: any) => sum + item.new_price * item.quantity, 0);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modalBox}>
          <View style={styles.header}>
            <Text style={styles.title}>Giỏ Hàng Của Bạn</Text>
            <TouchableOpacity onPress={onClose}>
              <Icon name="close" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
          {cartItems.length === 0 ? (
            <View style={styles.emptyBox}>
              <Icon name="shopping-basket" size={48} color="#888" />
              <Text style={styles.emptyText}>Giỏ hàng trống</Text>
            </View>
          ) : (
            <>
              <FlatList
                data={cartItems}
                keyExtractor={item => item.food_id.toString()}
                renderItem={({ item }) => (
                  <View style={styles.itemRow}>
                    <Image source={{ uri: item.image_url }} style={styles.itemImg} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.itemName}>{item.food_name}</Text>
                      <Text style={styles.itemPrice}>{item.new_price.toLocaleString()}đ</Text>
                    </View>
                    <View style={styles.quantityControl}>
                      <TouchableOpacity 
                        style={styles.quantityBtn}
                        onPress={() => onUpdateQuantity(item.food_id, item.quantity - 1)}
                      >
                        <Icon name="minus" size={14} color="#fff" />
                      </TouchableOpacity>
                      <Text style={styles.quantityText}>{item.quantity}</Text>
                      <TouchableOpacity 
                        style={styles.quantityBtn}
                        onPress={() => onUpdateQuantity(item.food_id, item.quantity + 1)}
                      >
                        <Icon name="plus" size={14} color="#fff" />
                      </TouchableOpacity>
                    </View>
                    <TouchableOpacity onPress={() => onRemove(item.food_id)} style={{ marginLeft: 10 }}>
                      <Icon name="trash" size={20} color="#e53935" />
                    </TouchableOpacity>
                  </View>
                )}
                style={{ maxHeight: 260 }}
              />
              <View style={styles.footer}>
                <Text style={styles.totalText}>Tổng Tiền: <Text style={{ color: '#fbc02d' }}>{total.toLocaleString()}đ</Text></Text>
                <TouchableOpacity 
                  style={styles.checkoutBtn} 
                  onPress={onCheckout}
                >
                  <Text style={{ color: '#23232a', fontWeight: 'bold' }}>THANH TOÁN</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: '90%', backgroundColor: '#23232a', borderRadius: 16, padding: 16, elevation: 10 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  title: { color: '#fbc02d', fontSize: 18, fontWeight: 'bold' },
  emptyBox: { alignItems: 'center', padding: 32 },
  emptyText: { color: '#aaa', marginTop: 10, fontSize: 15 },
  itemRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  itemImg: { width: 48, height: 48, borderRadius: 8, marginRight: 10 },
  itemName: { color: '#fff', fontWeight: 'bold', fontSize: 15 },
  itemPrice: { color: '#fbc02d', fontSize: 14, marginTop: 2 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 18 },
  totalText: { color: '#fff', fontSize: 16 },
  checkoutBtn: { backgroundColor: '#fbc02d', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 18 },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center', 
    marginLeft: 10
  },
  quantityBtn: {
    width: 22, 
    height: 22, 
    backgroundColor: '#fbc02d',
    borderRadius: 11, 
    justifyContent: 'center', 
    alignItems: 'center'
  },
  quantityText: {
    color: '#fff',
    marginHorizontal: 10,
    fontWeight: 'bold',
    fontSize: 16
  }
});

export default CartModal;