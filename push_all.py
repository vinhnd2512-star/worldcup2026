#!/usr/bin/env python3
"""
Complete git workflow: add, commit, and push changes
"""
import subprocess
import sys
import os

repo_dir = r"c:\Users\user\OneDrive\Cong - iCapital Intern\Project Z - Khác\web_app_worldcup.worktrees\agents-sheet-lich-thi-dau-du-doan"
os.chdir(repo_dir)

def run_git(cmd, show_output=True):
    """Execute git command"""
    try:
        result = subprocess.run(f"git {cmd}", capture_output=True, text=True, shell=True)
        if show_output and result.stdout:
            print(result.stdout)
        if result.stderr and "warning" not in result.stderr.lower():
            print("STDERR:", result.stderr)
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        print(f"❌ Error: {e}")
        return False, "", str(e)

print("=" * 70)
print("GIT WORKFLOW: ADD → COMMIT → PUSH")
print("=" * 70)

# Step 1: Show current status
print("\n📊 1. CURRENT STATUS")
print("-" * 70)
run_git("status --short")

# Step 2: Add all changes
print("\n📦 2. STAGING ALL CHANGES")
print("-" * 70)
success, _, _ = run_git("add -A", show_output=False)
if success:
    print("✅ All changes staged")
    run_git("status --short")
else:
    print("❌ Failed to stage changes")
    sys.exit(1)

# Step 3: Commit with detailed message
print("\n💾 3. CREATING COMMIT")
print("-" * 70)

commit_message = """Điều chỉnh odds để phản ánh độ khó thực tế: Tournament Winner & Golden Boot

Phân tích toán học:
- Tournament Winner: 1/48 teams = 2.08% (fair odds ~48x)
  * Cũ: 8.00x (margin 83%)
  * Mới: 50.00x (margin 2%)
  * Bonus: 25 → 40 points

- Golden Boot: ~1/200 players = 0.5% (fair odds ~200x)
  * Cũ: 12.00x (margin 95%)
  * Mới: 120.00x (margin 0.8%)
  * Bonus: 20 → 50 points

So sánh với nhà cái thực tế (Bet365, William Hill, DraftKings):
- Tournament Winner: 25-150x range ✅ (mới 50x phù hợp)
- Golden Boot: 50-250x range ✅ (mới 120x phù hợp)

Cập nhật logic:
- Không suy luận từ match betting (x300 là correct_score hiếm)
- Dùng xác suất từ supercomputer hoặc simulation
- Áp dụng fair odds formula: 1 / probability
- Tính bonuses theo tỷ lệ odds (~1 point per 3x)

Files thay đổi:
- backend/app/core/settlement.py: prediction_bonus() values
- backend/app/seed.py: multipliers + bonuses
- supabase/seed.sql: multipliers + bonuses
- backend/tests/test_settlement.py: updated test values
- ODDS_ANALYSIS.md: lý do & phân tích

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"""

success, stdout, _ = run_git(f'commit -m "{commit_message}"')
if success:
    print("✅ Commit created successfully!")
else:
    print("❌ Commit failed!")
    sys.exit(1)

# Step 4: Show commit log
print("\n📋 4. COMMIT DETAILS")
print("-" * 70)
run_git("log -1 --oneline")
run_git("log -1 --format=%B")

# Step 5: Push to remote
print("\n🚀 5. PUSHING TO REMOTE")
print("-" * 70)
success, stdout, stderr = run_git("push")
if success:
    print("✅ Push successful!")
    if stdout:
        print(stdout)
else:
    print("⚠️  Push may need remote configuration")
    print("If this is the first push, run:")
    print("  git push --set-upstream origin <branch>")
    print("\nTo check remote:")
    print("  git remote -v")

# Step 6: Final status
print("\n✅ 6. FINAL STATUS")
print("-" * 70)
run_git("status")

print("\n" + "=" * 70)
print("✨ GIT WORKFLOW COMPLETE!")
print("=" * 70)
