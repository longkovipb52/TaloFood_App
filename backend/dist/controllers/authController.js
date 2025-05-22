"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.register = exports.login = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../config/db"));
const login = async (req, res) => {
    const { username, password } = req.body;
    try {
        // Thêm trường id_role vào câu truy vấn để lấy thông tin role
        const [rows] = await db_1.default.query('SELECT account_id, username, password, id_role FROM account WHERE username = ?', [username]);
        if (rows.length === 0) {
            res.status(401).json({ message: 'Tên đăng nhập không tồn tại' });
            return;
        }
        const user = rows[0];
        // Sửa đổi: Thay thế $2y$ thành $2b$ (nếu cần, do PHP vs Node.js bcrypt)
        let hashedPassword = user.password;
        if (hashedPassword.startsWith('$2y$')) {
            hashedPassword = hashedPassword.replace('$2y$', '$2b$');
        }
        const passwordMatch = await bcrypt_1.default.compare(password, hashedPassword);
        if (!passwordMatch) {
            res.status(401).json({ message: 'Mật khẩu không đúng' });
            return;
        }
        // Lấy thông tin role để trả về client
        const [roleInfo] = await db_1.default.query('SELECT rolename FROM role WHERE role_id = ?', [user.id_role]);
        // Bổ sung thêm thông tin role vào object user
        const userData = {
            account_id: user.account_id,
            username: user.username,
            id_role: user.id_role,
            role: roleInfo[0].rolename
        };
        const token = jsonwebtoken_1.default.sign({ id: user.account_id, username: user.username, role: user.id_role }, 'your_jwt_secret', { expiresIn: '1d' });
        res.json({ token, user: userData });
    }
    catch (error) {
        res.status(500).json({ message: 'Lỗi server', error });
    }
};
exports.login = login;
const register = async (req, res) => {
    const { username, password, confirmPassword, email, phone, address } = req.body;
    // Kiểm tra thông tin đầy đủ
    if (!username || !password || !email || !phone || !address) {
        res.status(400).json({ message: 'Vui lòng nhập đầy đủ thông tin' });
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
    // Kiểm tra mật khẩu có chứa ít nhất 1 chữ số
    if (!/\d/.test(password)) {
        res.status(400).json({ message: 'Mật khẩu phải chứa ít nhất 1 chữ số' });
        return;
    }
    // Kiểm tra mật khẩu có chứa ít nhất 1 chữ hoa
    if (!/[A-Z]/.test(password)) {
        res.status(400).json({ message: 'Mật khẩu phải chứa ít nhất 1 chữ in hoa' });
        return;
    }
    // Kiểm tra mật khẩu có chứa ít nhất 1 ký tự đặc biệt
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        res.status(400).json({ message: 'Mật khẩu phải chứa ít nhất 1 ký tự đặc biệt (!@#$%^&*(),.?":{}|<>)' });
        return;
    }
    try {
        // Kiểm tra username đã tồn tại chưa
        const [usernameCheck] = await db_1.default.query('SELECT * FROM account WHERE username = ?', [username]);
        if (usernameCheck.length > 0) {
            res.status(400).json({ message: 'Tên đăng nhập đã tồn tại' });
            return;
        }
        // Kiểm tra email đã tồn tại chưa
        const [emailCheck] = await db_1.default.query('SELECT * FROM account WHERE email = ?', [email]);
        if (emailCheck.length > 0) {
            res.status(400).json({ message: 'Email đã tồn tại' });
            return;
        }
        // Kiểm tra số điện thoại đã tồn tại chưa
        const [phoneCheck] = await db_1.default.query('SELECT * FROM account WHERE phone = ?', [phone]);
        if (phoneCheck.length > 0) {
            res.status(400).json({ message: 'Số điện thoại đã tồn tại' });
            return;
        }
        // Mã hóa mật khẩu
        const hashedPassword = await bcrypt_1.default.hash(password, 10);
        // Thêm user mới
        await db_1.default.query('INSERT INTO account (username, password, email, phone, address, id_role, status) VALUES (?, ?, ?, ?, ?, ?, ?)', [username, hashedPassword, email, phone, address, 2, 1]);
        res.json({ message: 'Đăng ký thành công' });
    }
    catch (error) {
        res.status(500).json({ message: 'Lỗi server', error });
    }
};
exports.register = register;
