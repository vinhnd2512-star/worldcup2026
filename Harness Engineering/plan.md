# /plan — Tạo spec trước khi implement

**Bao giờ cũng chạy command này trước khi bắt đầu code.**

## Quy trình

1. Đọc claude-progress.md → biết đang ở đâu
2. Đọc feature_list.json → chọn feature "in_progress" hoặc "todo" ưu tiên cao
3. Đọc memory/MEMORY.md → check relevant context
4. Tạo/cập nhật specs/spec.md:

```markdown
# Spec: [Tên — ID]
**Status**: drafting
**Date**: [hôm nay]

## Goal
[1 câu outcome khi done]

## Scope
- [sẽ thay đổi gì]

## Out of scope
- [gì KHÔNG thay đổi]

## Acceptance criteria
- [ ] [testable criterion]

## Unknowns (trả lời trước khi code)
- [câu hỏi nếu có]

## Stop conditions (dừng + hỏi người dùng khi)
- [điều kiện dừng]

## Files likely affected
- [path/file] (new/modified)
```

5. **DỪNG — hỏi**: "Spec này đúng không? Tôi bắt đầu implement chưa?"
6. Chỉ implement sau xác nhận.
