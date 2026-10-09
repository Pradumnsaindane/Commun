# Notification and reply hardening

## Notifications

The public `POST /api/notifications` route no longer accepts client-supplied recipient, type, or entity fields. Authenticated callers receive `403`; unauthenticated callers receive `401`. The route remains present so existing clients fail closed rather than silently creating arbitrary records.

Legitimate moderation notifications continue through the server-only `notifyUser` helper, whose type is now restricted to `MODERATION`. Other trusted notification workflows use `createNotification` with its narrower event union. No client-provided ownership or entity reference is trusted.

## Discussion replies

Reply creation now requires an authenticated user with an `ACTIVE` profile, an existing non-removed discussion, and an open discussion. Parent replies are loaded server-side and must be non-removed and belong to the same discussion. Reply depth is calculated from the stored parent depth and is capped at depth 2; the client cannot choose the depth.

Invalid parent references return `422`, closed discussions return `409`, missing discussions return `404`, and inactive profiles return `403`. These checks complement, rather than replace, Supabase RLS.

## Test scope

Unit tests cover supported notification types and depth boundaries. Route-level behavior still requires a Supabase-backed integration test with authenticated fixtures; no production database, policies, or infrastructure were modified during this fix.

## Remaining limitation

The exact live RLS policies could not be inspected in this environment. Before beta approval, run the authenticated matrix against an isolated Supabase project using USER_A, USER_B, and inactive/suspended profiles, including cross-discussion parent IDs and closed discussions.
