

## Plan: Enrich Report Output Schema and Template with Granular Data

### Problem
The AI prompt now ingests ~30 granular capability fields from the new form, but the output JSON schema is unchanged. The report still only shows a one-line finding per standard with no breakdown of the specific capabilities assessed. The new data is used for rating accuracy but is invisible to the reader.

### What to Add

**1. New output field: `capability_snapshot` (Section 1 addition)**

A visual summary table showing the institution's capability across the 9 coverage areas. This gives the reader an at-a-glance view before diving into the gap analysis.

```text
+---------------------------+---------+
| Function                  | Level   |
+---------------------------+---------+
| CDD/KYC                  | Partial |
| Sanctions & PEP          | None    |
| Transaction Monitoring    | None    |
| ...                       | ...     |
+---------------------------+---------+
```

Add to output schema:
```json
"capability_snapshot": [
  { "function": "string", "level": "None | Manual | Partial | Full" }
]
```

**2. New output field: `standards[].detail_factors` (per-standard sub-evidence)**

Each standard already has `finding` and `required_action`. Add an optional array showing the specific data points that drove the rating:

```json
"detail_factors": [
  { "factor": "BVN/NIN Integration", "value": "No integration", "impact": "Critical" },
  { "factor": "KYC Review Process", "value": "Manual", "impact": "Gap" }
]
```

This makes the report defensible and transparent -- the reader sees exactly which inputs drove the assessment.

**3. New output field: `security_posture` (Section 2 addition)**

A compact block after the governance assessment showing security readiness:

```json
"security_posture": {
  "encryption": "string (None|Partial|Full)",
  "mfa": "string",
  "data_sovereignty": "string",
  "bia_status": "string",
  "overall_label": "string (MAX 8 words)"
}
```

**4. New output field: `implementation_readiness` (Section 4 addition)**

Context block before the roadmap showing where the institution stands on implementation:

```json
"implementation_readiness": {
  "approach": "string",
  "vendor_status": "string",
  "budget_status": "string",
  "tech_capacity": "string",
  "overall_label": "string (MAX 8 words)"
}
```

**5. Add `disclaimer` field (already missing)**

```json
"disclaimer": "string (MAX 60 words)"
```

### Changes Required

**`supabase/functions/generate-aml-report/index.ts`**
- Add 4 new blocks to OUTPUT SCHEMA: `capability_snapshot`, `standards[].detail_factors`, `security_posture`, `implementation_readiness`, `disclaimer`
- Add word limits for new fields
- Add generation instructions for each new block

**`src/lib/reportGenerator.ts`**
- Add `capability_snapshot` table render in Section 1 (after scorecard)
- Add `detail_factors` sub-rows inside each gap card in Section 2
- Add `security_posture` block after governance assessment in Section 2
- Add `implementation_readiness` block before roadmap table in Section 4
- Add `disclaimer` to footer
- Update TypeScript interfaces for new fields
- Sync section headings with template (Section 3 title, Section 5 subsections)
- Add `table-wrap` divs for responsive tables

**`public/temp/cbn_aml_report_template.html`**
- Add CSS styles for new blocks (capability-table, detail-factors, security-block, readiness-block)
- Add corresponding HTML structure in the template body

### What Won't Break
- All existing output fields remain unchanged
- New fields are additive -- old reports without them still render (guard with `|| []` / `|| {}`)
- Report PDF generation flow unchanged
- Database schema unchanged (these are AI output fields, not form fields)

