#!/bin/bash
# ultrawork-stop-hook-simple.sh - Stop hook (간소화 버전)
#
# 원본 대비 제거한 것:
#   - state.local.json 의존성 (세션 상태를 파일 존재로만 추론)
#   - plan-reviewer 서브에이전트 호출
#   - 반복 횟수(iteration) 제한
#
# 페이즈 추론 방식:
#   DRAFT.md 있고 PLAN.md 없음 → specify_plan (플랜 생성)
#   PLAN.md 있고 APPROVED 없음 → 승인 대기 (사용자에게 확인 요청)
#   PLAN.md + APPROVED 있음    → executing (실행)
#   TODO 0개                   → done (완료)
#
# Hook Input Fields (Stop):
#   - session_id: 현재 세션
#   - transcript_path: 대화 로그 경로
#   - cwd: 현재 작업 디렉토리

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

SPECS_ROOT="$CWD/.dev/specs"

# 스펙 디렉토리 없으면 종료
if [[ ! -d "$SPECS_ROOT" ]]; then
  exit 0
fi

# 가장 최근 수정된 DRAFT.md 또는 PLAN.md 기준으로 스펙 폴더 탐색
SPEC_DIR=$(find "$SPECS_ROOT" -maxdepth 2 \( -name "DRAFT.md" -o -name "PLAN.md" \) \
  -exec stat -f '%m %N' {} \; 2>/dev/null \
  | sort -rn | head -1 | cut -d' ' -f2- | xargs dirname 2>/dev/null || echo "")

if [[ -z "$SPEC_DIR" ]]; then
  exit 0
fi

FEATURE_NAME=$(basename "$SPEC_DIR")
DRAFT_FILE="$SPEC_DIR/DRAFT.md"
PLAN_FILE="$SPEC_DIR/PLAN.md"

# ============================================================
# 페이즈 추론 + 전환
# ============================================================

# --- Case 1: PLAN.md 없음 + DRAFT.md 있음 → 플랜 생성 요청 ---
if [[ ! -f "$PLAN_FILE" ]] && [[ -f "$DRAFT_FILE" ]]; then
  echo "📝 Draft 완료. PLAN.md 생성 요청." >&2

  jq -n \
    --arg feature "$FEATURE_NAME" \
    '{
      "decision": "block",
      "reason": "Draft가 완료됐습니다. 지금 PLAN.md를 생성하세요.\n\n1. DRAFT.md를 읽어 요구사항을 파악\n2. 구현 단계를 TODO 항목으로 분해\n3. PLAN.md 작성 (각 TODO는 `### [ ] TODO: 작업명` 형식)\n4. 완료 후 파일 상단에 `Status: Approved` 추가"
    }'
  exit 0
fi

# --- Case 2: PLAN.md 있음 + 미승인 → 사용자에게 확인 요청 ---
if [[ -f "$PLAN_FILE" ]]; then
  if ! grep -qi "APPROVED\|Status:.*Approved" "$PLAN_FILE" 2>/dev/null; then
    echo "⏳ PLAN.md 존재, 승인 대기 중." >&2

    jq -n \
      '{
        "decision": "block",
        "reason": "PLAN.md가 생성됐습니다. 사용자에게 플랜을 보여주고 승인을 요청하세요.\n\n승인되면 PLAN.md 상단에 `Status: Approved`를 추가하고 구현을 시작합니다."
      }'
    exit 0
  fi
fi

# --- Case 3: PLAN.md 승인됨 + TODO 남아있음 → 실행 ---
if [[ -f "$PLAN_FILE" ]]; then
  if grep -qi "APPROVED\|Status:.*Approved" "$PLAN_FILE" 2>/dev/null; then
    UNCHECKED=$(grep -c '### \[ \] TODO' "$PLAN_FILE" 2>/dev/null) || UNCHECKED=0

    if [[ "$UNCHECKED" -gt 0 ]]; then
      echo "⚙️ 실행 중: 남은 TODO $UNCHECKED 개." >&2

      jq -n \
        --arg feature "$FEATURE_NAME" \
        --argjson count "$UNCHECKED" \
        '{
          "decision": "block",
          "reason": ("플랜이 승인됐습니다. 구현을 시작하세요.\n\n- 남은 TODO: " + ($count | tostring) + "개\n- PLAN.md의 `### [ ] TODO` 항목을 순서대로 구현\n- 완료된 항목은 `### [x] TODO`로 업데이트")
        }'
      exit 0
    fi

    # --- Case 4: TODO 0개 → 완료 ---
    echo "🎉 모든 오케스트레이션 work 완료!" >&2
    exit 0
  fi
fi

# 아무 조건도 해당 없으면 조용히 종료
echo "=== Stop hook completed ===" >> "$LOG_FILE"
exit 0