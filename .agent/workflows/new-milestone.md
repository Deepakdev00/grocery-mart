---
description: Create a new milestone with phases
argument-hint: "<milestone-name>"
---

# /new-milestone Workflow

<objective>
Define a new milestone with goal, phases, and success criteria.
</objective>

<process>

## 1. Validate SPEC Exists

**PowerShell:**
```powershell
if (-not (Test-Path ".gsd/SPEC.md")) {
    Write-Error "SPEC.md required. Run /new-project first."
    exit 1
}
```

**Bash:**
```bash
if [ ! -f ".gsd/SPEC.md" ]; then
    echo "Error: SPEC.md required. Run /new-project first." >&2
    exit 1
fi
```

---

## 2. Gather Milestone Information

Ask for:
- **Name** — Milestone identifier (e.g., "v1.0", "MVP", "Beta")
- **Goal** — What does this milestone achieve?
- **Must-haves** — Non-negotiable deliverables
- **Nice-to-haves** — Optional if time permits

---

## 3. Generate Phase Breakdown

Based on goal and must-haves, suggest phases:

```markdown
## Suggested Phases

Phase 1: {Foundation/Setup}
Phase 2: {Core Feature A}
Phase 3: {Core Feature B}
Phase 4: {Integration/Polish}
Phase 5: {Verification/Launch}
```

Ask user to confirm or modify.

---

## 4. Update ROADMAP.md

```markdown
# ROADMAP.md

> **Current Milestone**: {name}
> **Goal**: {goal}

## Must-Haves
- [ ] {must-have 1}
- [ ] {must-have 2}

## Phases

### Phase 1: {name}
**Status**: ⬜ Not Started
**Objective**: {description}

### Phase 2: {name}
**Status**: ⬜ Not Started
**Objective**: {description}

...
```

---

## 5. Update STATE.md

```markdown
## Current Position
- **Milestone**: {name}
- **Phase**: Not started
- **Status**: Milestone planned
```

---

## 5b. Reset Session Files (if starting fresh)

If DECISIONS.md or JOURNAL.md contain entries from a previous milestone, reset them to prevent monolithic growth:

**PowerShell:**
```powershell
$currentMilestone = (Select-String -Path ".gsd/ROADMAP.md" -Pattern '^> \*\*Current Milestone\*\*: (.+)$').Matches.Groups[1].Value.Trim()
if (-not $currentMilestone) {
    Write-Error "Cannot archive previous milestone history without its name in ROADMAP.md."
    exit 1
}
$archiveDir = ".gsd/milestones/$currentMilestone"
foreach ($file in @("DECISIONS.md", "JOURNAL.md")) {
    $source = ".gsd/$file"
    $archive = "$archiveDir/$file"
    if ((Test-Path $source) -and (Get-Content $source | Measure-Object -Line).Lines -gt 5) {
        New-Item -ItemType Directory -Force $archiveDir | Out-Null
        if (-not (Test-Path $archive)) {
            Copy-Item -LiteralPath $source -Destination $archive -ErrorAction Stop
        }
        if (-not (Test-Path $archive)) {
            Write-Error "Could not preserve $source before resetting it."
            exit 1
        }
        if ($file -eq "DECISIONS.md") {
            Set-Content $source "# Decisions`n`n> Previous milestone archived in ``$archive``.`n`n---`n"
        } else {
            Set-Content $source "# Journal`n`n> Previous milestone archived in ``$archive``.`n`n---`n"
        }
    }
}
```

**Bash:**
```bash
previous_milestone=$(sed -n 's/^> \*\*Current Milestone\*\*: //p' .gsd/ROADMAP.md | head -n 1)
if [ -z "$previous_milestone" ]; then
    echo "Error: Cannot archive previous milestone history without its name in ROADMAP.md." >&2
    exit 1
fi
archive_dir=".gsd/milestones/$previous_milestone"
for file in DECISIONS.md JOURNAL.md; do
    source=".gsd/$file"
    archive="$archive_dir/$file"
    if [ -f "$source" ] && [ "$(wc -l < "$source")" -gt 5 ]; then
        mkdir -p "$archive_dir"
        if [ ! -f "$archive" ]; then
            cp "$source" "$archive" || exit 1
        fi
        if [ ! -f "$archive" ]; then
            echo "Error: Could not preserve $source before resetting it." >&2
            exit 1
        fi
        if [ "$file" = "DECISIONS.md" ]; then
            printf '# Decisions\n\n> Previous milestone archived in `%s`.\n\n---\n' "$archive" > "$source"
        else
            printf '# Journal\n\n> Previous milestone archived in `%s`.\n\n---\n' "$archive" > "$source"
        fi
    fi
done
```

> **Note:** Existing history is archived under the previous milestone before either file is reset.

---

## 6. Commit

```bash
git add .gsd/ROADMAP.md .gsd/STATE.md
git commit -m "docs: create milestone {name}"
```

---

## 7. Offer Next Steps

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► MILESTONE CREATED ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Milestone: {name}
Phases: {N}

───────────────────────────────────────────────────────

▶ NEXT

/plan 1 — Create Phase 1 execution plans

───────────────────────────────────────────────────────
```

</process>
