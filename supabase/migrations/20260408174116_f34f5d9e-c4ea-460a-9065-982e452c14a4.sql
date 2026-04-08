-- Grant table-level permissions for anon and authenticated roles
GRANT INSERT ON public.assessments TO anon;
GRANT INSERT ON public.assessments TO authenticated;
GRANT SELECT ON public.assessments TO authenticated;