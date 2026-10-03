# Private beta feedback

Authenticated users submit feedback from Settings using one of `BUG`, `FEATURE`, `CONFUSION`, or `GENERAL`. The server validates category, message length (10–2000 characters), and route; identity comes from the server session, never from the request body.

Feedback is stored separately from moderation reports in `beta_feedback`. Users can create their own submissions but cannot read another user's submission. Admins can review feedback through a protected admin workflow once the migration is applied to staging. Feedback does not contain private article content unless the user chooses to describe it.

Before beta: apply `20261004120000_private_beta_observability.sql`, verify the table and RLS policies, and confirm admin review access. During beta: triage bugs by severity, link reproducible issues to route/account role without recording credentials, and acknowledge useful requests. At close: export only aggregate themes, resolve or archive records under the project's retention policy, and remove test data from staging.

Rate-limit feedback submissions before inviting users if abuse becomes possible; keep the endpoint authenticated and add a route-specific limiter rather than sharing moderation-report limits.
