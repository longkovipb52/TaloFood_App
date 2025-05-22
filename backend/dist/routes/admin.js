"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const fs_1 = __importDefault(require("fs"));
const adminFoodController_1 = require("../controllers/adminFoodController");
const uuid_1 = require("uuid");
const adminCategoryController = __importStar(require("../controllers/adminCategoryController"));
const adminContactController = __importStar(require("../controllers/adminContactController"));
const adminBlogController = __importStar(require("../controllers/adminBlogController"));
const adminReviewController = __importStar(require("../controllers/adminReviewController"));
const adminReportController = __importStar(require("../controllers/adminReportController"));
// Cấu hình Multer để upload ảnh món ăn
const foodStorage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path_1.default.join(__dirname, '../../foods'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now().toString(16);
        cb(null, uniqueSuffix + path_1.default.extname(file.originalname));
    },
});
const foodUpload = (0, multer_1.default)({
    storage: foodStorage,
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
// Sửa cấu hình multer
const categoryStorage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        const categoryImagesDir = path_1.default.join(__dirname, '../../category_images');
        // Đảm bảo thư mục tồn tại
        if (!fs_1.default.existsSync(categoryImagesDir)) {
            fs_1.default.mkdirSync(categoryImagesDir, { recursive: true });
        }
        cb(null, categoryImagesDir);
    },
    filename: function (req, file, cb) {
        const uniqueName = `${Date.now()}-${(0, uuid_1.v4)()}`;
        const ext = path_1.default.extname(file.originalname);
        cb(null, uniqueName + ext);
    },
});
const categoryUpload = (0, multer_1.default)({
    storage: categoryStorage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});
// Cấu hình Multer để upload ảnh blog
const blogStorage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        const blogImagesDir = path_1.default.join(__dirname, '../../blogs');
        // Đảm bảo thư mục tồn tại
        if (!fs_1.default.existsSync(blogImagesDir)) {
            fs_1.default.mkdirSync(blogImagesDir, { recursive: true });
        }
        cb(null, blogImagesDir);
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, uniqueName + ext);
    },
});
const blogUpload = (0, multer_1.default)({
    storage: blogStorage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: function (req, file, cb) {
        // Chỉ chấp nhận các file ảnh
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Chỉ chấp nhận file hình ảnh'));
        }
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
router.post('/foods', auth_1.authenticateJWT, adminController_1.checkAdminRole, foodUpload.single('image'), adminFoodController_1.createFood);
router.put('/foods/:foodId', auth_1.authenticateJWT, adminController_1.checkAdminRole, foodUpload.single('image'), adminFoodController_1.updateFood);
router.delete('/foods/:foodId', auth_1.authenticateJWT, adminController_1.checkAdminRole, adminFoodController_1.deleteFood);
router.patch('/foods/:foodId/status', auth_1.authenticateJWT, adminController_1.checkAdminRole, adminFoodController_1.updateFoodStatus);
// Category Management
router.get('/categories', auth_1.authenticateJWT, adminController_1.checkAdminRole, adminCategoryController.getAllCategories);
router.get('/categories/search', auth_1.authenticateJWT, adminController_1.checkAdminRole, adminCategoryController.searchCategories);
router.get('/categories/:categoryId', auth_1.authenticateJWT, adminController_1.checkAdminRole, adminCategoryController.getCategoryById);
router.post('/categories', auth_1.authenticateJWT, adminController_1.checkAdminRole, categoryUpload.single('image'), adminCategoryController.createCategory);
router.put('/categories/:categoryId', auth_1.authenticateJWT, adminController_1.checkAdminRole, categoryUpload.single('image'), adminCategoryController.updateCategory);
router.delete('/categories/:categoryId', auth_1.authenticateJWT, adminController_1.checkAdminRole, adminCategoryController.deleteCategory);
// Contact Management
router.get('/contacts', auth_1.authenticateJWT, adminController_1.checkAdminRole, adminContactController.getAllContacts);
router.get('/contacts/:contactId', auth_1.authenticateJWT, adminController_1.checkAdminRole, adminContactController.getContactById);
router.put('/contacts/:contactId/status', auth_1.authenticateJWT, adminController_1.checkAdminRole, adminContactController.updateContactStatus);
router.delete('/contacts/:contactId', auth_1.authenticateJWT, adminController_1.checkAdminRole, adminContactController.deleteContact);
// Review Management
router.get('/reviews', auth_1.authenticateJWT, adminController_1.checkAdminRole, adminReviewController.getAllReviews);
router.get('/reviews/:reviewId', auth_1.authenticateJWT, adminController_1.checkAdminRole, adminReviewController.getReviewById);
router.delete('/reviews/:reviewId', auth_1.authenticateJWT, adminController_1.checkAdminRole, adminReviewController.deleteReview);
// Blog Management
router.get('/blogs', auth_1.authenticateJWT, adminController_1.checkAdminRole, adminBlogController.getAllBlogs);
router.get('/blogs/:blogId', auth_1.authenticateJWT, adminController_1.checkAdminRole, adminBlogController.getBlogById);
router.post('/blogs', auth_1.authenticateJWT, adminController_1.checkAdminRole, blogUpload.single('image'), adminBlogController.createBlog);
router.put('/blogs/:blogId', auth_1.authenticateJWT, adminController_1.checkAdminRole, blogUpload.single('image'), adminBlogController.updateBlog);
router.delete('/blogs/:blogId', auth_1.authenticateJWT, adminController_1.checkAdminRole, adminBlogController.deleteBlog);
router.put('/blogs/:blogId/status', auth_1.authenticateJWT, adminController_1.checkAdminRole, adminBlogController.updateBlogStatus);
// Report Management
router.get('/reports/overview', auth_1.authenticateJWT, adminController_1.checkAdminRole, adminReportController.getOverviewStats);
router.get('/reports/revenue', auth_1.authenticateJWT, adminController_1.checkAdminRole, adminReportController.getRevenueStats);
router.get('/reports/products', auth_1.authenticateJWT, adminController_1.checkAdminRole, adminReportController.getProductStats);
router.get('/reports/customers', auth_1.authenticateJWT, adminController_1.checkAdminRole, adminReportController.getCustomerStats);
router.get('/reports/export', auth_1.authenticateJWT, adminController_1.checkAdminRole, adminReportController.exportReportData);
exports.default = router;
