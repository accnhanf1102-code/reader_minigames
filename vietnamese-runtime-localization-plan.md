# Kế hoạch xử lý tiếng Trung còn sót trong runtime

Kế hoạch ban đầu đã được triển khai theo yêu cầu tiếp theo của người dùng. Kết quả và quy trình bảo trì nằm ở cuối tài liệu.

## Kết quả truy nguồn

- `wu` / `Eh`: tên và mô tả chiến lợi phẩm dựng trực tiếp từ phẩm chất, chủ đề, tên vật liệu và mẫu tiếng Trung. `cw` còn tạo tên, hiệu ứng và mô tả tiếng Trung cho vật phẩm ghi vào hành trang sau kết toán.
- `Xk`: 432 mục vật liệu có lời bình cố định; hai lời bình về kiếm chưa thành và song đao đều ở đây. Mapping hiện có đã chứa hai tên vật liệu tương ứng, nhưng một số đường hiển thị chưa áp dụng.
- `Wh`: lời giải thích chuyển đổi kỹ năng vẫn dùng mẫu tiếng Trung, độc lập với bộ mô tả hiệu ứng `fa`; phải kiểm tra cả reason, fidelity.summary, adaptation.summary và cache cũ.
- `A1` và bộ tóm tắt lựa chọn sự kiện: còn nhãn kết quả, điều kiện, rủi ro và tên thánh vật. Mapping hiện thiếu `预支借据`.
- `_u` / các hàm dựng chiêu quái: tên chiêu ghép từ motif và hậu tố; mapping thiếu `荧幕投射`. `e2` đưa thêm sourceDescription ra tooltip nên bản dịch hiệu ứng không che được mô tả nguồn còn tiếng Trung.
- `$b`: nhật ký hành động có đường định dạng thuộc tính riêng, vẫn dùng replace dấu phân cách và giữ nguyên mã `物`; sửa `Bp` ở lượt trước chưa bao phủ đường này.
- Nhãn NPC trên bản đồ: biến `hi` trong JavaScript đã là tiếng Việt. Gói PCK chứa `game.gdc` và `maps/p5_scene.gdc` đã biên dịch; cần truy thông điệp JS–Godot và nơi Godot dựng nhãn trước khi xác định chỗ sửa. Chưa xác nhận câu chữ cụ thể nằm trong script nào.

## Các bước thực hiện khi được yêu cầu triển khai

1. **Lập danh mục văn bản runtime và đường đi.** Phân loại văn bản UI, dữ liệu nội dung, thông tin do chương trình tự sinh, dữ liệu cache/host và mã nội bộ. Rà cả HTML và Godot; giữ nguyên ID, enum, tên khóa schema và biểu thức máy đọc. Kết quả: mỗi nhóm có nguồn, đầu đọc và đầu ghi được xác định.
2. **Tạo nguồn bản dịch dùng chung.** Tận dụng mapping hiện có, bổ sung thuật ngữ theo ID cho chủ đề, motif, hậu tố chiêu, thánh vật và NPC; dịch trọn 432 lời bình vật liệu với đúng giọng nhân vật. Dùng mẫu có tham số cho câu động; không thay hàng loạt chữ Hán trong bundle. Kết quả: kiểm tra độ phủ dữ liệu, phát hiện khóa thiếu, không âm thầm trả lại chuỗi gốc ở nội dung đã thuộc danh mục.
3. **Nối tất cả điểm trình bày vào nguồn dịch.** Bao phủ `wu/Eh`, tooltip/hành trang/kết toán, sự kiện, tên và mô tả nguồn của chiêu quái, lời giải thích chuyển đổi, các đường nhật ký gồm `$b/Bp`. Mã thuộc tính được đổi thành nhãn chỉ khi hiển thị. Kết quả: cùng một đối tượng hiện nhất quán ở mọi màn hình.
4. **Xử lý đầu ghi và dữ liệu cũ.** Dịch văn bản tự nhiên do `cw` và các bộ sinh nội dung tạo trước khi bàn giao cho SillyTavern. Kiểm tra logic tìm vật phẩm và cộng dồn `Hs/dw`, alias tên cũ, parser hộp mù/vé và nhãn máy đọc; không đổi tên định danh tùy tiện. Với cache cũ, chuẩn hóa nội dung chương trình biết cách dựng lại; giữ nguyên văn bản người dùng. Kết quả: không nhân đôi vật phẩm, mất đồ hay đổi số liệu khi tải lại/kết toán.
5. **Giải quyết nhãn Godot tại nguồn.** Xác định nhãn đến từ bridge hay tài nguyên/script đóng gói. Ưu tiên sửa nguồn và xuất lại PCK nếu có nguồn; nếu kho chỉ có bản xuất, đánh giá cách chỉnh tài nguyên/script cùng công cụ xác thực trước khi triển khai. Kết quả: nhãn NPC trên canvas là tiếng Việt, tương tác và bố cục vẫn hoạt động.
6. **Kiểm chứng toàn tuyến rồi chuẩn bị phát hành.** Quét chữ Hán trong đầu ra thuộc phạm vi đã dịch, có danh sách ngoại lệ rõ ràng cho dữ liệu nội bộ và văn bản người dùng. Kiểm thử 48 chủ đề, danh mục vật liệu/quái/thánh vật/sự kiện, cache cũ và mới; chạy chu trình nhận đồ → xem tooltip → chiến đấu → rời mê cung → ghi host → tải lại. So sánh ID, số lượng, FP, EXP và dữ liệu adapter; kiểm tra bằng trình duyệt cả DOM và canvas, cập nhật manifest/checksum khi sửa tài nguyên. Commit/push thực hiện theo yêu cầu triển khai tiếp theo.

## Tiêu chí nghiệm thu

Các ví dụ và năm ảnh đã báo được giải quyết; không còn chữ Hán trong văn bản do chương trình tạo thuộc các nhóm đã kiểm kê; tên/mô tả thống nhất giữa game và SillyTavern; công thức, phần thưởng, cộng dồn vật phẩm, dữ liệu lưu và adapter ENG ↔ CN không đổi ý nghĩa.

## Kết quả triển khai và bảo trì

- Nguồn dịch tập trung ở `tools/locales/`; bộ nối runtime ở `tools/runtime_localization.js`. Dịch 432 vật liệu, 60 thánh vật, nội dung sự kiện, chủ đề/motif/chiêu quái, mô tả chuyển đổi, nhật ký và các nhãn trình bày. Giữ nguyên ID, enum và khóa schema nội bộ.
- Vật phẩm do game tạo được dịch trước khi ghi host. Chuẩn hóa hành trang cũ chỉ áp dụng cho đồ mang nhãn `书海`, bảo toàn số lượng, xử lý trùng tên khác hiệu ứng riêng; giữ tên định danh vé FP phục vụ parser. Văn bản người dùng không thuộc danh mục được giữ nguyên.
- Bảy nhãn bản đồ nằm trong hằng chuỗi `game.gdc` của PCK. Kho không chứa dự án Godot nguồn; công cụ `localize_godot_labels.mjs` vá riêng hằng chuỗi, cập nhật MD5 tài nguyên và gzip, kiểm tra tính lặp lại và bảo toàn các phần còn lại.
- Kiểm thử 3.031 cấu hình cấp quái và 69.822 dòng hiệu ứng; so sánh dấu SHA-256 dữ liệu cơ chế với commit `90cca82`. Kiểm tra sự kiện, vật liệu, thánh vật, chuyển đổi adapter và cộng dồn đồ cũ/mới. Gói mới đã khởi động trong trình duyệt Godot.
- Khi đổi bản dịch: chạy `node tools/build_runtime_locale.mjs`, sau đó `node tools/update_release_manifest.mjs`. Khi đổi nhãn bản đồ: chạy `node tools/localize_godot_labels.mjs` trước cập nhật manifest. Dùng Node 24 cho công cụ PCK.
- Kiểm chứng: `node --check site/distribution.js`, `node tools/test_skill_display_vi.mjs`, `node tools/test_runtime_localization.mjs`, `node tools/test_godot_labels.mjs`, `node tools/test_async_host.mjs`, `node tools/test_reader_loader.mjs`, `python tools/materialize.py`. CI Pages chạy cùng các kiểm tra trước khi phát hành.
- Phạm vi xác minh host là fixture và adapter với dữ liệu mẫu; cần test lại chat thực tế của người dùng sau khi cập nhật. Dữ liệu do AI/người dùng tự viết ngoài danh mục không bị dịch cưỡng bức.
