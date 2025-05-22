import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, Dimensions, Image, Animated, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import { useCart } from '../hooks/useCart';
import FoodDetailModal from '../components/FoodDetailModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import MainLayout from '../components/MainLayout';

const { width } = Dimensions.get('window');
const API_URL = 'http://192.168.1.13:5000/api/menu';

const SORT_OPTIONS = [
  { label: 'Sắp Xếp Mặc Định', icon: 'diamond', value: 'default' },
  { label: 'Đánh Giá: Cao Nhất', icon: 'star', value: 'rating_desc' },
  { label: 'Đánh Giá: Thấp Nhất', icon: 'star-o', value: 'rating_asc' },
  { label: 'Giá: Thấp Đến Cao', icon: 'sort-amount-asc', value: 'price_asc' },
  { label: 'Giá: Cao Đến Thấp', icon: 'sort-amount-desc', value: 'price_desc' },
  { label: 'Tên: A-Z', icon: 'sort-alpha-asc', value: 'name_asc' },
  { label: 'Tên: Z-A', icon: 'sort-alpha-desc', value: 'name_desc' },
];

const MenuScreen = ({ navigation, route }: any) => {
  const { handleAddToCart } = useCart();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sort, setSort] = useState('default');
  const [showSort, setShowSort] = useState(false);
  const [foods, setFoods] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const scale = useState(new Animated.Value(1))[0];

  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const isCategoryFromMenu = !!route.params?.category;

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        setFoods(data.foods);
        const cats = Array.from(new Set(data.foods.map((f: any) => f.category)));
        setCategories(['Tất Cả', ...cats]);
      });
  }, []);

  useEffect(() => {
    if (route.params?.category) {
      setSelectedCategory(route.params.category);
    } else {
      setSelectedCategory(''); // Reset về mặc định khi không có params
    }
  }, [route.params?.category]);

  const filteredFoods = foods
    .filter(f =>
      (isCategoryFromMenu
        ? f.category.toLowerCase() === selectedCategory.toLowerCase()
        : selectedCategory === '' || selectedCategory === 'Tất Cả' || f.category.toLowerCase() === selectedCategory.toLowerCase()
      ) &&
      f.food_name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      switch (sort) {
        case 'rating_desc': return b.average_rating - a.average_rating;
        case 'rating_asc': return a.average_rating - b.average_rating;
        case 'price_asc': return a.new_price - b.new_price;
        case 'price_desc': return b.new_price - a.new_price;
        case 'name_asc': return a.food_name.localeCompare(b.food_name);
        case 'name_desc': return b.food_name.localeCompare(a.food_name);
        default: return 0;
      }
    });

  const handleFoodPress = (food: any) => {
    setSelectedFood(food);
    setModalVisible(true);
  };

  return (
    <MainLayout navigation={navigation}>
      <View style={{ flex: 1, backgroundColor: '#171717' }}>
        <ScrollView 
          stickyHeaderIndices={[0]} 
          contentContainerStyle={{ flexGrow: 1 }}
        >
          <View style={styles.headerContainer}>
            {/* Tạo container cho thanh tìm kiếm và nút sắp xếp */}
            <View style={styles.searchSortRow}>
              <TextInput
                style={styles.searchInput}
                placeholder="Tìm món ăn..."
                placeholderTextColor="#888"
                value={search}
                onChangeText={setSearch}
              />
              <TouchableOpacity style={styles.sortBtn} onPress={() => setShowSort(!showSort)}>
                <Icon name={SORT_OPTIONS.find(o => o.value === sort)?.icon || 'diamond'} size={18} color="#fbc02d" />
                <Text style={styles.sortText} numberOfLines={1} ellipsizeMode="tail">{SORT_OPTIONS.find(o => o.value === sort)?.label}</Text>
                <Icon name={showSort ? 'angle-up' : 'angle-down'} size={16} color="#fff" />
              </TouchableOpacity>
            </View>
            
            {!isCategoryFromMenu && (
              <View style={styles.categoryRow}>
                {categories.map(cat => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryBtn, selectedCategory === cat && styles.categoryBtnActive]}
                    onPress={() => setSelectedCategory(cat)}
                  >
                    <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' }}>
            {filteredFoods.map(item => (
              <TouchableOpacity 
                key={item.food_id.toString()}
                style={styles.foodCard}
                onPress={() => handleFoodPress(item)}
              >
                <View style={styles.foodImageWrapper}>
                  <Image source={{ uri: item.image_url }} style={styles.foodImage} />
                </View>
                <View style={styles.foodInfoBox}>
                  <View style={styles.foodTypeBadge}>
                    <Text style={styles.foodTypeText}>{item.category}</Text>
                  </View>
                  <View style={styles.nameContainer}>
                    <Text style={styles.foodName} numberOfLines={2} ellipsizeMode="tail">
                      {item.food_name}
                    </Text>
                  </View>
                  <View style={styles.ratingRow}>
                    {[1,2,3,4,5].map(i => (
                      <Icon key={i} name={i <= Math.round(item.average_rating || 0) ? 'star' : 'star-o'} size={16} color="#fbc02d" />
                    ))}
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={styles.foodPrice}>{item.new_price.toLocaleString()}đ</Text>
                    {item.price > item.new_price && (
                      <>
                        <Text style={styles.oldPrice}>{item.price.toLocaleString()}đ</Text>
                        <Text style={styles.discountBadge}>
                          {Math.round((item.price - item.new_price) / item.price * 100)}%
                        </Text>
                      </>
                    )}
                  </View>
                </View>
                <Animated.View style={{ transform: [{ scale }] }}>
                  <TouchableOpacity
                    style={styles.addCartBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      Animated.sequence([
                        Animated.timing(scale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
                        Animated.timing(scale, { toValue: 1, duration: 100, useNativeDriver: true })
                      ]).start();
                      handleAddToCart(item);
                    }}
                  >
                    <Icon name="shopping-cart" size={18} color="#23232a" />
                    <Text style={styles.addCartText}>Thêm vào giỏ</Text>
                  </TouchableOpacity>
                </Animated.View>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        
        {showSort && (
          <View style={styles.sortDropdown}>
            {SORT_OPTIONS.map(opt => (
              <TouchableOpacity key={opt.value} style={styles.sortOption} onPress={() => { setSort(opt.value); setShowSort(false); }}>
                <Icon name={opt.icon} size={16} color="#fbc02d" style={{ marginRight: 8 }} />
                <Text style={{ color: '#fff' }}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        <FoodDetailModal
          visible={modalVisible}
          food={selectedFood}
          onClose={() => setModalVisible(false)}
        />
      </View>
    </MainLayout>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: '#171717',
    paddingHorizontal: 8,
    paddingVertical: 8,
    zIndex: 10,
    marginBottom: 6,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 10,
    zIndex: 10,
  },
  searchSortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#23232a',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#fff',
    fontSize: 15,
    height: 40,
    marginRight: 8,
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#23232a',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    height: 40,
    minWidth: 150,
    maxWidth: 170,
  },
  sortText: {
    color: '#fff',
    marginLeft: 6,
    marginRight: 4,
    fontSize: 14,
    flex: 1,
  },
  sortDropdown: {
    position: 'absolute',
    top: 55,
    right: 10,
    backgroundColor: '#23232a',
    borderRadius: 10,
    padding: 6,
    elevation: 6,
    zIndex: 100,
    minWidth: 180,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#333',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 10,
    flexWrap: 'wrap',
  },
  categoryBtn: {
    backgroundColor: '#23232a',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 7,
    marginHorizontal: 5,
    marginBottom: 6,
  },
  categoryBtnActive: {
    backgroundColor: '#fbc02d',
  },
  categoryText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  categoryTextActive: {
    color: '#23232a',
  },
  foodCard: {
    backgroundColor: '#23232a',
    borderRadius: 14,
    margin: 8,
    padding: 12,
    width: width / 2 - 16,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 5,
  },
  foodImageWrapper: { 
    alignItems: 'center', 
    position: 'relative', 
    width: '100%', 
    marginBottom: 10 
  },
  foodImage: { 
    width: 120,
    height: 90,
    borderRadius: 8, 
    marginBottom: 8 
  },
  foodInfoBox: { alignItems: 'center' },
  foodTypeBadge: { backgroundColor: '#444', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginBottom: 4 },
  foodTypeText: { color: '#fbc02d', fontSize: 12, fontWeight: 'bold' },
  nameContainer: {
    height: 44,
    justifyContent: 'center',
    marginVertical: 4,
    width: '100%'
  },
  foodName: { 
    fontWeight: 'bold', 
    fontSize: 16,
    marginVertical: 4,
    color: '#fff', 
    textAlign: 'center',
    maxWidth: 160
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 2, flexWrap: 'wrap', maxWidth: 130 },
  foodPrice: { color: '#fbc02d', fontWeight: 'bold', fontSize: 15 },
  oldPrice: { color: '#aaa', fontSize: 12, textDecorationLine: 'line-through', marginLeft: 6 },
  discountBadge: { backgroundColor: '#fbc02d', color: '#23232a', fontWeight: 'bold', fontSize: 11, borderRadius: 6, paddingHorizontal: 5, marginLeft: 6 },
  foodDesc: { color: '#eee', fontSize: 13, marginTop: 4 },
  addCartBtn: {
    flexDirection: 'row',
    backgroundColor: '#fbc02d',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    width: '100%',
  },
  addCartBtnNew: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: '#e53935',
    borderRadius: 22,
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    zIndex: 10,
    borderWidth: 2,
    borderColor: '#fff',
  },
  addCartBtnCorner: {
    position: 'absolute',
    bottom: 10,
    right: 5,
    backgroundColor: 'rgba(251, 192, 45, 0.9)',
    borderRadius: 15,
    width: 30, 
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  addCartText: {
    color: '#23232a',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 13,
  },
});

export default MenuScreen;