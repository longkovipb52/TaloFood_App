import { Request, Response } from 'express';
import pool from '../config/db';

/**
 * Lấy thống kê tổng quan
 */
export const getOverviewStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const period = req.query.period || 'month'; // 'day', 'week', 'month', 'year'
    
    // Xác định khoảng thời gian dựa trên period
    let timeFilter: string;
    switch (period) {
      case 'day':
        timeFilter = 'DATE(created_at) = CURDATE()';
        break;
      case 'week':
        timeFilter = 'YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)';
        break;
      case 'year':
        timeFilter = 'YEAR(created_at) = YEAR(CURDATE())';
        break;
      case 'all':
        timeFilter = '1=1';
        break;
      default: // month
        timeFilter = 'MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())';
    }
    
    // 1. Tổng doanh thu
    const [revenue]: any = await pool.query(
      `SELECT SUM(total_amount) as total FROM bill WHERE ${timeFilter}`
    );
    
    // 2. Tổng số đơn hàng
    const [orders]: any = await pool.query(
      `SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'Đã giao' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'Chờ xác nhận' THEN 1 END) as pending,
        COUNT(CASE WHEN status = 'Đã hủy' THEN 1 END) as cancelled
      FROM bill WHERE ${timeFilter}`
    );
    
    // 3. Tổng số khách hàng mới - Bảng account không có cột created_at
    const [newUsers]: any = await pool.query(
      `SELECT COUNT(*) as total FROM account WHERE id_role = 2`
    );
    
    // 4. Tổng số sản phẩm đã bán
    const [itemsSold]: any = await pool.query(
      `SELECT SUM(count) as total 
       FROM bill_info bi 
       JOIN bill b ON bi.id_bill = b.bill_id 
       WHERE ${timeFilter.replace('created_at', 'b.created_at')}`
    );
    
    // 5. Đánh giá trung bình
    const [rating]: any = await pool.query(
      `SELECT AVG(star_rating) as average FROM reviews WHERE ${timeFilter}`
    );
    
    res.json({
      revenue: revenue[0].total || 0,
      orders: {
        total: orders[0].total || 0,
        completed: orders[0].completed || 0,
        pending: orders[0].pending || 0,
        cancelled: orders[0].cancelled || 0
      },
      newUsers: newUsers[0].total || 0,
      itemsSold: itemsSold[0].total || 0,
      rating: parseFloat(rating[0].average || 0) // Đảm bảo luôn trả về số
    });
  } catch (error) {
    console.error('Error fetching overview stats:', error);
    res.status(500).json({ message: 'Lỗi khi lấy dữ liệu thống kê tổng quan', error });
  }
};

/**
 * Lấy thống kê doanh thu theo thời gian
 */
export const getRevenueStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const period = req.query.period || 'month'; // 'day', 'week', 'month', 'year'
    const limit = parseInt(req.query.limit as string) || 12; // Số điểm dữ liệu muốn lấy
    
    let groupBy: string;
    let timeFilter: string;
    let labelFormat: string;
    
    switch (period) {
      case 'day':
        groupBy = 'DATE_FORMAT(created_at, "%Y-%m-%d %H:00:00")';
        labelFormat = '%H:00';
        timeFilter = 'DATE(created_at) = CURDATE()';
        break;
      case 'week':
        groupBy = 'DATE(created_at)';
        labelFormat = '%d/%m';
        timeFilter = 'YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)';
        break;
      case 'month':
        groupBy = 'DATE(created_at)';
        labelFormat = '%d/%m';
        timeFilter = 'MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())';
        break;
      case 'year':
        groupBy = 'MONTH(created_at)';
        labelFormat = '%m/%Y';
        timeFilter = 'YEAR(created_at) = YEAR(CURDATE())';
        break;
      default:
        groupBy = 'DATE(created_at)';
        labelFormat = '%d/%m/%Y';
        timeFilter = 'created_at >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
    }
    
    const [revenue]: any = await pool.query(
      `SELECT 
        ${groupBy} as date,
        DATE_FORMAT(created_at, '${labelFormat}') as label,
        SUM(total_amount) as amount,
        COUNT(*) as orders
      FROM bill
      WHERE ${timeFilter}
      GROUP BY ${groupBy}
      ORDER BY date
      LIMIT ?`,
      [limit]
    );
    
    // Lấy doanh thu theo phương thức thanh toán
    const [paymentMethods]: any = await pool.query(
      `SELECT 
        payment_method,
        SUM(total_amount) as amount,
        COUNT(*) as count
      FROM bill
      WHERE ${timeFilter} AND status NOT IN ('Đã hủy')
      GROUP BY payment_method`
    );
    
    res.json({
      revenue,
      paymentMethods
    });
  } catch (error) {
    console.error('Error fetching revenue stats:', error);
    res.status(500).json({ message: 'Lỗi khi lấy dữ liệu thống kê doanh thu', error });
  }
};

/**
 * Lấy thống kê sản phẩm bán chạy
 */
export const getProductStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const period = req.query.period || 'month'; // 'day', 'week', 'month', 'year', 'all'
    const limit = parseInt(req.query.limit as string) || 10;
    const categoryId = req.query.category || null;
    
    let timeFilter: string;
    switch (period) {
      case 'day':
        timeFilter = 'DATE(b.created_at) = CURDATE()';
        break;
      case 'week':
        timeFilter = 'YEARWEEK(b.created_at, 1) = YEARWEEK(CURDATE(), 1)';
        break;
      case 'month':
        timeFilter = 'MONTH(b.created_at) = MONTH(CURDATE()) AND YEAR(b.created_at) = YEAR(CURDATE())';
        break;
      case 'year':
        timeFilter = 'YEAR(b.created_at) = YEAR(CURDATE())';
        break;
      case 'all':
        timeFilter = '1=1';
        break;
      default:
        timeFilter = 'MONTH(b.created_at) = MONTH(CURDATE()) AND YEAR(b.created_at) = YEAR(CURDATE())';
    }
    
    let categoryFilter = '';
    if (categoryId) {
      categoryFilter = 'AND f.id_category = ?';
    }
    
    const query = `
      SELECT 
        f.food_id, f.food_name, f.image, f.price, f.new_price,
        fc.foodcategory_name as category,
        SUM(bi.count) as quantity_sold,
        SUM(bi.count * bi.price) as revenue,
        COUNT(DISTINCT b.bill_id) as order_count,
        AVG(r.star_rating) as average_rating,
        COUNT(r.review_id) as review_count
      FROM bill_info bi
      JOIN bill b ON bi.id_bill = b.bill_id
      JOIN food f ON bi.id_food = f.food_id
      JOIN food_category fc ON f.id_category = fc.foodcategory_id
      LEFT JOIN reviews r ON r.id_food = f.food_id
      WHERE ${timeFilter} ${categoryFilter} AND b.status != 'Đã hủy'
      GROUP BY f.food_id
      ORDER BY quantity_sold DESC
      LIMIT ?`;
    
    const queryParams = categoryId ? [categoryId, limit] : [limit];
    const [topProducts]: any = await pool.query(query, queryParams);
    
    // Format kết quả trả về
    const formattedProducts = topProducts.map((product: any) => ({
      ...product,
      image_url: product.image ? `http://192.168.1.13:5000/foods/${product.image}` : null,
      average_rating: product.average_rating !== null ? parseFloat(Number(product.average_rating).toFixed(1)) : 0
    }));
    
    // Lấy thống kê theo danh mục
    const [categoryStats]: any = await pool.query(
      `SELECT 
        fc.foodcategory_id,
        fc.foodcategory_name,
        fc.image,
        COUNT(DISTINCT bi.id_food) as product_count,
        SUM(bi.count) as quantity_sold,
        SUM(bi.count * bi.price) as revenue
      FROM bill_info bi
      JOIN bill b ON bi.id_bill = b.bill_id
      JOIN food f ON bi.id_food = f.food_id
      JOIN food_category fc ON f.id_category = fc.foodcategory_id
      WHERE ${timeFilter} AND b.status != 'Đã hủy'
      GROUP BY fc.foodcategory_id
      ORDER BY quantity_sold DESC`
    );
    
    const formattedCategories = categoryStats.map((category: any) => ({
      ...category,
      image_url: category.image ? `http://192.168.1.13:5000/category_images/${category.image}` : null
    }));
    
    res.json({
      topProducts: formattedProducts,
      categories: formattedCategories
    });
  } catch (error) {
    console.error('Error fetching product stats:', error);
    res.status(500).json({ message: 'Lỗi khi lấy dữ liệu thống kê sản phẩm', error });
  }
};

/**
 * Lấy thống kê khách hàng
 */
export const getCustomerStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const period = req.query.period || 'month';
    
    let timeFilter: string;
    switch (period) {
      case 'day':
        timeFilter = 'DATE(b.created_at) = CURDATE()';
        break;
      case 'week':
        timeFilter = 'YEARWEEK(b.created_at, 1) = YEARWEEK(CURDATE(), 1)';
        break;
      case 'month':
        timeFilter = 'MONTH(b.created_at) = MONTH(CURDATE()) AND YEAR(b.created_at) = YEAR(CURDATE())';
        break;
      case 'year':
        timeFilter = 'YEAR(b.created_at) = YEAR(CURDATE())';
        break;
      case 'all':
        timeFilter = '1=1';
        break;
      default:
        timeFilter = 'MONTH(b.created_at) = MONTH(CURDATE()) AND YEAR(b.created_at) = YEAR(CURDATE())';
    }
    
    // 1. Khách hàng tiềm năng (top customers)
    const [topCustomers]: any = await pool.query(
      `SELECT 
        a.account_id, a.username, a.email, a.phone, a.profile_image,
        COUNT(DISTINCT b.bill_id) as order_count,
        SUM(b.total_amount) as total_spent,
        MAX(b.created_at) as last_order_date,
        AVG(r.star_rating) as average_rating
      FROM account a
      JOIN bill b ON a.account_id = b.id_account
      LEFT JOIN reviews r ON r.id_account = a.account_id
      WHERE ${timeFilter.replace('b.created_at', 'b.created_at')} AND b.status != 'Đã hủy'
      GROUP BY a.account_id
      ORDER BY total_spent DESC
      LIMIT 10`
    );
    
    const formattedCustomers = topCustomers.map((customer: any) => ({
      ...customer,
      profile_image: customer.profile_image 
        ? `http://192.168.1.13:5000/profile_images/${customer.profile_image}` 
        : null,
      last_order_date: new Date(customer.last_order_date).toLocaleDateString('vi-VN'),
      average_rating: customer.average_rating !== null ? parseFloat(Number(customer.average_rating).toFixed(1)) : 0
    }));
    
    // 2. Thống kê đánh giá
    const [ratingStats]: any = await pool.query(
      `SELECT 
        star_rating,
        COUNT(*) as count
      FROM reviews
      GROUP BY star_rating
      ORDER BY star_rating DESC`
    );
    
    // 3. Thống kê đơn hàng theo giờ trong ngày
    const [orderTimeStats]: any = await pool.query(
      `SELECT 
        HOUR(created_at) as hour,
        COUNT(*) as order_count,
        SUM(total_amount) as revenue
      FROM bill
      WHERE ${timeFilter.replace(/b\.created_at/g, 'created_at')} AND status != 'Đã hủy'
      GROUP BY HOUR(created_at)
      ORDER BY hour`
    );
    
    res.json({
      topCustomers: formattedCustomers,
      ratings: ratingStats,
      orderTimes: orderTimeStats
    });
  } catch (error) {
    console.error('Error fetching customer stats:', error);
    res.status(500).json({ message: 'Lỗi khi lấy dữ liệu thống kê khách hàng', error });
  }
};

/**
 * Xuất báo cáo
 */
export const exportReportData = async (req: Request, res: Response): Promise<void> => {
  try {
    const { reportType, period } = req.query;
    
    // Xác định khoảng thời gian dựa trên period
    let timeFilter: string;
    let periodLabel: string;
    
    switch (period) {
      case 'day':
        timeFilter = 'DATE(created_at) = CURDATE()';
        periodLabel = 'Hôm nay';
        break;
      case 'week':
        timeFilter = 'YEARWEEK(created_at, 1) = YEARWEEK(CURDATE(), 1)';
        periodLabel = 'Tuần này';
        break;
      case 'month':
        timeFilter = 'MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())';
        periodLabel = 'Tháng này';
        break;
      case 'year':
        timeFilter = 'YEAR(created_at) = YEAR(CURDATE())';
        periodLabel = 'Năm nay';
        break;
      case 'all':
        timeFilter = '1=1';
        periodLabel = 'Tất cả thời gian';
        break;
      default:
        timeFilter = 'MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())';
        periodLabel = 'Tháng này';
    }
    
    let data: any = {};
    
    switch (reportType) {
      case 'revenue': {
        // Lấy doanh thu theo ngày
        const [dailyRevenue]: any = await pool.query(
          `SELECT 
            DATE(created_at) as date,
            COUNT(*) as order_count,
            SUM(total_amount) as revenue,
            status
          FROM bill
          WHERE ${timeFilter}
          GROUP BY DATE(created_at), status
          ORDER BY date`
        );
        
        // Lấy doanh thu theo phương thức thanh toán
        const [paymentStats]: any = await pool.query(
          `SELECT 
            payment_method,
            COUNT(*) as order_count,
            SUM(total_amount) as revenue
          FROM bill
          WHERE ${timeFilter} AND status != 'Đã hủy'
          GROUP BY payment_method`
        );
        
        data = {
          title: `Báo cáo doanh thu - ${periodLabel}`,
          dailyRevenue,
          paymentStats
        };
        break;
      }
      
      case 'products': {
        // Lấy sản phẩm bán chạy
        const [topProducts]: any = await pool.query(
          `SELECT 
            f.food_id, f.food_name, f.price, f.new_price,
            fc.foodcategory_name as category,
            SUM(bi.count) as quantity_sold,
            SUM(bi.count * bi.price) as revenue
          FROM bill_info bi
          JOIN bill b ON bi.id_bill = b.bill_id
          JOIN food f ON bi.id_food = f.food_id
          JOIN food_category fc ON f.id_category = fc.foodcategory_id
          WHERE ${timeFilter.replace('created_at', 'b.created_at')} AND b.status != 'Đã hủy'
          GROUP BY f.food_id
          ORDER BY quantity_sold DESC
          LIMIT 30`
        );
        
        // Lấy thống kê theo danh mục
        const [categoryStats]: any = await pool.query(
          `SELECT 
            fc.foodcategory_name,
            SUM(bi.count) as quantity_sold,
            SUM(bi.count * bi.price) as revenue
          FROM bill_info bi
          JOIN bill b ON bi.id_bill = b.bill_id
          JOIN food f ON bi.id_food = f.food_id
          JOIN food_category fc ON f.id_category = fc.foodcategory_id
          WHERE ${timeFilter.replace('created_at', 'b.created_at')} AND b.status != 'Đã hủy'
          GROUP BY fc.foodcategory_id
          ORDER BY quantity_sold DESC`
        );
        
        data = {
          title: `Báo cáo sản phẩm bán chạy - ${periodLabel}`,
          topProducts,
          categoryStats
        };
        break;
      }
      
      case 'customers': {
        // Lấy khách hàng tiềm năng
        const [topCustomers]: any = await pool.query(
          `SELECT 
            a.username, a.email, a.phone,
            COUNT(b.bill_id) as order_count,
            SUM(b.total_amount) as total_spent,
            MAX(b.created_at) as last_order_date
          FROM account a
          JOIN bill b ON a.account_id = b.id_account
          WHERE ${timeFilter.replace('created_at', 'b.created_at')} AND b.status != 'Đã hủy'
          GROUP BY a.account_id
          ORDER BY total_spent DESC
          LIMIT 50`
        );
        
        // Lấy thống kê đánh giá khách hàng
        const [ratingStats]: any = await pool.query(
          `SELECT 
            star_rating,
            COUNT(*) as review_count
          FROM reviews
          WHERE ${timeFilter.replace('created_at', 'created_at')}
          GROUP BY star_rating`
        );
        
        data = {
          title: `Báo cáo khách hàng - ${periodLabel}`,
          topCustomers,
          ratingStats
        };
        break;
      }
      
      default: {
        res.status(400).json({ message: 'Loại báo cáo không hợp lệ' });
        return;
      }
    }
    
    // Thêm ngày xuất báo cáo và thông tin
    data.generated_at = new Date().toLocaleString('vi-VN');
    data.period = periodLabel;
    
    res.json({
      reportData: data,
      message: 'Dữ liệu báo cáo đã được tạo'
    });
  } catch (error) {
    console.error('Error exporting report data:', error);
    res.status(500).json({ message: 'Lỗi khi xuất dữ liệu báo cáo', error });
  }
};