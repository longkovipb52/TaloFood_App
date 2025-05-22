import React from 'react';
import { ScrollView, View, Text, Image, StyleSheet, Dimensions } from 'react-native';
import MainLayout from '../components/MainLayout'; // import layout
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome';

const { width } = Dimensions.get('window');

const AboutScreen = ({ navigation }: any) => {
  return (
    
      <ScrollView contentContainerStyle={{ padding: 18 }}>
        <View style={styles.headerBox}>
          <Image source={require('../assets/logo.png')} style={styles.logo} />
          <Text style={styles.title}>TaloFood</Text>
          <Text style={styles.slogan}>Hương vị nhanh, trải nghiệm đậm đà</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Icon name="cutlery" size={18} color="#fbc02d" /> Sứ mệnh của chúng tôi
          </Text>
          <Text style={styles.sectionText}>
            TaloFood mang đến những món ăn nhanh thơm ngon, tiện lợi, chất lượng hàng đầu với dịch vụ tận tâm, giúp bạn tiết kiệm thời gian mà vẫn tận hưởng hương vị tuyệt vời mỗi ngày.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Icon name="star" size={18} color="#fbc02d" /> Giá trị cốt lõi
          </Text>
          <View style={styles.valueRow}>
            <Icon name="check-circle" size={20} color="#fbc02d" style={styles.valueIcon} />
            <Text style={styles.valueText}>Chất lượng & An toàn thực phẩm</Text>
          </View>
          <View style={styles.valueRow}>
            <Icon name="check-circle" size={20} color="#fbc02d" style={styles.valueIcon} />
            <Text style={styles.valueText}>Phục vụ nhanh chóng, chuyên nghiệp</Text>
          </View>
          <View style={styles.valueRow}>
            <Icon name="check-circle" size={20} color="#fbc02d" style={styles.valueIcon} />
            <Text style={styles.valueText}>Đổi mới & sáng tạo thực đơn</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Icon name="users" size={18} color="#fbc02d" /> Đội ngũ của chúng tôi
          </Text>
          <Text style={styles.sectionText}>
            Đội ngũ đầu bếp và nhân viên TaloFood luôn tận tâm, sáng tạo và không ngừng học hỏi để mang đến trải nghiệm tốt nhất cho khách hàng.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            <Icon name="phone" size={18} color="#fbc02d" /> Liên hệ
          </Text>
          <Text style={styles.sectionText}>
            <Icon name="map-marker" size={15} color="#fbc02d" /> 123 Đường Ẩm Thực, Quận 1, TP.HCM{'\n'}
            <Icon name="envelope" size={15} color="#fbc02d" /> support@talofood.vn{'\n'}
            <Icon name="phone" size={15} color="#fbc02d" /> 0123 456 789
          </Text>
        </View>
      </ScrollView>
    
  );
};

const styles = StyleSheet.create({
  headerBox: {
    alignItems: 'center',
    marginBottom: 18,
  },
  logo: {
    width: width * 0.32,
    height: width * 0.32,
    borderRadius: width * 0.16,
    marginBottom: 10,
    borderWidth: 3,
    borderColor: '#fbc02d',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fbc02d',
    letterSpacing: 2,
    marginBottom: 4,
  },
  slogan: {
    color: '#fff',
    fontSize: 15,
    fontStyle: 'italic',
    marginBottom: 8,
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#23232a',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 5,
  },
  sectionTitle: {
    color: '#fbc02d',
    fontWeight: 'bold',
    fontSize: 17,
    marginBottom: 8,
    letterSpacing: 1,
  },
  sectionText: {
    color: '#eee',
    fontSize: 14,
    lineHeight: 22,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  valueIcon: {
    marginRight: 8,
  },
  valueText: {
    color: '#eee',
    fontSize: 14,
  },
});

export default AboutScreen;