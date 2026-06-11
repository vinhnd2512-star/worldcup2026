@echo off
REM Windows batch script for git operations
cd "c:\Users\user\OneDrive\Cong - iCapital Intern\Project Z - Khác\web_app_worldcup.worktrees\agents-sheet-lich-thi-dau-du-doan"

echo Checking git status...
git status --short

echo.
echo Modified files:
git diff --name-only

echo.
echo Staging changes...
git add -A

echo.
echo Creating commit...
git commit -m "Hoàn thiện phần lịch thi đấu: thêm Golden Boot, mở rộng 48 đội, điều chỉnh odds

- Thêm settlement logic cho Golden Boot (Vua phá lưới) với multiplier 12.00 và bonus 20 points
- Thêm settlement logic cho Tournament Winner với multiplier tăng từ 4.00 lên 8.00 và bonus 25 points
- Mở rộng từ 10 đội lên 48 đội trong backend seed.py
- Cập nhật market_definitions với golden_boot market (outright type)
- Thêm top_scorer_player_id và tournament_winner_team_code fields trong MatchResult dataclass
- Cập nhật prediction_bonus dictionary với golden_boot bonus (20.00)
- Thêm settlement tests cho Tournament Winner và Golden Boot markets
- Sửa typo JPN trong seed.py
- Điều chỉnh tournament_winner multiplier từ 4.00 → 8.00 trong supabase/seed.sql

Phân tích mức độ khó:
- Vua phá lưới (Golden Boot): 12.00x odds - khó nhất (~0.4% chance ngẫu nhiên)
- Vô địch giải (Tournament Winner): 8.00x odds - khó hơn dự đoán tỷ số (~2% chance)
- Các markets khác giữ nguyên vì phù hợp với độ khó tương ứng

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"

if errorlevel 1 (
  echo Commit failed!
  exit /b 1
) else (
  echo.
  echo Commit successful!
  echo Log:
  git log -1 --oneline
)
