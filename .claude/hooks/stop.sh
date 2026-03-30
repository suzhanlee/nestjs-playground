#!/bin/bash
# Orchestration:
#   state.json 기반 스킬 오케스트레이션 (interview → test-case → implement)
#   대화형 스킬은 결과물 파일 생성을 통해 완료 상태를 감지

set -eo pipefail

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
STATE_DIR="$CWD/state"

if [[ -f "$STATE_FILE" ]]; then
  SKILL_NAME=$(jq -r '.skill_name // empty' "$STATE_FILE")
  STATUS=$(jq -r '.status // empty' "$STATE_FILE")
  INTERACTIVE=$(jq -r '.interactive // "false"' "$STATE_FILE")

  echo "Orchestration check: skill_name=$SKILL_NAME, status=$STATUS, interactive=$INTERACTIVE" >> "$LOG_FILE"

  # ============================================================
  # ralph 스킬은 자체 루프를 가지므로 오케스트레이션 제외
  # ============================================================
  if [[ "$SKILL_NAME" == "ralph" ]]; then
    echo "Ralph skill detected, skipping orchestration (using ralph-stop.sh)" >> "$LOG_FILE"
    exit 0
  fi

  # ============================================================
  # 대화형 스킬 완료 감지: 결과물 파일 확인
  # ============================================================
  if [[ "$INTERACTIVE" == "true" ]] && [[ "$STATUS" == "start" ]]; then
    OUTPUT_FILE_EXISTS="false"

    case "$SKILL_NAME" in
      "interview")
        if [[ -f "$STATE_DIR/requirements.md" ]]; then
          OUTPUT_FILE_EXISTS="true"
          echo "Interview output file found: requirements.md" >> "$LOG_FILE"
          # 자동으로 완료 상태로 변경
          jq -n \
            --arg skill "$SKILL_NAME" \
            --arg status "end" \
            --arg interactive "false" \
            --arg ts "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
            '{"skill_name": $skill, "status": $status, "interactive": $interactive, "timestamp": $ts}' > "$STATE_FILE"
          STATUS="end"
          INTERACTIVE="false"
        fi
        ;;
      "test-case")
        if [[ -f "$STATE_DIR/test-case.md" ]]; then
          OUTPUT_FILE_EXISTS="true"
          echo "Test-case output file found: test-case.md" >> "$LOG_FILE"
          # 자동으로 완료 상태로 변경
          jq -n \
            --arg skill "$SKILL_NAME" \
            --arg status "end" \
            --arg interactive "false" \
            --arg ts "$(date -u +"%Y-%m-%dT%H:%M:%SZ")" \
            '{"skill_name": $skill, "status": $status, "interactive": $interactive, "timestamp": $ts}' > "$STATE_FILE"
          STATUS="end"
          INTERACTIVE="false"
        fi
        ;;
      "implement")
        # implement는 테스트 통과를 통해 완료 확인 (별도 검증 필요)
        echo "Implement skill: manual completion check required" >> "$LOG_FILE"
        ;;
    esac

    echo "After auto-completion check: status=$STATUS, interactive=$INTERACTIVE" >> "$LOG_FILE"
  fi

  # Only orchestrate if skill ended AND not interactive
  if [[ "$STATUS" == "end" ]] && [[ "$INTERACTIVE" != "true" ]]; then
    REASON=""
    DECISION="block"

    echo "Checking case for SKILL_NAME='$SKILL_NAME'" >> "$LOG_FILE"

    case "$SKILL_NAME" in
      "start-orchestration")
        echo "Matched start-orchestration case" >> "$LOG_FILE"
        REASON="오케스트레이션 워크플로우가 초기화되었습니다. 이제 요구사항 인터뷰를 진행합니다.

Execute: Skill(\"interview\")"
        ;;
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
if [[ -n "${SKILL_NAME:-}" ]] && [[ "$SKILL_NAME" == "implement" ]] && [[ "$STATUS" == "end" ]]; then
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