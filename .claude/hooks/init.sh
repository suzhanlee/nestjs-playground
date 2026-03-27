#!/bin/bash
# init.sh - Initialize state.json when start-orchestration skill is called
# This hook runs on UserPromptSubmit when start-orchestration skill is called

set -euo pipefail

# Create log directory
LOG_DIR=".claude/logs"
mkdir -p "$LOG_DIR"

# Create timestamped log file
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOG_DIR/hook_init_${TIMESTAMP}.log"

# Log execution
echo "=== init hook executed at $(date) ===" >> "$LOG_FILE"
echo "Working directory: $(pwd)" >> "$LOG_FILE"

# Read stdin for input
INPUT=$(cat)
echo "STDIN input: $INPUT" >> "$LOG_FILE"

# Extract tool name and skill name from JSON input
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
SKILL_NAME=$(echo "$INPUT" | jq -r '.tool_input.skill // empty')
CWD=$(echo "$INPUT" | jq -r '.cwd // "."')

# Only process start-orchestration skill, exit silently for others
if [[ "$TOOL_NAME" != "Skill" ]] || [[ "$SKILL_NAME" != "start-orchestration" ]]; then
  exit 0
fi

# State directory and file
STATE_DIR="$CWD/state"
STATE_FILE="$STATE_DIR/state.json"

# Create state directory
mkdir -p "$STATE_DIR"

# Remove existing state file if present
rm -f "$STATE_FILE"

# Create new state.json with initialized status
cat > "$STATE_FILE" << EOF
{
  "skill_name": "start-orchestration",
  "status": "initialized",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")"
}
EOF

echo "State initialized: $STATE_FILE" >> "$LOG_FILE"
echo "=== init hook completed ===" >> "$LOG_FILE"

exit 0
