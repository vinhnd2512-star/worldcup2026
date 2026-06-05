# Harness Template

Quy trình mẫu cho mọi dự án mới với Claude Code.

## Cách dùng

### 1. Copy template vào project mới
```bash
cp -r ~/Desktop/harness-template/ ~/projects/my-new-project/
```

### 2. Điền thông tin project vào
- **CLAUDE.md**: project snapshot, tech stack, commands, architecture rules
- **feature_list.json**: điền features thực tế của project
- **docs/architecture.md**: mô tả kiến trúc
- **.env.example**: các env vars cần thiết

### 3. Đầu mỗi session Claude Code
```bash
bash scripts/init.sh
```
→ Claude sẽ thấy state hiện tại và biết bắt đầu từ đâu.

### 4. Workflow chuẩn mỗi task
```
/plan     → viết spec, confirm với bạn
[implement]
/verify   → chạy tests + lint + check criteria
/review   → review độc lập như reviewer
/session-end → cập nhật state, ready cho session sau
```

## Cấu trúc file

```
harness-template/
├── AGENTS.md              ← Entry point (đọc đầu tiên)
├── CLAUDE.md              ← Rules, commands, architecture
├── claude-progress.md     ← State giữa sessions
├── feature_list.json      ← Backlog + trạng thái features
├── .env.example           ← Template env vars
├── .gitignore
├── README.md
├── .claude/
│   ├── settings.json      ← Permissions + hooks
│   └── commands/
│       ├── plan.md        ← /plan
│       ├── verify.md      ← /verify
│       ├── review.md      ← /review
│       └── session-end.md ← /session-end
├── memory/
│   ├── MEMORY.md          ← Index của knowledge
│   └── lessons.md         ← Lessons learned template
├── specs/
│   └── spec.md            ← Spec task hiện tại
├── docs/
│   └── architecture.md    ← Chi tiết kiến trúc
└── scripts/
    ├── init.sh            ← Session init script
    └── check_secrets.py   ← PreToolUse security hook
```

## Nguyên tắc cốt lõi (từ walkinglabs/learn-harness-engineering)

1. **Model quyết định viết code gì. Harness quyết định khi nào, ở đâu, và như thế nào.**
2. **State layer** (claude-progress.md + feature_list.json) = bridge giữa sessions
3. **Verification** trước khi claim done — không chỉ "trông có vẻ đúng"
4. **1 feature at a time** — không làm nửa chừng 3 thứ cùng lúc
5. **Session lifecycle**: init → work → verify → update state → end

## Nguồn tham khảo
- https://github.com/walkinglabs/learn-harness-engineering
- Anthropic: Effective harnesses for long-running agents
- OpenAI: Harness engineering in an agent-first world
