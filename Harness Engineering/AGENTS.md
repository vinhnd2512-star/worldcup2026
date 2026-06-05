# AGENTS.md — Entry Point

> Đọc file này đầu tiên. Không đọc hết mọi thứ ngay — load theo nhu cầu.

## Bước 1: Hiểu project
→ Đọc: CLAUDE.md (rules + commands + architecture)

## Bước 2: Biết đang ở đâu
→ Đọc: claude-progress.md (session trước dừng ở đâu, còn gì chưa xong)
→ Đọc: feature_list.json (toàn bộ backlog + trạng thái từng feature)

## Bước 3: Nhận task mới
→ Chạy: /plan  (viết spec trước khi code)
→ Đọc: specs/spec.md sau khi /plan tạo xong

## Bước 4: Làm việc
→ Implement từng feature nhỏ (1 feature at a time)
→ Verify trước khi claim done (xem CLAUDE.md → Commands)
→ Không tự commit hay push

## Bước 5: Kết thúc session
→ Cập nhật: claude-progress.md
→ Cập nhật: feature_list.json (đổi status feature vừa làm)
→ Chạy verification cuối: xem CLAUDE.md → Commands

## Files tham khảo thêm (chỉ load khi cần)
- memory/MEMORY.md        ← lesson learned, decisions log
- memory/[topic].md       ← topic files cụ thể
- docs/architecture.md    ← chi tiết kiến trúc nếu cần
