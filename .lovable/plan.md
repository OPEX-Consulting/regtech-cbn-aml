

## Plan: Fix Input Schema Alignment in AI Prompt

### Problem
The edge function prompt at `supabase/functions/generate-aml-report/index.ts` has a broken input data section. It uses `{{placeholder}}` syntax (lines 22-85) that is **never interpolated** — the code at line 517 just passes raw JSON (`JSON.stringify(inputJson)`). The AI must guess the mapping between placeholder names and actual JSON keys. Additionally, several field names don't match what the form sends, and some form fields are completely undocumented in the prompt.

### Specific Issues

**1. Placeholder syntax never executed**
Lines 22-85 contain `{{inst_name}}`, `{{tx_volume}}`, etc. but no code replaces them. The AI receives the raw JSON object alongside a prompt full of unreplaced `{{...}}` tokens.

**2. Field name mismatches (prompt vs form)**
| Prompt placeholder | Form sends | 
|---|---|
| `{{tx_volume}}` | `tx_vol` |
| `{{customer_base}}` | `cust_base` |
| `{{geo_footprint}}` | `geo` |
| `{{aml_functions}}` | `aml_functions` (derived) |
| `{{aiml_usage}}` | `aiml` |
| `{{auto_closure}}` | `auto_close` |
| `{{gov_score}}` | (computed from governance object) |
| `{{gov_detail}}` | `governance` (object) |
| `{{audit_freq}}` | `audit` |
| `{{impl_approach}}` | `impl_approach` |
| `{{vendor_status}}` | `vendor_status` |
| `{{roadmap_status}}` | `roadmap_status` |
| `{{biggest_concern}}` | `biggest_concern` |
| `{{regulatory_context}}` | `regulatory_context` |

**3. Fields sent by form but missing from prompt**
- `contact_phone`
- `support` (from `supportNeeds[]`)
- `roadmap_status` (partially — listed as `{{roadmap_status}}` but in wrong section)
- `cust_base` (not referenced at all in prompt)

### Fix

**Replace the `{{placeholder}}` INSTITUTION DATA section** (lines 20-85) with a formal `INPUT JSON SCHEMA` block that:
1. Documents every field name exactly as the form sends it (e.g., `tx_vol`, `cust_base`, `geo`)
2. Lists allowed values / types for each field
3. Tells the AI: "The user message contains the assessment data as a JSON object. Use the field names below."

This is a single-section replacement in the prompt — no structural changes to the output schema, rating rules, or generation instructions. No changes to `reportGenerator.ts` or the form.

### Files Changed
- `supabase/functions/generate-aml-report/index.ts` — replace lines 20-85 (the `INSTITUTION DATA` section with `{{placeholder}}` syntax) with a formal `INPUT JSON SCHEMA` reference block

### What Won't Break
- Output schema unchanged
- Rating rules unchanged
- Form and `buildInputJson()` unchanged
- `reportGenerator.ts` unchanged
- Edge function request/response flow unchanged

