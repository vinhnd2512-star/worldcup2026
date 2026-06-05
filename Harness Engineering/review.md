# /review — Code review độc lập

**Đóng vai reviewer khác — không phải người vừa viết code.**

## Checklist

1. Đọc lại tất cả files đã thay đổi
2. Kiểm tra:
   - Edge cases: null, empty, network error, concurrent access
   - Type hints đầy đủ
   - Error handling cụ thể (không bare `except:`)
   - Architecture rules (xem CLAUDE.md) không bị vi phạm
   - Hardcoded values nên là constants
   - Test: happy path + error path

3. Output:
```
=== Code Review ===
✓ OK:
  - [list]

✗ Issues:
  - [file:line] [mô tả]

? Cần human quyết định:
  - [vấn đề]

Verdict: READY | NEEDS_FIX
```

4. Fix issues. Chỉ báo READY khi không còn ✗.
