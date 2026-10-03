# Commun product activation

## Feed

The authenticated feed queries published posts authored by accounts the current user follows, ordered by publication date. It never inserts recommendations or demo content. When there are no follows or no published work, the empty state explains the cause and links to developer discovery or writing.

## Onboarding

Registration leads into the existing four-step onboarding flow: welcome, developer identity, interests, and profile links. Selected interests are persisted to `profiles.interests` and onboarding completion updates the authenticated profile. The next activation step is discovery: users can follow real developers before entering the feed.

## Discovery

Discovery remains backed by Supabase profiles and the existing follow API. Search and developer cards use real rows only; no recommendation content is fabricated. Topics and article/discussion discovery remain constrained by the current database capabilities and should be expanded with server-side pagination when those tables are exposed in the route.

## Profiles

Public profiles now show identity, bio, interests, follower/following counts, follow state, external links, and published articles from the current user-visible database. Private profile data is not selected. Owners get a writing CTA when they have no published work.

## Article reading

Published articles retain the existing safe Markdown renderer and interaction components for like, save, comments, replies, reporting, and follow-author behavior. The article route includes author identity, reading time, publication date, a responsive reading column, and a discussion CTA where available. Related content is not fabricated.

## Activation journey

Register → verify → complete interests → discover developers/topics → follow relevant people → return to Feed → read → engage → write. Every empty state uses a next action rather than pretending the network already has content.

## Empty-state strategy

Empty states say what is empty, why it is empty, and what the user can do next. New users are directed to discovery or writing. Existing users with no results are told whether the cause is a lack of follows, published work, or conversations.

## Known limitations

- Discovery is still limited to the current PostgreSQL/Supabase routes; full cross-entity search and cursor pagination remain a follow-up.
- Topic-follow onboarding UI is not added without confirming the existing topic-follow schema and API contract.
- Multi-account RLS, realtime, rate-limit threshold, accessibility automation, performance, CSP, and deployed staging verification remain separate infrastructure blockers.
- The product activation pass does not add jobs, payments, AI, chat, DMs, or deployment infrastructure.
