---
name: document
description: Generate a structured document from a template or instructions. Use when the user asks to create, draft, or write a document, report, SOP, or guide.
allowed-tools: Read, Write, Bash
---

# Document Skill

## Usage
/document <type> <title> [from: @file]

Types: sop | report | guide | proposal | summary

## Steps

1. Check .claude/skills/document/templates/ for a matching template.
   If one exists, load it. If not, use the default structure below.
2. If source material is provided via @file, read it first.
3. Check projects/ for a CLAUDE.md relevant to this document's topic.
4. Draft the document using the template.
5. Run document.sh to create the output file.
6. Write the draft to the output file.

## Default Structure (no template)

# [Title]

**Purpose:** One sentence.
**Audience:** Who reads this.
**Last updated:** [date]

---

## Overview
[2-3 sentences]

## [Section 1]
[Content]

## [Section 2]
[Content]

## Next Steps / Actions
[Numbered list]

## Notes
- Keep every section tight. Cut anything that does not serve the purpose.
- Use headers, not bullet-heavy blocks.
- Active voice throughout.
