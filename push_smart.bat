@echo off
REM Git Push - Sử dụng đường dẫn ngắn (8.3 format)

REM Lấy tên thư mục rút gọn
for /f "tokens=*" %%A in ('cd') do set "CURRENT_DIR=%%A"

echo Current directory: %CURRENT_DIR%
echo.

REM Cố gắng chuyển đến worktree
cd /d "C:\Users\user\OneDrive" 2>nul
if errorlevel 1 (
    echo Trying alternative path...
    cd /d "C:\Users\user"
)

REM Tìm các worktree directories
echo.
echo Searching for project directory...
dir /s /b /ad "*agents-sheet*" 2>nul | findstr /i "agents" > temp_path.txt

REM Đọc đường dẫn tìm được
for /f "tokens=*" %%P in (temp_path.txt) do (
    echo Found: %%P
    cd /d "%%P"
    if not errorlevel 1 goto found
)

echo.
echo ERROR: Could not find project directory
del temp_path.txt 2>nul
pause
exit /b 1

:found
del temp_path.txt 2>nul
echo.
echo SUCCESS: Changed to project directory
cd

echo.
echo ====================================================================
echo GIT WORKFLOW: ADD ^> COMMIT ^> PUSH
echo ====================================================================
echo.

REM Show status
echo [1/5] Checking git status...
git status --short
if errorlevel 1 goto error

echo.
echo [2/5] Staging all changes...
git add -A
if errorlevel 1 goto error

echo.
echo [3/5] Creating commit...
git commit -m "Điều chỉnh odds để phản ánh độ khó thực tế: Tournament Winner & Golden Boot" ^
 -m "Tournament Winner: 50.00x, Golden Boot: 120.00x"
if errorlevel 1 goto error

echo.
echo [4/5] Commit details:
git log -1 --oneline

echo.
echo [5/5] Pushing to remote...
git push
if errorlevel 1 (
    echo.
    echo Trying with upstream...
    git push --set-upstream origin HEAD
)

echo.
echo ====================================================================
echo ✅ SUCCESS! All changes have been pushed.
echo ====================================================================
pause
goto end

:error
echo.
echo ❌ ERROR occurred!
echo Checking git status...
git status
pause
goto end

:end
