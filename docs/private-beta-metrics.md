# Private beta metrics

Commun measures a small activation funnel with allowlisted product events only. Events contain a user id for authenticated aggregation, route, and non-sensitive scalar metadata; never store article bodies, passwords, tokens, IP addresses, or private message content.

| Step | Event | Meaning | Measurement | Why it matters |
|---|---|---|---|---|
| Landing visit | `landing_viewed` (route analytics) | A visitor reached the product | Server/access analytics or privacy-conscious page view | Top-of-funnel context |
| Register | `signup_completed` | Account creation finished | `product_events` | Signup conversion |
| Verify/onboard | `onboarding_completed` | User reached a usable profile | `product_events` | Activation quality |
| Discover | route view/follow | User found the community | `follow_created` and route views | Relevance |
| Read | `article_viewed` | User consumed an article | `product_events` | Core reading value |
| Create | `article_created` | User started contributing | `product_events` | Contribution intent |
| Publish | `article_published` | User shared work | `product_events` | Contribution completion |
| Discuss | `discussion_created` / `reply_created` | User participated in conversation | `product_events` | Community health |
| Return | repeat authenticated events | User came back | Weekly distinct event users | Retention |

Review weekly by cohort, not by individual content. The primary beta metric is signup-to-onboarding completion. Secondary metrics are first follow, first read, first draft, first publication, first discussion, and returning contributor rate. Set no public vanity counters from this table.
