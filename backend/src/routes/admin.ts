import express from 'express';
import { checkAdminRole, getDashboardStats } from '../controllers/adminController';
import { authenticateJWT } from '../middleware/auth';
import { 
  getAllUsers, getUserById, createUser, updateUser, deleteUser, changeUserStatus 
} from '../controllers/adminUserController';
import {
  getAllOrders, getOrderDetails, updateOrderStatus, getOrderStats, searchOrders
} from '../controllers/adminOrderController';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import {
  getAllFoods, getFoodById, createFood, updateFood, deleteFood, 
  updateFoodStatus, getFoodCategories
} from '../controllers/adminFoodController';
import { v4 as uuidv4 } from 'uuid';
import * as adminCategoryController from '../controllers/adminCategoryController';
import * as adminContactController from '../controllers/adminContactController';
import * as adminBlogController from '../controllers/adminBlogController';
import * as adminReviewController from '../controllers/adminReviewController';
import * as adminReportController from '../controllers/adminReportController';

// Cấu hình Multer để upload ảnh món ăn
const foodStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../foods'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now().toString(16);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const foodUpload = multer({ 
  storage: foodStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Chỉ chấp nhận file hình ảnh'));
  }
});

// Sửa cấu hình multer
const categoryStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const categoryImagesDir = path.join(__dirname, '../../category_images');
    // Đảm bảo thư mục tồn tại
    if (!fs.existsSync(categoryImagesDir)) {
      fs.mkdirSync(categoryImagesDir, { recursive: true });
    }
    cb(null, categoryImagesDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = `${Date.now()}-${uuidv4()}`;
    const ext = path.extname(file.originalname);
    cb(null, uniqueName + ext);
  },
});

const categoryUpload = multer({
  storage: categoryStorage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Cấu hình Multer để upload ảnh blog
const blogStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    const blogImagesDir = path.join(__dirname, '../../blogs');
    // Đảm bảo thư mục tồn tại
    if (!fs.existsSync(blogImagesDir)) {
      fs.mkdirSync(blogImagesDir, { recursive: true });
    }
    cb(null, blogImagesDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueName + ext);
  },
});

const blogUpload = multer({
  storage: blogStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: function (req, file, cb) {
    // Chỉ chấp nhận các file ảnh
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file hình ảnh'));
    }
  }
});

const router = express.Router();

// Middleware xác thực và kiểm tra quyền admin cho tất cả các routes
router.use(authenticateJWT, checkAdminRole);

// Dashboard Stats
router.get('/dashboard', getDashboardStats);

// User Management
router.get('/users', getAllUsers);
router.get('/users/:userId', getUserById);
router.post('/users', createUser);
router.put('/users/:userId', updateUser);
router.delete('/users/:userId', deleteUser);
router.patch('/users/:userId/status', changeUserStatus);

// Order Management
router.get('/orders', getAllOrders);
router.get('/orders/:orderId', getOrderDetails);
router.put('/orders/:orderId/status', updateOrderStatus);
router.get('/order-stats', getOrderStats);
router.get('/search-orders', searchOrders);

// Food Management
router.get('/foods', authenticateJWT, checkAdminRole, getAllFoods);
router.get('/food-categories', authenticateJWT, checkAdminRole, getFoodCategories);
router.get('/foods/:foodId', authenticateJWT, checkAdminRole, getFoodById);
router.post('/foods', authenticateJWT, checkAdminRole, foodUpload.single('image'), createFood);
router.put('/foods/:foodId', authenticateJWT, checkAdminRole, foodUpload.single('image'), updateFood);
router.delete('/foods/:foodId', authenticateJWT, checkAdminRole, deleteFood);
router.patch('/foods/:foodId/status', authenticateJWT, checkAdminRole, updateFoodStatus);

// Category Management
router.get('/categories', authenticateJWT, checkAdminRole, adminCategoryController.getAllCategories);
router.get('/categories/search', authenticateJWT, checkAdminRole, adminCategoryController.searchCategories);
router.get('/categories/:categoryId', authenticateJWT, checkAdminRole, adminCategoryController.getCategoryById);
router.post('/categories', authenticateJWT, checkAdminRole, categoryUpload.single('image'), adminCategoryController.createCategory);
router.put('/categories/:categoryId', authenticateJWT, checkAdminRole, categoryUpload.single('image'), adminCategoryController.updateCategory);
router.delete('/categories/:categoryId', authenticateJWT, checkAdminRole, adminCategoryController.deleteCategory);

// Contact Management
router.get('/contacts', authenticateJWT, checkAdminRole, adminContactController.getAllContacts);
router.get('/contacts/:contactId', authenticateJWT, checkAdminRole, adminContactController.getContactById);
router.put('/contacts/:contactId/status', authenticateJWT, checkAdminRole, adminContactController.updateContactStatus);
router.delete('/contacts/:contactId', authenticateJWT, checkAdminRole, adminContactController.deleteContact);

// Review Management
router.get('/reviews', authenticateJWT, checkAdminRole, adminReviewController.getAllReviews);
router.get('/reviews/:reviewId', authenticateJWT, checkAdminRole, adminReviewController.getReviewById);
router.delete('/reviews/:reviewId', authenticateJWT, checkAdminRole, adminReviewController.deleteReview);

// Blog Management
router.get('/blogs', authenticateJWT, checkAdminRole, adminBlogController.getAllBlogs);
router.get('/blogs/:blogId', authenticateJWT, checkAdminRole, adminBlogController.getBlogById);
router.post('/blogs', authenticateJWT, checkAdminRole, blogUpload.single('image'), adminBlogController.createBlog);
router.put('/blogs/:blogId', authenticateJWT, checkAdminRole, blogUpload.single('image'), adminBlogController.updateBlog);
router.delete('/blogs/:blogId', authenticateJWT, checkAdminRole, adminBlogController.deleteBlog);
router.put('/blogs/:blogId/status', authenticateJWT, checkAdminRole, adminBlogController.updateBlogStatus);

// Report Management
router.get('/reports/overview', authenticateJWT, checkAdminRole, adminReportController.getOverviewStats);
router.get('/reports/revenue', authenticateJWT, checkAdminRole, adminReportController.getRevenueStats);
router.get('/reports/products', authenticateJWT, checkAdminRole, adminReportController.getProductStats);
router.get('/reports/customers', authenticateJWT, checkAdminRole, adminReportController.getCustomerStats);
router.get('/reports/export', authenticateJWT, checkAdminRole, adminReportController.exportReportData);

export default router;