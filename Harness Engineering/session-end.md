# /session-end — Dọn dẹp cuối session

**Chạy trước khi đóng terminal. Bridge sang session tiếp theo.**

## Quy trình

1. Cập nhật claude-progress.md:
   - Session date hôm nay
   - Feature đã làm + status
   - Tasks còn dở
   - Context quan trọng cho session tiếp theo
   - Blocked/unknowns

2. Cập nhật feature_list.json:
   - Đổi status phù hợp

3. Chạy verify nhanh nếu có changes chưa verify

4. Output:
```
=== Session Summary ===
Done today:  [list]
In progress: [feature, % estimate]
Next:        [bắt đầu từ đâu session sau]
Blocked:     [nếu có]
State saved: claude-progress.md ✓ | feature_list.json ✓
```
