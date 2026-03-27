#!/bin/bash
# skill-state-post.sh - Skill 완료 시 상태를 "end"로 설정

set -euo pipefail

# Hook 입력 읽기
INPUT=$(cat)

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

# 현재 시간
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

# state.json 업데이트
jq -n \
  --arg skill "$SKILL_NAME" \
  --arg status "end" \
  --arg ts "$TIMESTAMP" \
  '{"skill_name": $skill, "status": $status, "timestamp": $ts}' > "$STATE_FILE"

exit 0
