#!/bin/bash

# Create log directory
LOG_DIR=".claude/logs"
mkdir -p "$LOG_DIR"

# Create timestamped log file
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOG_DIR/hook_${TIMESTAMP}.log"

# Log execution
echo "=== Hook executed at $(date) ===" >> "$LOG_FILE"
echo "Working directory: $(pwd)" >> "$LOG_FILE"

# Read stdin
INPUT=$(cat)
echo "STDIN input: $INPUT" >> "$LOG_FILE"

# Extract tool_name
TOOL_NAME=$(echo "$INPUT" | grep -o '"tool_name":"[^"]*"' | cut -d'"' -f4)
echo "Extracted tool_name: $TOOL_NAME" >> "$LOG_FILE"

if [[ "$TOOL_NAME" != "Skill" ]]; then
    echo "Not a Skill tool, exiting" >> "$LOG_FILE"
    exit 0
fi

# Extract skill name
SKILL_NAME=$(echo "$INPUT" | grep -o '"skill":"[^"]*"' | cut -d'"' -f4)
echo "Extracted skill_name: $SKILL_NAME" >> "$LOG_FILE"

if [[ -z "$SKILL_NAME" ]]; then
    echo "No skill name found" >> "$LOG_FILE"
    exit 0
fi

# Find skill file
PROJECT_SKILL=".claude/skills/${SKILL_NAME}/SKILL.md"
GLOBAL_SKILL="$HOME/.claude/skills/${SKILL_NAME}/SKILL.md"

SKILL_FILE=""
if [[ -f "$PROJECT_SKILL" ]]; then
    SKILL_FILE="$PROJECT_SKILL"
elif [[ -f "$GLOBAL_SKILL" ]]; then
    SKILL_FILE="$GLOBAL_SKILL"
fi

echo "Looking for skill file: $SKILL_FILE" >> "$LOG_FILE"

if [[ ! -f "$SKILL_FILE" ]]; then
    echo "Skill file not found" >> "$LOG_FILE"
    exit 0
fi

# Extract validate_prompt (get line after validate_prompt:)
VALIDATE_PROMPT=$(grep "^validate_prompt:" "$SKILL_FILE" | cut -d':' -f2- | sed 's/^[[:space:]]*//')
echo "Extracted validate_prompt: $VALIDATE_PROMPT" >> "$LOG_FILE"

if [[ -z "$VALIDATE_PROMPT" ]]; then
    echo "No validate_prompt found" >> "$LOG_FILE"
    exit 0
fi

# Generate validation context and output JSON to stdout (Claude will parse this)
CONTEXT="⚠️ VALIDATION REQUIRED for skill: ${SKILL_NAME}

Validate Prompt:
${VALIDATE_PROMPT}

Please verify the output meets the above criteria before proceeding."

# Generate JSON for Claude (stdout)
JSON_OUTPUT=$(jq -n --arg ctx "$CONTEXT" '{
  hookSpecificOutput: {
    hookEventName: "PostToolUse",
    additionalContext: $ctx
  }
}')

if [[ $? -eq 0 ]]; then
    echo "$JSON_OUTPUT"
    echo "JSON output sent to Claude:" >> "$LOG_FILE"
    echo "$JSON_OUTPUT" >> "$LOG_FILE"
else
    echo "jq not available, skipping JSON output" >> "$LOG_FILE"
fi

# Create JSON output file
JSON_FILE="$LOG_DIR/validation_${SKILL_NAME}_${TIMESTAMP}.json"
cat > "$JSON_FILE" << EOF
{
  "skill": "$SKILL_NAME",
  "validate_prompt": $(echo "$VALIDATE_PROMPT" | sed 's/"/\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g'),
  "timestamp": "$(date -Iseconds)"
}
EOF

# Output to stderr (visible in Claude context)
echo "🔧 SKILL VALIDATION [$SKILL_NAME]: $VALIDATE_PROMPT" >> "$LOG_FILE"
echo "JSON saved to: $JSON_FILE" >> "$LOG_FILE"

exit 0
