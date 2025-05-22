import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import authRoutes from './routes/auth';
import homeRoutes from './routes/home';
import menuRoutes from './routes/menu';
import userRoutes from './routes/user';
import orderRoutes from './routes/orders';
import reviewRoutes from './routes/reviews';
import contactRoutes from './routes/contact';
import blogRoutes from './routes/blogs';
import adminRoutes from './routes/admin'; // Thêm dòng này

const app = express();
app.use(cors());
app.use(express.json());

// Thư mục lưu trữ
const uploadDir = path.join(__dirname, '../profile_images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Đã tạo thư mục profile_images');
}

// Cấu hình static cho các thư mục tài nguyên
app.use('/foods', express.static(path.join(__dirname, '../foods')));
app.use('/blogs', express.static(path.join(__dirname, '../blogs')));
app.use('/profile_images', express.static(path.join(__dirname, '../profile_images')));

// Routes API
app.use('/api/auth', authRoutes);
app.use('/api/home', homeRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/user', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/blogs', blogRoutes);
app.use('/api/admin', adminRoutes); // Thêm route admin

const PORT = 5000;
app.listen(PORT, () => {
  console.log(`Máy chủ đang chạy tại cổng ${PORT}`);
});