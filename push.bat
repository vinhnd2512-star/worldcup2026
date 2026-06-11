@echo off
REM Git Push Script - Chạy từ project directory
REM This script will stage, commit, and push all changes

cd /d "c:\Users\user\OneDrive\Cong - iCapital Intern\Project Z - Khác\web_app_worldcup.worktrees\agents-sheet-lich-thi-dau-du-doan"

echo.
echo ====================================================================
echo GIT WORKFLOW: ADD ^> COMMIT ^> PUSH
echo ====================================================================
echo.

REM Step 1: Show status
echo [1/5] Checking git status...
git status --short

REM Step 2: Add all
echo.
echo [2/5] Staging all changes...
git add -A
if errorlevel 1 goto error

REM Step 3: Commit with message
echo.
echo [3/5] Creating commit...
git commit -m "Điều chỉnh odds để phản ánh độ khó thực tế: Tournament Winner ^& Golden Boot" ^
 -m "Phân tích toán học: Tournament Winner (1/48) = 8.00x ^> 50.00x, Golden Boot (1/200) = 12.00x ^> 120.00x. Bonus: 25^>40 pts, 20^>50 pts"
if errorlevel 1 goto error

REM Step 4: Show commit log
echo.
echo [4/5] Commit details:
git log -1 --oneline

REM Step 5: Push
echo.
echo [5/5] Pushing to remote...
git push
if errorlevel 1 goto push_error

echo.
echo ====================================================================
echo ✅ SUCCESS! All changes have been pushed.
echo ====================================================================
pause
goto end

:error
echo.
echo ❌ ERROR: Commit failed!
echo Please check your git configuration and try again.
pause
goto end

:push_error
echo.
echo ⚠️  PUSH WARNING: Check git configuration
echo You may need to set upstream branch with:
echo   git push --set-upstream origin branch-name
echo.
echo Or check if your branch/remote is configured correctly with:
echo   git branch -vv
echo   git remote -v
pause
goto end

:end
