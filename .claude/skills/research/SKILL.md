---
name: research
description: Research a topic and return a structured summary. Use when the user asks to research, investigate, look into, or learn about a topic.
allowed-tools: Read, Bash, WebFetch
---

# Research Skill

## Usage
/research <topic> [depth: quick|deep]

Default depth is quick (3-5 sources). Deep runs broader and produces a longer report.

## Steps

1. Read data/ for any existing context on this topic before searching externally.
2. Run research.sh with the topic as argument.
3. Structure output as:

### [Topic]
**Bottom line:** One sentence summary.

**Key findings:**
[3-5 findings, one paragraph each. Cite source inline.]

**Gaps / unknowns:**
[What was not found or is unclear.]

**Recommended next step:**
[One actionable item.]

4. Save output to output/research-<slug>-<date>.md

## Notes
- Do not pad findings. If fewer than 3 solid sources exist, say so.
- Flag conflicting information rather than picking a side.
