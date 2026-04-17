-- Store the AI-generated report JSON against the assessment row for audit purposes
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS report_json JSONB;

-- Allow the public (anonymous) form session to write back the report JSON after generation
CREATE POLICY "Anyone can update assessments"
  ON public.assessments
  FOR UPDATE
  USING (true)
  WITH CHECK (true);
