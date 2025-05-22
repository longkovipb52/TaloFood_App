"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteReview = exports.checkUserReview = exports.getUserReviews = exports.getFoodReviews = exports.addReview = void 0;
const db_1 = __importDefault(require("../config/db"));
const addReview = async (req, res) => {
    const { userId, foodId, billId, billInfoId, rating, comment, reviewId, isEdit } = req.body;
    // Sửa điều kiện kiểm tra để xử lý đúng với trường hợp sửa đánh giá
    if (!userId || !foodId || (!billId && !isEdit) || !rating || !comment) {
        res.status(400).json({ message: 'Thiếu thông tin đánh giá' });
        return;
    }
    try {
        // Nếu là chỉnh sửa đánh giá từ lịch sử (có reviewId)
        if (isEdit && reviewId) {
            const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
            await db_1.default.query('UPDATE reviews SET star_rating = ?, comment = ?, created_at = ? WHERE review_id = ? AND id_account = ?', [rating, comment, currentDate, reviewId, userId]);
            res.json({
                message: 'Đã cập nhật đánh giá thành công',
                updated: true
            });
            // Cập nhật điểm trung bình
            const [averageRating] = await db_1.default.query('SELECT AVG(star_rating) as avg_rating FROM reviews WHERE id_food = ?', [foodId]);
            if (averageRating[0]?.avg_rating) {
                const roundedRating = Math.round(averageRating[0].avg_rating * 10) / 10;
                await db_1.default.query('UPDATE food SET average_rating = ? WHERE food_id = ?', [roundedRating, foodId]);
            }
            return;
        }
        // Kiểm tra xem đơn hàng có phải của người dùng không và đã được giao chưa
        const [orderCheck] = await db_1.default.query(`SELECT b.bill_id, bi.billinfo_id
       FROM bill b 
       JOIN bill_info bi ON b.bill_id = bi.id_bill
       WHERE b.bill_id = ? AND b.id_account = ? AND bi.id_food = ? AND b.status = 'Đã giao'
       LIMIT 1`, [billId, userId, foodId]);
        if (orderCheck.length === 0) {
            res.status(403).json({ message: 'Bạn chỉ có thể đánh giá món ăn đã mua và nhận hàng thành công' });
            return;
        }
        // Lấy bill_info_id từ kết quả truy vấn
        const billInfoIdFromDB = orderCheck[0]?.billinfo_id || null;
        // Kiểm tra xem người dùng đã đánh giá món này trong đơn hàng này chưa
        const [existingReview] = await db_1.default.query('SELECT * FROM reviews WHERE id_account = ? AND id_food = ? AND id_bill_info = ?', [userId, foodId, billInfoIdFromDB]);
        const currentDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
        if (existingReview.length > 0) {
            // Cập nhật đánh giá hiện có cho món ăn trong đơn hàng này
            await db_1.default.query('UPDATE reviews SET star_rating = ?, comment = ?, created_at = ? WHERE id_account = ? AND id_food = ? AND id_bill_info = ?', [rating, comment, currentDate, userId, foodId, billInfoIdFromDB]);
            res.json({
                message: 'Đã cập nhật đánh giá thành công',
                updated: true
            });
        }
        else {
            // Tạo đánh giá mới cho món ăn trong đơn hàng này
            await db_1.default.query('INSERT INTO reviews (id_account, id_food, id_bill_info, star_rating, comment, created_at) VALUES (?, ?, ?, ?, ?, ?)', [userId, foodId, billInfoIdFromDB, rating, comment, currentDate]);
            res.json({
                message: 'Đã thêm đánh giá thành công',
                updated: false
            });
        }
        // Cập nhật điểm đánh giá trung bình cho món ăn
        const [averageRating] = await db_1.default.query('SELECT AVG(star_rating) as avg_rating FROM reviews WHERE id_food = ?', [foodId]);
        if (averageRating[0]?.avg_rating) {
            const roundedRating = Math.round(averageRating[0].avg_rating * 10) / 10; // Làm tròn 1 chữ số thập phân
            await db_1.default.query('UPDATE food SET average_rating = ? WHERE food_id = ?', [roundedRating, foodId]);
        }
    }
    catch (error) {
        console.error('Error adding review:', error);
        res.status(500).json({
            message: 'Lỗi khi thêm đánh giá',
            error: error.message
        });
    }
};
exports.addReview = addReview;
const getFoodReviews = async (req, res) => {
    const foodId = req.params.foodId;
    try {
        const [reviews] = await db_1.default.query(`SELECT r.review_id, r.star_rating, r.comment, r.created_at, 
              a.username, a.profile_image
       FROM reviews r
       JOIN account a ON r.id_account = a.account_id
       WHERE r.id_food = ?
       ORDER BY r.created_at DESC`, [foodId]);
        // Định dạng ngày tạo để dễ đọc
        const formattedReviews = reviews.map((review) => ({
            ...review,
            created_at: new Date(review.created_at).toLocaleString('vi-VN'),
            profile_image: review.profile_image
                ? `http://192.168.1.13:5000/profiles/${review.profile_image}`
                : null
        }));
        res.json({
            reviews: formattedReviews,
            count: formattedReviews.length
        });
    }
    catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({
            message: 'Lỗi khi lấy đánh giá',
            error: error.message
        });
    }
};
exports.getFoodReviews = getFoodReviews;
// Hàm bổ sung: Lấy tất cả đánh giá của người dùng
const getUserReviews = async (req, res) => {
    const userId = req.params.userId;
    try {
        const [reviews] = await db_1.default.query(`SELECT r.review_id, r.star_rating, r.comment, r.created_at, r.id_food,
              f.food_name, f.image, f.price, f.new_price
       FROM reviews r
       JOIN food f ON r.id_food = f.food_id
       WHERE r.id_account = ?
       ORDER BY r.created_at DESC`, [userId]);
        // Định dạng kết quả - cập nhật tham chiếu từ image_url sang image
        const formattedReviews = reviews.map((review) => ({
            ...review,
            created_at: new Date(review.created_at).toLocaleString('vi-VN'),
            image_url: review.image // Đổi từ review.image_url sang review.image
                ? review.image.startsWith('http')
                    ? review.image
                    : `http://192.168.1.13:5000/foods/${review.image}`
                : null
        }));
        res.json({
            reviews: formattedReviews,
            count: formattedReviews.length
        });
    }
    catch (error) {
        console.error('Error fetching user reviews:', error);
        res.status(500).json({
            message: 'Lỗi khi lấy đánh giá của người dùng',
            error: error.message
        });
    }
};
exports.getUserReviews = getUserReviews;
// Cập nhật API kiểm tra đánh giá để kiểm tra theo đơn hàng cụ thể
const checkUserReview = async (req, res) => {
    const { userId, foodId, billId } = req.params;
    try {
        // Truy vấn để lấy billinfo_id
        const [billInfo] = await db_1.default.query(`SELECT billinfo_id FROM bill_info 
       WHERE id_bill = ? AND id_food = ? AND id_account = ?`, [billId, foodId, userId]);
        if (billInfo.length === 0) {
            res.json({ exists: false });
            return;
        }
        const billInfoId = billInfo[0].billinfo_id;
        // Kiểm tra đánh giá cho món ăn trong đơn hàng cụ thể
        const [review] = await db_1.default.query('SELECT review_id, star_rating, comment FROM reviews WHERE id_account = ? AND id_food = ? AND id_bill_info = ?', [userId, foodId, billInfoId]);
        if (review && review.length > 0) {
            res.json({
                exists: true,
                review: review[0],
                billInfoId: billInfoId
            });
        }
        else {
            res.json({
                exists: false,
                billInfoId: billInfoId
            });
        }
    }
    catch (error) {
        console.error('Error checking user review:', error);
        res.status(500).json({
            message: 'Lỗi khi kiểm tra đánh giá',
            error: error.message
        });
    }
};
exports.checkUserReview = checkUserReview;
// Sửa hàm deleteReview
const deleteReview = async (req, res) => {
    const reviewId = req.params.reviewId;
    const { userId } = req.body;
    if (!userId) {
        res.status(400).json({ message: 'Thiếu thông tin người dùng' });
        return;
    }
    try {
        // Kiểm tra xem đánh giá có thuộc về người dùng không
        const [checkReview] = await db_1.default.query('SELECT * FROM reviews WHERE review_id = ? AND id_account = ?', [reviewId, userId]);
        if (checkReview.length === 0) {
            res.status(403).json({ message: 'Bạn không có quyền xóa đánh giá này' });
            return;
        }
        // Xóa đánh giá
        await db_1.default.query('DELETE FROM reviews WHERE review_id = ?', [reviewId]);
        res.json({
            message: 'Đã xóa đánh giá thành công'
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
