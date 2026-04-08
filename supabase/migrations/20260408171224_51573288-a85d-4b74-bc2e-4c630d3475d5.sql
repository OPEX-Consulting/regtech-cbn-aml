
-- Create table for AML/CFT assessment submissions
CREATE TABLE public.assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inst_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_role TEXT NOT NULL,
  inst_type TEXT NOT NULL,
  tx_vol TEXT,
  cust_base TEXT,
  cbn_risk TEXT,
  geo TEXT,
  group_structure TEXT,
  products TEXT[] DEFAULT '{}',
  channels TEXT[] DEFAULT '{}',
  aml_status TEXT,
  aml_functions TEXT[] DEFAULT '{}',
  aiml TEXT,
  auto_close TEXT,
  risk_factors TEXT[] DEFAULT '{}',
  governance JSONB DEFAULT '{}',
  audit TEXT,
  extra_context TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public form, no auth required)
CREATE POLICY "Anyone can submit assessments"
  ON public.assessments
  FOR INSERT
  WITH CHECK (true);

-- Only authenticated users (admins) can read submissions
CREATE POLICY "Authenticated users can read assessments"
  ON public.assessments
  FOR SELECT
  TO authenticated
  USING (true);
