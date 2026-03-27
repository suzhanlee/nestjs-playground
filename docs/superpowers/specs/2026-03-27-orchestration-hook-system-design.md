# Orchestration Hook System Design

**Date:** 2026-03-27
**Status:** Draft

## Context

This system creates an automated workflow orchestration for feature development using hooks. The workflow follows: **interview → test-case → implement**.

When a skill completes, the stop hook automatically determines the next step and blocks with instructions to continue.

## Architecture

```
User: /start-orchestration
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  UserPromptSubmit Hook (init.sh)                            │
│  - Check skill == "startOrchestration"                      │
│  - Delete old state.json                                    │
│  - Create new state.json                                    │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  User enters feature → Skill("interview")                   │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  PreToolUse Hook (skill-state-pre.sh)                       │
│  - Update state.json: status = "start"                      │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  Skill executes...                                          │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  PostToolUse Hook (skill-state-post.sh)                     │
│  - Update state.json: status = "end"                        │
│  - Run validate_prompt (if defined in skill)                │
└─────────────────────────────────────────────────────────────┘
         │
         ▼
┌─────────────────────────────────────────────────────────────┐
│  SessionEnd Hook (stop.sh) ← ORCHESTRATOR                   │
│  - Read state.json                                          │
│  - If skill_name == "interview" + status == "end"           │
│    → Block: Execute Skill("test-case")                      │
│  - If skill_name == "test-case" + status == "end"           │
│    → Block: Execute Skill("implement")                      │
│  - If skill_name == "implement" + status == "end"           │
│    → Continue (workflow complete)                           │
└─────────────────────────────────────────────────────────────┘
```

## State Management

**File:** `state/state.json`

```json
{
  "skill_name": "interview",
  "status": "start|end",
  "timestamp": "2026-03-27T10:00:00.000Z"
}
```

**Status Values:**
- `start`: Skill execution began
- `end`: Skill execution completed

**Orchestration Table:**

| Current Skill | Status | Next Action |
|---------------|--------|-------------|
| `interview` | `end` | Block: Execute `test-case` |
| `test-case` | `end` | Block: Execute `implement` |
| `implement` | `end` | Continue (done) |

## File Structure

```
.claude/
├── hooks/
│   ├── init.sh              # Initialize on startOrchestration
│   ├── stop.sh              # Orchestrate next skill
│   ├── skill-state-pre.sh   # Set status to "start"
│   └── skill-state-post.sh  # Set status to "end" + validate
├── skills/
│   └── startOrchestration/  # Start workflow skill
│       └── SKILL.md
state/
└── .gitkeep                # Keep directory in git
```

## Hooks Configuration

**settings.json:**

```json
{
  "hooks": {
    "UserPromptSubmit": [
      {
        "matcher": "Skill",
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/init.sh",
            "timeout": 5
          }
        ]
      }
    ],
    "SessionEnd": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "bash .claude/hooks/stop.sh",
            "timeout": 10
          }
        ]
      }
    ]
  }
}
```

## Implementation Details

### init.sh

Initialize `state/state.json` when `startOrchestration` skill is called.

- Reads stdin for skill name
- Only processes `startOrchestration`
- Deletes existing state.json
- Creates new state.json with `status: "initialized"`

### stop.sh

Orchestrate next skill based on current state.

- Reads `state/state.json`
- Only acts when `status == "end"`
- Returns decision block with next skill instruction

### startOrchestration Skill

Initialize the workflow with state tracking.

## Verification

1. Run `/start-orchestration` → state.json created
2. Run `/interview` → state.json shows `skill_name: "interview", status: "start"`
3. Complete interview → state.json shows `status: "end"`
4. Session ends → stop hook blocks with `Execute: Skill("test-case")`
5. Run `/test-case` → state.json shows `skill_name: "test-case"`
6. Repeat for `implement`
