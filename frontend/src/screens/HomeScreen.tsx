import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Dimensions } from 'react-native';
import Swiper from 'react-native-swiper';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome';
import SideMenu from '../components/SideMenu';
import MainLayout from '../components/MainLayout';
import { useCart } from '../context/CartProvider';
import FoodDetailModal from '../components/FoodDetailModal';

const { width } = Dimensions.get('window');
const API_URL = 'http://192.168.1.13:5000/api/home';

const HomeScreen = ({ navigation }: any) => {
  // Sử dụng hook useCart một cách an toàn
  const { handleAddToCart } = useCart();
  
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);

  const [selectedFood, setSelectedFood] = useState<any>(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => {
        setCategories(data.categories);
        setBestSellers(data.bestSellers);
        setReviews(data.reviews);
        setBlogs(data.blogs);
        setLoading(false);
      });
  }, []);

  const handleFoodPress = (food: any) => {
    if (!food) return; // Kiểm tra dữ liệu trước khi xử lý
    
    // Đảm bảo dữ liệu đúng định dạng
    const processedFood = {
      ...food,
      food_id: food.id || food.food_id,
      food_name: food.name || food.food_name,
      average_rating: typeof food.average_rating === 'number' ? food.average_rating : 0,
      image_url: food.image_url?.startsWith('http')
        ? food.image_url
        : `http://192.168.1.13:5000/foods/${food.image_url}`
    };
    
    setSelectedFood(processedFood);
    setModalVisible(true);
  };

  if (loading) return <ActivityIndicator size="large" color="#fbc02d" style={{ flex: 1, marginTop: 100 }} />;

  return (
    <MainLayout navigation={navigation}>
      <ScrollView>
        {/* Banner */}
        <View style={styles.bannerSection}>
          <Swiper height={220} autoplay dotColor="#444" activeDotColor="#fbc02d">
            <Image source={require('../assets/banner1.jpg')} style={styles.banner} />
            <Image source={require('../assets/banner2.jpg')} style={styles.banner} />
          </Swiper>
          <View style={styles.bannerOverlay}>
            <Text style={styles.bannerTitle}>ĐÓI BỤNG? ĐỪNG LO, ĐÃ CÓ <Text style={{ color: '#fbc02d' }}>TALOFOOD!</Text></Text>
            <Text style={styles.bannerDesc}>Đồ ăn nhanh, chuẩn vị ngon, phục vụ tốc hành — bạn chỉ việc thưởng thức!</Text>
            <TouchableOpacity style={styles.bannerBtn}>
              <Text style={styles.bannerBtnText}>Đặt Món Ngay</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* About */}
        <View style={styles.section}>
          <Text style={styles.heading}><Text style={{ color: '#fbc02d' }}>VỀ</Text> CHÚNG TÔI</Text>
          <View style={styles.aboutRow}>
            <Image source={require('../assets/about.jpg')} style={styles.aboutImg} />
            <View style={{ flex: 1 }}>
              <Text style={styles.aboutTitle}>TaloFood – Hương Vị Nhanh, Trải Nghiệm Đậm Đà</Text>
              <Text style={styles.aboutDesc}>TaloFood là thương hiệu đồ ăn nhanh tiên phong, mang đến những món ăn thơm ngon, tiện lợi và chất lượng hàng đầu.</Text>
              <TouchableOpacity style={styles.bannerBtn} onPress={() => navigation.navigate('About')}>
                <Text style={styles.bannerBtnText}>Xem Thêm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.section}>
          <Text style={styles.heading}>THỰC ĐƠN <Text style={{ color: '#fbc02d' }}>CỦA CHÚNG TÔI</Text></Text>
          {categories.map((cat: any) => (
            <View key={cat.foodcategory_id} style={styles.categorySection}>
              <Text style={styles.categoryTitle}>{cat.foodcategory_name}</Text>
              <FlatList
                data={cat.foods}
                horizontal
                showsHorizontalScrollIndicator={false}
                keyExtractor={item => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity 
                    style={styles.foodCard}
                    onPress={() => handleFoodPress({
                      ...item,
                      food_id: item.id || item.food_id,
                      food_name: item.name || item.food_name,
                      category: item.category_name || 'ĐỒ ĂN',
                      image_url: item.image_url,
                    })}
                  >
                    <View style={styles.foodImageWrapper}>
                      <Image
                        source={{
                          uri: item.image_url.startsWith('http')
                            ? item.image_url
                            : `http://192.168.1.13:5000/foods/${item.image_url}`
                        }}
                        style={styles.foodImage}
                      />
                    </View>
                    {item.sold && (
                      <View style={styles.soldCountBadge}>
                        <Text style={styles.soldCountText}>{item.sold} Đã Bán</Text>
                      </View>
                    )}
                    <View style={styles.foodInfoBox}>
                      <View style={styles.foodTypeBadge}>
                        <Text style={styles.foodTypeText}>{item.category_name || 'ĐỒ ĂN'}</Text>
                      </View>
                      <Text style={styles.foodName}>{item.name}</Text>
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
                    <TouchableOpacity
                      style={styles.addCartBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleAddToCart({
                          food_id: item.id || item.food_id,
                          food_name: item.name || item.food_name,
                          new_price: item.new_price,
                          image_url: item.image_url,
                        });
                      }}
                    >
                      <Icon name="shopping-cart" size={18} color="#23232a" />
                      <Text style={styles.addCartText}>Thêm vào giỏ</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                )}
              />
            </View>
          ))}
        </View>

        {/* Best Sellers */}
        <View style={styles.section}>
          <Text style={styles.heading}>SẢN PHẨM <Text style={{ color: '#fbc02d' }}>BÁN CHẠY</Text></Text>
          <FlatList
            data={bestSellers}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.food_id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.foodCard}
                onPress={() => handleFoodPress({
                  ...item,
                  food_id: item.id || item.food_id,
                  food_name: item.name || item.food_name,
                  image_url: item.image_url,
                })}
              >
                <View style={styles.foodImageWrapper}>
                  <Image source={{ uri: item.image_url }} style={styles.foodImage} />
                </View>
                {item.total_sold && (
                  <View style={styles.soldCountBadge}>
                    <Text style={styles.soldCountText}>{item.total_sold} Đã Bán</Text>
                  </View>
                )}
                <View style={styles.foodInfoBox}>
                  <View style={styles.foodTypeBadge}>
                    <Text style={styles.foodTypeText}>{item.category_name || 'ĐỒ ĂN'}</Text>
                  </View>
                  <Text style={styles.foodName}>{item.food_name}</Text>
                  <View style={styles.ratingRow}>
                    {[1,2,3,4,5].map(i => (
                      <Icon key={i} name={i <= Math.round(item.average_rating || 0) ? 'star' : 'star-o'} size={16} color="#fbc02d" />
                    ))}
                    <Text style={styles.reviewCount}>({item.review_count})</Text>
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
                  <TouchableOpacity
                    style={styles.addCartBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleAddToCart({
                        food_id: item.id || item.food_id,
                        food_name: item.name || item.food_name,
                        new_price: item.new_price,
                        image_url: item.image_url,
                      });
                    }}
                  >
                    <Icon name="shopping-cart" size={18} color="#23232a" />
                    <Text style={styles.addCartText}>Thêm vào giỏ</Text>
                  </TouchableOpacity>
                </View>
                <View style={styles.soldBadge}><Text style={{ color: '#fff', fontSize: 11 }}>Bán chạy</Text></View>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* Review */}
        <View style={styles.section}>
          <Text style={styles.heading}>ĐÁNH GIÁ <Text style={{ color: '#fbc02d' }}>NỔI BẬT</Text></Text>
          <FlatList
            data={reviews}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <View style={styles.reviewCard}>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                  <Icon name="user-circle" size={38} color="#fbc02d" style={{ marginRight: 10 }} />
                  <View>
                    <Text style={styles.reviewUser}>{item.username}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                      {[1,2,3,4,5].map(i => (
                        <Icon
                          key={i}
                          name={i <= (item.star_rating || 0) ? 'star' : 'star-o'}
                          size={15}
                          color="#fbc02d"
                        />
                      ))}
                    </View>
                  </View>
                </View>
                <Text style={styles.reviewComment} numberOfLines={3}>
                  "{item.comment}"
                </Text>
                <Text style={styles.reviewDate}>
                  {item.created_at && new Date(item.created_at).toLocaleDateString()}
                </Text>
              </View>
            )}
          />
        </View>

        {/* Blog */}
        <View style={styles.section}>
          <Text style={styles.heading}>BÀI VIẾT <Text style={{ color: '#fbc02d' }}>MỚI</Text></Text>
          <FlatList
            data={blogs}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={item => item.blog_id.toString()}
            renderItem={({ item }) => (
              <TouchableOpacity style={styles.blogCard}>
                <Image source={{ uri: item.image_url }} style={styles.blogImage} />
                <Text style={styles.blogTitle}>{item.title}</Text>
                <Text style={styles.blogAuthor}>bởi {item.username} / {item.created_at && new Date(item.created_at).toLocaleDateString()}</Text>
                <Text style={styles.blogDesc} numberOfLines={2}>{item.content}</Text>
                <TouchableOpacity style={styles.blogBtn}>
                  <Text style={styles.blogBtnText}>Xem Thêm</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            )}
          />
        </View>

        <FoodDetailModal
          visible={modalVisible}
          food={selectedFood}
          onClose={() => setModalVisible(false)}
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </MainLayout>
  );
};

const styles = StyleSheet.create({
  bannerSection: { position: 'relative', marginBottom: 12 },
  banner: { width: width, height: 220 },
  bannerOverlay: { position: 'absolute', top: 0, left: 0, width: '100%', height: 220, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(24,24,28,0.45)' },
  bannerTitle: { fontSize: 26, fontWeight: 'bold', color: '#fff', textAlign: 'center', marginBottom: 8, textShadowColor: '#000', textShadowOffset: { width: 1, height: 1 }, textShadowRadius: 4 },
  bannerDesc: { color: '#eee', fontSize: 15, marginBottom: 12, textAlign: 'center' },
  bannerBtn: { backgroundColor: '#fbc02d', borderRadius: 8, paddingHorizontal: 24, paddingVertical: 8, marginTop: 4 },
  bannerBtnText: { color: '#18181c', fontWeight: 'bold', fontSize: 16 },
  section: { marginBottom: 18, paddingHorizontal: 10 },
  heading: { fontSize: 22, fontWeight: 'bold', marginVertical: 16, color: '#fff', letterSpacing: 1 },
  aboutRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#23232a', borderRadius: 14, padding: 12, marginBottom: 8 },
  aboutImg: { width: 90, height: 90, borderRadius: 12, marginRight: 14 },
  aboutTitle: { fontWeight: 'bold', fontSize: 16, color: '#fbc02d', marginBottom: 4 },
  aboutDesc: { color: '#eee', fontSize: 14, marginBottom: 6 },
  categorySection: { marginBottom: 10,textAlign: 'center' },
  categoryTitle: { fontSize: 17, fontWeight: 'bold', marginLeft: 6, marginBottom: 8, color: '#fbc02d',textAlign:'center' },
  foodCard: { 
    backgroundColor: '#23232a', 
    borderRadius: 14, 
    margin: 8, 
    padding: 12,  // Tăng padding
    width: 180,   // Tăng từ 150 lên 180
    alignItems: 'center', 
    elevation: 3, 
    shadowColor: '#000', 
    shadowOpacity: 0.15, 
    shadowRadius: 6 
  },
  foodImageWrapper: { alignItems: 'center' },
  foodImage: { 
    width: 120,  // Tăng từ 100 lên 120
    height: 90,  // Tăng từ 80 lên 90
    borderRadius: 8, 
    marginBottom: 8 
  },
  soldCountBadge: { 
    marginTop: 4, 
    backgroundColor: '#fbc02d', 
    borderRadius: 6, 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    alignSelf: 'center' 
  },
  soldCountText: { color: '#23232a', fontSize: 11, fontWeight: 'bold' },
  foodInfoBox: { alignItems: 'center' },
  foodTypeBadge: { backgroundColor: '#444', borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2, marginBottom: 4 },
  foodTypeText: { color: '#fbc02d', fontSize: 12, fontWeight: 'bold' },
  foodName: { 
    fontWeight: 'bold', 
    fontSize: 16,
    color: '#fff', 
    textAlign: 'center',
    height: 40,           // Thêm chiều cao cố định
    marginBottom: 8,
    maxWidth: 160,
    overflow: 'hidden'    // Ẩn phần text bị tràn
  },
  priceRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center',   // Thêm dòng này để canh giữa
    marginBottom: 2,
    flexWrap: 'wrap',
    maxWidth: 130,
  },
  foodPrice: { color: '#fbc02d', fontWeight: 'bold', fontSize: 15 },
  oldPrice: { color: '#aaa', fontSize: 12, textDecorationLine: 'line-through', marginLeft: 6 },
  discountBadge: { backgroundColor: '#fbc02d', color: '#23232a', fontWeight: 'bold', fontSize: 11, borderRadius: 6, paddingHorizontal: 5, marginLeft: 6 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  reviewCount: { fontSize: 12, color: '#fbc02d', marginLeft: 4 },
  soldBadge: { position: 'absolute', top: 8, right: 8, backgroundColor: '#bfa13b', borderRadius: 6, paddingHorizontal: 7, paddingVertical: 2 },
  reviewCard: {
    backgroundColor: '#23232a',
    borderRadius: 16,
    margin: 8,
    padding: 16,
    width: 240,
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 7,
    borderWidth: 1,
    borderColor: '#fbc02d22',
  },
  reviewUser: {
    fontWeight: 'bold',
    color: '#fbc02d',
    fontSize: 15,
  },
  reviewComment: {
    color: '#eee',
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 8,
    marginTop: 4,
  },
  reviewDate: {
    color: '#aaa',
    fontSize: 12,
    marginTop: 2,
    alignSelf: 'flex-end',
  },
  blogCard: { backgroundColor: '#23232a', borderRadius: 14, margin: 8, padding: 10, width: 240, elevation: 2, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 5 },
  blogImage: { width: 220, height: 110, borderRadius: 8 },
  blogTitle: { fontWeight: 'bold', fontSize: 15, marginTop: 6, color: '#fbc02d' },
  blogAuthor: { fontSize: 12, color: '#aaa', marginBottom: 2 },
  blogDesc: { color: '#eee', fontSize: 13, marginBottom: 6 },
  blogBtn: { backgroundColor: '#fbc02d', borderRadius: 8, paddingHorizontal: 16, paddingVertical: 6, alignSelf: 'flex-start' },
  blogBtnText: { color: '#23232a', fontWeight: 'bold', fontSize: 14 },
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
  addCartText: {
    color: '#23232a',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 13,
  },
});

export default HomeScreen;