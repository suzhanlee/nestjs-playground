#!/bin/bash
set -euo pipefail

# Orchestration Hook: Initialize state.json on startOrchestration skill
# This hook runs on UserPromptSubmit when startOrchestration skill is called

STATE_DIR="state"
STATE_FILE="$STATE_DIR/state.json"
LOG_DIR=".claude/logs"

# Create log directory
mkdir -p "$LOG_DIR"

# Read stdin for input
INPUT=$(cat)

# Extract tool name and skill name from JSON input
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
SKILL_NAME=$(echo "$INPUT" | jq -r '.tool_input.skill // empty')

# Only process startOrchestration skill, exit silently for others
if [[ "$TOOL_NAME" != "Skill" ]] || [[ "$SKILL_NAME" != "startOrchestration" ]]; then
  exit 0
fi

# Create state directory
mkdir -p "$STATE_DIR"

# Remove existing state file if present
rm -f "$STATE_FILE"

# Create new state.json with initialized status
cat > "$STATE_FILE" << EOF
{
  "skill_name": "startOrchestration",
  "status": "initialized",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")"
}
EOF

# Log initialization
echo "[$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")] State initialized via init.sh for startOrchestration skill" >> "$LOG_DIR/init.log"

exit 0
