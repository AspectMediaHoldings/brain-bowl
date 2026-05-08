---
name: incident-response
description: >
  Always use this skill when handling an active incident, writing a post-incident review,
  building an incident timeline, drafting escalation communications, or producing any
  incident-related output for internal or external stakeholders. Also use when the user
  asks to update a runbook or SOP related to an escalation or incident workflow.
---

# Incident Response

## Purpose

This skill governs how to manage, document, and communicate during and after an incident.
It encodes Nathan's escalation and incident management standards, including Smart Brevity
output format, Atlassian tooling conventions, and stakeholder communication rules.

## When to Use

- Active incident is in progress and documentation or communication is needed
- Post-incident review (PIR) or retrospective is being written
- Incident timeline is being constructed from logs, tickets, or notes
- Escalation communication is being drafted (internal or external)
- A runbook or SOP is being created or updated for an incident type

## Inputs

Before starting, confirm you have:

- Incident name or ticket number (Jira)
- Start time, end time (or "ongoing"), and severity level
- Affected systems or services
- Stakeholder list (internal and external, if applicable)
- Any existing Confluence page or Jira issue to update

If any of these are missing, stop and ask before proceeding.

## Procedure

1. Confirm incident scope: affected systems, start time, current status.
2. Identify the correct stakeholder list. Do not draft external communication without it.
3. Build the timeline in chronological order. Use exact timestamps where available.
   Flag approximate times with [APPROX].
4. Draft the incident summary using Smart Brevity format (see Output Format).
5. If updating a runbook or SOP: identify the triggering gap, update the relevant step,
   and note the change with a date and reason in the revision history.
6. If producing a PIR: include timeline, root cause, contributing factors, and action items
   with owners and due dates.
7. Run the pre-delivery check before presenting any output to stakeholders:
   - All times are confirmed or flagged as approximate
   - No names, systems, or services invented or assumed
   - Stakeholder list is verified
   - Action items have assigned owners

## Output Format

Incident summaries use Smart Brevity format:

**HEADLINE — verb-driven, under 10 words**

**Why it matters:** One sentence. No jargon.

**What happened:** 2-3 sentences. Facts only. Active voice.

**The details:**
- One idea per bullet
- No bullet longer than one sentence

**What's next:** One sentence.

Timelines are formatted as a numbered list: `[TIMESTAMP] — [Event description]`.

PIR documents go in Confluence. Use the existing PIR template if one exists. Ask Nathan
for the template location if unsure.

## Quality Checks

Before delivering any incident output:

- Every timestamp is verified or marked [APPROX]
- No system names, service names, or people invented
- Stakeholder list confirmed before any external draft
- Action items have owners and due dates
- Smart Brevity format applied to all summary outputs

## References

- Add links to Confluence SOP pages here as they are created
- Add links to Jira project or board here
