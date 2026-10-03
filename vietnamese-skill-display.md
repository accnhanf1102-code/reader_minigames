# Việt hóa mô tả kỹ năng

- [x] Dịch các nhánh hiệu ứng, công thức, thời hạn, điều kiện, kích hoạt và tiêu hao trong bộ dựng mô tả.
- [x] Ánh xạ phẩm chất, thuộc tính và tên dự phòng tại các điểm hiển thị, bao gồm cache cũ.
- [x] Yêu cầu AI dùng tiếng Việt cho văn bản tự do, giữ nguyên schema và enum.
- [x] Kiểm thử toàn bộ loại hiệu ứng, dữ liệu Card mẫu và giao diện; cập nhật manifest.
- Phát hành: commit và push lên main; kiểm tra trạng thái triển khai GitHub Pages.

Hoàn thành khi văn bản được game dựng trong phạm vi kỹ năng/trạng thái không còn chữ Hán, số liệu không đổi và gói phát hành được xác thực.

Kiểm chứng: 41 trường hợp hiệu ứng phủ toàn bộ nhánh op; các nhãn quy tắc, mốc kích hoạt, thời hạn; công thức và tên cache cũ; hợp đồng ngôn ngữ AI; màn hình Chuẩn bị bằng trình duyệt; adapter đồng bộ/bất đồng bộ; loader gzip; manifest phát hành.

`tools/skill-display-vi.json` ghi lại các chuỗi dịch tham khảo của bộ dựng. Khóa và enum của engine vẫn giữ nguyên.
