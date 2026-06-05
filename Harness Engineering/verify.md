# /verify — Verification trước khi claim done

## Quy trình

1. Chạy tất cả commands trong CLAUDE.md → Commands
2. Check từng acceptance criteria trong specs/spec.md
3. Output:

```
=== Verification Report ===
Tests:     PASS X/Y | FAIL: [list]
Lint:      CLEAN | ISSUES: [file:line]
Typecheck: CLEAN | ERRORS: [list]
Smoke:     PASS | FAIL

Criteria:
  ✓ [criterion]
  ✗ [criterion chưa đạt]

Ready: YES / NO — [reason nếu NO]
```

4. Nếu PASS → cập nhật feature_list.json (status → "done")
5. Nếu FAIL → fix trước, không báo done
