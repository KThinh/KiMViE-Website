// Mẫu cho config.js — sao chép file này thành config.js rồi chỉnh window.KV_API_BASE.
//
// - Deploy backend riêng (Render, Hugging Face Spaces...): đặt URL đầy đủ của backend, vd.
//   'https://kimie-backend.onrender.com' (không có dấu "/" ở cuối).
// - Chạy local theo hướng dẫn ở KiMiE-Backend/README.md (backend tự mount luôn frontend này,
//   cùng origin): để trống '' — không cần chỉnh gì thêm.
window.KV_API_BASE = '';
