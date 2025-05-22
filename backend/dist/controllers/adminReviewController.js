"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteReview = exports.getReviewById = exports.getAllReviews = void 0;
const db_1 = __importDefault(require("../config/db"));
// Lấy tất cả đánh giá (có tìm kiếm và lọc)
const getAllReviews = async (req, res) => {
    try {
        const searchQuery = req.query.q;
        const ratingFilter = req.query.rating;
        const foodFilter = req.query.food;
        let query = `
      SELECT r.review_id, r.star_rating, r.comment, r.created_at,
        a.username, a.account_id, a.profile_image,
        f.food_name, f.food_id, f.image as food_image
      FROM reviews r
      JOIN account a ON r.id_account = a.account_id
      JOIN food f ON r.id_food = f.food_id
    `;
        const params = [];
        // Thêm điều kiện tìm kiếm và lọc
        const conditions = [];
        if (searchQuery) {
            conditions.push("(a.username LIKE ? OR r.comment LIKE ? OR f.food_name LIKE ?)");
            params.push(`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`);
        }
        if (ratingFilter && ratingFilter !== 'all') {
            conditions.push("r.star_rating = ?");
            params.push(ratingFilter);
        }
        if (foodFilter && foodFilter !== 'all') {
            conditions.push("f.food_id = ?");
            params.push(foodFilter);
        }
        if (conditions.length > 0) {
            query += " WHERE " + conditions.join(" AND ");
        }
        // Sắp xếp theo thời gian mới nhất
        query += " ORDER BY r.created_at DESC";
        const [reviews] = await db_1.default.query(query, params);
        // Format lại dữ liệu để hiển thị
        const formattedReviews = reviews.map((review) => ({
            ...review,
            created_at: new Date(review.created_at).toLocaleString('vi-VN'),
            profile_image: review.profile_image
                ? `http://192.168.1.13:5000/profile_images/${review.profile_image}`
                : null,
            food_image: review.food_image
                ? `http://192.168.1.13:5000/foods/${review.food_image}`
                : null
        }));
        // Lấy danh sách món ăn cho dropdown filter
        const [foods] = await db_1.default.query(`SELECT food_id, food_name FROM food ORDER BY food_name`);
        res.json({
            reviews: formattedReviews,
            foods,
            count: formattedReviews.length
        });
    }
    catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({
            message: 'Lỗi khi lấy danh sách đánh giá',
            error: error.message
        });
    }
};
exports.getAllReviews = getAllReviews;
// Lấy chi tiết một đánh giá
const getReviewById = async (req, res) => {
    const reviewId = req.params.reviewId;
    try {
        const [reviews] = await db_1.default.query(`SELECT r.review_id, r.star_rating, r.comment, r.created_at,
        a.username, a.account_id, a.profile_image, a.email, a.phone,
        f.food_name, f.food_id, f.image as food_image, f.price, f.new_price,
        b.bill_id, bi.billinfo_id
      FROM reviews r
      JOIN account a ON r.id_account = a.account_id
      JOIN food f ON r.id_food = f.food_id
      LEFT JOIN bill_info bi ON r.id_bill_info = bi.billinfo_id
      LEFT JOIN bill b ON bi.id_bill = b.bill_id
      WHERE r.review_id = ?`, [reviewId]);
        if (reviews.length === 0) {
            res.status(404).json({ message: 'Không tìm thấy đánh giá' });
            return;
        }
        // Format lại dữ liệu để hiển thị
        const review = {
            ...reviews[0],
            created_at: new Date(reviews[0].created_at).toLocaleString('vi-VN'),
            profile_image: reviews[0].profile_image
                ? `http://192.168.1.13:5000/profile_images/${reviews[0].profile_image}`
                : null,
            food_image: reviews[0].food_image
                ? `http://192.168.1.13:5000/foods/${reviews[0].food_image}`
                : null
        };
        res.json({ review });
    }
    catch (error) {
        console.error('Error fetching review details:', error);
        res.status(500).json({
            message: 'Lỗi khi lấy thông tin chi tiết đánh giá',
            error: error.message
        });
    }
};
exports.getReviewById = getReviewById;
// Xóa đánh giá
const deleteReview = async (req, res) => {
    const reviewId = req.params.reviewId;
    try {
        // Tìm thông tin đánh giá trước khi xóa để cập nhật rating
        const [reviews] = await db_1.default.query('SELECT id_food FROM reviews WHERE review_id = ?', [reviewId]);
        if (reviews.length === 0) {
            res.status(404).json({ message: 'Không tìm thấy đánh giá' });
            return;
        }
        const foodId = reviews[0].id_food;
        // Xóa đánh giá
        await db_1.default.query('DELETE FROM reviews WHERE review_id = ?', [reviewId]);
        // Cập nhật rating trung bình của món ăn
        const [averageRating] = await db_1.default.query('SELECT AVG(star_rating) as avg_rating FROM reviews WHERE id_food = ?', [foodId]);
        // Nếu còn đánh giá, cập nhật rating trung bình
        if (averageRating[0]?.avg_rating) {
            const roundedRating = Math.round(averageRating[0].avg_rating * 10) / 10;
            await db_1.default.query('UPDATE food SET average_rating = ? WHERE food_id = ?', [roundedRating, foodId]);
        }
        else {
            // Nếu không còn đánh giá nào, đặt rating về null
            await db_1.default.query('UPDATE food SET average_rating = NULL WHERE food_id = ?', [foodId]);
        }
        res.json({
            message: 'Đã xóa đánh giá thành công',
            foodId
        });
    }
    catch (error) {
        console.error('Error deleting review:', error);
        res.status(500).json({
            message: 'Lỗi khi xóa đánh giá',
            error: error.message
        });
    }
};
exports.deleteReview = deleteReview;
