#!/usr/bin/env bash
# Full release: changeset -> version -> publish to npm -> push -> tag -> GitHub Release.
# All packages share one version (fixed group in .changeset/config.json),
# so the admin package is used as the source of the version and release notes.
set -euo pipefail

cd "$(git rev-parse --show-toplevel)"

VERSION_PACKAGE="packages/admin/package.json"
CHANGELOG_FILE="packages/admin/CHANGELOG.md"

step() { printf '\n\033[1;34m==> %s\033[0m\n' "$1"; }
fail() { printf '\033[1;31mError: %s\033[0m\n' "$1" >&2; exit 1; }

step "Checking preconditions"
[ "$(git branch --show-current)" = "main" ] || fail "Releases must be made from main."
git pull --ff-only
gh auth status >/dev/null 2>&1 || fail "Not logged in to GitHub CLI. Run: gh auth login"
if ! pnpm whoami >/dev/null 2>&1; then
  pnpm login
fi
echo "npm user: $(pnpm whoami)"

pending_changesets() { ls .changeset/*.md 2>/dev/null | grep -v README.md; }

step "Changesets"
if pending_changesets >/dev/null; then
  echo "Pending changesets found:"
  pending_changesets
  read -r -p "Add another changeset? [y/N] " add_more
  if [[ "$add_more" =~ ^[Yy]$ ]]; then pnpm changeset; fi
else
  pnpm changeset
fi
# pnpm changeset exits 0 even when cancelled, so check a changeset was actually created
pending_changesets >/dev/null || fail "No changeset created, nothing to release."

step "Applying versions"
pnpm changeset version
VERSION=$(node -p "require('./$VERSION_PACKAGE').version")
TAG="v$VERSION"
git rev-parse "$TAG" >/dev/null 2>&1 && fail "Tag $TAG already exists."
# changeset version commits the bump itself ("commit": true in .changeset/config.json)

read -r -p "Publish $TAG to npm? [y/N] " confirm
[[ "$confirm" =~ ^[Yy]$ ]] || fail "Aborted before publishing. Version commit is local only."

step "Publishing to npm"
pnpm changeset publish

step "Pushing commit and tags"
git tag -a "$TAG" -m "Release $TAG"
git push
# Push only this release's tags; pushing all local tags can clash with old ones on the remote
git push origin "$TAG" $(git tag --points-at HEAD | grep "@$VERSION$")

step "Creating GitHub Release"
NOTES=$(awk -v ver="$VERSION" '
  $0 == "## " ver {flag=1; next}
  /^## / && flag {exit}
  flag {print}
' "$CHANGELOG_FILE")
[ -n "$NOTES" ] || NOTES="No changelog available"
gh release create "$TAG" --title "$VERSION" --notes "$NOTES"

step "Released $TAG"
