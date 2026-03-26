# Claude Code Hooks 결정 제어 패턴 참조

이 문서는 Claude Code Hooks의 **결정 제어(Decision Control)** 패턴에 대한 스펙을 정리한 것입니다. Hook이 Claude의 동작을 제어하는 방법, JSON 출력 형식, 종료 코드 의미를 포함합니다.

전체 문서: [Claude Code Hooks 참조](https://code.claude.com/docs/ko/hooks)

---

## 목차

1. [결정 제어 개요](#결정-제어-개요)
2. [범용 필드](#범용-필드)
3. [종료 코드 출력](#종료-코드-출력)
4. [결정 제어 패턴별 스펙](#결정-제어-패턴별-스펙)
5. [이벤트별 종료 코드 2 동작](#이벤트별-종료-코드-2-동작)

---

## 결정 제어 개요

Hook은 Claude Code의 수명 주기에서 특정 지점에 실행되며, **결정 제어(Decision Control)**를 통해 Claude의 동작을 제어할 수 있습니다.

### 결정 제어 방법

| 방법 | 설명 | 사용 사례 |
|------|------|----------|
| **종료 코드 0** | 성공, JSON 출력 처리 | 대부분의 경우 |
| **종료 코드 2** | 차단 오류, stderr 피드백 | 작업 차단 |
| **종료 코드 기타** | 차단하지 않는 오류 | 로깅만 |
| **JSON 출력** | 세밀한 제어 | permissionDecision, decision 등 |

### 종료 코드 vs JSON 출력

```
종료 코드로 제어:
├── exit 0  → JSON 출력 처리 (allow/block)
├── exit 2  → 차단 오류 (stderr 피드백)
└── exit N  → 차단하지 않는 오류 (N ≠ 0, 2)

JSON 출력으로 제어:
├── continue: false          → 완전 중지
├── decision: "block"       → 작업 차단
├── permissionDecision      → 허용/거부/요청
└── systemMessage           → 사용자 메시지
```

---

## 범용 필드

모든 hook 이벤트에서 사용 가능한 JSON 출력 필드:

| 필드 | 기본값 | 설명 |
|------|--------|------|
| `continue` | `true` | `false`인 경우 hook 실행 후 Claude가 완전히 중지됨 |
| `stopReason` | 없음 | `continue: false`일 때 사용자에게 표시되는 메시지 |
| `suppressOutput` | `false` | `true`인 경우 자세한 모드 출력에서 stdout을 숨김 |
| `systemMessage` | 없음 | 사용자에게 표시되는 경고 메시지 |

### 예시: Claude 완전 중지

```json
{
  "continue": false,
  "stopReason": "Build failed, fix errors before continuing"
}
```

---

## 종료 코드 출력

### 종료 0: 성공

Claude Code는 JSON 출력 필드를 위해 stdout을 구문 분석합니다. JSON 출력은 종료 0에서만 처리됩니다.

### 종료 2: 차단 오류

Claude Code는 stdout과 JSON을 무시하고 stderr 텍스트를 Claude에 오류 메시지로 피드백합니다.

### 기타 종료 코드: 차단하지 않는 오류

stderr는 자세한 모드(`Ctrl+O`)에서만 표시되고 실행이 계속됩니다.

### 예시: 종료 코드 2로 차단

```bash
#!/bin/bash
# stdin에서 JSON 입력을 읽고 명령을 확인합니다
command=$(jq -r '.tool_input.command' < /dev/stdin)

if [[ "$command" == rm* ]]; then
  echo "Blocked: rm commands are not allowed" >&2
  exit 2  # 차단 오류: 도구 호출이 방지됨
fi

exit 0  # 성공: 도구 호출이 진행됨
```

---

## 결정 제어 패턴별 스펙

모든 이벤트가 결정 제어를 지원하지는 않습니다. 각 이벤트는 서로 다른 필드 집합을 사용하여 결정을 표현합니다.

| 이벤트 | 결정 패턴 | 주요 필드 |
|--------|-----------|-----------|
| UserPromptSubmit, PostToolUse, PostToolUseFailure, Stop, SubagentStop, ConfigChange | 최상위 `decision` | `decision: "block"`, `reason` |
| TeammateIdle, TaskCompleted | 종료 코드 또는 `continue: false` | 종료 코드 2 또는 `{"continue": false, "stopReason": "..."}` |
| PreToolUse | `hookSpecificOutput` | `permissionDecision` (allow/deny/ask), `permissionDecisionReason`, `updatedInput` |
| PermissionRequest | `hookSpecificOutput` | `decision.behavior` (allow/deny), `updatedInput`, `updatedPermissions` |
| WorktreeCreate | stdout 경로 | Hook은 생성된 worktree의 절대 경로를 인쇄 |
| Elicitation | `hookSpecificOutput` | `action` (accept/decline/cancel), `content` |
| ElicitationResult | `hookSpecificOutput` | `action` (accept/decline/cancel), `content` |
| WorktreeRemove, Notification, SessionEnd, PreCompact, PostCompact, InstructionsLoaded | 없음 | 결정 제어 없음. 로깅 또는 정리에 사용 |

---

### 1. 최상위 `decision` 패턴

**사용 가능한 이벤트**: UserPromptSubmit, PostToolUse, PostToolUseFailure, Stop, SubagentStop, ConfigChange

유일한 값은 `"block"`입니다. 작업을 진행하도록 허용하려면 JSON에서 `decision`을 생략하거나 JSON 없이 종료 0으로 나갑니다.

| 필드 | 설명 |
|------|------|
| `decision` | `"block"`은 작업이 진행되는 것을 방지합니다. 생략하여 작업을 진행하도록 허용 |
| `reason` | `decision: "block"`일 때 사용자/Claude에게 표시되는 설명 |

#### 예시: UserPromptSubmit에서 프롬프트 차단

```json
{
  "decision": "block",
  "reason": "Test suite must pass before proceeding"
}
```

#### 예시: Stop에서 Claude 중지 방지

```json
{
  "decision": "block",
  "reason": "작업이 아직 완료되지 않았습니다. 계속 진행해주세요."
}
```

#### 예시: PostToolUse에서 피드백 제공

```json
{
  "decision": "block",
  "reason": "테스트가 실패했습니다. 실패한 테스트를 먼저 수정하세요.",
  "hookSpecificOutput": {
    "hookEventName": "PostToolUse",
    "additionalContext": "실패한 테스트: 3개"
  }
}
```

---

### 2. `hookSpecificOutput` - PreToolUse 패턴

**사용 가능한 이벤트**: PreToolUse

PreToolUse는 `hookSpecificOutput` 객체 내에 결정을 반환합니다. 세 가지 결과(허용, 거부, 요청) 및 실행 전에 도구 입력을 수정하는 기능을 제공합니다.

| 필드 | 설명 |
|------|------|
| `permissionDecision` | `"allow"`는 권한 시스템을 우회하고, `"deny"`는 도구 호출을 방지하고, `"ask"`는 사용자에게 확인을 요청합니다 |
| `permissionDecisionReason` | `"allow"` 및 `"ask"`의 경우 사용자에게 표시되지만 Claude에는 표시되지 않습니다. `"deny"`의 경우 Claude에 표시됩니다 |
| `updatedInput` | 실행 전에 도구의 입력 매개변수를 수정합니다. `"allow"`와 결합하여 자동 승인하거나 `"ask"`와 결합하여 수정된 입력을 사용자에게 표시합니다 |
| `additionalContext` | 도구가 실행되기 전에 Claude의 컨텍스트에 추가되는 문자열 |

#### 예시: allow - 자동 허용

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow",
    "permissionDecisionReason": "보안 검증을 통과했습니다",
    "updatedInput": {
      "command": "npm run lint"
    },
    "additionalContext": "현재 환경: production. 주의해서 진행하세요."
  }
}
```

#### 예시: deny - 거부

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "deny",
    "permissionDecisionReason": "rm -rf 명령은 허용되지 않습니다",
    "additionalContext": "안전하지 않은 명령이 차단되었습니다"
  }
}
```

#### 예시: ask - 사용자 확인 요청

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "ask",
    "permissionDecisionReason": "프로덕션 환경에서 실행하려면 확인이 필요합니다",
    "updatedInput": {
      "command": "npm run deploy:prod"
    }
  }
}
```

---

### 3. `hookSpecificOutput` - PermissionRequest 패턴

**사용 가능한 이벤트**: PermissionRequest

권한 요청을 허용하거나 거부합니다.

| 필드 | 설명 |
|------|------|
| `decision.behavior` | `"allow"`는 권한을 부여하고, `"deny"`는 거부합니다 |
| `updatedInput` | `"allow"`만 해당: 실행 전에 도구의 입력 매개변수를 수정합니다 |
| `updatedPermissions` | `"allow"`만 해당: 권한 규칙 업데이트를 적용합니다. 사용자가 "항상 허용" 옵션을 선택하는 것과 동등합니다 |
| `message` | `"deny"`만 해당: Claude에 권한이 거부된 이유를 알립니다 |
| `interrupt` | `"deny"`만 해당: `true`인 경우 Claude를 중지합니다 |

#### 예시: allow - 자동 허용

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PermissionRequest",
    "decision": {
      "behavior": "allow",
      "updatedInput": {
        "command": "npm run lint"
      }
    }
  }
}
```

#### 예시: deny - 거부

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PermissionRequest",
    "decision": {
      "behavior": "deny",
      "message": "이 명령은 현재 브랜치에서 실행할 수 없습니다",
      "interrupt": true
    }
  }
}
```

#### 예시: updatedPermissions - 권한 규칙 추가

```json
{
  "hookSpecificOutput": {
    "hookEventName": "PermissionRequest",
    "decision": {
      "behavior": "allow",
      "updatedPermissions": [
        {
          "type": "addRules",
          "rules": [
            {
              "toolName": "Bash",
              "ruleContent": "npm test"
            }
          ],
          "behavior": "allow",
          "destination": "localSettings"
        }
      ]
    }
  }
}
```

---

### 4. `hookSpecificOutput` - Elicitation 패턴

**사용 가능한 이벤트**: Elicitation

MCP 서버가 사용자 입력을 요청할 때 프로그래밍 방식으로 응답합니다.

| 필드 | 값 | 설명 |
|------|-----|------|
| `action` | `accept`, `decline`, `cancel` | 요청을 수락, 거부 또는 취소할지 여부 |
| `content` | 객체 | 제출할 form 필드 값. `action`이 `accept"`일 때만 사용됨 |

#### 예시: accept - 수락

```json
{
  "hookSpecificOutput": {
    "hookEventName": "Elicitation",
    "action": "accept",
    "content": {
      "username": "alice",
      "password": "secure_password"
    }
  }
}
```

#### 예시: decline - 거부

```json
{
  "hookSpecificOutput": {
    "hookEventName": "Elicitation",
    "action": "decline"
  }
}
```

#### 예시: cancel - 취소

```json
{
  "hookSpecificOutput": {
    "hookEventName": "Elicitation",
    "action": "cancel"
  }
}
```

---

### 5. `hookSpecificOutput` - ElicitationResult 패턴

**사용 가능한 이벤트**: ElicitationResult

사용자의 응답을 재정의합니다.

| 필드 | 값 | 설명 |
|------|-----|------|
| `action` | `accept`, `decline`, `cancel` | 사용자의 작업을 재정의합니다 |
| `content` | 객체 | form 필드 값을 재정의합니다. `action`이 `"accept"`일 때만 의미 있음 |

#### 예시: 사용자 응답 재정의

```json
{
  "hookSpecificOutput": {
    "hookEventName": "ElicitationResult",
    "action": "decline",
    "content": {}
  }
}
```

---

### 6. WorktreeCreate 패턴

**사용 가능한 이벤트**: WorktreeCreate

Hook은 생성된 worktree 디렉토리의 절대 경로를 stdout에 인쇄해야 합니다. Claude Code는 이 경로를 격리된 세션의 작업 디렉토리로 사용합니다.

#### 예시: 경로 출력

```bash
#!/bin/bash
# stdin에서 JSON 입력을 읽습니다
NAME=$(jq -r '.name')
DIR="$HOME/.claude/worktrees/$NAME"

# worktree 생성
git worktree add "$DIR" "$NAME" >&2

# 경로 출력 (Claude Code가 읽음)
echo "$DIR"
```

**출력 예시**:
```
/Users/username/.claude/worktrees/feature-auth
```

---

### 7. 종료 코드 2 패턴

**사용 가능한 이벤트**: PreToolUse, PermissionRequest, UserPromptSubmit, Stop, SubagentStop, TeammateIdle, TaskCompleted, ConfigChange, Elicitation, ElicitationResult, WorktreeCreate

종료 코드 2는 hook이 "멈춰, 이것을 하지 마"라고 신호하는 방식입니다.

#### 예시: TeammateIdle에서 빌드 아티팩트 확인

```bash
#!/bin/bash

if [ ! -f "./dist/output.js" ]; then
  echo "Build artifact missing. Run the build before stopping." >&2
  exit 2  # 팀원이 계속 작동함
fi

exit 0  # 팀원이 유휴 상태가 됨
```

#### 예시: TaskCompleted에서 테스트 통과 확인

```bash
#!/bin/bash
INPUT=$(cat)
TASK_SUBJECT=$(echo "$INPUT" | jq -r '.task_subject')

# 테스트 스위트를 실행합니다
if ! npm test 2>&1; then
  echo "Tests not passing. Fix failing tests before completing: $TASK_SUBJECT" >&2
  exit 2  # 작업이 완료로 표시되지 않음
fi

exit 0  # 작업이 완료로 표시됨
```

---

### 8. `continue: false` 패턴

**사용 가능한 이벤트**: TeammateIdle, TaskCompleted

팀원을 다시 실행하는 대신 완전히 중지합니다. `Stop` hook 동작과 일치합니다.

#### 예시: TeammateIdle 완전 중지

```json
{
  "continue": false,
  "stopReason": "Critical error: build failed. Stopping all work."
}
```

#### 예시: TaskCompleted 완전 중지

```json
{
  "continue": false,
  "stopReason": "테스트 실패로 인해 작업을 중단합니다."
}
```

---

### 9. 결정 제어가 없는 이벤트

이 이벤트는 결정 제어를 지원하지 않습니다. 로깅, 감사, 정리와 같은 부작용에만 사용할 수 있습니다.

| 이벤트 | 용도 |
|--------|------|
| WorktreeRemove | worktree 제거 후 정리 |
| Notification | 알림 로깅 |
| SessionEnd | 세션 종료 후 정리 |
| PreCompact | 압축 전 로깅 |
| PostCompact | 압축 후 로깅 |
| InstructionsLoaded | 명령 파일 로드 감사 |

#### 예시: SessionEnd에서 로깅만

```bash
#!/bin/bash
INPUT=$(cat)
REASON=$(echo "$INPUT" | jq -r '.reason')

echo "Session ended: $REASON" >> /var/log/claude-sessions.log
exit 0
```

---

## 이벤트별 종료 코드 2 동작

종료 코드 2가 발생할 때의 동작은 이벤트에 따라 다릅니다.

| Hook 이벤트 | 차단 가능? | 종료 코드 2에서 발생하는 것 |
|-------------|-----------|-------------------------|
| `PreToolUse` | **예** | 도구 호출을 차단합니다 |
| `PermissionRequest` | **예** | 권한을 거부합니다 |
| `UserPromptSubmit` | **예** | 프롬프트 처리를 차단하고 프롬프트를 지웁니다 |
| `Stop` | **예** | Claude가 중지되는 것을 방지하고 대화를 계속합니다 |
| `SubagentStop` | **예** | subagent가 중지되는 것을 방지합니다 |
| `TeammateIdle` | **예** | 팀원이 유휴 상태가 되는 것을 방지합니다 (팀원이 계속 작업함) |
| `TaskCompleted` | **예** | 작업이 완료로 표시되는 것을 방지합니다 |
| `ConfigChange` | **예** | 구성 변경이 적용되는 것을 차단합니다 (`policy_settings` 제외) |
| `Elicitation` | **예** | elicitation을 거부합니다 |
| `ElicitationResult` | **예** | 응답을 차단합니다 (작업이 거부됨) |
| `WorktreeCreate` | **예** | 0이 아닌 종료 코드로 인해 worktree 생성이 실패합니다 |
| `PostToolUse` | **아니오** | Claude에 stderr을 표시합니다 (도구가 이미 실행됨) |
| `PostToolUseFailure` | **아니오** | Claude에 stderr을 표시합니다 (도구가 이미 실패함) |
| `Notification` | **아니오** | 사용자에게만 stderr을 표시합니다 |
| `SubagentStart` | **아니오** | 사용자에게만 stderr을 표시합니다 |
| `SessionStart` | **아니오** | 사용자에게만 stderr을 표시합니다 |
| `SessionEnd` | **아니오** | 사용자에게만 stderr을 표시합니다 |
| `PreCompact` | **아니오** | 사용자에게만 stderr을 표시합니다 |
| `PostCompact` | **아니오** | 사용자에게만 stderr을 표시합니다 |
| `WorktreeRemove` | **아니오** | 실패는 디버그 모드에서만 기록됩니다 |
| `InstructionsLoaded` | **아니오** | 종료 코드는 무시됩니다 |

---

## 요약 퀵 참조

### 결정 패턴 선택 가이드

```
┌─────────────────────────────────────────────────────────────┐
│                    결정 패턴 선택                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  도구 호출 제어?                                             │
│  ├── PreToolUse      → hookSpecificOutput                   │
│  │                     (permissionDecision)                 │
│  └── PermissionRequest → hookSpecificOutput                   │
│                         (decision.behavior)                 │
│                                                             │
│  프롬프트/응답 제어?                                         │
│  ├── UserPromptSubmit → decision: "block"                  │
│  ├── Stop/SubagentStop → decision: "block"                 │
│  └── ConfigChange      → decision: "block"                 │
│                                                             │
│  MCP 입력 제어?                                              │
│  ├── Elicitation      → hookSpecificOutput (action)         │
│  └── ElicitationResult → hookSpecificOutput (action)         │
│                                                             │
│  Worktree 생성?                                             │
│  └── WorktreeCreate   → stdout에 경로 출력                   │
│                                                             │
│  팀원/작업 제어?                                             │
│  └── TeammateIdle/TaskCompleted → 종료 코드 2 또는           │
│                                  {continue: false}          │
│                                                             │
│  로깅만 필요?                                                │
│  └── 결정 제어 없는 이벤트 → 종료 0 + 로깅                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### JSON 출력 구조 비교

```json
// 최상위 decision (UserPromptSubmit, Stop, etc.)
{
  "decision": "block",
  "reason": "..."
}

// hookSpecificOutput - PreToolUse
{
  "hookSpecificOutput": {
    "hookEventName": "PreToolUse",
    "permissionDecision": "allow|deny|ask",
    "permissionDecisionReason": "...",
    "updatedInput": {...}
  }
}

// hookSpecificOutput - PermissionRequest
{
  "hookSpecificOutput": {
    "hookEventName": "PermissionRequest",
    "decision": {
      "behavior": "allow|deny",
      "updatedInput": {...},
      "updatedPermissions": [...]
    }
  }
}

// hookSpecificOutput - Elicitation
{
  "hookSpecificOutput": {
    "hookEventName": "Elicitation",
    "action": "accept|decline|cancel",
    "content": {...}
  }
}

// continue: false (TeammateIdle, TaskCompleted)
{
  "continue": false,
  "stopReason": "..."
}
```

---

*이 문서는 Claude Code Hooks 공식 문서의 결정 제어 패턴 부분을 정리한 것입니다.*
*전체 문서: https://code.claude.com/docs/ko/hooks*
