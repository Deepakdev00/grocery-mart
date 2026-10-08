---
description: Discuss a phase before planning (clarify scope and approach)
argument-hint: "<phase-number>"
---

# /discuss-phase Workflow

<objective>
Interactive discussion about a phase to clarify scope, approach, and concerns before creating plans.
</objective>

<context>
Run BEFORE `/plan` when:
- Phase scope is unclear
- Multiple implementation approaches exist
- Trade-offs need user input
- Dependencies are complex
</context>

<process>

## 1. Load Phase Context

Read from ROADMAP.md:
- Phase objective
- Dependencies
- Current status

---

## 2. Analyze Requirements

From phase objective, extract:
- What needs to be built
- What constraints exist
- What decisions need to be made

---

## 3. Present Discussion Points

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► DISCUSS PHASE {N}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Phase: {name}
Objective: {objective}

───────────────────────────────────────────────────────

TOPICS TO DISCUSS

1. SCOPE CLARIFICATION
   - {question about scope}
   - {question about boundaries}

2. IMPLEMENTATION APPROACH
   Option A: {approach}
   Option B: {approach}
   Which do you prefer and why?

3. DEPENDENCIES
   - Requires: {what from previous phases}
   - Missing: {any gaps in earlier work}

4. CONCERNS
   - {potential issue}
   - {risk to flag}

───────────────────────────────────────────────────────
```

---

## 4. Gather User Input

Listen for:
- Scope decisions
- Approach preferences
- Constraints not in spec
- Priority clarifications

---

## 5. Capture Phase Context

Create or update `.gsd/phases/{N}/CONTEXT.md` using `.gsd/templates/context.md`.
Capture the user's vision in their words, including essential and flexible scope,
out-of-scope items, expectations, examples, answered questions, and constraints.

---

## 6. Offer Next Steps

```
───────────────────────────────────────────────────────

✓ Phase context documented in .gsd/phases/{N}/CONTEXT.md

▶ NEXT

/plan {N} — Create execution plans with this context
/research-phase {N} — Deep dive on technical options

───────────────────────────────────────────────────────
```

</process>
