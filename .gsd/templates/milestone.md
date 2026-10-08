# Milestone Template

Reference structure for milestone definition and tracking. `/new-milestone` records active milestone details in `ROADMAP.md` and `STATE.md`; `/complete-milestone` creates `.gsd/milestones/{name}-SUMMARY.md`.

---

## File Template

```markdown
---
name: {milestone-name}
version: {semantic version, e.g., v1.0}
status: planning | active | complete | archived
created: [ISO timestamp]
target_date: [optional target]
---

# Milestone: {name}

## Vision

{What this milestone achieves — one paragraph}

## Must-Haves

Non-negotiable deliverables for this milestone:

- [ ] {Must-have 1}
- [ ] {Must-have 2}
- [ ] {Must-have 3}

## Nice-to-Haves

If time permits:

- [ ] {Nice-to-have 1}
- [ ] {Nice-to-have 2}

## Phases

| Phase | Name | Status | Objective |
|-------|------|--------|-----------|
| 1 | {name} | ⬜ Not Started | {objective} |
| 2 | {name} | ⬜ Not Started | {objective} |
| 3 | {name} | ⬜ Not Started | {objective} |

## Success Criteria

How we know milestone is complete:

- [ ] {Measurable criterion 1}
- [ ] {Measurable criterion 2}

## Architecture Decisions

Key technical decisions for this milestone:

| Decision | Choice | Rationale |
|----------|--------|-----------|
| {decision} | {choice} | {why} |

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| {risk} | Low/Med/High | Low/Med/High | {action} |

## Progress Log

| Date | Event | Notes |
|------|-------|-------|
| {date} | Milestone started | — |
```

---

## Lifecycle

1. **Creation:** `/new-milestone` records the milestone in `ROADMAP.md` and `STATE.md`
2. **Active:** Progress is tracked in `ROADMAP.md` and `STATE.md`
3. **Complete:** `/complete-milestone` creates `.gsd/milestones/{name}-SUMMARY.md` and archives phase files
4. **Archived:** The summary is a read-only reference

---

## Guidelines

- One active milestone at a time
- 3-5 phases per milestone
- Must-haves should be testable
- Success criteria should be measurable
