#!/bin/bash
# PostToolUse Hook: Agent 실행 완료 후 로깅

set -euo pipefail

LOG_DIR=".claude/logs"
mkdir -p "$LOG_DIR"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOG_DIR/hook_post_agent_${TIMESTAMP}.log"

# Hook 입력 읽기
INPUT=$(cat)
echo "=== Post-Agent hook executed at $(date) ===" >> "$LOG_FILE"
echo "STDIN input: $INPUT" >> "$LOG_FILE"

# 툴 이름 추출
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')

# Agent 툴만 처리
if [[ "$TOOL_NAME" != "Agent" ]]; then
  exit 0
fi

SUBAGENT_TYPE=$(echo "$INPUT" | jq -r '.tool_input.subagent_type // empty')
DESCRIPTION=$(echo "$INPUT" | jq -r '.tool_input.description // empty')

echo "Tool: Agent" >> "$LOG_FILE"
echo "Subagent Type: $SUBAGENT_TYPE" >> "$LOG_FILE"
echo "Description: $DESCRIPTION" >> "$LOG_FILE"
echo "Action: Sub-agent completed" >> "$LOG_FILE"

# 결과 저장 (추가 분석을 위해)
RESULT_FILE="$LOG_DIR/agent_result_${TIMESTAMP}.json"
echo "$INPUT" > "$RESULT_FILE"

exit 0
