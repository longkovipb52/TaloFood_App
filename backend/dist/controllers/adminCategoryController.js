"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.searchCategories = exports.deleteCategory = exports.updateCategory = exports.createCategory = exports.getCategoryById = exports.getAllCategories = void 0;
const db_1 = __importDefault(require("../config/db"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Lấy danh sách tất cả danh mục
const getAllCategories = async (req, res) => {
    try {
        const [categories] = await db_1.default.query(`SELECT foodcategory_id, foodcategory_name, image, 
       (SELECT COUNT(*) FROM food WHERE id_category = foodcategory_id) as food_count
       FROM food_category
       ORDER BY foodcategory_name ASC`);
        res.json({ categories });
    }
    catch (error) {
        console.error('Error fetching all categories:', error);
        res.status(500).json({
            message: 'Lỗi khi lấy danh sách danh mục',
            error: error.message
        });
    }
};
exports.getAllCategories = getAllCategories;
// Lấy thông tin chi tiết danh mục
const getCategoryById = async (req, res) => {
    const categoryId = req.params.categoryId;
    try {
        // Lấy thông tin danh mục
        const [categories] = await db_1.default.query(`SELECT foodcategory_id, foodcategory_name, image
       FROM food_category
       WHERE foodcategory_id = ?`, [categoryId]);
        if (categories.length === 0) {
            res.status(404).json({ message: 'Không tìm thấy danh mục' });
            return;
        }
        // Lấy các món ăn thuộc danh mục
        const [foods] = await db_1.default.query(`SELECT food_id, food_name, image, price, status 
       FROM food 
       WHERE id_category = ? 
       ORDER BY food_name ASC`, [categoryId]);
        // Trả về thông tin danh mục kèm danh sách món ăn
        res.json({
            category: categories[0],
            foods
        });
    }
    catch (error) {
        console.error('Error fetching category details:', error);
        res.status(500).json({
            message: 'Lỗi khi lấy thông tin danh mục',
            error: error.message
        });
    }
};
exports.getCategoryById = getCategoryById;
// Thêm danh mục mới
const createCategory = async (req, res) => {
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
        const [result] = await db_1.default.query(`INSERT INTO food_category (foodcategory_name, image) VALUES (?, ?)`, [foodcategory_name, image]);
        if (result.affectedRows > 0) {
            // Lấy thông tin danh mục vừa tạo
            const [categories] = await db_1.default.query(`SELECT foodcategory_id, foodcategory_name, image,
         (SELECT COUNT(*) FROM food WHERE id_category = foodcategory_id) as food_count
         FROM food_category
         WHERE foodcategory_id = ?`, [result.insertId]);
            res.status(201).json({
                message: 'Thêm danh mục thành công',
                category: categories[0]
            });
        }
        else {
            res.status(400).json({ message: 'Không thể thêm danh mục' });
        }
    }
    catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({
            message: 'Lỗi khi thêm danh mục',
            error: error.message
        });
    }
};
exports.createCategory = createCategory;
// Cập nhật danh mục
const updateCategory = async (req, res) => {
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
        const [categories] = await db_1.default.query('SELECT * FROM food_category WHERE foodcategory_id = ?', [categoryId]);
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
                    const oldImagePath = path_1.default.join(__dirname, '../../category_images', oldCategory.image);
                    if (fs_1.default.existsSync(oldImagePath)) {
                        fs_1.default.unlinkSync(oldImagePath);
                        console.log('Old image deleted:', oldImagePath);
                    }
                }
                catch (err) {
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
                    const oldImagePath = path_1.default.join(__dirname, '../../category_images', oldCategory.image);
                    if (fs_1.default.existsSync(oldImagePath)) {
                        fs_1.default.unlinkSync(oldImagePath);
                    }
                }
                catch (err) {
                    console.error('Error deleting image:', err);
                }
            }
            image = null;
        }
        // Cập nhật danh mục
        await db_1.default.query(`UPDATE food_category SET foodcategory_name = ?, image = ? WHERE foodcategory_id = ?`, [foodcategory_name, image, categoryId]);
        // Lấy thông tin danh mục đã cập nhật
        const [updatedCategories] = await db_1.default.query(`SELECT foodcategory_id, foodcategory_name, image,
       (SELECT COUNT(*) FROM food WHERE id_category = foodcategory_id) as food_count
       FROM food_category
       WHERE foodcategory_id = ?`, [categoryId]);
        console.log('Category updated successfully:', updatedCategories[0]);
        res.json({
            message: 'Cập nhật danh mục thành công',
            category: updatedCategories[0]
        });
    }
    catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({
            message: 'Lỗi khi cập nhật danh mục',
            error: error.message
        });
    }
};
exports.updateCategory = updateCategory;
// Xóa danh mục
const deleteCategory = async (req, res) => {
    const categoryId = req.params.categoryId;
    try {
        // Kiểm tra danh mục tồn tại
        const [categories] = await db_1.default.query('SELECT * FROM food_category WHERE foodcategory_id = ?', [categoryId]);
        if (categories.length === 0) {
            res.status(404).json({ message: 'Không tìm thấy danh mục' });
            return;
        }
        // Kiểm tra có món ăn nào thuộc danh mục này không
        const [foods] = await db_1.default.query('SELECT COUNT(*) as count FROM food WHERE id_category = ?', [categoryId]);
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
            const imagePath = path_1.default.join(__dirname, '../../category_images', categoryToDelete.image);
            if (fs_1.default.existsSync(imagePath)) {
                fs_1.default.unlinkSync(imagePath);
            }
        }
        // Xóa danh mục
        await db_1.default.query('DELETE FROM food_category WHERE foodcategory_id = ?', [categoryId]);
        res.json({ message: 'Xóa danh mục thành công' });
    }
    catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({
            message: 'Lỗi khi xóa danh mục',
            error: error.message
        });
    }
};
exports.deleteCategory = deleteCategory;
// Tìm kiếm danh mục
const searchCategories = async (req, res) => {
    const searchQuery = req.query.q;
    if (!searchQuery) {
        res.status(400).json({ message: 'Vui lòng cung cấp từ khóa tìm kiếm' });
        return;
    }
    try {
        const [categories] = await db_1.default.query(`SELECT foodcategory_id, foodcategory_name, image, 
       (SELECT COUNT(*) FROM food WHERE id_category = foodcategory_id) as food_count
       FROM food_category
       WHERE foodcategory_name LIKE ?
       ORDER BY foodcategory_name ASC`, [`%${searchQuery}%`]);
        res.json({ categories });
    }
    catch (error) {
        console.error('Error searching categories:', error);
        res.status(500).json({
            message: 'Lỗi khi tìm kiếm danh mục',
            error: error.message
        });
    }
};
exports.searchCategories = searchCategories;
