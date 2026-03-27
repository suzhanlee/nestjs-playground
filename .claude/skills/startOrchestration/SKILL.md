---
name: startOrchestration
description: Initialize the orchestration workflow for feature development. Sets up state tracking and prepares for interview phase.
---

# Start Orchestration

This skill initializes the development workflow that guides you through feature development with automated state tracking.

## What This Does

1. Initializes `state/state.json` with workflow state
2. Prepares the system for the interview phase
3. Enables automatic orchestration between skills

## Workflow Steps

The orchestration follows this sequence:

```
interview → test-case → implement
```

After each skill completes, the stop hook will automatically guide you to the next step.

## Usage

Simply invoke this skill to start the workflow:

```
/start-orchestration
```

## Next Steps

1. Describe your feature requirements
2. Use `/interview` to gather detailed requirements
3. Follow the orchestration prompts through each phase

## State File

The workflow state is tracked in `state/state.json`:

```json
{
  "skill_name": "current-skill",
  "status": "start|end",
  "timestamp": "2026-03-27T10:00:00.000Z"
}
```
