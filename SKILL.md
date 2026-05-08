---
name: skills-based-approach
description: >
  Reference guide for designing, organizing, and operating a skills-based AI workflow system.
  Use this skill when planning or explaining how to replace agent-based AI workflows with
  context-injected skill files, when building a skill library from scratch, when evaluating
  whether a task should become a skill, when onboarding a team to a skills-based system,
  or when troubleshooting skill triggering and quality. Also consult this skill whenever
  someone asks about the difference between skills and agents, how to structure a skill
  folder hierarchy, or how to write effective SKILL.md files.
---

# Skills-Based AI Workflow Approach

## What This Is

A skills-based approach replaces persistent AI agents with on-demand context injection.
Instead of spinning up separate agents with their own state, memory, and orchestration
logic, you store knowledge and workflow instructions in structured Markdown files (skills).
Those files load into the model's context window at the moment they are needed.

The model reads the skill, follows its instructions, and produces output — with no
persistent process, no message bus, and no inter-agent coordination layer.

---

## Core Concepts

### Skill

A skill is a Markdown file (typically named `SKILL.md`) that contains:

- A YAML frontmatter block with a name and trigger description
- Step-by-step instructions for a specific task or workflow
- Decision rules, standards, and constraints the model must follow
- References to supporting files or templates when needed

A skill is not code. It is structured prose that shapes how the model behaves
on a specific class of task.

### Skill Library

A collection of skill files organized into a folder hierarchy. The library is
the AI's operational knowledge base. Skills in the library represent repeatable,
institutionalized workflows — the things your team does over and over that benefit
from consistency.

### Triggering

Skills are loaded when the model determines a user's request matches the skill's
description. Well-written trigger descriptions are specific about what situations
call for the skill, and slightly assertive — they push the model to load the skill
rather than improvise.

---

## Why Skills Over Agents

| Dimension | Skills-Based | Agent-Based |
|---|---|---|
| Runtime cost | Zero when idle | Persistent overhead |
| Composability | Stack freely in one context window | Requires handoff protocols |
| Auditability | Human-readable Markdown | Often opaque framework config |
| Update path | Edit one file | Chase updates across multiple configs |
| Failure visibility | Visible in conversation | Often surfaces as orchestration errors |
| Control | Operator decides what loads | Agent decides what it does |

**The key trade-off:** Agents can route themselves. Skills require deliberate selection.
For solo operators or small teams, deliberateness is usually a feature, not a limitation.
For large-scale autonomous pipelines where routing complexity is high, a hybrid approach
may be appropriate.

---

## Folder Structure

A three-tier hierarchy works well for most organizations:

```
skills/
├── public/          # Stable, shared, domain-agnostic skills
│   ├── docx/
│   ├── pdf/
│   ├── data-analysis/
│   └── ...
├── team/            # Team- or org-specific operational knowledge
│   ├── incident-response/
│   ├── change-management/
│   ├── escalation-sop/
│   └── ...
└── sandbox/         # Experimental or in-progress skills
    ├── draft-skill-1/
    └── ...
```

### Why Three Tiers

**Public** skills are general-purpose and environment-agnostic. They cover things
like document creation, data transformation, or formatting standards. These change
rarely and are safe to share or reuse across teams.

**Team** skills encode your organization's specific knowledge: your SOPs, your
escalation paths, your naming conventions, your tooling constraints. These are
where institutional knowledge lives. They override or supplement public skills
when both are relevant.

**Sandbox** is where new skills go before they are proven. It signals to the model
and the team that these instructions are provisional. Graduate a skill to team/ only
when it has been tested and produces reliable output.

This separation prevents three failure modes:
1. General best practices getting overridden by untested local rules
2. Stable workflows getting disrupted by experimental changes
3. Institutional knowledge scattered across ad-hoc prompts with no single source of truth

---

## Anatomy of a SKILL.md

```
---
name: skill-identifier
description: >
  One to three sentences. What this skill does. When to load it.
  Be specific about trigger contexts. Be slightly assertive.
---

# Skill Title

## Purpose
One paragraph. What problem this skill solves.

## When to Use
Explicit list of scenarios that should trigger this skill.

## Inputs
What the model needs before starting. What to ask for if missing.

## Procedure
Step-by-step instructions. Decision points. Standards to apply.

## Output Format
What the deliverable looks like. File type, structure, length.

## Quality Checks
What to verify before presenting output to the user.

## References
Pointers to supporting files in the skill folder, if any.
```

---

## Skill Folder Anatomy

```
skill-name/
├── SKILL.md              # Required. Instructions and trigger description.
├── references/           # Optional. Docs loaded into context as needed.
│   ├── standards.md
│   └── glossary.md
├── scripts/              # Optional. Executable code for deterministic tasks.
└── assets/               # Optional. Templates, icons, boilerplate files.
```

Keep SKILL.md under 500 lines. If a skill grows beyond that, move detail into
reference files and link to them from SKILL.md with clear guidance on when to read them.

---

## Writing Effective Skills

### Trigger Descriptions

The description field is the routing mechanism. Weak descriptions cause the model
to skip the skill and improvise. Write descriptions that:

- Name the task explicitly ("creating incident timelines")
- Name the context ("when the user is in a post-incident review")
- Name the output format if relevant ("producing a Markdown summary")
- Are slightly assertive ("Always use this skill when...")

### Procedure Sections

Write procedures as the model's internal checklist. Use numbered steps for
sequential tasks. Use decision trees for branching logic. State constraints
as hard rules, not suggestions.

Bad: "You might want to check the stakeholder list before sending."
Good: "Always verify the stakeholder list before drafting any external communication.
Do not proceed if the list is empty. Ask the user to provide it."

### Standards and Constraints

State your organization's standards explicitly inside the skill. Do not assume
the model knows them. This includes:

- Tone and voice requirements
- Naming conventions
- Tool preferences
- Compliance or legal constraints
- What to do when data is missing or ambiguous

### Composability

Skills stack. A single task may load two or three skills — one for document
formatting, one for your org's writing standards, one for the specific workflow.
Design skills to be additive, not monolithic. A skill that tries to do too much
becomes hard to maintain and hard to trigger accurately.

---

## When to Create a New Skill

Create a skill when:

- You have corrected the model's behavior on the same task more than twice
- A workflow has more than four steps and consistent output format matters
- The task involves org-specific knowledge the model cannot infer
- Multiple team members will perform the same task through AI assistance
- The output feeds into another system or process with format requirements

Do not create a skill for:

- One-off tasks with no reuse potential
- Tasks where improvisation produces acceptable results every time
- Tasks that change so frequently the skill would be outdated within weeks

---

## Maintaining the Skill Library

### Version Discipline

Treat skill files like internal documentation. When a workflow changes, update
the skill before the next use — not after. Stale skills produce confident but
wrong output.

### Graduation Path

```
Sandbox → Team → (Public, if domain-agnostic)
```

A skill graduates when it has been used on at least three real tasks without
requiring mid-task correction. Document what you tested.

### Skill Reviews

Schedule periodic reviews (quarterly is reasonable) to:
- Retire skills for deprecated workflows
- Update skills when tooling or standards change
- Consolidate overlapping skills
- Promote sandbox skills that have proven out

---

## Hybrid Use: Skills + Agents

Skills and agents are not mutually exclusive. A practical hybrid:

- Use skills for all knowledge-intensive, human-in-the-loop tasks
- Use lightweight agents for high-volume, low-variance automation
- Use skills to define the standards that agents must follow

In this model, skills are the organization's knowledge layer. Agents are the
execution layer for tasks that don't require judgment. Skills govern both.

---

## Quick Reference

| Task | Action |
|---|---|
| Model ignores the skill | Strengthen the trigger description — be more assertive and specific |
| Skill output is inconsistent | Add explicit quality checks and output format requirements |
| Skill is too long | Move detail to references/ and link from SKILL.md |
| Two skills conflict | Add precedence rules to both; clarify which takes priority |
| Workflow changed | Update the skill first, test, then resume using it |
| New team member onboarding | Point them to the skill library before ad-hoc prompting |
