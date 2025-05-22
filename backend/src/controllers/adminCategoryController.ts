import { Request, Response } from 'express';
import pool from '../config/db';
import fs from 'fs';
import path from 'path';

// Lấy danh sách tất cả danh mục
export const getAllCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const [categories]: any = await pool.query(
      `SELECT foodcategory_id, foodcategory_name, image, 
       (SELECT COUNT(*) FROM food WHERE id_category = foodcategory_id) as food_count
       FROM food_category
       ORDER BY foodcategory_name ASC`
    );
    
    res.json({ categories });
  } catch (error: any) {
    console.error('Error fetching all categories:', error);
    res.status(500).json({ 
      message: 'Lỗi khi lấy danh sách danh mục', 
      error: error.message 
    });
  }
};

// Lấy thông tin chi tiết danh mục
export const getCategoryById = async (req: Request, res: Response): Promise<void> => {
  const categoryId = req.params.categoryId;
  
  try {
    // Lấy thông tin danh mục
    const [categories]: any = await pool.query(
      `SELECT foodcategory_id, foodcategory_name, image
       FROM food_category
       WHERE foodcategory_id = ?`,
      [categoryId]
    );
    
    if (categories.length === 0) {
      res.status(404).json({ message: 'Không tìm thấy danh mục' });
      return;
    }
    
    // Lấy các món ăn thuộc danh mục
    const [foods]: any = await pool.query(
      `SELECT food_id, food_name, image, price, status 
       FROM food 
       WHERE id_category = ? 
       ORDER BY food_name ASC`,
      [categoryId]
    );
    
    // Trả về thông tin danh mục kèm danh sách món ăn
    res.json({ 
      category: categories[0],
      foods
    });
  } catch (error: any) {
    console.error('Error fetching category details:', error);
    res.status(500).json({ 
      message: 'Lỗi khi lấy thông tin danh mục', 
      error: error.message 
    });
  }
};

// Thêm danh mục mới
export const createCategory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { foodcategory_name } = req.body;
    
    if (!foodcategory_name || foodcategory_name.trim() === '') {
      res.status(400).json({ message: 'Tên danh mục không được để trống' });
      return;
    }
    
    let image = null;
    
    // Xử lý upload ảnh nếu có
    if (req.file) {
      image = req.file.filename || req.file.path.split('\\').pop() || req.file.path.split('/').pop();
    }
    
    const [result]: any = await pool.query(
      `INSERT INTO food_category (foodcategory_name, image) VALUES (?, ?)`,
      [foodcategory_name, image]
    );
    
    if (result.affectedRows > 0) {
      // Lấy thông tin danh mục vừa tạo
      const [categories]: any = await pool.query(
        `SELECT foodcategory_id, foodcategory_name, image,
         (SELECT COUNT(*) FROM food WHERE id_category = foodcategory_id) as food_count
         FROM food_category
         WHERE foodcategory_id = ?`,
        [result.insertId]
      );
      
      res.status(201).json({ 
        message: 'Thêm danh mục thành công',
        category: categories[0]
      });
    } else {
      res.status(400).json({ message: 'Không thể thêm danh mục' });
    }
  } catch (error: any) {
    console.error('Error creating category:', error);
    res.status(500).json({ 
      message: 'Lỗi khi thêm danh mục', 
      error: error.message 
    });
  }
};

// Cập nhật danh mục
export const updateCategory = async (req: Request, res: Response): Promise<void> => {
  const categoryId = req.params.categoryId;
  
  try {
    console.log('Update Category Request:', {
      body: req.body,
      file: req.file ? {
        filename: req.file.filename,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : 'No file',
      params: req.params
    });
    
    const { foodcategory_name, removeImage } = req.body;
    
    if (!foodcategory_name || foodcategory_name.trim() === '') {
      res.status(400).json({ message: 'Tên danh mục không được để trống' });
      return;
    }
    
    // Kiểm tra danh mục tồn tại
    const [categories]: any = await pool.query(
      'SELECT * FROM food_category WHERE foodcategory_id = ?', 
      [categoryId]
    );
    
    if (categories.length === 0) {
      res.status(404).json({ message: 'Không tìm thấy danh mục' });
      return;
    }
    
    const oldCategory = categories[0];
    let image = oldCategory.image;
    
    // Xử lý ảnh
    if (req.file) {
      // Xóa ảnh cũ nếu có
      if (oldCategory.image) {
        try {
          const oldImagePath = path.join(__dirname, '../../category_images', oldCategory.image);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
            console.log('Old image deleted:', oldImagePath);
          }
        } catch (err) {
          console.error('Error deleting old image:', err);
        }
      }
      
      // Lưu tên file mới
      image = req.file.filename;
      console.log('New image saved:', image);
    } 
    else if (removeImage === 'true') {
      // Xóa ảnh hiện tại nếu người dùng muốn xóa
      if (oldCategory.image) {
        try {
          const oldImagePath = path.join(__dirname, '../../category_images', oldCategory.image);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        } catch (err) {
          console.error('Error deleting image:', err);
        }
      }
      image = null;
    }
    
    // Cập nhật danh mục
    await pool.query(
      `UPDATE food_category SET foodcategory_name = ?, image = ? WHERE foodcategory_id = ?`,
      [foodcategory_name, image, categoryId]
    );
    
    // Lấy thông tin danh mục đã cập nhật
    const [updatedCategories]: any = await pool.query(
      `SELECT foodcategory_id, foodcategory_name, image,
       (SELECT COUNT(*) FROM food WHERE id_category = foodcategory_id) as food_count
       FROM food_category
       WHERE foodcategory_id = ?`,
      [categoryId]
    );
    
    console.log('Category updated successfully:', updatedCategories[0]);
    
    res.json({ 
      message: 'Cập nhật danh mục thành công',
      category: updatedCategories[0]
    });
    
  } catch (error: any) {
    console.error('Error updating category:', error);
    res.status(500).json({ 
      message: 'Lỗi khi cập nhật danh mục', 
      error: error.message 
    });
  }
};

// Xóa danh mục
export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
  const categoryId = req.params.categoryId;
  
  try {
    // Kiểm tra danh mục tồn tại
    const [categories]: any = await pool.query(
      'SELECT * FROM food_category WHERE foodcategory_id = ?', 
      [categoryId]
    );
    
    if (categories.length === 0) {
      res.status(404).json({ message: 'Không tìm thấy danh mục' });
      return;
    }
    
    // Kiểm tra có món ăn nào thuộc danh mục này không
    const [foods]: any = await pool.query(
      'SELECT COUNT(*) as count FROM food WHERE id_category = ?',
      [categoryId]
    );
    
    if (foods[0].count > 0) {
      res.status(400).json({ 
        message: 'Không thể xóa danh mục này vì có món ăn đang sử dụng',
        foodCount: foods[0].count
      });
      return;
    }
    
    // Xóa ảnh nếu có
    const categoryToDelete = categories[0];
    if (categoryToDelete.image) {
      const imagePath = path.join(__dirname, '../../category_images', categoryToDelete.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }
    
    // Xóa danh mục
    await pool.query('DELETE FROM food_category WHERE foodcategory_id = ?', [categoryId]);
    
    res.json({ message: 'Xóa danh mục thành công' });
  } catch (error: any) {
    console.error('Error deleting category:', error);
    res.status(500).json({ 
      message: 'Lỗi khi xóa danh mục', 
      error: error.message 
    });
  }
};

// Tìm kiếm danh mục
export const searchCategories = async (req: Request, res: Response): Promise<void> => {
  const searchQuery = req.query.q as string;
  
  if (!searchQuery) {
    res.status(400).json({ message: 'Vui lòng cung cấp từ khóa tìm kiếm' });
    return;
  }
  
  try {
    const [categories]: any = await pool.query(
      `SELECT foodcategory_id, foodcategory_name, image, 
       (SELECT COUNT(*) FROM food WHERE id_category = foodcategory_id) as food_count
       FROM food_category
       WHERE foodcategory_name LIKE ?
       ORDER BY foodcategory_name ASC`,
      [`%${searchQuery}%`]
    );
    
    res.json({ categories });
  } catch (error: any) {
    console.error('Error searching categories:', error);
    res.status(500).json({ 
      message: 'Lỗi khi tìm kiếm danh mục', 
      error: error.message 
    });
  }
};