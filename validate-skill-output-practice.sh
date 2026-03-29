#!/bin/bash
set -euo pipefail

INPUT=$(cat)

TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

if [[ "$TOOL_NAME" != "Skill" ]]; then
  exit 0
fi

if [[ ! -f "$SKILL_FILE" ]]; then
  exit 0
fi

SKILL_NAME=$(echo "$INPUT" | jq -r '.tool_input.skill // empty')

SKILL_FILE=".claude/skills/$SKILL_NAME/SKILL.md"

VALIDATE_PROMPT=$(grep "^validate_prompt:" "$SKILL_FILE" | cut -d':' -f2- | sed 's/^[[:space:]]*//')

CONTEXT="⚠️ VALIDATION REQUIRED for skill: ${SKILL_NAME}"

JSON_OUTPUT=$(jq -n \
  --arg ctx "$CONTEXT" \
  '{
    hookSpecificOutput: {
      hookEventName: "PostToolUse",
      additionalContext: $ctx
    }
  }')

echo "$JSON_OUTPUT" >> "$SKILL_NAME.log"
echo "$JSON_OUTPUT"