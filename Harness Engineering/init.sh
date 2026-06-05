#!/bin/bash
# init.sh — Chạy đầu mỗi session Claude Code
set -e
echo "=== Harness Init ==="
echo ""
echo "[ ENV CHECK ]"
[ ! -f ".env" ] && echo "  WARNING: .env không tồn tại — copy .env.example" || echo "  .env: OK"

echo ""
echo "[ CURRENT STATE — claude-progress.md ]"
head -25 claude-progress.md 2>/dev/null || echo "  (chưa có)"

echo ""
echo "[ FEATURE LIST — in_progress / todo ]"
python3 -c "
import json, sys
try:
    data = json.load(open('feature_list.json'))
    for f in data.get('features', []):
        if f.get('status') in ('in_progress', 'todo'):
            print(f\"  [{f['status'].upper():12s}] {f['id']}: {f['name']}\")
except Exception as e:
    print(f'  (error reading feature_list.json: {e})')
" 2>/dev/null

echo ""
echo "[ GIT STATUS ]"
git status --short 2>/dev/null || echo "  (not a git repo)"
echo ""
echo "=== Ready. Đọc AGENTS.md để bắt đầu. ==="
