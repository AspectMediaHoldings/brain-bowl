---
name: confluence-docs
description: >
  Always use this skill when creating, updating, or reviewing any documentation intended
  for Confluence. This includes SOPs (standard operating procedures), runbooks, process
  guides, and knowledge base articles. Also use when Nathan asks to write or revise any
  internal procedure document, regardless of whether it will be published to Confluence
  immediately.
---

# Confluence Documentation

## Purpose

This skill governs the creation and maintenance of process documentation in Confluence.
It encodes Nathan's documentation standards: Smart Brevity writing style, SOP structure,
runbook format, and revision tracking conventions.

## When to Use

- Writing a new SOP or runbook
- Updating an existing SOP or runbook after a workflow change or incident
- Creating a knowledge base article or process guide in Confluence
- Reviewing existing documentation for accuracy or gaps
- Drafting documentation that will be published to Confluence after approval

## Inputs

Before starting, confirm:

- Document type: SOP, runbook, knowledge base article, or process guide
- Confluence space and parent page (ask Nathan if unknown)
- Whether this is a new document or an update to an existing one
- If updating: what changed and why (incident findings, process change, etc.)

If this is an update, ask Nathan for the current document or a link to it before
making any changes. Do not rewrite from scratch when an existing version exists.

## Procedure

1. Confirm document type and location in Confluence.
2. If updating an existing document: identify only the affected sections. Do not
   rewrite sections that are not changing.
3. Apply the document structure (see Output Format).
4. Write in Smart Brevity style: active voice, short sentences, plain language.
   No em dashes, semicolons, or filler words.
5. For SOPs: each step must have a clear actor, action, and expected result.
6. For runbooks: each procedure must include trigger conditions, step-by-step actions,
   and escalation path if the procedure fails.
7. Add a revision history entry for every update: date, change summary, and reason.
8. Run the pre-delivery check before presenting the document to Nathan.

## Output Format

**SOP structure:**
- Title
- Purpose (one paragraph)
- Scope (who this applies to)
- Roles and Responsibilities
- Procedure (numbered steps)
- Escalation Path
- Revision History

**Runbook structure:**
- Title
- Trigger Conditions
- Pre-Conditions (what must be true before starting)
- Procedure (numbered steps with decision points)
- Escalation Path (what to do if steps fail)
- Rollback Steps (if applicable)
- Revision History

**Revision history entry format:**
| Version | Date | Change | Reason | Author |
|---------|------|--------|--------|--------|

## Quality Checks

Before delivering any document:

- Every step has a clear actor, action, and expected result
- Escalation path is present and specific (not "contact your manager")
- Revision history is updated with today's date and a clear change summary
- No assumed knowledge — procedures are written for someone new to the process
- Smart Brevity standards applied: no banned words, no filler

## References

- Add Confluence space URL here
- Add link to Confluence SOP template here
- Add Jira project reference here if runbooks link to incident tickets
