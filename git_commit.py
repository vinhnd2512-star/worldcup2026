#!/usr/bin/env python3
"""
Git commit script - Stage and commit all changes with appropriate message
"""
import subprocess
import sys
import os

# Change to repo directory
repo_dir = r"c:\Users\user\OneDrive\Cong - iCapital Intern\Project Z - Khác\web_app_worldcup.worktrees\agents-sheet-lich-thi-dau-du-doan"
os.chdir(repo_dir)

def run_cmd(cmd, show_output=True):
    """Run a command and return success status"""
    try:
        result = subprocess.run(cmd, capture_output=True, text=True, shell=True)
        if show_output:
            if result.stdout:
                print(result.stdout)
            if result.stderr and "warning" not in result.stderr.lower():
                print("STDERR:", result.stderr)
        return result.returncode == 0, result.stdout, result.stderr
    except Exception as e:
        print(f"Error running command: {e}")
        return False, "", str(e)

print("=" * 60)
print("GIT COMMIT SCRIPT")
print("=" * 60)

# Step 1: Check status
print("\n📊 Current git status:")
print("-" * 60)
success, stdout, _ = run_cmd("git status --short")
if not success or not stdout.strip():
    print("✅ Working tree clean - nothing to commit")
    sys.exit(0)

print(stdout)

# Step 2: Stage all changes
print("\n📦 Staging all changes...")
print("-" * 60)
success, stdout, stderr = run_cmd("git add -A")
if success:
    print("✅ Changes staged successfully")
else:
    print("❌ Failed to stage changes")
    print(stderr)
    sys.exit(1)

# Step 3: Create commit message
commit_message = """Hoàn thiện phần lịch thi đấu: Golden Boot + mở rộng 48 đội + điều chỉnh odds

Thêm settlement logic cho Golden Boot (Vua phá lưới):
- Market key: golden_boot (outright type)
- Multiplier: 12.00 (cao nhất)
- Prediction bonus: 20 points
- Selection key format: player:{player_id}
- Logic: So sánh selection_key với top_scorer_player_id từ MatchResult

Thêm settlement logic cho Tournament Winner:
- Tăng multiplier từ 4.00 → 8.00 (phản ánh độ khó: 1/48)
- Prediction bonus: 25 points
- Selection key: team code (e.g., 'BRA')
- Logic: So sánh selection_key với tournament_winner_team_code

Mở rộng dữ liệu:
- Backend seed.py: 10 → 48 đội
- Supabase schema: Hỗ trợ outright_markets, team_players
- Market definitions: Thêm golden_boot market

Cập nhật models:
- MatchResult: Thêm top_scorer_player_id, tournament_winner_team_code
- prediction_bonus(): Thêm golden_boot → 20.00

Testing:
- Thêm 4 unit tests cho tournament_winner và golden_boot

Phân tích mức độ khó (phù hợp):
- Draw no bet: 1.65x (dễ)
- Match result: 1.80x (cơ bản)
- Total goals/BTTS/Corners: 1.90-1.95x (trung bình)
- Correct score: 6.00x (khó)
- Tournament winner: 8.00x (khó hơn: 1/48)
- Golden Boot: 12.00x (khó nhất: ~0.4% chance)

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"""

# Step 4: Commit changes
print("\n💾 Creating commit...")
print("-" * 60)
success, stdout, stderr = run_cmd(f'git commit -m "{commit_message}"')
if success:
    print("✅ Commit created successfully!")
else:
    print("❌ Commit failed!")
    if stderr:
        print("Error:", stderr)
    sys.exit(1)

# Step 5: Show commit details
print("\n📋 Commit details:")
print("-" * 60)
run_cmd("git log -1 --oneline")

print("\n" + "=" * 60)
print("✨ COMMIT COMPLETE!")
print("=" * 60)
