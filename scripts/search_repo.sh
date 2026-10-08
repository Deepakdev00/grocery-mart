#!/bin/bash
# search_repo.sh - Search codebase with best available tool
#
# Usage: ./scripts/search_repo.sh <pattern> [path] [options]
#
# Examples:
#   ./scripts/search_repo.sh "TODO"
#   ./scripts/search_repo.sh "function.*login" src/
#   ./scripts/search_repo.sh "error" --type ts

set -e

PATTERN="${1:-}"
if (($# > 0)); then
    shift
fi

SEARCH_PATH="."
if (($# > 0)) && [[ "$1" != -* ]]; then
    SEARCH_PATH="$1"
    shift
fi
EXTRA_ARGS=("$@")

if [[ -z "$PATTERN" ]]; then
    echo "Usage: search_repo.sh <pattern> [path] [options]"
    echo ""
    echo "Examples:"
    echo "  ./scripts/search_repo.sh 'TODO'"
    echo "  ./scripts/search_repo.sh 'login' src/"
    echo "  ./scripts/search_repo.sh 'error' . --type ts"
    exit 1
fi

# Try ripgrep first (fastest)
if command -v rg &> /dev/null; then
    echo "# Using ripgrep" >&2
    rg "$PATTERN" "$SEARCH_PATH" "${EXTRA_ARGS[@]}" --color=always
    exit $?
fi

# Fall back to grep
echo "# Using grep (install ripgrep for better performance)" >&2

# Convert common rg options to grep options
GREP_ARGS=()
for ((i = 0; i < ${#EXTRA_ARGS[@]}; i++)); do
    arg="${EXTRA_ARGS[$i]}"
    case "$arg" in
        --type)
            if ((i + 1 < ${#EXTRA_ARGS[@]})); then
                i=$((i + 1))
                GREP_ARGS+=("--include=*.${EXTRA_ARGS[$i]}")
            fi
            ;;
        *)
            GREP_ARGS+=("$arg")
            ;;
    esac
done

grep -rn "$PATTERN" "$SEARCH_PATH" "${GREP_ARGS[@]}" --color=always 2>/dev/null || {
    echo "No matches found for: $PATTERN"
    exit 0
}
