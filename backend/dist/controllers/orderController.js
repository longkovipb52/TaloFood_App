"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelOrder = exports.getOrderDetails = exports.getUserOrders = exports.createOrder = void 0;
const db_1 = __importDefault(require("../config/db"));
// Tạo đơn hàng mới
const createOrder = async (req, res) => {
    const { userId, name, phone, address, paymentMethod, items, totalAmount } = req.body;
    try {
        // Bắt đầu transaction
        await db_1.default.query('START TRANSACTION');
        // Tạo bill (đơn hàng)
        const currentDate = new Date().toISOString().split('T')[0];
        const deliveryDate = new Date();
        deliveryDate.setDate(deliveryDate.getDate() + 3); // Giao trong 3 ngày
        const [billResult] = await db_1.default.query('INSERT INTO bill (ngaydat, ngaygiao, id_account, status, address, total_amount, payment_method, phone, name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [
            currentDate,
            currentDate, // Để tương thích với dữ liệu hiện tại
            userId,
            'Chờ xác nhận',
            address,
            totalAmount,
            paymentMethod,
            phone,
            name
        ]);
        const billId = billResult.insertId;
        // Thêm chi tiết đơn hàng (bill_info)
        for (const item of items) {
            await db_1.default.query('INSERT INTO bill_info (id_bill, id_food, id_account, count, price) VALUES (?, ?, ?, ?, ?)', [billId, item.foodId, userId, item.quantity, item.price]);
            // Cập nhật số lượng đã bán (total_sold) của món ăn
            await db_1.default.query('UPDATE food SET total_sold = total_sold + ? WHERE food_id = ?', [item.quantity, item.foodId]);
        }
        // Commit transaction
        await db_1.default.query('COMMIT');
        // Trả về kết quả thành công
        res.status(201).json({
            message: 'Đặt hàng thành công',
            orderId: billId
        });
    }
    catch (error) {
        // Rollback nếu có lỗi
        await db_1.default.query('ROLLBACK');
        const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
        console.error('Create order error:', error);
        res.status(500).json({
            message: 'Lỗi khi tạo đơn hàng',
            error: errorMessage
        });
    }
};
exports.createOrder = createOrder;
// Lấy danh sách đơn hàng của người dùng
const getUserOrders = async (req, res) => {
    const userId = req.params.userId;
    try {
        const [orders] = await db_1.default.query(`SELECT b.*, 
        (SELECT COUNT(*) FROM bill_info bi WHERE bi.id_bill = b.bill_id) as item_count
      FROM bill b 
      WHERE b.id_account = ? 
      ORDER BY b.created_at DESC`, [userId]);
        res.json({ orders });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
        res.status(500).json({
            message: 'Lỗi khi lấy danh sách đơn hàng',
            error: errorMessage
        });
    }
};
exports.getUserOrders = getUserOrders;
// Lấy chi tiết đơn hàng
const getOrderDetails = async (req, res) => {
    const orderId = req.params.orderId;
    try {
        // Lấy thông tin đơn hàng
        const [orderInfo] = await db_1.default.query('SELECT * FROM bill WHERE bill_id = ?', [orderId]);
        if (orderInfo.length === 0) {
            res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
            return;
        }
        // Lấy chi tiết sản phẩm trong đơn hàng
        const [orderItems] = await db_1.default.query(`SELECT bi.*, f.food_name, f.image 
       FROM bill_info bi 
       JOIN food f ON bi.id_food = f.food_id 
       WHERE bi.id_bill = ?`, [orderId]);
        // Định dạng lại dữ liệu trả về
        const orderDetails = {
            ...orderInfo[0],
            items: orderItems.map((item) => ({
                ...item,
                image_url: `http://192.168.1.13:5000/foods/${item.image}`
            }))
        };
        res.json({ order: orderDetails });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
        res.status(500).json({
            message: 'Lỗi khi lấy chi tiết đơn hàng',
            error: errorMessage
        });
    }
};
exports.getOrderDetails = getOrderDetails;
// Thêm hàm hủy đơn hàng
const cancelOrder = async (req, res) => {
    const orderId = req.params.orderId;
    const { userId } = req.body;
    try {
        // Kiểm tra đơn hàng có tồn tại và thuộc về người dùng không
        const [orderInfo] = await db_1.default.query('SELECT * FROM bill WHERE bill_id = ? AND id_account = ?', [orderId, userId]);
        if (orderInfo.length === 0) {
            res.status(404).json({ message: 'Không tìm thấy đơn hàng hoặc đơn hàng không thuộc về bạn' });
            return;
        }
        const order = orderInfo[0];
        // Kiểm tra đơn hàng có thể hủy không
        if (['Đã giao', 'Đã hủy'].includes(order.status)) {
            res.status(400).json({ message: 'Không thể hủy đơn hàng này' });
            return;
        }
        // Cập nhật trạng thái đơn hàng thành "Đã hủy"
        await db_1.default.query('UPDATE bill SET status = ? WHERE bill_id = ?', ['Đã hủy', orderId]);
        res.json({ message: 'Hủy đơn hàng thành công' });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
        res.status(500).json({
            message: 'Lỗi khi hủy đơn hàng',
            error: errorMessage
        });
    }
};
exports.cancelOrder = cancelOrder;
