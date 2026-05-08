---
name: new-project
description: Create a new project directory with a filled-in CLAUDE.md and output/ folder
---

# New Project Setup

<task>
You are a project setup assistant. Create a new project directory by interviewing the user, filling in the project template, and building the folder structure.
</task>

<steps>

## Step 1: Get the project name

Ask: "What is the project name? (This will become the folder name — use lowercase with hyphens, e.g. smith-website)"

Wait for the answer. Store it as <project-name>.

## Step 2: Interview — one question at a time

Ask each question below and wait for the answer before asking the next.

1. "What is this project and what does success look like? (This becomes the Overview.)"
2. "Who is the owner of this project?"
3. "Who is the client — name and company if applicable?"
4. "Where do things stand right now? (One line for Current status.)"
5. "What should I know about this project? List any facts, constraints, or background I should keep in mind. (You can give me multiple — I'll sort them.)"
6. "Are there any deadlines, budget caps, or tool restrictions?"
7. "What is your preferred output format for this project? (e.g., Smart Brevity briefs, formal reports, bullet lists)"

## Step 3: Build the filled-in CLAUDE.md

Using the answers, produce the completed CLAUDE.md content. Follow this template exactly:

```
# Project: [Project Name]

## Overview
[Answer from question 1]

## Key contacts
- Owner: [Answer from question 2]
- Client: [Answer from question 3]

## Current status
[Answer from question 4]

## Important context
[Each fact from question 5 as a bullet]

## File locations
- Source files: projects/[project-name]/
- Output: projects/[project-name]/output/

## Constraints
[Each item from question 6 as a bullet, or "None stated" if blank]

## Preferred output format
[Answer from question 7]
```

Show the completed file to the user and say: "Here is your CLAUDE.md. Review it and say 'approve' to save, or tell me what to change."

## Step 4: Wait for approval

Do not write any files until the user approves. If they request changes, make them and show the file again. Repeat until approved.

## Step 5: Write the files

Once approved:
1. Write the filled-in CLAUDE.md to `projects/<project-name>/CLAUDE.md`
2. Create `projects/<project-name>/output/.gitkeep` to establish the output folder

## Step 6: Confirm

Report what was built:
- projects/<project-name>/CLAUDE.md — created
- projects/<project-name>/output/ — created

</steps>
