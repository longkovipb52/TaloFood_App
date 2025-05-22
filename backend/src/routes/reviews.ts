import express from 'express';
import { addReview, getFoodReviews, getUserReviews, checkUserReview, deleteReview } from '../controllers/reviewController';

const router = express.Router();

router.post('/add', addReview);
router.get('/food/:foodId', getFoodReviews);
router.get('/user/:userId', getUserReviews);
router.get('/check/:userId/:foodId/:billId', checkUserReview);
router.delete('/:reviewId', deleteReview); // Thêm route mới cho việc xóa đánh giá

export default router;