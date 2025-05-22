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
import {
  getAllFoods, getFoodById, createFood, updateFood, deleteFood, 
  updateFoodStatus, getFoodCategories
} from '../controllers/adminFoodController';

// Cấu hình Multer để upload ảnh món ăn
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../../foods'));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now().toString(16);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ 
  storage: storage,
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
router.post('/foods', authenticateJWT, checkAdminRole, upload.single('image'), createFood);
router.put('/foods/:foodId', authenticateJWT, checkAdminRole, upload.single('image'), updateFood);
router.delete('/foods/:foodId', authenticateJWT, checkAdminRole, deleteFood);
router.patch('/foods/:foodId/status', authenticateJWT, checkAdminRole, updateFoodStatus);

export default router;