#!/usr/bin/env bash
# Contributor-only: manual test harness for scripts/prestart.mjs
# Usage: bash scripts/test-prestart.sh
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
STUBS_DIR="$SCRIPT_DIR/test-stubs"

pass=0
fail=0

GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

PKG_JSON='{"name":"test","scripts":{"prestart":"node scripts/prestart.mjs","start":"echo start"}}'

run_test() {
    local name="$1"
    local expected_exit="$2"
    local expected_pattern="$3"
    local input="$4"
    shift 4
    local extra_env=("$@")

    local tmp
    tmp=$(mktemp -d)
    mkdir -p "$tmp/scripts"
    cp "$SCRIPT_DIR/prestart.mjs" "$tmp/scripts/"
    printf '%s' "$PKG_JSON" > "$tmp/package.json"

    local actual_exit=0
    local output
    # { printf; sleep } keeps write end of pipe open until node exits (readline closes on EOF)
    output=$(
        { printf '%b\n' "$input"; sleep 10; } | \
        env PATH="$STUBS_DIR:$PATH" "${extra_env[@]+"${extra_env[@]}"}" \
            node "$tmp/scripts/prestart.mjs" 2>&1
    ) || actual_exit=$?

    rm -rf "$tmp"

    local ok=true
    [[ "$actual_exit" != "$expected_exit" ]] && ok=false
    if [[ "$ok" == true ]] && ! printf '%s' "$output" | grep -qF "$expected_pattern"; then
        ok=false
    fi

    if [[ "$ok" == true ]]; then
        printf "${GREEN}PASS${NC} %s\n" "$name"
        pass=$((pass + 1))
    else
        printf "${RED}FAIL${NC} %s\n" "$name"
        printf '  expected exit=%s got=%s\n' "$expected_exit" "$actual_exit"
        printf '  expected pattern: %s\n' "$expected_pattern"
        printf '  output: %s\n' "$output"
        fail=$((fail + 1))
    fi
}

# P2a: tools present, TTY, user confirms setup
run_test \
    "P2a: tools present, TTY, confirm setup" \
    0 "Setup complete" \
    "y" \
    PRESTART_FORCE_TTY=1

# P2b: tools present, TTY, user declines setup
run_test \
    "P2b: tools present, TTY, decline setup" \
    1 "stellar scaffold setup" \
    "n" \
    PRESTART_FORCE_TTY=1

# P3: tools present, non-TTY
run_test \
    "P3: tools present, non-TTY" \
    1 "interactive terminal" \
    ""

# P4a: tools missing, TTY, confirm install + confirm setup
run_test \
    "P4a: tools missing, TTY, confirm install + setup" \
    0 "All tools installed" \
    "y\ny" \
    PRESTART_FORCE_TTY=1 STUB_STELLAR_MISSING=1 STUB_SCAFFOLD_MISSING=1

# P4b: tools missing, TTY, decline install
run_test \
    "P4b: tools missing, TTY, decline install" \
    1 "developers.stellar.org" \
    "n" \
    PRESTART_FORCE_TTY=1 STUB_STELLAR_MISSING=1 STUB_SCAFFOLD_MISSING=1

# P5: tools missing, non-TTY
run_test \
    "P5: tools missing, non-TTY" \
    1 "developers.stellar.org" \
    "" \
    STUB_STELLAR_MISSING=1 STUB_SCAFFOLD_MISSING=1

echo ""
printf '%d passed, %d failed\n' "$pass" "$fail"
[[ "$fail" -eq 0 ]] || exit 1
