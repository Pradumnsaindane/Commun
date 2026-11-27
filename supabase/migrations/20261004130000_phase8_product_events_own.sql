-- The analytics page reads a user's own product events with a session client,
-- but the tracked observability migrations only grant INSERT to the user and
-- SELECT to admins. Add the missing owner READ policy.

drop policy if exists product_events_select_own on public.product_events;
create policy product_events_select_own on public.product_events
  for select to authenticated
  using ((select auth.uid()) = user_id);
