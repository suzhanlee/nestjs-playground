---
name: test-case
description: 요구사항 문서를 분석하여 포괄적인 테스트 케이스를 생성하고 MD 파일로 저장합니다. "테스트 케이스", "test-case"
allowed-tools:
  - Read
  - Write
  - AskUserQuestion
  - Bash
  - Glob
validate_prompt: |
  dod:
    - id: "1"
      description: "결과 파일이 해당 위치(state/test-case.md)에 새로 생겼는가"
    - id: "2"
      description: "모든 핵심 기능에 대한 E2E 테스트 케이스가 포함되었는가"
    - id: "3"
      description: "비즈니스 규칙 및 제약조건에 대한 테스트 케이스가 포함되었는가"
    - id: "4"
      description: "단위 테스트 케이스가 도메인/서비스 레벨에서 포함되었는가"
    - id: "5"
      description: "테스트 케이스의 명명 규칙이 일관되게 적용되었는가"
    - id: "6"
      description: "테스트 우선순위(P0, P1, P2, P3)가 지정되었는가"
    - id: "7"
      description: "요구사항과 테스트 케이스의 추적성이 확보되었는가"
---

# 테스트 케이스 생성 스킬

## 개요

요구사항 문서(requirements.md)를 분석하여 E2E, 단위, 통합 테스트 케이스를 체계적으로 생성합니다.

## 사용법

```
/test-case
```

## 테스트 케이스 추출 전문가의 멘탈 모델

### Phase 1: 요구사항 분석

- **프로젝트 개요 파악**: 프로젝트명, 목적, 대상 사용자
- **핵심 기능 분해**: API 엔드포인트/유스케이스 매핑
- **데이터 모델링 유추**: 엔티티, 필드, 제약조건

### Phase 2: 테스트 시나리오 분류

| 유형 | 비중 | 설명 |
|------|------|------|
| 정상 시나리오 (Happy Path) | 40% | 정상적인 데이터로 정상적으로 동작하는 경우 |
| 예외 시나리오 (Error Cases) | 30% | 유효하지 않은 데이터, 누락된 데이터 |
| 경계값 분석 (Boundary Values) | 20% | 최소/최대값, 빈 값, null 값 |
| 비즈니스 규칙 검증 | 10% | 도메인 특화 규칙, 제약조건 |

### Phase 3: 각 레이어별 테스트 케이스 설계

**E2E 테스트**: API 엔드포인트별
- POST /api/[resources]: 생성 관련
- GET /api/[resources]: 목록 조회
- GET /api/[resources]/:id: 단건 조회
- PATCH /api/[resources]/:id: 수정
- DELETE /api/[resources]/:id: 삭제

**단위 테스트**: 엔티티/서비스별
- 엔티티 Factory Method: create()
- 엔티티 Business Method: 비즈니스 로직
- 서비스 CRUD Operations: CRUD 동작

### Phase 4: 경계값 분석

**문자열**:
- 빈 문자열 (`""`)
- 공백만 (`"   "`)
- 1글자
- 최대길이 ± 1
- null

**숫자**:
- 0
- 1
- -1
- 최소값 - 1
- 최대값 + 1
- null

**배열**:
- 빈 배열 (`[]`)
- 1개 요소
- 최대 요소 수 ± 1
- null

### Phase 5: 비즈니스 규칙 추출 패턴

| 키워드 패턴 | 추출된 테스트 |
|-------------|---------------|
| "반드시/필수" | 필드 누락 시 400 Bad Request |
| "최대/최소/이하/이상" | 범위 초과/미만 시 400 Bad Request |
| "중복 불가/고유" | 중복 데이터로 생성 시도 |
| "초과할 수 없다/제한" | 비즈니스 규칙 위반 시 실패 |
| "자동으로/기본값" | 자동 생성된 값 검증 |
| "상태 변경/전이" | 상태 변화 검증 |

### Phase 6: 우선순위 지정

| 우선순위 | 기준 | 예시 |
|----------|------|------|
| **P0** (필수) | MVP 런칭 필수, 핵심 비즈니스 기능 | 기본 CRUD, 인증 |
| **P1** (높음) | 안정성 필수, 자주 발생하는 예외 | 유효성 검증, 404 처리 |
| **P2** (중간) | 신뢰성 향상, 드문 예외 케이스 | 경계값, 동시성 |
| **P3** (낮음) | 사용성 향상, UI 관련 | 정렬, 필터링 옵션 |

## 구현 가이드

### Step 1: requirements.md 읽기

```bash
# requirements.md 확인
ls -la state/
```

### Step 2: requirements.md 읽기 및 파싱

- 핵심 기능 추출
- 비즈니스 규칙 및 제약조건 추출
- 우선순위 정보 파악

### Step 3: E2E 테스트 케이스 생성

각 CRUD operation별:

**정상 시나리오 (Happy Path)**:
- 모든 필수 필드로 리소스 생성
- 선택적 필드 포함/제외
- 단건/다건 조회

**유효성 검증 (Validation)**:
- 필수 필드 누락
- 데이터 타입 불일치
- 허용되지 않은 값

**경계값 분석 (Boundary Values)**:
- 빈 문자열, 공백
- 최소/최대값
- null 값

**비즈니스 규칙 검증**:
- 중복 데이터 체크
- 상태 변화 검증
- 제약조건 위반

### Step 4: 단위 테스트 케이스 생성

**엔티티 Factory Method**:
- 유효한 파라미터로 엔티티 생성
- 필수 파라미터 누락
- 잘못된 타입의 파라미터

**엔티티 Business Methods**:
- 각 비즈니스 메서드의 정상 동작
- 경계값 조건
- 예외 상황

**서비스 CRUD Operations**:
- 생성, 조회, 수정, 삭제
- 존재하지 않는 리소스 처리
- 동시성 고려

### Step 5: test-case.md 파일 생성

```markdown
# [프로젝트명] 테스트 케이스 문서

## 생성 정보
- 생성일: YYYY-MM-DD HH:mm:ss
- 세션 ID: {sessionId}
- 요구사항 문서: requirements.md

---

## 1. 테스트 전략

### 테스트 범위
- E2E 테스트: API 엔드포인트 검증
- 단위 테스트: 도메인 로직 및 서비스 계층 검증
- 통합 테스트: 레이어 간 상호작용 검증

### 테스트 도구
- E2E: Supertest + Jest
- 단위/통합: Jest

---

## 2. E2E 테스트 케이스

### 2.1 POST /api/[resources]

#### 정상 시나리오 (Happy Path)
- [ ] **TC-E2E-001**: 모든 필수 필드로 [리소스] 생성
  - Given: 유효한 필수 데이터
  - When: POST /api/[resources]
  - Then: 201 Created, 응답에 생성된 ID 포함

#### 유효성 검증 (Validation)
- [ ] **TC-E2E-003**: 필수 필드 누락 시 400 반환

#### 경계값 분석 (Boundary Values)
- [ ] **TC-E2E-006**: 빈 문자열 필드 처리

#### 비즈니스 규칙 검증
- [ ] **TC-E2E-010**: 중복 [필드]로 생성 시도 시 실패

---

## 3. 단위 테스트 케이스

### 3.1 [Entity] 엔티티

#### Factory Method - create()
- [ ] **TC-UNIT-001**: 유효한 파라미터로 엔티티 생성

---

## 4. 테스트 우선순위

### P0 (필수 - MVP 런칭 필수)
- TC-E2E-001, 002, 003...

### P1 (높음 - 안정성 필수)
- TC-E2E-006, 007...

### P2 (중간 - 신뢰성 향상)
- TC-E2E-021...

### P3 (낮음 - 사용성 향상)
- (사용성 관련 테스트 케이스)

---

## 5. 테스트 데이터 준비

### 테스트 픽스처
- 주요 테스트 시나리오를 위한 샘플 데이터

### 경계값 데이터
- 각 필드의 최소/최대/경계 값

---

## 6. 참고사항

### 테스트 실행 방법
```bash
# E2E 테스트
npm run test:e2e

# 단위 테스트
npm test

# 커버리지
npm run test:cov
```

### 테스트 작성 시 참고사항
- 각 테스트는 독립적이어야 함
- 테스트 간 의존성 없이 순서 무관하게 실행 가능
- 명확한 Given-When-Then 구조 유지
```

### Step 6: 완료 안내

```
✅ 테스트 케이스 생성 완료

📁 저장 위치: state/test-case.md
📊 생성된 테스트 케이스:
   - E2E 테스트: N개
   - 단위 테스트: N개
   - 우선순위 P0: N개
   - 우선순위 P1: N개
   - 우선순위 P2: N개
   - 우선순위 P3: N개
```

## 검증 방법 (DoD)

1. `/test-case` 실행
2. **DoD 확인 1**: `state/test-case.md` 파일이 새로 생성되었는가?
3. **DoD 확인 2**: requirements.md의 각 핵심 기능별로 최소 3개 이상의 E2E 테스트 케이스가 있는가?
4. **DoD 확인 3**: requirements.md의 각 비즈니스 규칙별 검증 테스트가 있는가?
5. **DoD 확인 4**: 엔티티/서비스별 단위 테스트가 있는가?
6. **DoD 확인 5**: TC-E2E-XXX, TC-UNIT-XXX 명명 규칙이 적용되었는가?
7. **DoD 확인 6**: 모든 테스트 케이스가 P0-P3로 분류되었는가?
8. **DoD 확인 7**: 테스트 케이스가 요구사항의 모든 핵심 기능을 커버하는가?

## 주의사항

- **요구사항 범위**: requirements.md에 명시된 비즈니스 요구사항만 다루어야 함
- **구현 상세 제외**: API 엔드포인트 설계, 도메인 모델링 등은 별도 단계에서 다룸
- **테스트 가능성**: 실제 테스트 가능한 수준의 케이스만 작성
- **추적성 유지**: 각 테스트 케이스가 어떤 요구사항에서 파생되었는지 명확히

## 참고 자료

- `.claude/skills/test-case/references/test-patterns.md` - NestJS 테스트 패턴
- `.claude/skills/test-case/references/boundary-values.md` - 경계값 분석 가이드
- `.claude/skills/test-case/references/naming-conventions.md` - 테스트 케이스 명명 규칙
