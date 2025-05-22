"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const reviewController_1 = require("../controllers/reviewController");
const router = express_1.default.Router();
router.post('/add', reviewController_1.addReview);
router.get('/food/:foodId', reviewController_1.getFoodReviews);
router.get('/user/:userId', reviewController_1.getUserReviews);
router.get('/check/:userId/:foodId/:billId', reviewController_1.checkUserReview);
router.delete('/:reviewId', reviewController_1.deleteReview); // Thêm route mới cho việc xóa đánh giá
exports.default = router;
