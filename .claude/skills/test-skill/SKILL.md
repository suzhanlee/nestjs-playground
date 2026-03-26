---
name: test-skill
description: Hook 시스템 테스트용 Skill
validate_prompt: 이 형식을 따르세요: ## Summary, ## Steps, ## Status (최대 10줄)
---

# Test Skill

Hook 시스템을 테스트하기 위한 간단한 Skill입니다.

## 요구사항

사용자의 요청을 받아서 다음 형식으로 응답하세요:

```markdown
## Summary
[1줄로 작업 요약]

## Steps
1. [첫 번째 단계]
2. [두 번째 단계]

## Status
DONE
```

## 규칙

- 전체 출력은 10줄을 넘지 않아야 합니다
- 모든 섹션(Summary, Steps, Status)이 포함되어야 합니다
- Status는 DONE 또는 IN_PROGRESS여야 합니다