"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.addContact = exports.getUserContacts = void 0;
const db_1 = __importDefault(require("../config/db"));
const getUserContacts = async (req, res) => {
    const userId = req.params.userId;
    try {
        // Lấy tất cả tin nhắn liên hệ của người dùng
        // Sử dụng các trường hiện có trong bảng contact
        const [contacts] = await db_1.default.query(`SELECT contact_id, Message, status
       FROM contact
       WHERE id_account = ?
       ORDER BY contact_id DESC`, // Giả sử ID lớn hơn là tin nhắn mới hơn
        [userId]);
        res.json({
            contacts,
            count: contacts.length
        });
    }
    catch (error) {
        console.error('Error fetching user contacts:', error);
        res.status(500).json({
            message: 'Lỗi khi lấy danh sách liên hệ',
            error: error.message
        });
    }
};
exports.getUserContacts = getUserContacts;
const addContact = async (req, res) => {
    const { userId, message } = req.body;
    if (!userId || !message) {
        res.status(400).json({ message: 'Thiếu thông tin cần thiết' });
        return;
    }
    try {
        // Thêm liên hệ mới vào cơ sở dữ liệu sử dụng các trường hiện có
        const [result] = await db_1.default.query('INSERT INTO contact (Message, id_account, status) VALUES (?, ?, ?)', [message, userId, 'Chưa xử lý']);
        res.status(201).json({
            message: 'Đã gửi tin nhắn liên hệ thành công',
            contactId: result.insertId
        });
    }
    catch (error) {
        console.error('Error adding contact:', error);
        res.status(500).json({
            message: 'Lỗi khi gửi tin nhắn liên hệ',
            error: error.message
        });
    }
};
exports.addContact = addContact;
