#!/bin/sh
# Proves the layout sweep can fail: runs it on the dev chapters of a project
# scaffolded from template/. "devfail" (src/scenes/dev/DevLayoutFixture.tsx)
# breaks every rule on purpose and must report each one; "dev"
# (src/scenes/dev/DevPreview.tsx) is a clean composition and must report none.
# Run it after changing any rule or kit component, before trusting a clean
# sweep of real chapters.
# Usage: scripts/layout_selftest.sh videos/<slug>
PROJECT=${1:?usage: layout_selftest.sh <project>}
HERE=$(cd "$(dirname "$0")" && pwd)
OUT=$("$HERE/layout_sweep.sh" "$PROJECT" devfail dev 2>&1)
echo "$OUT" | sed 's/^/  /' | head -80
status=0
for rule in overlap tight bounds text-bounds overflow duplicate-id text-overflow clipped-text \
            illegible-text cropped-label unlabelled-node off-center arrow-detached \
            arrow-through-text arrow-pileup column-top; do
  if ! echo "$OUT" | grep -q "d0[23] f[0-9]* $rule:"; then
    echo "SELFTEST FAIL: the fixture did not trip '$rule'"
    status=1
  fi
done
if echo "$OUT" | grep -q "d01 f"; then
  echo "SELFTEST FAIL: the clean preview reported findings"
  status=1
fi
[ $status -eq 0 ] && echo "selftest: every rule trips on the fixture; the preview is clean"
exit $status
