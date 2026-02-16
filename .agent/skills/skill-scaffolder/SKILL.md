---
name: skill-scaffolder
description: Generates the directory structure and boilerplate files for new Antigravity Skills. Use this skill ONLY when the user explicitly asks to create, scaffold, or generate a new skill.
---

# Skill Scaffolder (Meta-Skill)

## Context
This skill automates the creation of new Antigravity Skills. It ensures that every new skill follows the official "Best Practices" for directory structure, YAML frontmatter, and instruction clarity.

## When to use this skill
- [ ] When the user asks to "create a new skill".
- [ ] When the user asks to "add a tool" for a specific task (e.g., "Make a tool to deploy to Vercel").

## Step-by-Step Instructions

### Step 1: Requirement Gathering
Before writing any files, ask the user for the following if not already provided:
1.  **Skill Name:** (Must be kebab-case, e.g., `git-automator`).
2.  **Purpose:** What specifically will this skill do? (Used for the description).
3.  **Scope:** Is this for the current workspace (`.agent/skills/`) or global (`~/.gemini/antigravity/global_skills/`)? *Default to workspace if unsure.*

### Step 2: Create Directory Structure
Execute shell commands to create the folder structure.
* Path: `[Scope]/[Skill-Name]/`
* Create an empty `scripts` folder inside it (optional but good practice).
* Create the `SKILL.md` file.

### Step 3: Generate `SKILL.md` Content
Write the content of the new `SKILL.md` using the template below. **Crucial:** You must adapt the template to the user's specific request.

**Rules for Content Generation:**
1.  **Frontmatter:** The `description` field MUST be in the third person (e.g., "Deploys the app..." not "I will deploy...").
2.  **Focus:** Ensure the skill focuses on *one* specific domain.
3.  **Tools:** If the user mentioned external tools (like checking an API), add a placeholder section for `scripts/`.

#### Template to use:

```markdown
---
name: {{skill_name}}
description: {{third_person_description_of_what_the_skill_does}}
---

# {{Skill Name Title}}

## Context
{{Brief explanation of why this skill exists}}

## When to use this skill
- [ ] Condition A (e.g., When the user asks to deploy)
- [ ] Condition B (e.g., When a specific error occurs)

## Instructions
1.  **Step 1:** {{First action}}
2.  **Step 2:** {{Second action}}

## Scripts & Tools
- If you need to run complex logic, use the scripts in the `scripts/` folder.
60. - Always run scripts with `--help` first to understand their arguments.
61. 
62. ## Language
63. **LANGUAGE: SPANISH. All output, comments, and documentation MUST be in Spanish.**
64. ```
65. 
66. ## Language
67. **LANGUAGE: SPANISH. All output, comments, and documentation MUST be in Spanish.**
