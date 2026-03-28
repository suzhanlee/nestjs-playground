#!/bin/bash
# skill-state-post.sh - Skill 완료 시 상태를 "end"로 설정 (대화형 스킬 제외)

set -euo pipefail

# Create log directory
LOG_DIR=".claude/logs"
mkdir -p "$LOG_DIR"

# Create timestamped log file
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOG_DIR/hook_skill_state_post_${TIMESTAMP}.log"

# Log execution
echo "=== skill-state-post hook executed at $(date) ===" >> "$LOG_FILE"
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

# State 파일 확인
STATE_FILE="$CWD/state/state.json"

if [[ ! -f "$STATE_FILE" ]]; then
  # state 파일이 없으면 생성 (end 상태로)
  STATE_DIR="$CWD/state"
  mkdir -p "$STATE_DIR"
fi

# 대화형 스킬 목록 (사용자 입력이 필요한 스킬)
INTERACTIVE_SKILLS="interview|implement"

# 현재 시간
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# 대화형 스킬인지 확인
if [[ "$INTERACTIVE_SKILLS" =~ "$SKILL_NAME" ]]; then
  # 대화형 스킬은 start 상태 유지 (스킬이 직접 완료 처리)
  echo "Interactive skill detected: $SKILL_NAME, keeping status as 'start'" >> "$LOG_FILE"
  jq -n \
    --arg skill "$SKILL_NAME" \
    --arg status "start" \
    --arg interactive "true" \
    --arg ts "$TIMESTAMP" \
    '{"skill_name": $skill, "status": $status, "interactive": $interactive, "timestamp": $ts}' > "$STATE_FILE"
else
  # 즉시 완료형 스킬은 end로 설정
  echo "Non-interactive skill: $SKILL_NAME, setting status to 'end'" >> "$LOG_FILE"
  jq -n \
    --arg skill "$SKILL_NAME" \
    --arg status "end" \
    --arg interactive "false" \
    --arg ts "$TIMESTAMP" \
    '{"skill_name": $skill, "status": $status, "interactive": $interactive, "timestamp": $ts}' > "$STATE_FILE"
fi

echo "=== skill-state-post hook completed ===" >> "$LOG_FILE"
exit 0
