"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.changeUserStatus = exports.deleteUser = exports.updateUser = exports.createUser = exports.getUserById = exports.getAllUsers = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = __importDefault(require("../config/db"));
// Lấy danh sách tất cả người dùng
const getAllUsers = async (req, res) => {
    try {
        // Loại bỏ trường created_at khỏi danh sách truy vấn
        const [users] = await db_1.default.query('SELECT account_id, username, email, phone, address, id_role, profile_image, status FROM account ORDER BY account_id DESC');
        res.json({ users });
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            message: 'Lỗi khi lấy danh sách người dùng',
            error: error.message
        });
    }
};
exports.getAllUsers = getAllUsers;
// Lấy thông tin chi tiết của một người dùng
const getUserById = async (req, res) => {
    const userId = req.params.userId;
    try {
        const [user] = await db_1.default.query('SELECT account_id, username, email, phone, address, id_role, profile_image, status, created_at FROM account WHERE account_id = ?', [userId]);
        if (user.length === 0) {
            res.status(404).json({ message: 'Không tìm thấy người dùng' });
            return;
        }
        res.json({ user: user[0] });
    }
    catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({
            message: 'Lỗi khi lấy thông tin người dùng',
            error: error.message
        });
    }
};
exports.getUserById = getUserById;
// Thêm người dùng mới
const createUser = async (req, res) => {
    const { username, email, phone, address, password, confirmPassword } = req.body;
    // Kiểm tra thông tin đầy đủ
    if (!username || !email || !phone || !address || !password || !confirmPassword) {
        res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin' });
        return;
    }
    // Kiểm tra xác nhận mật khẩu
    if (password !== confirmPassword) {
        res.status(400).json({ message: 'Mật khẩu xác nhận không khớp' });
        return;
    }
    // Kiểm tra độ dài mật khẩu
    if (password.length < 6) {
        res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
        return;
    }
    // Kiểm tra mật khẩu phải có chữ in hoa
    if (!/[A-Z]/.test(password)) {
        res.status(400).json({ message: 'Mật khẩu phải chứa ít nhất 1 chữ in hoa' });
        return;
    }
    // Kiểm tra mật khẩu phải có chữ số
    if (!/\d/.test(password)) {
        res.status(400).json({ message: 'Mật khẩu phải chứa ít nhất 1 chữ số' });
        return;
    }
    // Kiểm tra mật khẩu phải có ký tự đặc biệt
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        res.status(400).json({ message: 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt' });
        return;
    }
    try {
        // Kiểm tra username đã tồn tại chưa
        const [usernameCheck] = await db_1.default.query('SELECT account_id FROM account WHERE username = ?', [username]);
        if (usernameCheck.length > 0) {
            res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });
            return;
        }
        // Kiểm tra email đã tồn tại chưa
        const [emailCheck] = await db_1.default.query('SELECT account_id FROM account WHERE email = ?', [email]);
        if (emailCheck.length > 0) {
            res.status(400).json({ message: 'Email đã tồn tại' });
            return;
        }
        // Kiểm tra số điện thoại đã tồn tại chưa
        const [phoneCheck] = await db_1.default.query('SELECT account_id FROM account WHERE phone = ?', [phone]);
        if (phoneCheck.length > 0) {
            res.status(400).json({ message: 'Số điện thoại đã tồn tại' });
            return;
        }
        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        // Thêm người dùng mới với role là 2 (user) và status là 1 (active)
        const [result] = await db_1.default.query('INSERT INTO account (username, email, phone, address, password, id_role, status) VALUES (?, ?, ?, ?, ?, 2, 1)', [username, email, phone, address, hashedPassword]);
        res.status(201).json({
            message: 'Tạo tài khoản người dùng thành công',
            userId: result.insertId
        });
    }
    catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({
            message: 'Lỗi khi tạo tài khoản người dùng',
            error: error.message
        });
    }
};
exports.createUser = createUser;
// Cập nhật thông tin người dùng
const updateUser = async (req, res) => {
    const userId = req.params.userId;
    const { email, phone, address, password, confirmPassword } = req.body;
    try {
        // Kiểm tra người dùng tồn tại
        const [userCheck] = await db_1.default.query('SELECT account_id FROM account WHERE account_id = ?', [userId]);
        if (userCheck.length === 0) {
            res.status(404).json({ message: 'Không tìm thấy người dùng' });
            return;
        }
        // Kiểm tra email đã tồn tại ở tài khoản khác chưa
        if (email) {
            const [emailCheck] = await db_1.default.query('SELECT account_id FROM account WHERE email = ? AND account_id != ?', [email, userId]);
            if (emailCheck.length > 0) {
                res.status(400).json({ message: 'Email đã được sử dụng bởi tài khoản khác' });
                return;
            }
        }
        // Kiểm tra số điện thoại đã tồn tại ở tài khoản khác chưa
        if (phone) {
            const [phoneCheck] = await db_1.default.query('SELECT account_id FROM account WHERE phone = ? AND account_id != ?', [phone, userId]);
            if (phoneCheck.length > 0) {
                res.status(400).json({ message: 'Số điện thoại đã được sử dụng bởi tài khoản khác' });
                return;
            }
        }
        // Cập nhật thông tin cơ bản
        await db_1.default.query('UPDATE account SET email = ?, phone = ?, address = ? WHERE account_id = ?', [email, phone, address, userId]);
        // Nếu có cung cấp mật khẩu mới
        if (password) {
            // Kiểm tra xác nhận mật khẩu
            if (password !== confirmPassword) {
                res.status(400).json({ message: 'Mật khẩu xác nhận không khớp' });
                return;
            }
            // Kiểm tra độ dài mật khẩu
            if (password.length < 6) {
                res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự' });
                return;
            }
            // Kiểm tra mật khẩu phải có chữ in hoa
            if (!/[A-Z]/.test(password)) {
                res.status(400).json({ message: 'Mật khẩu phải chứa ít nhất 1 chữ in hoa' });
                return;
            }
            // Kiểm tra mật khẩu phải có chữ số
            if (!/\d/.test(password)) {
                res.status(400).json({ message: 'Mật khẩu phải chứa ít nhất 1 chữ số' });
                return;
            }
            // Kiểm tra mật khẩu phải có ký tự đặc biệt
            if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
                res.status(400).json({ message: 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt' });
                return;
            }
            // Mã hóa mật khẩu mới
            const hashedPassword = await bcrypt_1.default.hash(password, 10);
            // Cập nhật mật khẩu
            await db_1.default.query('UPDATE account SET password = ? WHERE account_id = ?', [hashedPassword, userId]);
        }
        res.json({ message: 'Cập nhật thông tin người dùng thành công' });
    }
    catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({
            message: 'Lỗi khi cập nhật thông tin người dùng',
            error: error.message
        });
    }
};
exports.updateUser = updateUser;
// Xóa người dùng
const deleteUser = async (req, res) => {
    const userId = req.params.userId;
    try {
        // Kiểm tra người dùng tồn tại
        const [userCheck] = await db_1.default.query('SELECT account_id, id_role FROM account WHERE account_id = ?', [userId]);
        if (userCheck.length === 0) {
            res.status(404).json({ message: 'Không tìm thấy người dùng' });
            return;
        }
        // Không cho phép xóa tài khoản admin
        if (userCheck[0].id_role === 1) {
            res.status(403).json({ message: 'Không thể xóa tài khoản admin' });
            return;
        }
        // Xóa người dùng
        await db_1.default.query('DELETE FROM account WHERE account_id = ?', [userId]);
        res.json({ message: 'Xóa người dùng thành công' });
    }
    catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            message: 'Lỗi khi xóa người dùng',
            error: error.message
        });
    }
};
exports.deleteUser = deleteUser;
// Thay đổi trạng thái người dùng (kích hoạt/vô hiệu hóa)
const changeUserStatus = async (req, res) => {
    const userId = req.params.userId;
    const { status } = req.body;
    if (status !== 0 && status !== 1) {
        res.status(400).json({ message: 'Trạng thái không hợp lệ' });
        return;
    }
    try {
        // Kiểm tra người dùng tồn tại
        const [userCheck] = await db_1.default.query('SELECT account_id, id_role FROM account WHERE account_id = ?', [userId]);
        if (userCheck.length === 0) {
            res.status(404).json({ message: 'Không tìm thấy người dùng' });
            return;
        }
        // Không cho phép thay đổi trạng thái tài khoản admin
        if (userCheck[0].id_role === 1) {
            res.status(403).json({ message: 'Không thể thay đổi trạng thái tài khoản admin' });
            return;
        }
        // Cập nhật trạng thái
        await db_1.default.query('UPDATE account SET status = ? WHERE account_id = ?', [status, userId]);
        res.json({
            message: status === 1 ? 'Đã kích hoạt tài khoản' : 'Đã vô hiệu hóa tài khoản'
        });
    }
    catch (error) {
        console.error('Error changing user status:', error);
        res.status(500).json({
            message: 'Lỗi khi thay đổi trạng thái người dùng',
            error: error.message
        });
    }
};
exports.changeUserStatus = changeUserStatus;
