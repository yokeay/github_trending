#!/bin/bash
# ─────────────────────────────────────────────────────────────
# npm audit script - Security vulnerability scanner
# Run: npm run audit
# ─────────────────────────────────────────────────────────────

set -e

echo "📋 Running npm audit..."
echo ""

npm audit --audit-level=moderate

AUDIT_RESULT=$?

echo ""
if [ $AUDIT_RESULT -eq 0 ]; then
  echo "✅ No audit issues found (or only info/warning level)"
else
  echo "⚠️  Audit completed with findings (moderate or above)"
fi

exit $AUDIT_RESULT