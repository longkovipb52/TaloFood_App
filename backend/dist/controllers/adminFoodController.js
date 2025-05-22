"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateFoodStatus = exports.deleteFood = exports.updateFood = exports.createFood = exports.getFoodById = exports.getFoodCategories = exports.getAllFoods = void 0;
const db_1 = __importDefault(require("../config/db"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Lấy danh sách tất cả món ăn
const getAllFoods = async (req, res) => {
    try {
        const [foods] = await db_1.default.query(`SELECT f.food_id, f.food_name, f.price, f.image, f.description, 
        f.id_category, f.status, fc.foodcategory_name AS category_name 
      FROM food f
      JOIN food_category fc ON f.id_category = fc.foodcategory_id
      ORDER BY f.food_id DESC`);
        res.json({ foods });
    }
    catch (error) {
        console.error('Error fetching all foods:', error);
        res.status(500).json({
            message: 'Lỗi khi lấy danh sách món ăn',
            error: error.message
        });
    }
};
exports.getAllFoods = getAllFoods;
// Lấy danh sách danh mục món ăn
const getFoodCategories = async (req, res) => {
    try {
        const [categories] = await db_1.default.query(`SELECT foodcategory_id AS id_category, foodcategory_name AS category_name 
       FROM food_category 
       ORDER BY foodcategory_name`);
        res.json({ categories });
    }
    catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            message: 'Lỗi khi lấy danh sách danh mục',
            error: error.message
        });
    }
};
exports.getFoodCategories = getFoodCategories;
// Lấy thông tin chi tiết món ăn
const getFoodById = async (req, res) => {
    const foodId = req.params.foodId;
    try {
        const [foods] = await db_1.default.query(`SELECT f.food_id, f.food_name, f.price, f.image, f.description, 
        f.id_category, f.status, fc.foodcategory_name AS category_name
      FROM food f
      JOIN food_category fc ON f.id_category = fc.foodcategory_id
      WHERE f.food_id = ?`, [foodId]);
        if (foods.length === 0) {
            res.status(404).json({ message: 'Không tìm thấy món ăn' });
            return;
        }
        res.json({ food: foods[0] });
    }
    catch (error) {
        console.error('Error fetching food details:', error);
        res.status(500).json({
            message: 'Lỗi khi lấy thông tin món ăn',
            error: error.message
        });
    }
};
exports.getFoodById = getFoodById;
// Thêm món ăn mới
const createFood = async (req, res) => {
    try {
        const { food_name, price, description, id_category, status } = req.body;
        let image = null;
        // Xử lý upload ảnh nếu có
        if (req.file) {
            image = req.file.filename;
        }
        const [result] = await db_1.default.query(`INSERT INTO food (food_name, price, description, id_category, image, status) 
      VALUES (?, ?, ?, ?, ?, ?)`, [food_name, price, description, id_category, image, status || 1]);
        if (result.affectedRows > 0) {
            // Lấy thông tin món ăn vừa tạo
            const [foods] = await db_1.default.query(`SELECT f.food_id, f.food_name, f.price, f.image, f.description, 
          f.id_category, f.status, fc.foodcategory_name AS category_name
        FROM food f
        JOIN food_category fc ON f.id_category = fc.foodcategory_id
        WHERE f.food_id = ?`, [result.insertId]);
            res.status(201).json({
                message: 'Thêm món ăn thành công',
                food: foods[0]
            });
        }
        else {
            res.status(400).json({ message: 'Không thể thêm món ăn' });
        }
    }
    catch (error) {
        console.error('Error creating food:', error);
        res.status(500).json({
            message: 'Lỗi khi thêm món ăn',
            error: error.message
        });
    }
};
exports.createFood = createFood;
// Cập nhật món ăn
const updateFood = async (req, res) => {
    const foodId = req.params.foodId;
    try {
        const { food_name, price, description, id_category, status } = req.body;
        // Kiểm tra món ăn tồn tại
        const [foods] = await db_1.default.query('SELECT * FROM food WHERE food_id = ?', [foodId]);
        if (foods.length === 0) {
            res.status(404).json({ message: 'Không tìm thấy món ăn' });
            return;
        }
        const oldFood = foods[0];
        let image = oldFood.image;
        // Xử lý upload ảnh mới nếu có
        if (req.file) {
            // Xóa ảnh cũ nếu có
            if (oldFood.image) {
                const oldImagePath = path_1.default.join(__dirname, '../../foods', oldFood.image);
                if (fs_1.default.existsSync(oldImagePath)) {
                    fs_1.default.unlinkSync(oldImagePath);
                }
            }
            image = req.file.filename;
        }
        await db_1.default.query(`UPDATE food 
      SET food_name = ?, price = ?, description = ?, id_category = ?, image = ?, status = ? 
      WHERE food_id = ?`, [food_name, price, description, id_category, image, status, foodId]);
        // Lấy thông tin món ăn đã cập nhật
        const [updatedFoods] = await db_1.default.query(`SELECT f.food_id, f.food_name, f.price, f.image, f.description, 
        f.id_category, f.status, fc.foodcategory_name AS category_name
      FROM food f
      JOIN food_category fc ON f.id_category = fc.foodcategory_id
      WHERE f.food_id = ?`, [foodId]);
        res.json({
            message: 'Cập nhật món ăn thành công',
            food: updatedFoods[0]
        });
    }
    catch (error) {
        console.error('Error updating food:', error);
        res.status(500).json({
            message: 'Lỗi khi cập nhật món ăn',
            error: error.message
        });
    }
};
exports.updateFood = updateFood;
// Xóa món ăn
const deleteFood = async (req, res) => {
    const foodId = req.params.foodId;
    try {
        // Kiểm tra món ăn tồn tại
        const [foods] = await db_1.default.query('SELECT * FROM food WHERE food_id = ?', [foodId]);
        if (foods.length === 0) {
            res.status(404).json({ message: 'Không tìm thấy món ăn' });
            return;
        }
        // Xóa ảnh nếu có
        const foodToDelete = foods[0];
        if (foodToDelete.image) {
            const imagePath = path_1.default.join(__dirname, '../../foods', foodToDelete.image);
            if (fs_1.default.existsSync(imagePath)) {
                fs_1.default.unlinkSync(imagePath);
            }
        }
        // Xóa món ăn
        await db_1.default.query('DELETE FROM food WHERE food_id = ?', [foodId]);
        res.json({ message: 'Xóa món ăn thành công' });
    }
    catch (error) {
        console.error('Error deleting food:', error);
        res.status(500).json({
            message: 'Lỗi khi xóa món ăn',
            error: error.message
        });
    }
};
exports.deleteFood = deleteFood;
// Cập nhật trạng thái món ăn
const updateFoodStatus = async (req, res) => {
    const foodId = req.params.foodId;
    const { status } = req.body;
    try {
        // Kiểm tra món ăn tồn tại
        const [foods] = await db_1.default.query('SELECT * FROM food WHERE food_id = ?', [foodId]);
        if (foods.length === 0) {
            res.status(404).json({ message: 'Không tìm thấy món ăn' });
            return;
        }
        // Cập nhật trạng thái
        await db_1.default.query('UPDATE food SET status = ? WHERE food_id = ?', [status, foodId]);
        res.json({
            message: 'Cập nhật trạng thái món ăn thành công',
            status
        });
    }
    catch (error) {
        console.error('Error updating food status:', error);
        res.status(500).json({
            message: 'Lỗi khi cập nhật trạng thái món ăn',
            error: error.message
        });
    }
};
exports.updateFoodStatus = updateFoodStatus;
