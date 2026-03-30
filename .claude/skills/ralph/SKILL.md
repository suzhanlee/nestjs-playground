---
name: ralph
description: 완료 기준(DoD) 검증이 포함된 반복 작업 완료 루프. test-case.md를 기반으로 DoD를 자동 생성하고 Stop hook을 통해 반복 실행.
triggers:
  - "/ralph"
  - "ralph loop"
  - "ralph 루프"
  - "반복 작업"
  - "DoD 루프"
  - "완료 검증 루프"
  - "task loop"
  - "keep going until done"
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - Write
  - Edit
  - Agent
  - AskUserQuestion
validate_prompt: |
  Phase 1(test-case 기반 DoD 생성)과 Phase 2(작업 실행)를 반드시 포함. DoD 파일을 state/DoD.md에 저장 필수. Stop hook 재주입을 위한 프롬프트 저장 포함 필수.
---

# Ralph Loop Skill

test-case.md를 기반으로 자동 생성된 완료 기준(DoD)에 의해 구동되는 반복 작업 완료 루프. Ralph Wiggum 기법(종료 시 프롬프트 재주입)과 DoD 기반 독립 검증을 결합.

## 동작 방식

1. `state/test-case.md`를 읽어서 DoD 체크리스트 자동 생성
2. 작업 수행
3. 종료를 시도하면 Stop hook이 DoD 체크리스트 확인:
   - 미완료 항목 존재 → 종료 차단, 원래 프롬프트 + 미완료 항목 재주입
   - 모든 항목 완료 → 종료 허용
4. 모든 DoD 항목이 검증될 때까지 루프 반복

---

## Phase 1: test-case 기반 DoD 생성

### Step 1 — test-case 파일 확인

**먼저 `state/test-case.md` 파일 존재를 확인합니다.**

```bash
파일 경로: state/test-case.md
```

파일이 존재하지 않으면 에러 메시지를 출력하고 종료:
```
❌ test-case.md 파일을 찾을 수 없습니다.
📝 /test-case 스킬을 먼저 실행하여 테스트 케이스를 생성해주세요.
```

### Step 2 — test-case 파싱 및 DoD 생성

test-case.md 파일을 파싱하여 DoD.md를 생성합니다.

**파싱 규칙:**
1. `**TC-E2E-XXX**` 또는 `**TC-UNIT-XXX**` 또는 `**TC-INT-XXX**` 형식의 테스트 ID 추출
2. 각 테스트 케이스의 Given-When-Then 설명을 `:` 뒤에 연결
3. 우선순위(P0, P1, P2, P3) 순서대로 정렬

**test-case.md 예시:**
```markdown
- [ ] **TC-E2E-001**: [P0] 모든 필수 필드로 카테고리 생성
  - Given: 유효한 카테고리 이름 ("전자기기")
  - When: POST /api/categories
  - Then: 201 Created, 응답에 생성된 ID 포함
```

**DoD.md 생성 형식:**
```markdown
# RALPH DOD CHECKLIST
# FORMAT: - [ ] TEST_ID:Description
# ENDMARKER: DODEOF

- [ ] TC-E2E-001:모든 필수 필드로 카테고리 생성
- [ ] TC-E2E-002:선택적 필드(parentId) 포함하여 하위 카테고리 생성
- [ ] TC-E2E-004:필수 필드(name) 누락 시 400 반환
- [ ] TC-E2E-011:중복된 name으로 생성 시도 시 409 Conflict
...

DODEOF
```

### Step 3 — ralph-state.json 생성

Stop hook을 위해 상태 파일을 생성합니다:

**state/ralph-state.json:**
```json
{
  "original_prompt": "<사용자가 입력한 원본 프롬프트>",
  "test_case_file": "state/test-case.md",
  "session_id": "<UUID>",
  "created_at": "<ISO-8601 타임스탬프>",
  "loop_count": 0
}
```

### Step 4 — 초기화 완료 메시지

```
## Ralph 루프 초기화 완료

📋 **작업**: <사용자 요청 요약>
✅ **DoD**: test-case.md 기반 <N>개 기준 생성
📁 **DoD 파일**: state/DoD.md

작업을 시작합니다. 루프는 완료 전 각 DoD 항목을 독립적으로 검증합니다.
```

---

## Phase 2: 작업 실행

이제 실제 작업을 수행합니다. 모든 DoD 기준을 충족하는 것에 집중합니다.

### 작업 중 규칙

- **DoD 파일을 읽지 마세요** — 시스템이 보호 중
- **DoD 항목을 직접 체크하지 마세요** — Stop hook이 검증을 처리
- **사용자의 원래 요청에 집중**하여 순수하게 작업 수행
- **철저하게 작업하세요** — 빠진 부분은 루프가 잡아냅니다

### 작업 완료 시

작업이 완료됐다고 판단되면 응답을 정상적으로 마칩니다. Stop hook이:

1. DoD 파일에서 미완료 항목 확인
2. 항목 존재 시: 종료 차단, reason에 원래 프롬프트 재주입, systemMessage에 미완료 항목 목록 전달
3. 모든 항목 완료 시: 종료 허용

---

## Phase 3: 재진입 시(Stop hook이 종료를 차단한 경우)

### systemMessage 구조

Stop hook이 종료를 차단하면 다음과 같은 systemMessage가 전달됩니다:

```
=== RALPH LOOP CONTINUATION ===

ORIGINAL_PROMPT: <사용자가 입력한 원본 프롬프트>

REMAINING_DOD_ITEMS: <개수>개

[ ] TC-E2E-001:모든 필수 필드로 카테고리 생성
[ ] TC-E2E-002:선택적 필드(parentId) 포함하여 하위 카테고리 생성
[ ] TC-E2E-004:필수 필드(name) 누락 시 400 반환

ACTION_REQUIRED:
1. dod-validator sub-agent를 실행하여 각 항목 검증
2. 통과한 항목은 [x]로 변경
3. 실패한 항목은 이번 반복에서 수정

LOOP_INFO: 루프 <N>회차
===============================
```

### ralph-verifier custom-agent 실행

별도 에이전트를 통한 검증(컨텍스트 격리):

1. `.claude/skills/ralph/ralph-verifier.md`를 읽어서 검증 에이전트 프롬프트 구성
2. `subagent_type="general-purpose"`로 ralph-verifier 에이전트를 포그라운드에서 생성
   - `run_in_background=true` 사용 금지
   - 백그라운드로 생성하면 메인 에이전트가 종료되어 Stop hook이 실행되고 루프가 끊김
3. DoD 파일 경로와 검증할 항목 리스트를 전달
4. 검증기는 새로운 컨텍스트에서 실행 — 작업 단계의 편향 없음
5. 검증기의 결과를 파싱:
   - PASS 항목 → DoD 파일의 `- [ ]`를 `- [x]`로 변경
   - FAIL 항목 → 이번 반복에서 해당 문제를 수정
6. FAIL 항목이 수정된 경우, 다음 Stop hook이 다시 검증 라운드를 시작

### ralph-verifier 에이전트 프롬프트 구성

ralph-verifier.md 파일을 읽고, 다음 내용을 추가하여 전달:

```
검증할 항목:
<remaining DoD items>

프로젝트 경로: <CWD from state.json>
```

### 별도 에이전트를 사용하는 이유

코드를 작성한 에이전트가 스스로 검증해서는 안 됩니다. ralph-verifier 에이전트는 깨끗한 컨텍스트에서 시작하여 실제 파일을 읽고 객관적으로 판단합니다.

---

## 파일 구조

### state/DoD.md

```markdown
# RALPH DOD CHECKLIST
# FORMAT: - [ ] TEST_ID: Description
# ENDMARKER: DODEOF

- [ ] TC-E2E-001:모든 필수 필드로 리소스 생성
- [ ] TC-E2E-002:단건 조회 성공
- [ ] TC-E2E-003:필수 필드 누락 시 400 반환
- [ ] TC-UNIT-001:엔티티 create() 메서드 정상 동작
- [ ] TC-UNIT-002:서비스 findAll() 메서드 정상 동작

DODEOF
```

### state/ralph-state.json

```json
{
  "original_prompt": "사용자가 ralph에 입력한 원본 프롬프트",
  "test_case_file": "state/test-case.md",
  "session_id": "...",
  "created_at": "ISO-8601 타임스탬프",
  "loop_count": 0
}
```

---

## 보안 및 안전성

- 원래 프롬프트는 셸 인젝션 방지를 위해 JSON에 저장
- Stop hook은 jq JSON 구성을 통해 프롬프트를 안전하게 재주입
- DoD 파일은 작업 단계 중 수정으로부터 보호됨 — 검증 단계에서만 수정 가능
