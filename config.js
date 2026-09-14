// Trỏ frontend sang backend đã deploy — tương đương file .env cho 1 site tĩnh không có bước
// build (không dùng được .env thật vì trình duyệt không tự đọc file .env). Sao chép/đối chiếu
// với config.example.js khi cần đổi giá trị cho môi trường khác (local, staging...).
window.KV_API_BASE = 'https://kimie-backend.onrender.com';
