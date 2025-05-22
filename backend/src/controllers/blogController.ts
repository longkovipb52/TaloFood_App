import { Request, Response } from 'express';
import pool from '../config/db';

export const getAllBlogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const [blogs]: any = await pool.query(
      `SELECT b.blog_id, b.title, b.content, b.image, b.created_at, a.username, a.profile_image
       FROM blog b
       JOIN account a ON b.author_id = a.account_id
       WHERE b.status = 'published'
       ORDER BY b.created_at DESC`
    );
    
    const formattedBlogs = blogs.map((blog: any) => ({
      ...blog,
      created_at: new Date(blog.created_at).toLocaleDateString('vi-VN'),
      image_url: blog.image ? `http://192.168.1.13:5000/blogs/${blog.image}` : null,
      author_image: blog.profile_image 
        ? `http://192.168.1.13:5000/profile_images/${blog.profile_image}`
        : null,
      excerpt: blog.content.length > 100 ? blog.content.substring(0, 100) + '...' : blog.content
    }));
    
    res.json({ 
      blogs: formattedBlogs,
      count: formattedBlogs.length
    });
  } catch (error: any) {
    console.error('Error fetching blogs:', error);
    res.status(500).json({ 
      message: 'Lỗi khi lấy danh sách bài viết', 
      error: error.message 
    });
  }
};

export const getBlogById = async (req: Request, res: Response): Promise<void> => {
  const blogId = req.params.blogId;
  
  try {
    const [blogs]: any = await pool.query(
      `SELECT b.blog_id, b.title, b.content, b.image, b.created_at, b.updated_at,
        a.username, a.profile_image, a.account_id as author_id
       FROM blog b
       JOIN account a ON b.author_id = a.account_id
       WHERE b.blog_id = ? AND b.status = 'published'`,
      [blogId]
    );
    
    if (blogs.length === 0) {
      res.status(404).json({ message: 'Không tìm thấy bài viết' });
      return;
    }
    
    const blog = blogs[0];
    const formattedBlog = {
      ...blog,
      created_at: new Date(blog.created_at).toLocaleDateString('vi-VN'),
      updated_at: new Date(blog.updated_at).toLocaleDateString('vi-VN'),
      image_url: blog.image ? `http://192.168.1.13:5000/blogs/${blog.image}` : null,
      author_image: blog.profile_image 
        ? `http://192.168.1.13:5000/profile_images/${blog.profile_image}`
        : null
    };
    
    // Lấy các bài viết liên quan (cùng tác giả hoặc mới nhất)
    const [relatedBlogs]: any = await pool.query(
      `SELECT b.blog_id, b.title, b.image, b.created_at
       FROM blog b
       WHERE b.blog_id != ? AND b.status = 'published'
       ORDER BY CASE WHEN b.author_id = ? THEN 0 ELSE 1 END, b.created_at DESC
       LIMIT 4`,
      [blogId, blog.author_id]
    );
    
    const formattedRelatedBlogs = relatedBlogs.map((relBlog: any) => ({
      ...relBlog,
      created_at: new Date(relBlog.created_at).toLocaleDateString('vi-VN'),
      image_url: relBlog.image ? `http://192.168.1.13:5000/blogs/${relBlog.image}` : null
    }));
    
    res.json({ 
      blog: formattedBlog,
      relatedBlogs: formattedRelatedBlogs
    });
  } catch (error: any) {
    console.error('Error fetching blog details:', error);
    res.status(500).json({ 
      message: 'Lỗi khi lấy chi tiết bài viết', 
      error: error.message 
    });
  }
};