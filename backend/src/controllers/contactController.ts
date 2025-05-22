import { Request, Response } from 'express';
import  pool  from '../config/db';

export const getUserContacts = async (req: Request, res: Response): Promise<void> => {
  const userId = req.params.userId;
  
  try {
    // Lấy tất cả tin nhắn liên hệ của người dùng
    // Sử dụng các trường hiện có trong bảng contact
    const [contacts]: any = await pool.query(
      `SELECT contact_id, Message, status
       FROM contact
       WHERE id_account = ?
       ORDER BY contact_id DESC`, // Giả sử ID lớn hơn là tin nhắn mới hơn
      [userId]
    );
    
    res.json({ 
      contacts,
      count: contacts.length
    });
  } catch (error: any) {
    console.error('Error fetching user contacts:', error);
    res.status(500).json({ 
      message: 'Lỗi khi lấy danh sách liên hệ', 
      error: error.message 
    });
  }
};

export const addContact = async (req: Request, res: Response): Promise<void> => {
  const { userId, message } = req.body;
  
  if (!userId || !message) {
    res.status(400).json({ message: 'Thiếu thông tin cần thiết' });
    return;
  }
  
  try {
    // Thêm liên hệ mới vào cơ sở dữ liệu sử dụng các trường hiện có
    const [result]: any = await pool.query(
      'INSERT INTO contact (Message, id_account, status) VALUES (?, ?, ?)',
      [message, userId, 'Chưa xử lý']
    );
    
    res.status(201).json({ 
      message: 'Đã gửi tin nhắn liên hệ thành công',
      contactId: result.insertId
    });
  } catch (error: any) {
    console.error('Error adding contact:', error);
    res.status(500).json({ 
      message: 'Lỗi khi gửi tin nhắn liên hệ', 
      error: error.message 
    });
  }
};