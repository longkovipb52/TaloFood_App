"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = exports.checkAdminRole = void 0;
const db_1 = __importDefault(require("../config/db"));
// Middleware để kiểm tra quyền admin
const checkAdminRole = async (req, res, next) => {
    try {
        // Lấy thông tin user từ middleware xác thực JWT
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'Không có thông tin xác thực' });
            return;
        }
        // Kiểm tra quyền admin
        const [rows] = await db_1.default.query('SELECT id_role FROM account WHERE account_id = ?', [userId]);
        if (rows.length === 0 || rows[0].id_role !== 1) {
            res.status(403).json({ message: 'Không có quyền truy cập' });
            return;
        }
        next();
    }
    catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
        return;
    }
};
exports.checkAdminRole = checkAdminRole;
// API lấy dữ liệu tổng quan cho dashboard
const getDashboardStats = async (req, res) => {
    try {
        // Tổng số người dùng
        const [usersCount] = await db_1.default.query('SELECT COUNT(*) as count FROM account WHERE id_role = 2');
        // Tổng số sản phẩm
        const [productsCount] = await db_1.default.query('SELECT COUNT(*) as count FROM food');
        // Tổng số đơn hàng
        const [ordersCount] = await db_1.default.query('SELECT COUNT(*) as count FROM bill');
        // Tổng doanh thu
        const [revenue] = await db_1.default.query('SELECT SUM(total_amount) as total FROM bill WHERE status = "Đã giao" OR status = "Đã thanh toán"');
        // Số đơn hàng theo trạng thái
        const [orderStatus] = await db_1.default.query(`SELECT 
        SUM(CASE WHEN status = 'Chờ xác nhận' THEN 1 ELSE 0 END) as pending,
        SUM(CASE WHEN status = 'Đã giao' OR status = 'Đã thanh toán' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'Đã hủy' THEN 1 ELSE 0 END) as cancelled
       FROM bill`);
        // Dữ liệu doanh thu theo ngày trong tuần này
        const [weeklyRevenue] = await db_1.default.query(`SELECT 
        DAYOFWEEK(ngaydat) as day_of_week,
        SUM(total_amount) as daily_revenue
       FROM bill
       WHERE ngaydat >= DATE_SUB(CURRENT_DATE(), INTERVAL 7 DAY)
         AND (status = 'Đã giao' OR status = 'Đã thanh toán')
       GROUP BY DAYOFWEEK(ngaydat)
       ORDER BY DAYOFWEEK(ngaydat)`);
        // Chuyển đổi dữ liệu doanh thu theo ngày thành định dạng cho biểu đồ
        const salesData = {
            labels: ["T2", "T3", "T4", "T5", "T6", "T7", "CN"],
            datasets: [
                {
                    data: [0, 0, 0, 0, 0, 0, 0] // Giá trị mặc định
                }
            ]
        };
        // Cập nhật dữ liệu thực tế từ cơ sở dữ liệu
        weeklyRevenue.forEach((item) => {
            // MySQL DAYOFWEEK: 1 = Sunday, 2 = Monday, ..., 7 = Saturday
            // Chuyển đổi sang vị trí trong mảng (0 = Monday, ..., 6 = Sunday)
            const dayIndex = item.day_of_week === 1 ? 6 : item.day_of_week - 2;
            salesData.datasets[0].data[dayIndex] = Math.round(item.daily_revenue / 1000); // Chuyển thành đơn vị nghìn
        });
        // Lấy 5 đơn hàng mới nhất
        const [recentOrders] = await db_1.default.query(`SELECT b.bill_id, b.name, b.status, b.total_amount, b.created_at
       FROM bill b
       ORDER BY b.created_at DESC
       LIMIT 5`);
        res.json({
            totalUsers: usersCount[0].count,
            totalProducts: productsCount[0].count,
            totalOrders: ordersCount[0].count,
            totalRevenue: revenue[0].total || 0,
            pendingOrders: orderStatus[0].pending,
            completedOrders: orderStatus[0].completed,
            cancelledOrders: orderStatus[0].cancelled,
            recentOrders,
            salesData
        });
    }
    catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};
exports.getDashboardStats = getDashboardStats;
