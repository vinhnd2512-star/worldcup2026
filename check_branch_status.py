#!/usr/bin/env python3
"""
Check Git Branch Sync Status
Kiểm tra xem nhánh hiện tại có đồng bộ được với nhánh cũ không
"""

import subprocess
import os

os.chdir(r"c:\Users\user\OneDrive\Cong - iCapital Intern\Project Z - Khác\web_app_worldcup.worktrees\agents-sheet-lich-thi-dau-du-doan")

def run(cmd):
    """Run git command"""
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    return result.stdout.strip()

print("\n" + "="*70)
print("📊 GIT BRANCH SYNC STATUS")
print("="*70)

# Current branch
print("\n1️⃣  CURRENT BRANCH:")
print(run("git branch -v"))

# Log
print("\n2️⃣  RECENT COMMITS:")
print(run("git log --oneline -5"))

# Remote
print("\n3️⃣  REMOTE:")
print(run("git remote -v"))

# Status
print("\n4️⃣  CHANGES:")
output = run("git status --short")
if output:
    print(output)
else:
    print("✅ Working tree clean")

# Fetch info
print("\n5️⃣  FETCH INFO:")
print(run("git fetch --dry-run 2>&1 | head -10 || echo 'No fetch info'"))

# Compare with origin
print("\n6️⃣  COMPARISON WITH ORIGIN:")
try:
    behind = run("git rev-list --count HEAD..origin/HEAD 2>nul || echo '?'")
    ahead = run("git rev-list --count origin/HEAD..HEAD 2>nul || echo '?'")
    print(f"Commits BEHIND origin/HEAD: {behind}")
    print(f"Commits AHEAD of origin/HEAD: {ahead}")
except:
    print("❌ Cannot compare (origin/HEAD may not exist)")

print("\n" + "="*70)
