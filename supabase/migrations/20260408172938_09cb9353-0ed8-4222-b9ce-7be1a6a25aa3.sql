-- Drop the existing insert policy and recreate with explicit anon role
DROP POLICY IF EXISTS "Anyone can submit assessments" ON public.assessments;
CREATE POLICY "Anyone can submit assessments"
  ON public.assessments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);