import { Request, Response } from 'express';
import pool from '../config/db';

export const getHomeData = async (req: Request, res: Response) => {
  try {
    // 1. Lấy danh mục và 4 món ăn mỗi danh mục
    const [categories]: any = await pool.query(
      'SELECT foodcategory_id, foodcategory_name, image FROM food_category'
    );
    for (const cat of categories) {
      const [foods]: any = await pool.query(
        `SELECT f.food_id as id, f.food_name as name, f.price, f.new_price, f.image, f.description, f.total_sold,
          (SELECT AVG(r.star_rating) FROM reviews r WHERE r.id_food = f.food_id) as average_rating,
          (SELECT COUNT(*) FROM reviews r WHERE r.id_food = f.food_id) as review_count
         FROM food f WHERE f.id_category = ? LIMIT 4`,
        [cat.foodcategory_id]
      );
      cat.foods = foods.map((food: any) => ({
        ...food,
        image_url: `http://192.168.1.13:5000/foods/${food.image}`,
      }));
    }

    // 2. Sản phẩm bán chạy (top 6)
    const [bestSellers]: any = await pool.query(
      `SELECT f.food_id, f.food_name, f.new_price, f.image, f.total_sold,
        (SELECT AVG(r.star_rating) FROM reviews r WHERE r.id_food = f.food_id) as average_rating,
        (SELECT COUNT(*) FROM reviews r WHERE r.id_food = f.food_id) as review_count
       FROM food f ORDER BY f.total_sold DESC LIMIT 6`
    );
    const bestSellersWithImg = bestSellers.map((item: any) => ({
      ...item,
      image_url: `http://192.168.1.13:5000/foods/${item.image}`,
    }));

    // 3. Đánh giá nổi bật (top 6)
    const [reviews]: any = await pool.query(
      `SELECT r.review_id as id, r.star_rating, r.comment, a.username, a.profile_image
       FROM reviews r
       JOIN account a ON r.id_account = a.account_id
       ORDER BY r.review_id DESC LIMIT 3`
    );
    const reviewsWithImg = reviews.map((item: any) => ({
      ...item,
      profile_image_url: item.profile_image
        ? `http://192.168.1.13:5000/images/${item.profile_image}`
        : 'https://ui-avatars.com/api/?name=' + encodeURIComponent(item.username),
    }));

    // 4. Blog mới nhất (top 4)
    const [blogs]: any = await pool.query(
      `SELECT b.blog_id, b.title, b.image, a.username
       FROM blog b
       JOIN account a ON b.author_id = a.account_id
       WHERE b.status = 'published'
       ORDER BY b.created_at DESC LIMIT 4`
    );
    const blogsWithImg = blogs.map((item: any) => ({
      ...item,
      image_url: `http://192.168.1.13:5000/blogs/${item.image}`,
    }));

    res.json({
      categories,
      bestSellers: bestSellersWithImg,
      reviews: reviewsWithImg,
      blogs: blogsWithImg,
    });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server', error: err });
  }
};