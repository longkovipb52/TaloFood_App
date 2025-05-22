import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '', // thay bằng mật khẩu của bạn
  database: 'talofood',
  port: 3307, // đúng với file SQL bạn gửi
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;