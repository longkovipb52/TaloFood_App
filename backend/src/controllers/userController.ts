import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import pool from '../config/db';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Định nghĩa kiểu dữ liệu cho request có file từ multer
interface RequestWithFile extends Request {
  file?: Express.Multer.File;
}

// Lấy thông tin người dùng
export const getUserInfo = async (req: Request, res: Response): Promise<void> => {
  const userId = req.params.id;
  
  try {
    const [rows]: any = await pool.query(
      'SELECT account_id, username, email, phone, address, profile_image FROM account WHERE account_id = ?',
      [userId]
    );
    
    if (rows.length > 0) {
      res.json({ user: rows[0] });
    } else {
      res.status(404).json({ message: 'Không tìm thấy người dùng' });
    }
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
    res.status(500).json({ 
      message: 'Lỗi server', 
      error: errorMessage 
    });
  }
};

// Cập nhật thông tin người dùng
export const updateUserInfo = async (req: Request, res: Response): Promise<void> => {
  const { userId, email, phone, address } = req.body;
  
  try {
    // Đảm bảo userId là số
    const userIdNumber = parseInt(userId, 10);
    
    console.log('Update request for userId:', userId, '(converted to number:', userIdNumber, ')');
    console.log('Phone number to update:', phone);
    
    // Kiểm tra email có trùng với tài khoản khác không
    const [emailCheck]: any = await pool.query(
      'SELECT * FROM account WHERE email = ? AND account_id != ?',
      [email, userIdNumber]
    );
    
    if (emailCheck.length > 0) {
      res.status(400).json({ message: 'Email đã được sử dụng bởi tài khoản khác' });
      return;
    }
    
    // Lấy thông tin hiện tại của người dùng để kiểm tra
    const [currentUser]: any = await pool.query(
      'SELECT phone FROM account WHERE account_id = ?', 
      [userIdNumber]
    );
    
    // Kiểm tra số điện thoại có trùng với tài khoản khác không
    if (phone && phone.trim() !== '') {
      // Nếu người dùng không thay đổi số điện thoại, bỏ qua kiểm tra
      if (currentUser.length > 0 && currentUser[0].phone === phone) {
        console.log('Phone number unchanged, skipping duplicate check');
      } else {
        // Chỉ kiểm tra khi số điện thoại thay đổi
        const [phoneCheck]: any = await pool.query(
          'SELECT account_id FROM account WHERE phone = ? AND account_id != ?',
          [phone, userIdNumber]
        );
        
        console.log('Phone check query:', 'SELECT account_id FROM account WHERE phone = ? AND account_id != ?');
        console.log('Phone check params:', [phone, userIdNumber]);
        console.log('Phone check results:', phoneCheck);
        
        if (phoneCheck.length > 0) {
          console.log('Duplicate phone found for accounts:', phoneCheck.map((row: any) => row.account_id));
          res.status(400).json({ message: 'Số điện thoại đã được sử dụng bởi tài khoản khác' });
          return;
        }
      }
    }
    
    // Cập nhật thông tin người dùng
    await pool.query(
      'UPDATE account SET email = ?, phone = ?, address = ? WHERE account_id = ?',
      [email, phone, address, userIdNumber]
    );
    
    res.json({ message: 'Cập nhật thông tin thành công' });
  } catch (error: unknown) {
    console.error('Update user info error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
    res.status(500).json({ 
      message: 'Lỗi server', 
      error: errorMessage 
    });
  }
};

// Đổi mật khẩu
export const changePassword = async (req: Request, res: Response): Promise<void> => {
  const { userId, currentPassword, newPassword } = req.body;
  
  try {
    // Lấy thông tin người dùng
    const [rows]: any = await pool.query(
      'SELECT password FROM account WHERE account_id = ?',
      [userId]
    );
    
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
    const passwordMatch = await bcrypt.compare(currentPassword, hashedPassword);
    
    if (!passwordMatch) {
      res.status(400).json({ message: 'Mật khẩu hiện tại không đúng' });
      return;
    }
    
    // Mã hóa mật khẩu mới
    const newHashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Cập nhật mật khẩu
    await pool.query(
      'UPDATE account SET password = ? WHERE account_id = ?',
      [newHashedPassword, userId]
    );
    
    res.json({ message: 'Đổi mật khẩu thành công' });
  } catch (error: unknown) {
    console.error('Password change error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
    res.status(500).json({ 
      message: 'Lỗi server khi đổi mật khẩu',
      error: errorMessage 
    });
  }
};

// Cấu hình multer để upload ảnh đại diện
const storage = multer.diskStorage({
  destination: function(req: Express.Request, file: Express.Multer.File, cb: any) {
    const uploadDir = path.join(__dirname, '../../profile_images');
    
    // Tự động tạo thư mục nếu chưa tồn tại
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
      console.log('Đã tạo thư mục profile_images từ controller');
    }
    
    cb(null, uploadDir);
  },
  filename: function(req: Express.Request, file: Express.Multer.File, cb: any) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'profile-' + uniqueSuffix + ext);
  }
});

export const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req: Express.Request, file: Express.Multer.File, cb: any) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.mimetype)) {
      cb(new Error('Chỉ chấp nhận file hình ảnh (jpeg, png, jpg)'));
      return;
    }
    cb(null, true);
  }
});

// Upload ảnh đại diện
export const uploadProfileImage = async (req: RequestWithFile, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ message: 'Vui lòng chọn ảnh để tải lên' });
      return;
    }
    
    const userId = req.body.userId;
    const filename = req.file.filename;
    
    // Lấy ảnh đại diện cũ để xóa
    const [oldImage]: any = await pool.query(
      'SELECT profile_image FROM account WHERE account_id = ?',
      [userId]
    );
    
    // Xóa ảnh cũ (nếu có)
    if (oldImage.length > 0 && oldImage[0].profile_image) {
      const oldImagePath = path.join(__dirname, '../../profile_images', oldImage[0].profile_image);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }
    
    // Cập nhật ảnh đại diện mới
    await pool.query(
      'UPDATE account SET profile_image = ? WHERE account_id = ?',
      [filename, userId]
    );
    
    res.json({ 
      message: 'Cập nhật ảnh đại diện thành công',
      filename 
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Lỗi không xác định';
    res.status(500).json({ 
      message: 'Lỗi server', 
      error: errorMessage 
    });
  }
};