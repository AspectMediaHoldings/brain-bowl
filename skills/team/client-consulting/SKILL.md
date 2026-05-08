---
name: client-consulting
description: >
  Always use this skill when working on any task for a consulting client. This includes
  web development, content, and operations projects. Also use when Nathan asks to
  prepare, review, or deliver any client-facing output, or when setting up a new
  client project in the workspace.
---

# Client Consulting

## Purpose

This skill governs all client work Nathan performs as a consultant. It encodes
confidentiality rules, deliverable review standards, tone defaults, and the approval
gate that every client-facing output must pass before delivery.

## When to Use

- Any task involving a named consulting client
- Drafting, formatting, or finalizing any client-facing document or deliverable
- Setting up a new client project directory in the workspace
- Reviewing work for client-readiness before Nathan delivers it
- Any time Nathan asks whether something is ready to send to a client

## Inputs

Before starting any client task, confirm:

- Which client this is for
- Whether the output is internal (working draft) or external (client-facing)
- The client's preferred style or tone, if Nathan has specified it
- Whether there is an existing project directory at `projects/<client-name>/`

Never proceed with client work if the client identity is unclear. Ask first.

## Confidentiality Rules

Client work is confidential. These rules are non-negotiable:

1. Never reference one client's information in another client's session or document.
2. Never include a client's name, data, or project details in any output not
   explicitly scoped to that client.
3. If working in a client project directory, do not read or write files in any
   sibling client directory.

## Procedure

1. Confirm client identity and output type (internal or external).
2. Check for an existing project directory at `projects/<client-name>/CLAUDE.md`.
   If it exists, read it before doing any work. It contains client-specific context.
3. If no project directory exists and this is a new client, propose creating one
   using the `_template` directory as the base. Wait for Nathan's approval before
   creating it.
4. Apply the client's preferred style and tone if Nathan has specified it.
   Default tone: clear and direct, professional but not stiff.
5. Complete the work.
6. Before presenting any output as client-ready, stop and ask Nathan explicitly:
   "Is this ready to go to the client, or do you want to review it first?"
7. Do not format, send, or save anything in client-facing form without Nathan's
   explicit approval.

## Output Format

- Default: plain prose, active voice, short sentences
- Match client style when Nathan specifies it
- Deliverables go in `output/` unless the project CLAUDE.md specifies otherwise
- File naming convention: `<client>-<deliverable-type>-<YYYY-MM-DD>.<ext>`

## Quality Checks

Run the pre-delivery check before presenting any output as client-ready:

- Every factual claim is traceable to a source or to something Nathan said directly
- No names, numbers, dates, or specifications were generated without a basis
- All [VERIFY] flags are visible and not buried
- Nothing is a confident guess dressed as a fact
- Confidentiality rules have not been violated

Report check results to Nathan. Do not deliver output that fails this check
without flagging the issues first.

## References

- Client project directories: `projects/<client-name>/`
- Project template: `projects/_template/`
