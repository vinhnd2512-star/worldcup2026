# CLAUDE.md — Project Rules

> Đây là rules layer. AGENTS.md là entry point. Đọc AGENTS.md trước.

## Project snapshot
[TÊN PROJECT] — [1 câu mô tả ngắn gọn mục đích]
Tech stack: [ngôn ngữ, framework chính]
Developer: [solo / team size]

## Commands — chạy trước khi claim "done"
```
[install command]     # ví dụ: pip install -r requirements.txt
[test command]        # ví dụ: python -m pytest tests/ -v   ← MUST PASS
[lint command]        # ví dụ: ruff check src/
[typecheck command]   # ví dụ: mypy src/
[smoke test]          # ví dụ: python main.py --dry-run
```

## Repository layout
```
src/
  [module_1]/    ← [vai trò của module này]
  [module_2]/    ← [vai trò]
tests/
  unit/          ← fast, no network
  integration/   ← requires env vars
docs/
memory/          ← MEMORY.md + topic files
specs/           ← spec.md của task hiện tại
scripts/         ← hooks, utilities
```

## Architecture rules — KHÔNG được vi phạm
1. [Rule cụ thể #1 — verifiable]
2. [Rule cụ thể #2]
3. API keys/tokens chỉ trong .env — không hardcode, không log
4. [Dependency direction nếu có: A → B → C]

## Coding conventions
- [Convention #1: ví dụ "type hints bắt buộc cho public functions"]
- [Convention #2: ví dụ "Google style docstrings"]
- [Convention #3: ví dụ "log bằng structlog, không dùng print()"]

## Definition of done — feature CHƯA xong nếu thiếu
- [ ] Tests pass (pytest / vitest / jest)
- [ ] Lint clean
- [ ] Type check clean
- [ ] Smoke test không crash
- [ ] claude-progress.md đã cập nhật

## Final response format — BẮT BUỘC sau mỗi task
```
Files changed: [list]
Tests: passed X / failed Y
Lint: clean / issues: [list]
Untested areas: [nếu có]
Next: [feature tiếp theo trong feature_list.json]
```

## What NOT to do
- Không tự commit hoặc push
- Không tự ý thêm dependency mới
- Không sửa file ngoài scope của task hiện tại
- Không tiếp tục khi gặp stop condition trong spec.md
