---
name: brief
description: Write a Smart Brevity style brief on any topic or document. Use when the user asks for a brief, summary, or Smart Brevity format output.
allowed-tools: Read, Bash
---

# Brief Skill

## Usage
/brief <topic or @file>

## Smart Brevity Format

**[BOLD HEADLINE — one line, verb-driven, under 10 words]**

**Why it matters:** One sentence. No jargon.

**What happened:** 2-3 sentences. Facts only. Active voice.

**The details:**
- Bullet 1 (one idea per bullet)
- Bullet 2
- Bullet 3

**What's next:** One sentence on the next action or development.

## Rules
- No sentence over 20 words
- No em dashes
- No passive voice
- No filler: "it is important to note", "in conclusion", "leveraging", etc.
- Numbers under 10 are spelled out. 10 and above use numerals.
- If source material is provided via @file, read it first, then brief it.

## Output
Print brief to screen. If user says "save it", write to output/brief-<slug>-<date>.md
