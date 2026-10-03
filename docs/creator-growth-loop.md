# Creator growth loop

Commun's creator loop is intentionally built from existing authenticated data and interactions:

`Publish → Discover → Read → Engage → Follow → Feed → Return → Publish`

## Implemented

- Article pages now include author presence: avatar initial, display name, username, bio, follower count, profile link, and the existing follow API state.
- Article interactions keep Like, Save, comments, and a direct Discussions path together so reading can become participation without creating duplicate discussions.
- Publishing now exposes an in-editor success state with the live article, profile, discovery, and continue-writing actions after a successful publish response.
- Feed remains bounded and server-backed: it only uses followed authors' published posts, orders by publication time, and excludes draft/removed content through the existing query and RLS model.
- Saved content links directly back to the real article and provides a discovery empty state.
- The authenticated shell keeps Feed, Explore, Discussions, Notifications, Saved, Write, and Profile easy to reach.
- Public profiles remain creator hubs with real published work, follower/following counts, interests, and public links only.

## Existing notification behavior

Notifications are loaded only for the authenticated recipient. Follow events link to the actor's profile; article like/comment/reply events link to the article slug when available. Notifications use the existing conflict-safe upsert path to avoid duplicate events. Realtime refreshes the authenticated notification center without adding a second subscription per render.

## Verification limits

Local validation confirms the unauthenticated boundaries and empty-database states, but it cannot prove the full multi-user loop without real accounts. A staging pass still needs USER_A and USER_B to verify follow → feed, like/comment/reply notification navigation, save → Saved → article, realtime delivery, and author privacy across accounts. The existing RLS policies and server-derived identity remain the source of truth; no client-supplied user IDs or fabricated engagement counts were added.

## Performance and security

Author counts and relationship state are loaded in bounded server queries. The article author card uses the existing follow endpoint, which validates authenticated identity and target UUID server-side. Related discovery remains bounded and does not add an opaque recommendation system, background jobs, external search service, or unbounded realtime subscription.
