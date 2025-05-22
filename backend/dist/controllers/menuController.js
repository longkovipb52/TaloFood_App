"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMenu = void 0;
const db_1 = __importDefault(require("../config/db"));
const getMenu = async (req, res) => {
    try {
        const [foods] = await db_1.default.query(`SELECT f.food_id, f.food_name, f.price, f.new_price, f.image, f.description, f.total_sold,
              c.foodcategory_id, c.foodcategory_name,
              (SELECT AVG(r.star_rating) FROM reviews r WHERE r.id_food = f.food_id) as average_rating
         FROM food f
         JOIN food_category c ON f.id_category = c.foodcategory_id
         WHERE f.status = 1`);
        const foodsWithImg = foods.map((item) => ({
            ...item,
            image_url: `http://192.168.1.13:5000/foods/${item.image}`,
            category: item.foodcategory_name,
            category_id: item.foodcategory_id,
            average_rating: Number(item.average_rating) || 0,
        }));
        res.json({ foods: foodsWithImg });
    }
    catch (err) {
        res.status(500).json({ message: 'Lỗi server', error: err });
    }
};
exports.getMenu = getMenu;
