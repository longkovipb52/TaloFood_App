"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadProfileImage = exports.upload = exports.changePassword = exports.updateUserInfo = exports.getUserInfo = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = __importDefault(require("../config/db"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Lấy thông tin người dùng
const getUserInfo = async (req, res) => {
    const userId = req.params.id;
    try {
        const [rows] = await db_1.default.query('SELECT account_id, username, email, phone, address, profile_image FROM account WHERE account_id = ?', [userId]);
        if (rows.length > 0) {
            res.json({ user: rows[0] });
        }
        else {
            res.status(404).json({ message: 'Không tìm thấy người dùng' });
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
        res.status(500).json({
            message: 'Lỗi server',
            error: errorMessage
        });
    }
};
exports.getUserInfo = getUserInfo;
// Cập nhật thông tin người dùng
const updateUserInfo = async (req, res) => {
    const { userId, email, phone, address } = req.body;
    try {
        // Đảm bảo userId là số
        const userIdNumber = parseInt(userId, 10);
        console.log('Update request for userId:', userId, '(converted to number:', userIdNumber, ')');
        console.log('Phone number to update:', phone);
        // Kiểm tra email có trùng với tài khoản khác không
        const [emailCheck] = await db_1.default.query('SELECT * FROM account WHERE email = ? AND account_id != ?', [email, userIdNumber]);
        if (emailCheck.length > 0) {
            res.status(400).json({ message: 'Email đã được sử dụng bởi tài khoản khác' });
            return;
        }
        // Lấy thông tin hiện tại của người dùng để kiểm tra
        const [currentUser] = await db_1.default.query('SELECT phone FROM account WHERE account_id = ?', [userIdNumber]);
        // Kiểm tra số điện thoại có trùng với tài khoản khác không
        if (phone && phone.trim() !== '') {
            // Nếu người dùng không thay đổi số điện thoại, bỏ qua kiểm tra
            if (currentUser.length > 0 && currentUser[0].phone === phone) {
                console.log('Phone number unchanged, skipping duplicate check');
            }
            else {
                // Chỉ kiểm tra khi số điện thoại thay đổi
                const [phoneCheck] = await db_1.default.query('SELECT account_id FROM account WHERE phone = ? AND account_id != ?', [phone, userIdNumber]);
                console.log('Phone check query:', 'SELECT account_id FROM account WHERE phone = ? AND account_id != ?');
                console.log('Phone check params:', [phone, userIdNumber]);
                console.log('Phone check results:', phoneCheck);
                if (phoneCheck.length > 0) {
                    console.log('Duplicate phone found for accounts:', phoneCheck.map((row) => row.account_id));
                    res.status(400).json({ message: 'Số điện thoại đã được sử dụng bởi tài khoản khác' });
                    return;
                }
            }
        }
        // Cập nhật thông tin người dùng
        await db_1.default.query('UPDATE account SET email = ?, phone = ?, address = ? WHERE account_id = ?', [email, phone, address, userIdNumber]);
        res.json({ message: 'Cập nhật thông tin thành công' });
    }
    catch (error) {
        console.error('Update user info error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
        res.status(500).json({
            message: 'Lỗi server',
            error: errorMessage
        });
    }
};
exports.updateUserInfo = updateUserInfo;
// Đổi mật khẩu
const changePassword = async (req, res) => {
    const { userId, currentPassword, newPassword } = req.body;
    try {
        // Lấy thông tin người dùng
        const [rows] = await db_1.default.query('SELECT password FROM account WHERE account_id = ?', [userId]);
        if (rows.length === 0) {
            res.status(404).json({ message: 'Không tìm thấy người dùng' });
            return;
        }
        const user = rows[0];
        // Sửa đổi: Thay thế $2y$ thành $2b$ nếu cần
        let hashedPassword = user.password;
        if (hashedPassword.startsWith('$2y$')) {
            hashedPassword = hashedPassword.replace('$2y$', '$2b$');
        }
        // So sánh mật khẩu
        const passwordMatch = await bcrypt_1.default.compare(currentPassword, hashedPassword);
        if (!passwordMatch) {
            res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
            return;
        }
        // Mã hóa mật khẩu mới
        const newHashedPassword = await bcrypt_1.default.hash(newPassword, 10);
        // Cập nhật mật khẩu
        await db_1.default.query('UPDATE account SET password = ? WHERE account_id = ?', [newHashedPassword, userId]);
        res.json({ message: 'Đổi mật khẩu thành công' });
    }
    catch (error) {
        console.error('Password change error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
        res.status(500).json({
            message: 'Lỗi server khi đổi mật khẩu',
            error: errorMessage
        });
    }
};
exports.changePassword = changePassword;
// Cấu hình multer để upload ảnh đại diện
const storage = multer_1.default.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path_1.default.join(__dirname, '../../profile_images');
        // Tự động tạo thư mục nếu chưa tồn tại
        if (!fs_1.default.existsSync(uploadDir)) {
            fs_1.default.mkdirSync(uploadDir, { recursive: true });
            console.log('Đã tạo thư mục profile_images từ controller');
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, 'profile-' + uniqueSuffix + ext);
    }
});
exports.upload = (0, multer_1.default)({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
        if (!allowedTypes.includes(file.mimetype)) {
            cb(new Error('Chỉ chấp nhận file hình ảnh (jpeg, png, jpg)'));
            return;
        }
        cb(null, true);
    }
});
// Upload ảnh đại diện
const uploadProfileImage = async (req, res) => {
    try {
        if (!req.file) {
            res.status(400).json({ message: 'Vui lòng chọn ảnh để tải lên' });
            return;
        }
        const userId = req.body.userId;
        const filename = req.file.filename;
        // Lấy ảnh đại diện cũ để xóa
        const [oldImage] = await db_1.default.query('SELECT profile_image FROM account WHERE account_id = ?', [userId]);
        // Xóa ảnh cũ (nếu có)
        if (oldImage.length > 0 && oldImage[0].profile_image) {
            const oldImagePath = path_1.default.join(__dirname, '../../profile_images', oldImage[0].profile_image);
            if (fs_1.default.existsSync(oldImagePath)) {
                fs_1.default.unlinkSync(oldImagePath);
            }
        }
        // Cập nhật ảnh đại diện mới
        await db_1.default.query('UPDATE account SET profile_image = ? WHERE account_id = ?', [filename, userId]);
        res.json({
            message: 'Cập nhật ảnh đại diện thành công',
            filename
        });
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
        res.status(500).json({
            message: 'Lỗi server',
            error: errorMessage
        });
    }
};
exports.uploadProfileImage = uploadProfileImage;
