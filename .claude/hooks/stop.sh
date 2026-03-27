#!/bin/bash
# Orchestration:
#   state.json 기반 스킬 오케스트레이션 (interview → test-case → implement)

set -euo pipefail

# Create log directory
LOG_DIR=".claude/logs"
mkdir -p "$LOG_DIR"

# Create timestamped log file
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="$LOG_DIR/hook_stop_${TIMESTAMP}.log"

# Log execution
echo "=== Stop hook executed at $(date) ===" >> "$LOG_FILE"
echo "Working directory: $(pwd)" >> "$LOG_FILE"

HOOK_INPUT=$(cat)
echo "STDIN input: $HOOK_INPUT" >> "$LOG_FILE"
CWD=$(echo "$HOOK_INPUT" | jq -r '.cwd')

# ============================================================
# Orchestration: state.json 기반 스킬 오케스트레이션
# ============================================================

STATE_FILE="$CWD/state/state.json"

if [[ -f "$STATE_FILE" ]]; then
  SKILL_NAME=$(jq -r '.skill_name // empty' "$STATE_FILE")
  STATUS=$(jq -r '.status // empty' "$STATE_FILE")

  echo "Orchestration check: skill_name=$SKILL_NAME, status=$STATUS" >> "$LOG_FILE"

  # Only orchestrate if skill ended
  if [[ "$STATUS" == "end" ]]; then
    REASON=""
    DECISION="block"

    case "$SKILL_NAME" in
      "interview")
        REASON="요구사항 수집 완료! 이제 테스트 케이스를 생성합니다.

Execute: Skill(\"test-case\")"
        ;;
      "test-case")
        REASON="테스트 케이스 생성 완료! 이제 구현을 시작합니다.

Execute: Skill(\"implement\")"
        ;;
      "implement")
        # Workflow complete - continue
        DECISION="continue"
        ;;
    esac

    if [[ -n "$REASON" ]]; then
      echo "Orchestration: $SKILL_NAME -> next step" >> "$LOG_FILE"
      jq -n \
        --arg decision "$DECISION" \
        --arg reason "$REASON" \
        '{decision: $decision, reason: $reason}'
      exit 0
    fi
  fi
fi

# ============================================================
# 스킬 오케스트레이션 완료 메시지
# ============================================================
if [[ "$SKILL_NAME" == "implement" ]] && [[ "$STATUS" == "end" ]]; then
  echo "🎉 모든 스킬 오케스트레이션이 완료되었습니다!" >&2
  echo "interview → test-case → implement" >&2
  echo "" >&2
  echo "다음 단계:" >&2
  echo "- 코드가 제대로 작동하는지 테스트하세요" >&2
  echo "- 필요시 추가 기능을 개발하세요" >&2
fi

# 아무 조건도 해당 없으면 조용히 종료
echo "=== Stop hook completed ===" >> "$LOG_FILE"
exit 0