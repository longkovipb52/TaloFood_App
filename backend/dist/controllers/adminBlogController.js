"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateBlogStatus = exports.deleteBlog = exports.updateBlog = exports.createBlog = exports.getBlogById = exports.getAllBlogs = void 0;
const db_1 = __importDefault(require("../config/db"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Thêm hàm helper tạo excerpt
const createExcerpt = (content, maxLength = 150) => {
    if (content.length <= maxLength)
        return content;
    // Cắt đến kí tự cuối cùng mà không phá vỡ từ
    const truncated = content.substring(0, maxLength);
    const lastSpaceIndex = truncated.lastIndexOf(' ');
    if (lastSpaceIndex === -1)
        return truncated + '...';
    return truncated.substring(0, lastSpaceIndex) + '...';
};
// Lấy tất cả blogs cho trang admin (bao gồm cả draft)
const getAllBlogs = async (req, res) => {
    try {
        const searchQuery = req.query.q;
        const statusFilter = req.query.status;
        let query = `
      SELECT b.blog_id, b.title, b.content, b.image, b.status, 
        b.created_at, b.updated_at, a.username, a.account_id
      FROM blog b
      JOIN account a ON b.author_id = a.account_id
    `;
        const params = [];
        // Thêm điều kiện tìm kiếm và lọc
        if (searchQuery || statusFilter) {
            query += " WHERE";
            if (searchQuery) {
                query += " (b.title LIKE ? OR b.content LIKE ?)";
                params.push(`%${searchQuery}%`, `%${searchQuery}%`);
                if (statusFilter) {
                    query += " AND";
                }
            }
            if (statusFilter) {
                query += " b.status = ?";
                params.push(statusFilter);
            }
        }
        query += " ORDER BY b.created_at DESC";
        const [blogs] = await db_1.default.query(query, params);
        const formattedBlogs = blogs.map((blog) => ({
            ...blog,
            created_at: new Date(blog.created_at).toLocaleDateString('vi-VN'),
            updated_at: new Date(blog.updated_at).toLocaleDateString('vi-VN'),
            image_url: blog.image ? `http://192.168.1.13:5000/blogs/${blog.image}` : null,
            excerpt: createExcerpt(blog.content)
        }));
        res.json({
            blogs: formattedBlogs,
            count: formattedBlogs.length
        });
    }
    catch (error) {
        console.error('Error fetching blogs:', error);
        res.status(500).json({
            message: 'Lỗi khi lấy danh sách bài viết',
            error: error.message
        });
    }
};
exports.getAllBlogs = getAllBlogs;
// Lấy chi tiết blog theo ID
const getBlogById = async (req, res) => {
    const blogId = req.params.blogId;
    try {
        const [blogs] = await db_1.default.query(`SELECT b.blog_id, b.title, b.content, b.image, b.status,
        b.created_at, b.updated_at, a.username, a.account_id
       FROM blog b
       JOIN account a ON b.author_id = a.account_id
       WHERE b.blog_id = ?`, [blogId]);
        if (blogs.length === 0) {
            res.status(404).json({ message: 'Không tìm thấy bài viết' });
            return;
        }
        const blog = blogs[0];
        const formattedBlog = {
            ...blog,
            created_at: new Date(blog.created_at).toLocaleDateString('vi-VN'),
            updated_at: new Date(blog.updated_at).toLocaleDateString('vi-VN'),
            image_url: blog.image ? `http://192.168.1.13:5000/blogs/${blog.image}` : null
        };
        res.json({ blog: formattedBlog });
    }
    catch (error) {
        console.error('Error fetching blog details:', error);
        res.status(500).json({
            message: 'Lỗi khi lấy chi tiết bài viết',
            error: error.message
        });
    }
};
exports.getBlogById = getBlogById;
// Tạo blog mới
const createBlog = async (req, res) => {
    try {
        const { title, content, status } = req.body;
        const author_id = req.user.id;
        // Kiểm tra dữ liệu đầu vào
        if (!title || !content) {
            res.status(400).json({ message: 'Tiêu đề và nội dung không được để trống' });
            return;
        }
        // Xử lý file ảnh
        let image = null;
        if (req.file) {
            image = req.file.filename;
        }
        // Thêm blog mới vào database
        const [result] = await db_1.default.query(`INSERT INTO blog (title, content, image, author_id, status) 
       VALUES (?, ?, ?, ?, ?)`, [title, content, image, author_id, status || 'draft']);
        // Lấy thông tin blog vừa tạo
        const [blogs] = await db_1.default.query(`SELECT b.blog_id, b.title, b.content, b.image, b.status,
        b.created_at, b.updated_at, a.username
       FROM blog b
       JOIN account a ON b.author_id = a.account_id
       WHERE b.blog_id = ?`, [result.insertId]);
        if (blogs.length === 0) {
            res.status(500).json({ message: 'Lỗi khi tạo bài viết' });
            return;
        }
        const blog = blogs[0];
        const formattedBlog = {
            ...blog,
            created_at: new Date(blog.created_at).toLocaleDateString('vi-VN'),
            updated_at: new Date(blog.updated_at).toLocaleDateString('vi-VN'),
            image_url: blog.image ? `http://192.168.1.13:5000/blogs/${blog.image}` : null,
            excerpt: createExcerpt(blog.content)
        };
        res.status(201).json({
            message: 'Tạo bài viết thành công',
            blog: formattedBlog
        });
    }
    catch (error) {
        console.error('Error creating blog:', error);
        res.status(500).json({
            message: 'Lỗi khi tạo bài viết',
            error: error.message
        });
    }
};
exports.createBlog = createBlog;
// Cập nhật blog
const updateBlog = async (req, res) => {
    try {
        const blogId = req.params.blogId;
        const { title, content, status, removeImage } = req.body;
        // Kiểm tra dữ liệu đầu vào
        if (!title || !content) {
            res.status(400).json({ message: 'Tiêu đề và nội dung không được để trống' });
            return;
        }
        // Kiểm tra blog có tồn tại không
        const [blogs] = await db_1.default.query('SELECT * FROM blog WHERE blog_id = ?', [blogId]);
        if (blogs.length === 0) {
            res.status(404).json({ message: 'Không tìm thấy bài viết' });
            return;
        }
        const oldBlog = blogs[0];
        let image = oldBlog.image;
        // Xử lý file ảnh
        if (req.file) {
            // Xóa ảnh cũ nếu có
            if (oldBlog.image) {
                const oldImagePath = path_1.default.join(__dirname, '../../blogs', oldBlog.image);
                try {
                    if (fs_1.default.existsSync(oldImagePath)) {
                        fs_1.default.unlinkSync(oldImagePath);
                    }
                }
                catch (err) {
                    console.error('Error deleting old image:', err);
                }
            }
            // Lưu tên file mới
            image = req.file.filename;
        }
        else if (removeImage === 'true') {
            // Xóa ảnh hiện tại nếu người dùng muốn xóa
            if (oldBlog.image) {
                try {
                    const oldImagePath = path_1.default.join(__dirname, '../../blogs', oldBlog.image);
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
        // Cập nhật blog trong database
        await db_1.default.query(`UPDATE blog SET title = ?, content = ?, image = ?, status = ?, updated_at = NOW()
       WHERE blog_id = ?`, [title, content, image, status, blogId]);
        // Lấy thông tin blog sau khi cập nhật
        const [updatedBlogs] = await db_1.default.query(`SELECT b.blog_id, b.title, b.content, b.image, b.status,
        b.created_at, b.updated_at, a.username, a.account_id
       FROM blog b
       JOIN account a ON b.author_id = a.account_id
       WHERE b.blog_id = ?`, [blogId]);
        if (updatedBlogs.length === 0) {
            res.status(500).json({ message: 'Lỗi khi cập nhật bài viết' });
            return;
        }
        const updatedBlog = updatedBlogs[0];
        const formattedBlog = {
            ...updatedBlog,
            created_at: new Date(updatedBlog.created_at).toLocaleDateString('vi-VN'),
            updated_at: new Date(updatedBlog.updated_at).toLocaleDateString('vi-VN'),
            image_url: updatedBlog.image ? `http://192.168.1.13:5000/blogs/${updatedBlog.image}` : null,
            excerpt: createExcerpt(updatedBlog.content)
        };
        res.json({
            message: 'Cập nhật bài viết thành công',
            blog: formattedBlog
        });
    }
    catch (error) {
        console.error('Error updating blog:', error);
        res.status(500).json({
            message: 'Lỗi khi cập nhật bài viết',
            error: error.message
        });
    }
};
exports.updateBlog = updateBlog;
// Xóa blog
const deleteBlog = async (req, res) => {
    try {
        const blogId = req.params.blogId;
        // Kiểm tra blog có tồn tại không
        const [blogs] = await db_1.default.query('SELECT * FROM blog WHERE blog_id = ?', [blogId]);
        if (blogs.length === 0) {
            res.status(404).json({ message: 'Không tìm thấy bài viết' });
            return;
        }
        const blog = blogs[0];
        // Xóa file ảnh nếu có
        if (blog.image) {
            const imagePath = path_1.default.join(__dirname, '../../blogs', blog.image);
            try {
                if (fs_1.default.existsSync(imagePath)) {
                    fs_1.default.unlinkSync(imagePath);
                }
            }
            catch (err) {
                console.error('Error deleting image file:', err);
            }
        }
        // Xóa blog trong database
        await db_1.default.query('DELETE FROM blog WHERE blog_id = ?', [blogId]);
        res.json({ message: 'Xóa bài viết thành công' });
    }
    catch (error) {
        console.error('Error deleting blog:', error);
        res.status(500).json({
            message: 'Lỗi khi xóa bài viết',
            error: error.message
        });
    }
};
exports.deleteBlog = deleteBlog;
// Thay đổi trạng thái (draft/published)
const updateBlogStatus = async (req, res) => {
    try {
        const blogId = req.params.blogId;
        const { status } = req.body;
        if (!status || !['draft', 'published'].includes(status)) {
            res.status(400).json({ message: 'Trạng thái không hợp lệ' });
            return;
        }
        // Kiểm tra blog có tồn tại không
        const [blogs] = await db_1.default.query('SELECT * FROM blog WHERE blog_id = ?', [blogId]);
        if (blogs.length === 0) {
            res.status(404).json({ message: 'Không tìm thấy bài viết' });
            return;
        }
        // Cập nhật trạng thái
        await db_1.default.query('UPDATE blog SET status = ?, updated_at = NOW() WHERE blog_id = ?', [status, blogId]);
        res.json({
            message: `Đã ${status === 'published' ? 'xuất bản' : 'lưu nháp'} bài viết thành công`,
            status
        });
    }
    catch (error) {
        console.error('Error updating blog status:', error);
        res.status(500).json({
            message: 'Lỗi khi cập nhật trạng thái bài viết',
            error: error.message
        });
    }
};
exports.updateBlogStatus = updateBlogStatus;
