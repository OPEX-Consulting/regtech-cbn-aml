

## Plan: Replace Assessment Form with New 9-Section Version

### What We're Doing
Replace the current 7-step wizard form with the new 9-section single-page form from the uploaded HTML (`cbn-aml-download.html`), while adding back the 6 fields the AI prompt depends on so nothing breaks downstream.

### Phase 1: Database Migration
Add ~30 new columns to the `assessments` table for all new form fields:
- Coverage matrix: `cov_cdd`, `cov_sanctions`, `cov_txmon`, `cov_fraud`, `cov_case`, `cov_reporting`, `cov_risk`, `cov_audit`, `cov_security`
- KYC/Identity: `bvn_status`, `kyc_review`, `ubo_map`
- Sanctions: `sanctions_capab`, `sanction_lists`
- Fraud: `fraud_capab`, `fraud_feed`
- Reporting: `reporting_method`, `report_approval`
- Security: `encryption`, `mfa`, `data_sov`, `bia_status`
- Implementation: `impl_approach`, `vendor_status`, `budget_status`, `tech_capacity`, `core_integ`, `roadmap_status`
- Context: `biggest_concern`, `regulatory_context`, `support`, `contact_phone`
- Governance granular: `gov_ia`, `gov_policy`, etc. (replaces boolean governance JSONB with richer select values)

Existing columns remain unchanged -- no data loss.

### Phase 2: Build New Form Component
- Convert the 9-section HTML into a single-page React component with Tailwind styling matching the dark navy/gold design
- Re-integrate the 6 missing fields into natural positions:
  - `contact_role` → Section 1 (Institution Details)
  - `cust_base` → Section 2 (Scale & Risk Profile)
  - `products[]` → Section 2
  - `channels[]` → Section 2
  - `aiml` → Section 4 (Coverage Matrix)
  - `auto_close` → Section 4
- Implement sticky progress bar, radio/checkbox selection, coverage matrix rows
- Keep localStorage draft persistence
- Wire up existing Supabase insert + edge function call flow

### Phase 3: Data Mapping Layer
- Map renamed fields: `tx_volume` → `tx_vol`, `risk_class` → `cbn_risk`, `geo_reach` → `geo`, `group_struct` → `group_structure`
- Normalize `aml_status` values: "Standalone" → "Partial", "FullyCompliant" → "Full"
- Map granular governance selects back to Yes/No for existing prompt compatibility
- Derive `aml_functions[]` from the `cov_*` coverage matrix fields

### Phase 4: Update AI Prompt (Edge Function)
- Extend `generate-aml-report` SYSTEM_PROMPT to accept richer data (coverage matrix, KYC details, sanctions capability, fraud capability, security fields, implementation context)
- Update per-standard rating rules to use granular coverage data
- Update governance mapping for granular statuses
- Keep backward compatibility with existing output JSON schema

### Files Changed
- `src/components/AssessmentForm.tsx` -- full rebuild
- `src/components/FormFields.tsx` -- new field components for coverage matrix
- `supabase/functions/generate-aml-report/index.ts` -- updated prompt
- New database migration -- add columns
- `src/index.css` / `tailwind.config.ts` -- ensure new form uses consistent design tokens

### What Won't Break
- All 6 re-added fields keep the AI prompt working as-is
- Edge function output JSON schema stays identical
- Report PDF generation receives the same structure
- Existing database records unaffected (new columns are nullable)

