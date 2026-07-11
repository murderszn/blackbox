---
tags: [decision, adr, scroll]
status: accepted
updated: 2026-07-11
---

# ADR · Proximity Scroll

## Context

Mandatory full-page snap felt like a deck and trapped users on dense finance stages.

## Decision

Use `scroll-snap-type: y proximity` when `html.stages-armed`, with `scroll-snap-stop: normal`. Honor `prefers-reduced-motion: none`.

## Consequences

- Sections still align when near  
- Free scroll always possible  
- Keyboard stage jumps remain for film navigation  

Related: [[Journey Film]] · [[Skill - Stage Full Viewport]]
