"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const auth_1 = __importDefault(require("./routes/auth"));
const home_1 = __importDefault(require("./routes/home"));
const menu_1 = __importDefault(require("./routes/menu"));
const user_1 = __importDefault(require("./routes/user"));
const orders_1 = __importDefault(require("./routes/orders"));
const reviews_1 = __importDefault(require("./routes/reviews"));
const contact_1 = __importDefault(require("./routes/contact"));
const blogs_1 = __importDefault(require("./routes/blogs"));
const admin_1 = __importDefault(require("./routes/admin")); // Thêm dòng này
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Thư mục lưu trữ
const uploadDir = path_1.default.join(__dirname, '../profile_images');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
    console.log('Đã tạo thư mục profile_images');
}
// Cấu hình static cho các thư mục tài nguyên
app.use('/foods', express_1.default.static(path_1.default.join(__dirname, '../foods')));
app.use('/blogs', express_1.default.static(path_1.default.join(__dirname, '../blogs')));
app.use('/profile_images', express_1.default.static(path_1.default.join(__dirname, '../profile_images')));
// Routes API
app.use('/api/auth', auth_1.default);
app.use('/api/home', home_1.default);
app.use('/api/menu', menu_1.default);
app.use('/api/user', user_1.default);
app.use('/api/orders', orders_1.default);
app.use('/api/reviews', reviews_1.default);
app.use('/api/contact', contact_1.default);
app.use('/api/blogs', blogs_1.default);
app.use('/api/admin', admin_1.default); // Thêm route admin
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Máy chủ đang chạy tại cổng ${PORT}`);
});
