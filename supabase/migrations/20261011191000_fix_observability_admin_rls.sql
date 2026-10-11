-- Align observability read policies with the application's authoritative
-- Supabase Auth app_metadata.role authorization model.

DROP POLICY IF EXISTS product_events_select_admin
  ON public.product_events;

CREATE POLICY product_events_select_admin
  ON public.product_events
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN'
  );

DROP POLICY IF EXISTS beta_feedback_select_admin
  ON public.beta_feedback;

CREATE POLICY beta_feedback_select_admin
  ON public.beta_feedback
  FOR SELECT
  TO authenticated
  USING (
    (SELECT auth.jwt() -> 'app_metadata' ->> 'role') = 'ADMIN'
  );
