import { Request, Response } from 'express';
import pool from '../config/db';

// Lấy danh sách tất cả đơn hàng
export const getAllOrders = async (req: Request, res: Response): Promise<void> => {
  try {
    const [bills]: any = await pool.query(
      `SELECT b.bill_id, b.id_account, b.total_amount, b.status, 
        b.payment_method, b.name, b.phone, b.address, b.created_at, b.ngaygiao
      FROM bill b
      ORDER BY b.created_at DESC`
    );
    
    res.json({ orders: bills });
  } catch (error: any) {
    console.error('Error fetching all orders:', error);
    res.status(500).json({ 
      message: 'Lỗi khi lấy danh sách đơn hàng', 
      error: error.message 
    });
  }
};

// Lấy thông tin chi tiết của một đơn hàng
export const getOrderDetails = async (req: Request, res: Response): Promise<void> => {
  const orderId = req.params.orderId;
  
  try {
    // Lấy thông tin đơn hàng
    const [bills]: any = await pool.query(
      `SELECT b.bill_id, b.id_account, b.total_amount, b.status, 
        b.payment_method, b.name, b.phone, b.address, b.created_at, b.ngaygiao
      FROM bill b
      WHERE b.bill_id = ?`,
      [orderId]
    );
    
    if (bills.length === 0) {
      res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
      return;
    }

    // Lấy chi tiết các món ăn trong đơn hàng
    const [items]: any = await pool.query(
      `SELECT bi.billinfo_id, bi.id_bill, bi.id_food as food_id, bi.count, bi.price, 
        f.food_name, f.image
      FROM bill_info bi
      JOIN food f ON bi.id_food = f.food_id
      WHERE bi.id_bill = ?`,
      [orderId]
    );

    // Trả về thông tin đơn hàng và chi tiết
    res.json({ 
      order: {
        ...bills[0],
        items
      } 
    });
  } catch (error: any) {
    console.error('Error fetching order details:', error);
    res.status(500).json({ 
      message: 'Lỗi khi lấy thông tin chi tiết đơn hàng', 
      error: error.message 
    });
  }
};

// Cập nhật trạng thái đơn hàng
export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  const orderId = req.params.orderId;
  const { status } = req.body;
  
  // Kiểm tra trạng thái hợp lệ
  const validStatuses = [
    'Chờ xác nhận', 
    'Đã xác nhận', 
    'Đang giao', 
    'Đã giao', 
    'Đã thanh toán', 
    'Đã hủy'
  ];
  
  if (!validStatuses.includes(status)) {
    res.status(400).json({ message: 'Trạng thái đơn hàng không hợp lệ' });
    return;
  }
  
  try {
    // Kiểm tra đơn hàng tồn tại
    const [bills]: any = await pool.query(
      'SELECT bill_id FROM bill WHERE bill_id = ?',
      [orderId]
    );
    
    if (bills.length === 0) {
      res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
      return;
    }
    
    // Cập nhật trạng thái đơn hàng
    await pool.query(
      'UPDATE bill SET status = ? WHERE bill_id = ?',
      [status, orderId]
    );
    
    // Cập nhật ngày giao nếu trạng thái là "Đã giao"
    if (status === 'Đã giao') {
      await pool.query(
        'UPDATE bill SET ngaygiao = CURRENT_DATE() WHERE bill_id = ?',
        [orderId]
      );
    }
    
    res.json({ 
      message: 'Cập nhật trạng thái đơn hàng thành công',
      status
    });
  } catch (error: any) {
    console.error('Error updating order status:', error);
    res.status(500).json({ 
      message: 'Lỗi khi cập nhật trạng thái đơn hàng', 
      error: error.message 
    });
  }
};

// Lấy thống kê đơn hàng
export const getOrderStats = async (req: Request, res: Response): Promise<void> => {
  try {
    // Lấy tổng số đơn hàng theo trạng thái
    const [statusStats]: any = await pool.query(`
      SELECT status, COUNT(bill_id) as count
      FROM bill
      GROUP BY status
    `);
    
    // Lấy doanh thu theo tháng (trong năm hiện tại)
    const [monthlyRevenue]: any = await pool.query(`
      SELECT 
        MONTH(created_at) as month,
        SUM(total_amount) as revenue
      FROM bill
      WHERE 
        YEAR(created_at) = YEAR(CURRENT_DATE()) AND
        status IN ('Đã giao', 'Đã thanh toán')
      GROUP BY MONTH(created_at)
      ORDER BY MONTH(created_at)
    `);
    
    // Tổng doanh thu 
    const [totalRevenue]: any = await pool.query(`
      SELECT SUM(total_amount) as total
      FROM bill
      WHERE status IN ('Đã giao', 'Đã thanh toán')
    `);
    
    res.json({
      statusStats,
      monthlyRevenue,
      totalRevenue: totalRevenue[0].total || 0
    });
  } catch (error: any) {
    console.error('Error fetching order stats:', error);
    res.status(500).json({ 
      message: 'Lỗi khi lấy thống kê đơn hàng', 
      error: error.message 
    });
  }
};

// Tìm kiếm đơn hàng
export const searchOrders = async (req: Request, res: Response): Promise<void> => {
  const { keyword, status, fromDate, toDate } = req.query;
  
  try {
    let query = `
      SELECT b.bill_id, b.account_id, b.total_amount, b.status, 
        b.payment_method, b.name, b.phone, b.address, b.created_at, b.ngaygiao
      FROM bill b
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    // Tìm theo từ khóa
    if (keyword) {
      query += ` AND (b.bill_id LIKE ? OR b.name LIKE ? OR b.phone LIKE ? OR b.address LIKE ?)`;
      const keywordParam = `%${keyword}%`;
      params.push(keywordParam, keywordParam, keywordParam, keywordParam);
    }
    
    // Lọc theo trạng thái
    if (status && status !== 'all') {
      query += ` AND b.status = ?`;
      params.push(status);
    }
    
    // Lọc theo ngày
    if (fromDate) {
      query += ` AND DATE(b.created_at) >= ?`;
      params.push(fromDate);
    }
    
    if (toDate) {
      query += ` AND DATE(b.created_at) <= ?`;
      params.push(toDate);
    }
    
    // Sắp xếp theo ngày tạo mới nhất
    query += ` ORDER BY b.created_at DESC`;
    
    const [bills]: any = await pool.query(query, params);
    
    res.json({ orders: bills });
  } catch (error: any) {
    console.error('Error searching orders:', error);
    res.status(500).json({ 
      message: 'Lỗi khi tìm kiếm đơn hàng', 
      error: error.message 
    });
  }
};