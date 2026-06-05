"""
PreToolUse hook — chạy trước mỗi lần Claude write file.
exit(2) = block tool use. Claude sẽ thấy stderr và tự sửa.
"""
import sys, re

PATTERNS = [
    (r'(?i)bot\d{9,10}:[A-Za-z0-9_-]{35}',                 "Telegram bot token"),
    (r'(?i)(api_key|apikey)\s*=\s*["\'][^"\']{8,}["\']',    "Hardcoded API key"),
    (r'(?i)(secret|password)\s*=\s*["\'][^"\']{8,}["\']',   "Hardcoded secret"),
    (r'sk-[A-Za-z0-9]{32,}',                                 "OpenAI/Anthropic key"),
]
EXEMPT = [".env.example", "check_secrets.py", "CLAUDE.md", "AGENTS.md", ".md"]

def main():
    fp = sys.argv[1] if len(sys.argv) > 1 else ""
    content = sys.argv[2] if len(sys.argv) > 2 else ""
    if any(fp.endswith(e) for e in EXEMPT):
        return
    for pattern, label in PATTERNS:
        if re.search(pattern, content):
            print(f"[BLOCKED] {label} in {fp}", file=sys.stderr)
            print("→ Dùng os.getenv('KEY') thay vì hardcode", file=sys.stderr)
            sys.exit(2)

if __name__ == "__main__":
    main()
