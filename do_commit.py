#!/usr/bin/env python3
"""Git commit script for changes"""
import os
import subprocess
import sys

os.chdir("c:\\Users\\user\\OneDrive\\Cong - iCapital Intern\\Project Z - Khác\\web_app_worldcup.worktrees\\agents-sheet-lich-thi-dau-du-doan")

# Check git status
print("=== Checking git status ===")
result = subprocess.run(["git", "status", "--short"], capture_output=True, text=True)
print(result.stdout)

if "nothing to commit" in result.stdout or (result.stdout.strip() == "" and subprocess.run(["git", "diff", "--quiet"], capture_output=True).returncode == 0):
    print("✅ No changes to commit")
    sys.exit(0)

# Stage all changes
print("\n=== Staging changes ===")
subprocess.run(["git", "add", "-A"], check=True)

# Prepare commit message
message = """Hoàn thiện phần lịch thi đấu: Golden Boot + mở rộng 48 đội + điều chỉnh odds

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
- Draw no bet: 1.65x
- Match result: 1.80x
- Total goals/BTTS/Corners: 1.90-1.95x
- Correct score: 6.00x
- Tournament winner: 8.00x (1/48)
- Golden Boot: 12.00x (~0.4% chance)

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"""

# Commit
print("\n=== Creating commit ===")
result = subprocess.run(["git", "commit", "-m", message], capture_output=True, text=True)
print(result.stdout)
if result.stderr:
    print("STDERR:", result.stderr)

# Show result
print("\n=== Commit Result ===")
subprocess.run(["git", "log", "-1", "--oneline"])
