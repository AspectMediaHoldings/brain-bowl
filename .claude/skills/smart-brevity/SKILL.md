---
name: smart-brevity
description: Use when the user wants to write, rewrite, convert, or summarize anything using Smart Brevity format. Trigger on: "write this as Smart Brevity", "convert to Smart Brevity", "make this a brief", "Smart Brevity version of this", "rewrite this concisely", "summarize this for [audience]", "turn this into a brief", or any request for a structured professional summary. Also use when the user pastes a long piece of content and asks for a shorter version, or when they say "write a brief about X." When in doubt, trigger — Smart Brevity is appropriate for newsletters, status updates, incident summaries, meeting recaps, client communications, and internal announcements.
---

# Smart Brevity

Convert content into Smart Brevity format, or generate original Smart Brevity content from a topic or rough notes. Every output passes a built-in rubric check before delivery.

## Step 1 — Detect mode

Read the input and identify which mode applies:

- **GENERATE mode** — Input is a topic, a few words, or rough notes (under ~3 sentences). Write original Smart Brevity content.
- **CONVERT mode** — Input is existing content (email, transcript, bullet dump, draft, long paragraph). Rewrite it into Smart Brevity format.

State the detected mode at the top of your response. The user can correct it.

## Step 2 — Identify audience

Look for audience signals anywhere in the user's message: "for my Etsy team," "BSA council leadership," "client-facing," "general public." If none is specified, default to professional plain language.

Adjust vocabulary, assumed knowledge level, and formality to match the audience. The format structure never changes — only the language inside it.

## Step 3 — Write the output

Use this exact structure:

```
HEADLINE — verb-driven, 6-8 words

LEDE: One strong sentence that stands completely alone.

Why it matters: One sentence. No jargon. States the impact.

What happened: 2-3 sentences. Facts only. Active voice.

The details:
• **Key term** — one idea, one sentence per bullet
• **Key term** — bold the first 1-2 words of each bullet

[Big picture: One sentence of broader context.] *include only when content needs it*

[By the numbers:] *include only for data-heavy topics*
• Stat one
• Stat two

What's next: One sentence. Clear action, owner, or timeframe.
```

**Format notes:**
- The lede sits between the headline and "Why it matters." A reader who stops at the headline still gets the core point.
- Bold the first 1-2 words of every detail bullet — this creates the scannable entry points Smart Brevity is known for.
- Big picture and By the numbers appear only when the content genuinely calls for them.
- Target: 150-200 words total. Output should fit on a phone screen.

## Step 4 — Self-check before delivery

Run every item below silently. Fix violations in place. If a violation cannot be resolved, flag it once at the end.

**Headline**
- Verb-driven
- 6-8 words maximum
- No jargon, no filler words

**Lede**
- One sentence only
- Stands alone — the point lands without reading anything else
- Under 25 words

**Why it matters**
- Exactly one sentence
- States impact, not description
- No jargon

**What happened**
- 2-3 sentences maximum
- Facts only — no opinion, no interpretation
- Active voice throughout

**The details**
- One idea per bullet
- One sentence per bullet
- First 1-2 words bolded
- No bullet repeats content already in "What happened"

**Big picture / By the numbers** (when used)
- Big picture: one sentence, adds context not already stated elsewhere
- By the numbers: each entry is a single stat with no padding

**What's next**
- Exactly one sentence
- Contains a clear action, owner, or timeframe — not vague

**Banned words** — remove any of these:
delve, realm, landscape, utilize, unveil, pivotal, tapestry, game-changer, groundbreaking, intricate, elucidate, leverage (as verb), seamless, streamline, holistic, robust, comprehensive (as filler), it is important to note, in conclusion, in summary, as an AI language model, it goes without saying, at the end of the day, move the needle, circle back, touch base, synergy

**Length**
- Full output is 150-200 words
- Fits on a phone screen

Deliver the output clean. No preamble, no explanation of what you did.
