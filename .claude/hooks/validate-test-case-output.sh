#!/bin/bash

# PostToolUse Hook: test-case 스킬 검증
#
# 이 hook은 test-case 스킬 실행 후에만 동작하여:
# 1. requirements.md 존재 여부 확인
# 2. validate_prompt 추출 및 Claude에게 전달

# Exit on errors but handle glob failures gracefully
set -e

# Read stdin first
INPUT=$(cat)

# Extract tool_name
TOOL_NAME=$(echo "$INPUT" | grep -o '"tool_name":"[^"]*"' | cut -d'"' -f4)

# 1. Check if tool is Skill
if [[ "$TOOL_NAME" != "Skill" ]]; then
    exit 0
fi

# 2. Check if skill is test-case only
SKILL_NAME=$(echo "$INPUT" | grep -o '"skill":"[^"]*"' | cut -d'"' -f4)

if [[ "$SKILL_NAME" != "test-case" ]]; then
    exit 0
fi

# Create log directory
LOG_DIR=".claude/logs"
mkdir -p "$LOG_DIR"

# Create timestamped log file
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOG_DIR/hook_test_case_${TIMESTAMP}.log"

# Log execution
echo "=== test-case validation hook executed at $(date) ===" >> "$LOG_FILE"
echo "Working directory: $(pwd)" >> "$LOG_FILE"
echo "STDIN input: $INPUT" >> "$LOG_FILE"
echo "Extracted tool_name: $TOOL_NAME" >> "$LOG_FILE"
echo "Extracted skill_name: $SKILL_NAME" >> "$LOG_FILE"

# 3. Check if requirements.md exists
REQUIREMENTS_FILE="state/requirements.md"
echo "Checking for requirements.md: $REQUIREMENTS_FILE" >> "$LOG_FILE"

if [[ ! -f "$REQUIREMENTS_FILE" ]]; then
    echo "requirements.md not found at: $REQUIREMENTS_FILE" >> "$LOG_FILE"
    # Output warning to Claude
    jq -n '{
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext: "⚠️ WARNING: requirements.md not found in state/. Please ensure requirements.md exists before running /test-case."
      }
    }'
    exit 0
fi

echo "requirements.md found!" >> "$LOG_FILE"

# 4. Extract validate_prompt from test-case skill file
SKILL_FILE=".claude/skills/test-case/SKILL.md"
echo "Reading skill file: $SKILL_FILE" >> "$LOG_FILE"

if [[ ! -f "$SKILL_FILE" ]]; then
    echo "Skill file not found: $SKILL_FILE" >> "$LOG_FILE"
    exit 0
fi

# Extract validate_prompt (multi-line value after validate_prompt:)
VALIDATE_PROMPT=$(sed -n '/^validate_prompt:/,/^[a-z]/p' "$SKILL_FILE" | tail -n +2 | head -n -1)
echo "Extracted validate_prompt:" >> "$LOG_FILE"
echo "$VALIDATE_PROMPT" >> "$LOG_FILE"

if [[ -z "$VALIDATE_PROMPT" ]]; then
    echo "No validate_prompt found in skill file" >> "$LOG_FILE"
    exit 0
fi

# 5. Generate validation context and output JSON to stdout
CONTEXT="⚠️ VALIDATION REQUIRED for /test-case

requirements.md found at: ${REQUIREMENTS_FILE}

Validation Criteria (DoD):
${VALIDATE_PROMPT}

Please verify the test-case.md output meets all criteria before proceeding."

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
    echo "jq command failed" >> "$LOG_FILE"
fi

# Also save validation record
JSON_FILE="$LOG_DIR/validation_test_case_${TIMESTAMP}.json"
cat > "$JSON_FILE" << EOF
{
  "skill": "test-case",
  "requirementsFile": "$REQUIREMENTS_FILE",
  "validate_prompt": $(echo "$VALIDATE_PROMPT" | sed 's/"/\\"/g' | sed ':a;N;$!ba;s/\n/\\n/g'),
  "timestamp": "$(date -Iseconds)"
}
EOF

echo "Validation record saved to: $JSON_FILE" >> "$LOG_FILE"

exit 0
