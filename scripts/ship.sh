#!/usr/bin/env bash
# The whole release in one command: check, build, test, push to main, deploy, verify.
#
# Run it from the main clone or from any linked worktree. The commit that ships is the
# current HEAD, rebased onto origin/main. Nothing is deployed unless every earlier
# stage passed, and the run only reports SHIPPED once the live site serves the commit.
set -euo pipefail

LIVE_URL="https://forgotten-mistory.web.app/"
FIREBASE_PROJECT="forgotten-mistory"
LOCK_FILE="/tmp/forgotten-mistory-ship.lock"
LOCK_WAIT_SECONDS=1800
VERIFY_ATTEMPTS=12
VERIFY_INTERVAL_SECONDS=10
STAGES=9

stage=""
begin() {
  stage="$1/$STAGES $2"
  printf '[ship] %s\n' "$stage"
}
fail() {
  printf '[ship] FAILED: %s\n' "$1" >&2
  exit 1
}
trap 'printf "[ship] FAILED during stage %s\n" "$stage" >&2' ERR

cd "$(dirname "${BASH_SOURCE[0]}")/.."
cd "$(git rev-parse --show-toplevel)"

# 1. Only committed work ships: what is built and tested must be what is pushed.
begin 1 "working tree is clean"
if [ -n "$(git status --porcelain)" ]; then
  git status --short >&2
  fail "uncommitted changes; commit or stash them first"
fi

# 2. One release at a time, across every clone and worktree on this machine.
begin 2 "taking the release lock ($LOCK_FILE)"
if [ ! -e "$LOCK_FILE" ]; then
  (umask 000 && : >"$LOCK_FILE")
fi
exec 9<"$LOCK_FILE"
if ! flock -n 9; then
  echo "[ship] another release is running; waiting for it to finish"
  flock -w "$LOCK_WAIT_SECONDS" 9 || fail "gave up waiting for the other release after ${LOCK_WAIT_SECONDS}s"
fi

# 3. Ship on top of whatever main is now.
begin 3 "rebasing onto origin/main"
git fetch origin main
if ! git rebase origin/main; then
  git rebase --abort || true
  fail "the rebase onto origin/main conflicts; rebase by hand, resolve the conflict, then run this again"
fi
sha="$(git rev-parse --short=8 HEAD)"
echo "[ship] releasing $sha"

# Stale build output (generated types of a route that no longer exists, files of a page
# that was removed) must never reach the check or the deploy, so both start from nothing.
begin 4 "npm run check (from a clean .next and out)"
rm -rf .next out
npm run check

begin 5 "npm run build"
npm run build
built="$(<out/index.html)"
if [[ "$built" != *"name=\"build-commit\" content=\"$sha\""* ]]; then
  fail "the build in out/ does not carry commit $sha; remove .next and out and run this again"
fi

# A free port, so a stale server left on the default one can never be tested by mistake.
begin 6 "npm test"
port="$(node -e 'const s=require("net").createServer().listen(0,()=>{console.log(s.address().port);s.close()})')"
PORT="$port" npm test

begin 7 "pushing HEAD to origin main"
git push origin HEAD:main

# On this host only root is logged in to Firebase, so the deploy goes through sudo
# unless the current user (or a token in the environment) can deploy directly.
begin 8 "deploying to Firebase Hosting ($FIREBASE_PROJECT)"
firebase_bin="$(command -v firebase)" || fail "the firebase CLI is not installed"
accounts="$("$firebase_bin" login:list 2>&1 || true)"
if [[ "$accounts" == *"Logged in as"* || -n "${FIREBASE_TOKEN:-}" || -n "${GOOGLE_APPLICATION_CREDENTIALS:-}" ]]; then
  "$firebase_bin" deploy --only hosting --project "$FIREBASE_PROJECT" --non-interactive
else
  echo "[ship] $(id -un) is not logged in to Firebase; deploying as root"
  sudo -n -H "$firebase_bin" deploy --only hosting --project "$FIREBASE_PROJECT" --non-interactive
fi

# Every page and every payload the client router fetches must revalidate on each load.
# Firebase's own default is an hour, so a path without a rule keeps serving a stale page
# whose scripts the release has deleted. The paths come from the build, not from a list.
document_paths() {
  local file path
  while IFS= read -r file; do
    path="/${file#out/}"
    case "$path" in
      /index.html) path="/" ;;
      *.html) path="${path%.html}" ;;
    esac
    printf '%s\n' "$path"
  done < <(find out -path out/_next -prune -o -type f \( -name '*.html' -o -name '*.txt' \) -print | sort)
}

# Prints the document paths whose live Cache-Control does not revalidate.
stale_paths() {
  local path headers
  headers="$(mktemp)"
  while IFS= read -r path; do
    if ! curl -fsS --max-time 20 -o /dev/null -D "$headers" "${LIVE_URL%/}${path}"; then
      echo "$path (unreachable)"
    elif ! grep -iq '^cache-control:.*max-age=0' "$headers"; then
      echo "$path ($(tr -d '\r' <"$headers" | grep -i '^cache-control:' || echo 'no cache-control'))"
    fi
  done < <(document_paths)
  rm -f "$headers"
}

# The page is downloaded to a file and read from the file; piping curl into a parser
# that exits early makes curl fail with EPIPE.
begin 9 "waiting for the live site to serve $sha and revalidate every page"
page="$(mktemp)"
trap 'rm -f "$page"' EXIT
served=""
stale=""
for attempt in $(seq 1 "$VERIFY_ATTEMPTS"); do
  served=""
  stale=""
  if curl -fsS --max-time 20 -H 'Cache-Control: no-cache' -o "$page" "${LIVE_URL}?ship=${sha}-${attempt}"; then
    html="$(<"$page")"
    if [[ "$html" =~ name=\"build-commit\"\ content=\"([^\"]+)\" ]]; then
      served="${BASH_REMATCH[1]}"
    fi
  fi
  if [ "$served" = "$sha" ]; then
    stale="$(stale_paths)"
    if [ -z "$stale" ]; then
      echo "SHIPPED $sha"
      exit 0
    fi
  fi
  if [ "$attempt" -lt "$VERIFY_ATTEMPTS" ]; then
    echo "[ship] live site serves '${served:-nothing}'${stale:+ and caches: $stale}; checking again in ${VERIFY_INTERVAL_SECONDS}s ($attempt/$VERIFY_ATTEMPTS)"
    sleep "$VERIFY_INTERVAL_SECONDS"
  fi
done
fail "after $((VERIFY_ATTEMPTS * VERIFY_INTERVAL_SECONDS))s the live site serves '${served:-nothing}' instead of $sha${stale:+ and caches: $stale}"
