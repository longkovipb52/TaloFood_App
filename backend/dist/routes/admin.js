"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const adminController_1 = require("../controllers/adminController");
const auth_1 = require("../middleware/auth");
const adminUserController_1 = require("../controllers/adminUserController");
const adminOrderController_1 = require("../controllers/adminOrderController");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const adminFoodController_1 = require("../controllers/adminFoodController");
// Cấu hình Multer để upload ảnh món ăn
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path_1.default.join(__dirname, '../../foods'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now().toString(16);
        cb(null, uniqueSuffix + path_1.default.extname(file.originalname));
    },
});
const upload = (0, multer_1.default)({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|gif/;
        const mimetype = filetypes.test(file.mimetype);
        const extname = filetypes.test(path_1.default.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb(new Error('Chỉ chấp nhận file hình ảnh'));
    }
});
const router = express_1.default.Router();
// Middleware xác thực và kiểm tra quyền admin cho tất cả các routes
router.use(auth_1.authenticateJWT, adminController_1.checkAdminRole);
// Dashboard Stats
router.get('/dashboard', adminController_1.getDashboardStats);
// User Management
router.get('/users', adminUserController_1.getAllUsers);
router.get('/users/:userId', adminUserController_1.getUserById);
router.post('/users', adminUserController_1.createUser);
router.put('/users/:userId', adminUserController_1.updateUser);
router.delete('/users/:userId', adminUserController_1.deleteUser);
router.patch('/users/:userId/status', adminUserController_1.changeUserStatus);
// Order Management
router.get('/orders', adminOrderController_1.getAllOrders);
router.get('/orders/:orderId', adminOrderController_1.getOrderDetails);
router.put('/orders/:orderId/status', adminOrderController_1.updateOrderStatus);
router.get('/order-stats', adminOrderController_1.getOrderStats);
router.get('/search-orders', adminOrderController_1.searchOrders);
// Food Management
router.get('/foods', auth_1.authenticateJWT, adminController_1.checkAdminRole, adminFoodController_1.getAllFoods);
router.get('/food-categories', auth_1.authenticateJWT, adminController_1.checkAdminRole, adminFoodController_1.getFoodCategories);
router.get('/foods/:foodId', auth_1.authenticateJWT, adminController_1.checkAdminRole, adminFoodController_1.getFoodById);
router.post('/foods', auth_1.authenticateJWT, adminController_1.checkAdminRole, upload.single('image'), adminFoodController_1.createFood);
router.put('/foods/:foodId', auth_1.authenticateJWT, adminController_1.checkAdminRole, upload.single('image'), adminFoodController_1.updateFood);
router.delete('/foods/:foodId', auth_1.authenticateJWT, adminController_1.checkAdminRole, adminFoodController_1.deleteFood);
router.patch('/foods/:foodId/status', auth_1.authenticateJWT, adminController_1.checkAdminRole, adminFoodController_1.updateFoodStatus);
exports.default = router;
