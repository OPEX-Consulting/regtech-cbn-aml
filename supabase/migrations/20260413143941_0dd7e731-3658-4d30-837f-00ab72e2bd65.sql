-- Add new columns for the 9-section CBN AML assessment form
-- All nullable to preserve backward compatibility with existing records

-- Coverage matrix (per-function capability level)
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS cov_cdd text;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS cov_sanctions text;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS cov_txmon text;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS cov_fraud text;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS cov_case text;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS cov_reporting text;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS cov_risk text;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS cov_audit text;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS cov_security text;

-- KYC / Identity (§5.2)
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS bvn_status text;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS kyc_review text;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS ubo_map text;

-- Sanctions & PEP (§5.3)
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS sanctions_capab text;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS sanction_lists text[] DEFAULT '{}'::text[];

-- Fraud (§5.6)
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS fraud_capab text;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS fraud_feed text;

-- Reporting (§5.8)
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS reporting_method text;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS report_approval text;

-- Security & NDPA (§5.11)
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS encryption text;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS mfa text;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS data_sov text;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS bia_status text;

-- Implementation / Vendor strategy
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS impl_approach text;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS vendor_status text;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS budget_status text;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS tech_capacity text;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS core_integ text;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS roadmap_status text;

-- Context & priorities
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS biggest_concern text;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS regulatory_context text;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS support text[] DEFAULT '{}'::text[];
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS contact_phone text;

-- Granular governance controls (richer than JSONB Yes/No)
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS gov_mlro text;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS gov_policy text;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS gov_framework text;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS gov_change text;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS gov_model text;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS gov_sla text;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS gov_vendor text;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS gov_retention text;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS gov_bvn text;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS gov_training text;