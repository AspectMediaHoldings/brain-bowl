---
name: escalation-incident-management
description: >
  Use this skill for all escalation and incident management work: writing SOPs, drafting
  stakeholder communications, building Jira filters or Confluence pages, post-incident
  reviews, or escalation path design. Always load before producing any escalation document,
  incident timeline, or stakeholder update using Smart Brevity or Atlassian tooling.
---

# Escalation and Incident Management

## Purpose

Nathan is a senior escalation and incident management professional. This skill governs
all professional workflow tasks: SOP writing, stakeholder communication, Jira and
Confluence documentation, Python scripting for Atlassian REST API, post-incident review
(PIR) facilitation, and escalation path design. All output follows Smart Brevity
methodology and human-in-the-loop review standards.

## When to Use

- Writing or updating an escalation or incident management SOP
- Drafting stakeholder communications: incident updates, escalation notices, executive summaries
- Building or automating Jira filters via REST API (Python)
- Producing Confluence documentation for incident workflows
- Facilitating or documenting a post-incident review
- Designing escalation paths or tier structures
- Any professional document where Smart Brevity applies

## Inputs

Confirm before starting:
1. Task type: SOP, communication, Jira/Confluence, PIR, or escalation path design
2. Audience: internal team, executive stakeholders, external customers, or all
3. Incident or escalation context: severity, timeline, systems affected, resolution status
4. Deliverable format: Confluence page, Word document, email, Slack message, or Python script
5. Smart Brevity level: short update (3-5 sentences), full summary, or long-form SOP

If audience is unspecified, default to internal team with executive-accessible summary.

## Procedure

### Smart Brevity Standards (apply to all communications)

These are hard rules — not suggestions.

1. Lead with the single most important fact. Do not bury the lede.
2. Short sentences. Active voice. Subject-verb-object.
3. Use "you" and "your" for direct address.
4. Bullet points for action items and next steps.
5. No em dashes. No semicolons. No filler vocabulary.
6. Prohibited words: delve, realm, landscape, utilize, unveil, pivotal, intricate, tapestry,
   game-changer, groundbreaking, cutting-edge, remarkable, leverage, embark, enlightening,
   revolutionize, disruptive, and similar.
7. No emojis unless explicitly requested.

### SOP Development

1. Define scope: what does this SOP govern, and what is explicitly out of scope.
2. State the trigger: what event or condition activates this procedure.
3. Write the procedure as a numbered checklist. Each step is one action.
4. Mark decision points explicitly: "If [condition], go to step X. If not, continue."
5. State escalation thresholds as hard criteria — not judgment calls.
6. Include a "what to do if" section for common failure modes.
7. End with owner, review date, and version number.

Format: Word document (.docx), section headers, numbered steps, decision tables where branching logic exists.

### Stakeholder Communications

Structure every incident communication:
1. **What happened** — one sentence, specific.
2. **Current status** — one sentence: resolved, in progress, or monitoring.
3. **Impact** — who was affected, what was affected, for how long.
4. **What we did** — concise action list.
5. **Next steps** — concrete, owned, time-bound.
6. **Contact** — who to reach for questions.

For executive audiences: lead with impact and status. Move technical detail to an appendix or separate section.
For customer-facing communications: remove internal jargon. State impact in plain terms. Do not speculate on root cause until confirmed.

### Jira Filter Automation (Python / REST API)

When producing a Python script for Jira filter automation:
1. Use the Jira REST API v3 endpoint.
2. Authenticate via API token — never hardcode credentials. Use environment variables.
3. Script structure: authenticate, build filter payload (JQL + name + description), POST to /rest/api/3/filter.
4. Include error handling: log HTTP status and response body on failure.
5. Parameterize JQL and filter name — do not hardcode values.
6. Add a dry-run flag that prints the payload without submitting.

Deliver as a Python script (.py) with inline comments and a usage example at the top.

### Post-Incident Review (PIR)

PIR document structure:
1. Incident summary: date, duration, severity, systems affected.
2. Timeline: chronological, time-stamped, factual — no blame language.
3. Root cause: confirmed cause only. State "under investigation" if not yet confirmed.
4. Contributing factors: separate from root cause.
5. Impact: quantified where possible (users affected, downtime duration, revenue impact).
6. What went well.
7. What needs improvement.
8. Action items: owner, due date, status. One row per item.

PIR language is factual and blameless. Do not attribute failure to individuals by name.

## Output Format

- SOPs: Word document (.docx), numbered steps, decision tables, version block at top.
- Stakeholder updates: plain text or Confluence wiki markup, Smart Brevity structure.
- Python scripts: .py file with inline comments, environment variable pattern, usage example.
- PIR documents: Word document (.docx) or Confluence page, structured sections as above.
- Jira filter specs: plain text JQL block with filter name and description, ready to paste.

## Quality Checks

Before delivering any communication:
- Confirm the most important fact leads the document.
- Confirm all prohibited words are absent.
- Confirm no em dashes or semicolons are present.
- Confirm action items are owned and time-bound.

Before delivering any SOP:
- Confirm scope and trigger are defined.
- Confirm every decision point has explicit branching logic.
- Confirm escalation thresholds are stated as hard criteria.
- Confirm version number and review date are present.

Before delivering a Python script:
- Confirm no hardcoded credentials.
- Confirm error handling is present.
- Confirm dry-run flag is included.

## References

- Tooling: Atlassian Jira, Confluence, Python Jira REST API v3.
- Methodology: Smart Brevity (Axios) — lead with the most important fact, short sentences, active voice.
- Escalation context: Nathan previously held VP-level escalation management roles. Output should reflect senior practitioner standards.
