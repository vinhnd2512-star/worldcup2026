#!/bin/bash
# Script to commit all changes with appropriate message

cd "$(dirname "$0")"

echo "=== Git Log (Recent commits) ==="
git log --oneline -10

echo ""
echo "=== Git Status ==="
git status --short

echo ""
echo "=== Staging all changes ==="
git add -A

echo ""
echo "=== Creating commit ==="
git commit -m "Hoàn thiện phần lịch thi đấu: Golden Boot + mở rộng 48 đội + điều chỉnh odds" \
  -m "Thêm settlement logic cho Golden Boot (Vua phá lưới):
- Market key: golden_boot (outright type)
- Multiplier: 12.00 (cao nhất)
- Prediction bonus: 20 points
- Selection key format: player:{\$player_id}
- Logic: So sánh \$selection_key với \$top_scorer_player_id từ MatchResult

Thêm settlement logic cho Tournament Winner:
- Tăng multiplier từ 4.00 → 8.00 (phản ánh độ khó thực tế: 1/48)
- Prediction bonus: 25 points (giữ nguyên)
- Selection key: team code (e.g., 'BRA')
- Logic: So sánh \$selection_key với \$tournament_winner_team_code

Mở rộng dữ liệu:
- Backend seed.py: 10 → 48 đội
- Supabase schema: Đã hỗ trợ outright_markets, team_players
- Market definitions: Thêm golden_boot market

Cập nhật models:
- MatchResult: Thêm top_scorer_player_id, tournament_winner_team_code
- prediction_bonus(): Thêm golden_boot → 20.00

Testing:
- Thêm 4 unit tests cho tournament_winner và golden_boot
- Tests xác nhận win/loss, payout, bonuses, net_points

Phân tích mức độ khó (**Phù hợp**):
- Draw no bet: 1.65x (dễ)
- Match result: 1.80x (cơ bản)
- Total goals/BTTS/Corners: 1.90-1.95x (trung bình)
- Correct score: 6.00x (khó)
- Tournament winner: 8.00x (khó hơn: 1/48)
- Golden Boot: 12.00x (khó nhất: ~0.4% chance)

Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>"

echo ""
echo "=== Commit Result ==="
git log -1 --oneline
