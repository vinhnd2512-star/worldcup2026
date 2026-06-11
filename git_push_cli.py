#!/usr/bin/env python3
"""
Git Push Script - Push all staged/unstaged changes to remote
Tự động: add → commit → push
"""

import subprocess
import sys
import os

# Set working directory
os.chdir(r"c:\Users\user\OneDrive\Cong - iCapital Intern\Project Z - Khác\web_app_worldcup.worktrees\agents-sheet-lich-thi-dau-du-doan")

def run_cmd(cmd, description):
    """Run command and return result"""
    print(f"\n{'='*70}")
    print(f"[*] {description}")
    print(f"{'='*70}")
    try:
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        output = result.stdout + result.stderr
        print(output)
        
        if result.returncode != 0 and "nothing to commit" not in output.lower():
            print(f"⚠️  Command failed with code {result.returncode}")
            return False
        return True
    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False

def main():
    print("\n" + "="*70)
    print("🚀 GIT WORKFLOW: ADD → COMMIT → PUSH")
    print("="*70)
    
    # Step 1: Status
    if not run_cmd("git status --short", "[1/5] Checking git status"):
        sys.exit(1)
    
    # Step 2: Add all
    if not run_cmd("git add -A", "[2/5] Staging all changes"):
        sys.exit(1)
    
    # Step 3: Commit
    commit_msg = "Điều chỉnh odds để phản ánh độ khó thực tế: Tournament Winner & Golden Boot"
    commit_body = "Tournament Winner: 1/48 = 8.00x > 50.00x, Golden Boot: 1/200 = 12.00x > 120.00x"
    
    cmd = f'git commit -m "{commit_msg}" -m "{commit_body}"'
    if not run_cmd(cmd, "[3/5] Creating commit"):
        print("⚠️  Commit may have failed or nothing to commit")
    
    # Step 4: Show log
    if not run_cmd("git log -1 --oneline", "[4/5] Commit details"):
        sys.exit(1)
    
    # Step 5: Push
    if not run_cmd("git push", "[5/5] Pushing to remote"):
        print("\n⚠️  Push may have failed")
        print("\nTrying with upstream...")
        if not run_cmd("git push --set-upstream origin HEAD", "[5b/5] Setting upstream & pushing"):
            print("\n❌ Push failed. Check your git configuration:")
            print("  git branch -vv     (show tracking info)")
            print("  git remote -v      (show remotes)")
            sys.exit(1)
    
    print("\n" + "="*70)
    print("✅ SUCCESS! All changes have been pushed!")
    print("="*70)

if __name__ == "__main__":
    main()
