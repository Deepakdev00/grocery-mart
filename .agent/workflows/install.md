---
description: Install GSD into the current project from GitHub
---

# /install Workflow

<objective>
Install GSD for Antigravity into the current project from GitHub.
</objective>

<process>

## 1. Check for Existing Installation

Look for GSD marker directories:

**PowerShell:**
```powershell
$alreadyInstalled = (Test-Path ".agents") -or (Test-Path ".agent") -or (Test-Path ".gsd")
if ($alreadyInstalled) {
    Write-Output "GSD files detected in this project."
}
```

**Bash:**
```bash
if [ -d ".agents" ] || [ -d ".agent" ] || [ -d ".gsd" ]; then
    echo "GSD files detected in this project."
fi
```

**If already installed:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► ALREADY INSTALLED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GSD files already exist in this project.

───────────────────────────────────────────────────────

A) Reinstall — Overwrite with latest version
B) Cancel — Keep current installation

If you want to update instead: /update

───────────────────────────────────────────────────────
```

If user chooses Cancel, exit.
If user chooses Reinstall, continue to Step 2.

---

## 2. Clone from GitHub

```bash
git init .gsd-install-temp
git -C .gsd-install-temp remote add origin https://github.com/toonight/get-shit-done-for-antigravity.git
git -C .gsd-install-temp fetch --depth 1 origin 5b7762fd6f5ad5119a6f591fa943c48b6ab6028a
git -C .gsd-install-temp checkout --detach FETCH_HEAD
```

---

## 3. Preview Files to Be Installed

Display the workflow and script files from the pinned checkout before copying:

**PowerShell:**
```powershell
Get-ChildItem ".gsd-install-temp\.agent\workflows" -File | Select-Object -ExpandProperty Name
Get-ChildItem ".gsd-install-temp\scripts" -File | Select-Object -ExpandProperty Name
```

**Bash:**
```bash
find .gsd-install-temp/.agent/workflows -maxdepth 1 -type f -print
find .gsd-install-temp/scripts -maxdepth 1 -type f -print
```

## 4. Copy Files

**PowerShell:**
```powershell
# Core directories
Copy-Item -Recurse ".gsd-install-temp\.agent" ".\"
Copy-Item -Recurse ".gsd-install-temp\.agents" ".\"
Copy-Item -Recurse ".gsd-install-temp\.gemini" ".\"
Copy-Item -Recurse ".gsd-install-temp\.gsd\templates" ".\.gsd\"
Copy-Item -Recurse ".gsd-install-temp\adapters" ".\"
Copy-Item -Recurse ".gsd-install-temp\docs" ".\"
Copy-Item -Recurse ".gsd-install-temp\scripts" ".\"

# Root files
Copy-Item -Force ".gsd-install-temp\PROJECT_RULES.md" ".\"
Copy-Item -Force ".gsd-install-temp\GSD-STYLE.md" ".\"
Copy-Item -Force ".gsd-install-temp\model_capabilities.yaml" ".\"
```

**Bash:**
```bash
# Core directories
cp -r .gsd-install-temp/.agent ./
cp -r .gsd-install-temp/.agents ./
cp -r .gsd-install-temp/.gemini ./
cp -r .gsd-install-temp/.gsd/templates .gsd/
cp -r .gsd-install-temp/adapters ./
cp -r .gsd-install-temp/docs ./
cp -r .gsd-install-temp/scripts ./

# Root files
cp .gsd-install-temp/PROJECT_RULES.md ./
cp .gsd-install-temp/GSD-STYLE.md ./
cp .gsd-install-temp/model_capabilities.yaml ./
```

---

## 5. Cleanup

**PowerShell:**
```powershell
Remove-Item -Recurse -Force ".gsd-install-temp"
```

**Bash:**
```bash
rm -rf .gsd-install-temp
```

---

## 6. Add to .gitignore (Optional)

Check if `.gsd/STATE.md` and other session files should be gitignored:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► ADD TO .gitignore?
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Recommended .gitignore additions for session-specific files:

.gsd/STATE.md
.gsd/JOURNAL.md
.gsd/TODO.md

───────────────────────────────────────────────────────

A) Yes — Add recommended entries
B) No — Skip

───────────────────────────────────────────────────────
```

---

## 7. Confirm Installation

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 GSD ► INSTALLED ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

GSD for Antigravity has been installed.

Files installed:
• .agent/        (workflows)
• .agents/       (subagents + skills — Agent Skills standard)
• .gemini/       (Gemini integration)
• .gsd/          (project state templates)
• adapters/      (model-specific enhancements)
• docs/          (operational documentation)
• scripts/       (utility scripts)
• PROJECT_RULES.md
• GSD-STYLE.md
• model_capabilities.yaml

───────────────────────────────────────────────────────

Next step:

/new-project — Initialize your project with GSD

───────────────────────────────────────────────────────
```

</process>

<notes>
- This workflow is designed to work from a clean project (no prior GSD installation)
- It copies ALL necessary files, unlike manual installation which may miss some
- For updates to an existing installation, use /update instead
- The /new-project command should be run after installation to set up SPEC.md
</notes>
