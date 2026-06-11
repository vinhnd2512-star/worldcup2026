#!/usr/bin/env python3
"""
Compare Old vs New Git Repository Status
So sánh folder cũ vs worktree mới
"""

import subprocess
import os

def get_git_info(path):
    """Get git info from a directory"""
    try:
        os.chdir(path)
        
        # Branch
        branch = subprocess.run("git branch --show-current", shell=True, capture_output=True, text=True).stdout.strip()
        
        # Remote
        remote = subprocess.run("git remote -v", shell=True, capture_output=True, text=True).stdout.strip()
        
        # Recent commits
        commits = subprocess.run("git log --oneline -3", shell=True, capture_output=True, text=True).stdout.strip()
        
        # Status
        status = subprocess.run("git status --short", shell=True, capture_output=True, text=True).stdout.strip()
        
        # Ahead/behind
        behind = subprocess.run("git rev-list --count HEAD..@{u} 2>/dev/null || echo 'N/A'", shell=True, capture_output=True, text=True).stdout.strip()
        ahead = subprocess.run("git rev-list --count @{u}..HEAD 2>/dev/null || echo 'N/A'", shell=True, capture_output=True, text=True).stdout.strip()
        
        return {
            'path': path,
            'branch': branch,
            'remote': remote,
            'commits': commits,
            'status': status,
            'behind': behind,
            'ahead': ahead
        }
    except Exception as e:
        return {'path': path, 'error': str(e)}

# Paths
old_path = r"C:\Users\user\OneDrive\Cong - iCapital Intern\Project Z - Khác\web_app_worldcup"
new_path = r"C:\Users\user\OneDrive\Cong - iCapital Intern\Project Z - Khác\web_app_worldcup.worktrees\agents-sheet-lich-thi-dau-du-doan"

print("\n" + "="*80)
print("🔍 GIT REPOSITORY COMPARISON: OLD vs NEW (WORKTREE)")
print("="*80)

# Old repo
print("\n" + "─"*80)
print("📁 OLD REPOSITORY (Nhánh Cũ)")
print("─"*80)
print(f"Path: {old_path}")
print()

old_info = get_git_info(old_path)
if 'error' in old_info:
    print(f"❌ ERROR: {old_info['error']}")
else:
    print(f"🌿 Branch: {old_info['branch'] or '(detached)'}")
    print(f"\n🔗 Remote:")
    print(old_info['remote'] or "(no remote)")
    print(f"\n📝 Recent Commits:")
    print(old_info['commits'] or "(no commits)")
    print(f"\n📊 Status:")
    if old_info['status']:
        print(old_info['status'])
    else:
        print("✅ Clean (no changes)")
    print(f"\n⬅️  Behind remote: {old_info['behind']}")
    print(f"➡️  Ahead of remote: {old_info['ahead']}")

# New worktree
print("\n" + "─"*80)
print("📁 NEW REPOSITORY (Worktree - Nhánh Mới)")
print("─"*80)
print(f"Path: {new_path}")
print()

new_info = get_git_info(new_path)
if 'error' in new_info:
    print(f"❌ ERROR: {new_info['error']}")
else:
    print(f"🌿 Branch: {new_info['branch'] or '(detached)'}")
    print(f"\n🔗 Remote:")
    print(new_info['remote'] or "(no remote)")
    print(f"\n📝 Recent Commits:")
    print(new_info['commits'] or "(no commits)")
    print(f"\n📊 Status:")
    if new_info['status']:
        print(new_info['status'])
    else:
        print("✅ Clean (no changes)")
    print(f"\n⬅️  Behind remote: {new_info['behind']}")
    print(f"➡️  Ahead of remote: {new_info['ahead']}")

# Comparison
print("\n" + "="*80)
print("🔀 SO SÁNH")
print("="*80)

if 'error' not in old_info and 'error' not in new_info:
    same_branch = old_info['branch'] == new_info['branch']
    same_remote = old_info['remote'] == new_info['remote']
    
    print(f"\n📌 Same branch? {('✅ YES' if same_branch else '❌ NO')}")
    print(f"   Old: {old_info['branch']}")
    print(f"   New: {new_info['branch']}")
    
    print(f"\n📌 Same remote? {('✅ YES' if same_remote else '❌ NO')}")
    
    print(f"\n📌 Sync Status:")
    if same_branch and same_remote:
        print("   ✅ CÓ THỂ MERGE / SYNC")
        print("   - Cả hai pointing cùng nhánh & remote")
        print("   - Dùng: git merge, git rebase, hoặc git pull")
    else:
        print("   ⚠️  CẦN CHÚ Ý")
        print("   - Nhánh/remote khác nhau")
        print("   - Cần specify source branch: git merge <branch-name>")

print("\n" + "="*80)
