# Discovery and search

## Searchable entities

`/search?q=react&type=articles` uses the authenticated Supabase server client to search active developer profiles, published posts, non-removed discussions, and topics. `type` accepts `all`, `developers`, `articles`, `discussions`, or `topics`. Empty queries show activation prompts instead of querying unbounded content.

## Query behavior

Search uses PostgreSQL `ilike` predicates over relevant title, description, profile, and body fields. Search terms are escaped for `%`, `_`, and backslashes before being passed to PostgREST. Published article search includes body text; drafts are excluded by `status = PUBLISHED`. Removed discussions and inactive profiles are excluded.

## Pagination

The API caps `limit` at 20 and defaults to 12. Results use stable entity-specific ordering and Supabase range pagination. Search state is URL-addressable, so refresh and browser back/forward preserve `q`, `type`, and `page`.

## Authorization

All reads use the existing SSR Supabase client and inherit the current session and database RLS policies. Anonymous users receive only rows exposed by public policies; the endpoint does not accept a client-supplied user ID, role, visibility, or ownership value. Author enrichment is batched by IDs to avoid per-result queries.

## Topics

Explore supports topic URLs and uses `post_topics` to show published articles associated with a topic. Discussions are filtered by their existing `topic_id`. Topic following is not implemented because no complete follow contract was present in the existing schema/API.

## Known limitations

PostgreSQL `ilike` is a pragmatic first search implementation, not full-text ranking. It does not yet provide stemming, typo tolerance, cursor pagination, or reply-count ranking. Explore uses bounded server-rendered sections; `/search` is the paginated surface for larger result sets. Specialized indexes or PostgreSQL full-text search should be driven by measured query plans and real beta data.
