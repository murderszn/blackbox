---
tags: [meta]
updated: 2026-07-11
---

# BLACKBOX Brain

Obsidian-style markdown second brain for the BLACKBOX product: **methodologies**, **engine mathematics**, **stages**, and **decisions** — all cross-linked with `[[wikilinks]]`.

---

## 🖥️ Live Browser Viewer

While this is designed to open directly in Obsidian, you can also spin up the built-in local web server to browse the files in an interactive, math-enabled web view:

1.  **Launch the server:**
    ```bash
    node brain/server.js
    ```
2.  **Open in your browser:**  
    👉 **[http://localhost:4444](http://localhost:4444)**
    *(Provides live search, folder navigation, wikilink transitions, and KaTeX math formatting)*

---

## 🗂️ Open in Obsidian

1. Install [Obsidian](https://obsidian.md)  
2. **Open folder as vault** → select this directory: `blackbox/brain`  
3. Open [[Home]] (`00 Maps/Home.md`)

> **Note:** Open the **`brain`** folder itself as the vault root (not the whole repo), so Obsidian's graph colors and configuration apply cleanly.

---

## 📁 Layout

```
brain/
├── .obsidian/          # vault config (graph colors, links)
├── 00 Maps/            # Maps of Content (MOCs) + Home
├── 01 Product/         # Vision, journey film, UX guidelines
├── 02 Architecture/    # System files, runtime, APIs, data flow
├── 03 Design/          # Atelier design system, tokens, layout passes
├── 04 Tools/           # Dev tools catalog (Chart.js, Pollinations...)
├── 05 Skills/          # Playbooks & consistent UI procedures
├── 06 Links/           # External developer garden
├── 07 Stages/          # 11 journey stages (Planning, Budget, Purchases...)
├── 08 Finance/         # Formulas, FICO, tax brackets, and matrix framework
├── 09 Decisions/       # Architecture Decision Records (ADRs)
└── assets/             # Images & diagrams
```

---

## 🔗 Quick Jumps

| Destination | Link |
| :--- | :--- |
| **Start Here** | [[Home]] |
| **Financial Brain Matrix** | [[Financial Brain Framework]] |
| **Personal Finance Rules** | [[Personal Finance Handbook]] |
| **Mathematical Models** | [[MOC - Finance]] |
| **UX & Journey Stages** | [[MOC - Stages]] |
| **System Architecture** | [[MOC - Architecture]] |
| **Design Tokens** | [[MOC - Design]] |

---

## ⚙️ Conventions

*   **One Idea per Note:** Keep notes modular and atomic.  
*   **Prefer Wikilinks:** Use `[[Note Name]]` instead of standard file paths inside the vault.  
*   **Decisions as ADRs:** Save sticky design constraints in `09 Decisions/` using standard templates.  
*   **Methodology-Driven Copy:** All stage notes are written from a top-down, income-first budgeting perspective (lifestyle fits income, not vice-versa).
*   **Maintenance Protocol:** See [[Skill - Maintain This Brain]] for indexing.
