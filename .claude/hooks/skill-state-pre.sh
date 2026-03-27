#!/bin/bash
# skill-state-pre.sh - Skill 시작 시 상태를 "start"로 설정

set -euo pipefail

# Create log directory
LOG_DIR=".claude/logs"
mkdir -p "$LOG_DIR"

# Create timestamped log file
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOG_DIR/hook_skill_state_pre_${TIMESTAMP}.log"

# Log execution
echo "=== skill-state-pre hook executed at $(date) ===" >> "$LOG_FILE"
echo "Working directory: $(pwd)" >> "$LOG_FILE"

# Hook 입력 읽기
INPUT=$(cat)
echo "STDIN input: $INPUT" >> "$LOG_FILE"

# 필드 추출
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty')
SKILL_NAME=$(echo "$INPUT" | jq -r '.tool_input.skill // empty')
CWD=$(echo "$INPUT" | jq -r '.cwd // "."')

# Skill tool만 처리
if [[ "$TOOL_NAME" != "Skill" ]] || [[ -z "$SKILL_NAME" ]]; then
  exit 0
fi

# State 디렉토리 생성
STATE_DIR="$CWD/state"
mkdir -p "$STATE_DIR"

STATE_FILE="$STATE_DIR/state.json"

# 현재 시간
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# state.json 생성/업데이트
jq -n \
  --arg skill "$SKILL_NAME" \
  --arg status "start" \
  --arg ts "$TIMESTAMP" \
  '{"skill_name": $skill, "status": $status, "timestamp": $ts}' > "$STATE_FILE"

echo "=== skill-state-pre hook completed ===" >> "$LOG_FILE"
exit 0
