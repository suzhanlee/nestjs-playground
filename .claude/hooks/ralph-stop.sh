#!/bin/bash
# Ralph Stop Hook: DoD 기반 반복 작업 루프 종료 제어
# DoD 항목이 모두 완료될 때까지 종료를 차단하고 원래 프롬프트를 재주입

set -eo pipefail

HOOK_INPUT=$(cat)
CWD=$(echo "$HOOK_INPUT" | jq -r '.cwd')
DOD_FILE="$CWD/state/DoD.md"
RALPH_STATE="$CWD/state/ralph-state.json"
LOG_DIR="$CWD/.claude/logs"
mkdir -p "$LOG_DIR"

# 로깅
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOG_DIR/ralph-stop_${TIMESTAMP}.log"
echo "=== Ralph Stop Hook ===" >> "$LOG_FILE"
echo "CWD: $CWD" >> "$LOG_FILE"
echo "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")" >> "$LOG_FILE"

# DoD 파일 존재 확인
if [[ ! -f "$DOD_FILE" ]]; then
  echo "DoD.md not found, allowing exit" >> "$LOG_FILE"
  echo '{"decision": "allow"}'
  exit 0
fi

# ralph-state.json 존재 확인
if [[ ! -f "$RALPH_STATE" ]]; then
  echo "ralph-state.json not found, allowing exit" >> "$LOG_FILE"
  echo '{"decision": "allow"}'
  exit 0
fi

# DoD 파일에서 체크되지 않은 항목 파싱
# 형식: - [ ] TEST_ID:Description
REMAINING=()
PATTERN='^- \[ \] ([A-Z]+-[A-Z]+-[0-9]+):(.+)$'
while IFS= read -r line; do
  if [[ "$line" == "DODEOF" ]]; then
    break
  fi
  # 공백 제거 후 패턴 매칭
  trimmed_line=$(echo "$line" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//')
  if [[ "$trimmed_line" =~ $PATTERN ]]; then
    TEST_ID="${BASH_REMATCH[1]}"
    DESCRIPTION="${BASH_REMATCH[2]}"
    REMAINING+=("${TEST_ID}:${DESCRIPTION}")
  fi
done < "$DOD_FILE"

REMAINING_COUNT=${#REMAINING[@]}
echo "Remaining DoD items: $REMAINING_COUNT" >> "$LOG_FILE"

if [[ $REMAINING_COUNT -eq 0 ]]; then
  echo "All DoD items completed, allowing exit" >> "$LOG_FILE"
  echo '{"decision": "allow"}'
  exit 0
fi

# remaining이 있으면 block
ORIGINAL_PROMPT=$(jq -r '.original_prompt // empty' "$RALPH_STATE" 2>/dev/null || echo "")
LOOP_COUNT=$(jq '.loop_count // 0' "$RALPH_STATE" 2>/dev/null || echo "0")
NEW_LOOP_COUNT=$((LOOP_COUNT + 1))

# 루프 카운트 업데이트
if [[ -f "$RALPH_STATE" ]]; then
  jq --arg orig "$ORIGINAL_PROMPT" --argjson count "$NEW_LOOP_COUNT" \
     '.loop_count = $count | if $orig != "" then .original_prompt = $orig end' \
     "$RALPH_STATE" > "${RALPH_STATE}.tmp" && mv "${RALPH_STATE}.tmp" "$RALPH_STATE"
fi

# remaining 항목들 포맷팅
REMAINING_LIST=""
for item in "${REMAINING[@]}"; do
  REMAINING_LIST+="[ ] $item"$'\n'
done

# system message 구조화
SYSTEM_MESSAGE="=== RALPH LOOP CONTINUATION ==="$'\n\n'
SYSTEM_MESSAGE+="ORIGINAL_PROMPT: $ORIGINAL_PROMPT"$'\n\n'
SYSTEM_MESSAGE+="REMAINING_DOD_ITEMS: $REMAINING_COUNT개"$'\n\n'
SYSTEM_MESSAGE+="$REMAINING_LIST"
SYSTEM_MESSAGE+=$'\n'
SYSTEM_MESSAGE+="ACTION_REQUIRED:"$'\n'
SYSTEM_MESSAGE+="1. .claude/skills/ralph/ralph-verifier.md를 읽어서 검증 에이전트 구성"$'\n'
SYSTEM_MESSAGE+="2. ralph-verifier custom-agent를 실행하여 각 항목 검증"$'\n'
SYSTEM_MESSAGE+="3. 통과한 항목은 [x]로 변경"$'\n'
SYSTEM_MESSAGE+="4. 실패한 항목은 이번 반복에서 수정"$'\n\n'
SYSTEM_MESSAGE+="LOOP_INFO: 루프 ${NEW_LOOP_COUNT}회차"$'\n'
SYSTEM_MESSAGE+="==============================="

# reason: 원본 프롬프트로 ralph 재실행
REASON="Execute: Skill(\"ralph\", \"$ORIGINAL_PROMPT\")"

# JSON 출력
jq -n \
  --arg decision "block" \
  --arg reason "$REASON" \
  --arg systemMsg "$SYSTEM_MESSAGE" \
  '{decision: $decision, reason: $reason, systemMessage: $systemMsg}'
