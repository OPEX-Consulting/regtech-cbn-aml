

## Plan: Overhaul AI Output Schema and Report Template to Match New Sample

### Problem
The uploaded sample report (`CBN_AML_Gap_Report_GG_IMTO.html`) is a 20-page professional document with substantially richer content than the current AI output schema supports. The current schema enforces brevity (30-word findings, 15-word actions) while the sample has multi-paragraph prose, new sections, and expanded data structures. The report template and `reportGenerator.ts` must be rebuilt to match.

### Schema Changes Required (Edge Function)

**Fields to expand:**
- `executive_summary` -- replace `overall_rating.summary_paragraph` (50 words) with: `lead` (~60 words), `body_paragraphs[]` (2-3 paragraphs, ~100 words each), `inline_alert` (~50 words)
- `standards[].finding` -- expand from 30 words to ~120 words (full paragraph with CBN context)
- `standards[].required_action` -- expand from 15 words to ~80 words (full paragraph)
- `priority_actions[].body` -- expand from 50 words to ~150 words (2 paragraphs: what + OPEX support)
- `priority_actions[].deadline_label` -- expand from 5 words to ~15 words (full subtitle line)
- `roadmap.phases[].objectives` -- replace with `description` (~100 words, full paragraph)
- `roadmap.phases[].key_deliverables` -- change to `deliverables[]` (array of strings for tag pills)
- `products[].relevance_to_client` -- expand from 30 words to `description` (~120 words)
- `advisory_services[]` -- change from 6 noun phrases to 8 objects: `{ title, description }`

**Fields to add:**
- `standards[].req_tags[]` -- array of `{ label, type: "mandatory"|"conditional" }` for badges per standard
- `standards[].regtech_solution` -- new field (~80 words) describing RegTech365 product mapping
- `standards[].regtech_products[]` -- array of product names (e.g. `["RegPort", "RegGuard"]`)
- `requirement_categories[]` -- new section (array of ~17 objects: `{ area, cbn_ref, category, trigger }`)
- `requirement_categories_intro` -- intro paragraph (~40 words)
- `requirement_categories_alert` -- institution-specific alert paragraph (~60 words)
- `governance_assessment.items[]` -- expand each item with `cbn_ref`, `category`, `action_required`
- `governance_assessment.score_percentage` -- numeric (e.g. 20)
- `governance_assessment.score_context` -- paragraph (~60 words)
- `roadmap.milestones[]` -- array of `{ milestone, target_date, owner }` (~6 items)
- `products[].tagline` -- product subtitle (~10 words)
- `products[].gaps_closed[]` -- array of section labels (e.g. `"5.5 — Transaction Monitoring"`)
- `support_section.differentiator` -- "What makes this different" paragraph (~60 words)
- `cta` -- `{ title, subtitle, primary_button_label, secondary_button_label }`
- `profile.group_structure` -- add to meta
- `profile.risk_factors_display` -- formatted risk factors string
- `profile.sector_context_box` -- institution-specific paragraph (~60 words)

**Fields to remove/replace:**
- `capability_snapshot` -- not in new report design (remove)
- `detail_factors` -- replaced by richer `finding` text and `regtech_solution` (remove)
- `security_posture` -- folded into gap analysis 5.11 finding (remove as separate block)
- `implementation_readiness` -- folded into roadmap intro (remove as separate block)

### Template Changes (reportGenerator.ts)

**New sections to build:**
1. **Table of Contents** (Section 0) -- clickable links using `id` anchors on each section heading; clicking a TOC item scrolls/jumps to that `id` in the report body
2. **Section 3: Requirement Categories** -- Mandatory vs Conditional table with ~17 rows + alert box
3. **Milestones table** at end of roadmap section

**Sections to restructure:**
- Section 1 (Executive Summary) -- multi-paragraph with inline alert box
- Section 2 (Profile) -- add group structure, risk factors display, sector context box, scorecard visual (0/12 compliant, score rings)
- Section 4 (Gap Analysis, was Section 2) -- each standard card gets req_tags badges, expanded finding/action, regtech_solution block with product pills
- Section 5 (Governance, was in Section 2) -- separate section with score ring, expanded table (CBN ref, category, action_required columns)
- Section 6 (Priority Actions, was Section 3) -- longer body text, expanded deadline labels
- Section 7 (Roadmap, was Section 4) -- phase cards with description paragraphs + deliverable tags + milestones table
- Section 8 (Support, was Section 5) -- differentiator callout, product cards with tagline/gaps_closed/description, advisory services as titled items, CTA box with buttons

**Table of Contents anchor linking:**
- Each section heading gets an `id` attribute (e.g. `id="section-1"`, `id="section-2"`, etc.)
- TOC entries are `<a href="#section-1">` links
- Add smooth scroll CSS: `html { scroll-behavior: smooth; }`

### CSS/Template Changes
- Update `public/temp/cbn_aml_report_template.html` CSS to include styles for: requirement categories table, req-tag badges, regtech-solution blocks, product pills, milestone table, score ring/gauge, sector context box, CTA box, TOC links
- Remove CSS for removed blocks (capability-table, detail-factors, security-block, readiness-block)

### Files Changed
- `supabase/functions/generate-aml-report/index.ts` -- full schema rewrite (expanded fields, new sections, removed brevity limits)
- `src/lib/reportGenerator.ts` -- full rebuild (new section structure, TOC with anchor links, expanded rendering)
- `public/temp/cbn_aml_report_template.html` -- CSS updates for new components

### What Won't Break
- Database schema unchanged (AI output fields, not form fields)
- Edge function request/response flow unchanged
- PDF generation method unchanged (iframe + print)
- Assessment form unchanged

### Risk Notes
- Expanded schema will produce ~8-10K token AI responses (up from ~3-4K). The `max_tokens: 32000` is sufficient.
- Old reports saved in DB won't render correctly in new template -- guard with `|| []` / `|| {}` defaults

