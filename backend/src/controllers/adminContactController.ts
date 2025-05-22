import { Request, Response } from 'express';
import pool from '../config/db';

// Lấy tất cả liên hệ (có tìm kiếm và lọc)
export const getAllContacts = async (req: Request, res: Response): Promise<void> => {
  try {
    const searchQuery = req.query.q as string;
    const statusFilter = req.query.status as string;
    
    let query = `
      SELECT c.contact_id, c.Message, c.status, c.id_account,
        a.username, a.email, a.phone
      FROM contact c
      JOIN account a ON c.id_account = a.account_id
    `;
    
    const params: any[] = [];
    
    // Thêm điều kiện tìm kiếm nếu có
    if (searchQuery || statusFilter) {
      query += " WHERE";
      
      if (searchQuery) {
        query += " (c.Message LIKE ? OR a.username LIKE ? OR a.email LIKE ? OR a.phone LIKE ?)";
        params.push(`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`);
        
        if (statusFilter) {
          query += " AND";
        }
      }
      
      if (statusFilter) {
        query += " c.status = ?";
        params.push(statusFilter);
      }
    }
    
    query += " ORDER BY c.contact_id DESC";
    
    const [contacts]: any = await pool.query(query, params);
    
    res.json({ contacts });
  } catch (error: any) {
    console.error('Error fetching contacts:', error);
    res.status(500).json({ 
      message: 'Lỗi khi lấy danh sách liên hệ', 
      error: error.message 
    });
  }
};

// Lấy chi tiết một liên hệ
export const getContactById = async (req: Request, res: Response): Promise<void> => {
  const contactId = req.params.contactId;
  
  try {
    const [contacts]: any = await pool.query(
      `SELECT c.contact_id, c.Message, c.status, c.id_account,
        a.username, a.email, a.phone, a.address
      FROM contact c
      JOIN account a ON c.id_account = a.account_id
      WHERE c.contact_id = ?`,
      [contactId]
    );
    
    if (contacts.length === 0) {
      res.status(404).json({ message: 'Không tìm thấy liên hệ' });
      return;
    }
    
    res.json({ contact: contacts[0] });
  } catch (error: any) {
    console.error('Error fetching contact details:', error);
    res.status(500).json({ 
      message: 'Lỗi khi lấy thông tin chi tiết liên hệ', 
      error: error.message 
    });
  }
};

// Cập nhật trạng thái liên hệ
export const updateContactStatus = async (req: Request, res: Response): Promise<void> => {
  const contactId = req.params.contactId;
  const { status } = req.body;
  
  if (!status || !['Đã xử lý', 'Chưa xử lý'].includes(status)) {
    res.status(400).json({ message: 'Trạng thái không hợp lệ. Chọn "Đã xử lý" hoặc "Chưa xử lý".' });
    return;
  }
  
  try {
    // Kiểm tra liên hệ có tồn tại không
    const [contacts]: any = await pool.query(
      'SELECT * FROM contact WHERE contact_id = ?',
      [contactId]
    );
    
    if (contacts.length === 0) {
      res.status(404).json({ message: 'Không tìm thấy liên hệ' });
      return;
    }
    
    // Cập nhật trạng thái
    await pool.query(
      'UPDATE contact SET status = ? WHERE contact_id = ?',
      [status, contactId]
    );
    
    res.json({ 
      message: 'Cập nhật trạng thái liên hệ thành công',
      status
    });
  } catch (error: any) {
    console.error('Error updating contact status:', error);
    res.status(500).json({ 
      message: 'Lỗi khi cập nhật trạng thái liên hệ', 
      error: error.message 
    });
  }
};

// Xóa liên hệ
export const deleteContact = async (req: Request, res: Response): Promise<void> => {
  const contactId = req.params.contactId;
  
  try {
    // Kiểm tra liên hệ có tồn tại không
    const [contacts]: any = await pool.query(
      'SELECT * FROM contact WHERE contact_id = ?',
      [contactId]
    );
    
    if (contacts.length === 0) {
      res.status(404).json({ message: 'Không tìm thấy liên hệ' });
      return;
    }
    
    // Xóa liên hệ
    await pool.query(
      'DELETE FROM contact WHERE contact_id = ?',
      [contactId]
    );
    
    res.json({ message: 'Xóa liên hệ thành công' });
  } catch (error: any) {
    console.error('Error deleting contact:', error);
    res.status(500).json({ 
      message: 'Lỗi khi xóa liên hệ', 
      error: error.message 
    });
  }
};