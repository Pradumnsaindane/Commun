# Commun.dev — Production Architecture Spec & Deterministic Execution Blueprint

**System Version:** 1.0.0 (Production Core)  
**Target Runtime:** Next.js 14+ (App Router) / Node.js 20 LTS / PostgreSQL 15+ (Supabase)  
**Document Classification:** Engineering Master Specification & AI-Agent Execution Protocol  

---

## 0. Executive Product Scope & Anti-Scope Guardrails

Commun.dev is a high-signal, Substack-meets-Dev.to editorial publishing and peer discussion platform for software engineers.

```
DISCOVER (Explore / Feed) ──► READ (Editorial Reader) ──► FOLLOW (Devs & Topics) 
   ▲                                                             │
   └────── DISCUSS (Threads) ◄── CREATE (Articles & Drafts) ◄───┘
```

### Strict Non-Functional & Anti-Scope Constraints (Zero-Tolerance)
The implementing agent **MUST NOT** scaffold, import, or implement any of the following:
- **NO** AI coding assistants, chat bots, or LLM wrapper features.
- **NO** IDE/code-runner integrations, sandboxes, or WebAssembly compilers.
- **NO** Job boards, resume builders, career coaching tools, or salary calculators.
- **NO** Crypto, tokenomics, Web3 wallets, or paid payment gateways (Stripe/crypto).
- **NO** Video conferencing, audio rooms, or complex BI analytics platforms.
- **NO** Multi-tenant enterprise organization management.

### Access Control Matrix
| Role | Public Content Read | Draft / Publish Articles | Create Discussions / Comments | Pin Own Thread Replies | Moderate Content / Reports | Ban / Suspend Users |
|---|---|---|---|---|---|---|
| **Guest** (Unauthenticated) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Registered (Unverified)** | ✅ | ❌ (Draft only) | ❌ | ❌ | ❌ | ❌ |
| **Registered (Active)** | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| **Moderator** | ✅ | ✅ | ✅ | ✅ | ✅ (Posts, Comments, Threads) | ❌ |
| **Admin** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (Full RBAC + Audit) |

---

## 1. Non-Negotiable Core Engineering Laws

All agents and developers executing against this spec must strictly adhere to these fundamental laws. Any violation is considered an immediate build failure.

### 1. Zero Fake, Mock, Seeded, or Placeholder Data — Anywhere, Ever
- **Never** generate sample users, sample posts, sample comments, sample notifications, or fake "trending" content to make screens look populated.
- **Never** hardcode arrays like `const posts = [...]` or `const authors = [...]` with invented names/avatars/content in any component.
- Every list, feed, counter, and profile **must** be fetched directly from the real database through the real API.
- The **only** exception is unit test files (`*.spec.ts`, `*.test.ts`) explicitly isolated from production bundles.

### 2. Zero-State Resilience (0 Users, 1 User, N Users)
- On a freshly deployed, empty database, the application **must** load with zero console errors and display honest, accessible empty states.
- Every feed and list component **must** implement a dedicated empty state:
  - **Home Feed (Global Empty):** *"No posts yet. Be the first to publish something."* + `[Create Post]` button.
  - **Home Feed (Following Tab):** *"You're not following anyone yet."* + link to Explore.
  - **Explore (No Creators):** *"No developers here yet — invite someone or be the first to publish."*
  - **Notifications (Inbox Zero):** *"You're all caught up."*
  - **Community (No Threads):** *"No discussions started yet."* + `[Start Discussion]` button.
  - **Profile (No Articles):** *"@username hasn't published anything yet."*
  - **Counters:** Followers, likes, replies, and saves must display real `0` (never omitted, never falsified).

### 3. Real Authenticated Sessions & Server-Side Security
- **Guest Browsing:** Guests can read public articles, explore topics, and view developer profiles.
- **Write Actions Require Auth:** Any write action (publishing, commenting, replying, liking, saving, following, starting discussions) must redirect the user to `/login` or `/register` and preserve the return URL (`?next=...`) to return them seamlessly after authentication.
- **Email Verification Gating:** Registered users with unverified emails can draft articles and read, but **cannot** publish, comment, or start discussions. Show an inline warning: *"Verify your email to publish"* with a resend-verification action.
- **Server-Side Enforcement:** Every mutation endpoint must reject unauthenticated requests with `401 Unauthorized` and reject unverified/unauthorized actions with `403 Forbidden`. The frontend never decides permissions.

### 4. First-Run Demo Workflow (The Ground-Truth Acceptance Test)
The definitive validation test for the entire system:
1. Deploy against a completely empty database.
2. Register **Account 1** → Verify email → Publish a real technical post.
3. Open incognito/second session → Register **Account 2** → Verify email.
4. From Account 2: See Account 1's post appear live on Home/Explore → Follow Account 1 → Switch to "Following" tab to see it → Like the post → Post a comment.
5. In Account 1 session: Observe real-time notification update (incremented badge + notification item) via Supabase Realtime without refreshing.

### 5. True Relational Persistence (No Client-Side Simulation)
- No `useState` or `localStorage` standing in for a database. Every post, comment, like, follow, bookmark, and notification must persist in PostgreSQL via Prisma/Supabase and survive full browser refreshes.
- Realtime events must stream from Postgres CDC (Supabase Realtime) channels reacting to real database mutations, not polling or `setInterval` mock routines.

### 6. The "No Fallback Placeholders" Rule
- If ever tempted to insert a mock array "so the UI looks good during development" — **don't**. Ship the empty state component instead.
- Any placeholder mock data introduced into the runtime is treated as a regression bug.

---

## 2. Universal Acceptance Checklist (Verify Before Marking Any Phase Complete)

Every agent must run and satisfy this checklist before finalizing a phase:
- [ ] **Fresh Empty DB:** App loads cleanly without errors; every view displays its honest empty state.
- [ ] **Auth Gating:** Unauthenticated users cannot mutate data; redirect-after-login works seamlessly.
- [ ] **Verification Gate:** Unverified users are blocked from publishing/commenting with clear verify-email UI.
- [ ] **Multi-Session Interactivity:** Two real accounts in separate browsers can interact with real data.
- [ ] **Server Persistence:** Hard refreshing any page preserves all mutations and relational state.
- [ ] **Zero-Mock Audit:** Grepping the codebase (`grep -r "Marcus Chen"` or sample arrays) yields zero hits in `app/` and `components/`.

---

## 3. Concrete Technology Stack & Canonical Dependencies

All dependencies are locked to avoid version drift and API deprecations.

```json
{
  "dependencies": {
    "next": "^14.2.15",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "@supabase/supabase-js": "^2.45.4",
    "@supabase/ssr": "^0.5.1",
    "@prisma/client": "^5.21.1",
    "@tanstack/react-query": "^5.59.0",
    "zustand": "^4.5.5",
    "zod": "^3.23.8",
    "lucide-react": "^0.453.0",
    "tailwind-merge": "^2.5.4",
    "clsx": "^2.1.1",
    "class-variance-authority": "^0.7.0",
    "@radix-ui/react-dialog": "^1.1.2",
    "@radix-ui/react-dropdown-menu": "^2.1.2",
    "@radix-ui/react-avatar": "^1.1.1",
    "@radix-ui/react-toast": "^1.2.2",
    "@radix-ui/react-tabs": "^1.1.1",
    "@radix-ui/react-tooltip": "^1.1.3",
    "date-fns": "^3.6.0",
    "slugify": "^1.6.6",
    "dompurify": "^3.1.7",
    "isomorphic-dompurify": "^2.16.0"
  },
  "devDependencies": {
    "typescript": "^5.6.3",
    "@types/node": "^20.16.11",
    "@types/react": "^18.3.11",
    "@types/react-dom": "^18.3.0",
    "tailwindcss": "^3.4.14",
    "postcss": "^8.4.47",
    "autoprefixer": "^10.4.20",
    "prisma": "^5.21.1",
    "vitest": "^2.1.3",
    "@testing-library/react": "^16.0.1",
    "@playwright/test": "^1.48.1",
    "eslint": "^8.57.1",
    "eslint-config-next": "^14.2.15"
  }
}
```

---

## 4. Definitive Database Schema (`prisma/schema.prisma`)

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

generator client {
  provider = "prisma-client-js"
}

enum Role {
  USER
  MODERATOR
  ADMIN
}

enum UserStatus {
  PENDING_VERIFICATION
  ACTIVE
  SUSPENDED
  DEACTIVATED
  DELETED
}

enum PostStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
  REMOVED
}

enum TargetType {
  POST
  COMMENT
  DISCUSSION
  REPLY
  USER
}

enum ReportStatus {
  PENDING
  DISMISSED
  ACTIONED
}

enum NotificationType {
  LIKE
  COMMENT
  REPLY
  FOLLOW
  MENTION
  NEW_POST
  NEW_DISCUSSION
  MODERATION
  SYSTEM
}

model User {
  id            String      @id @default(uuid()) @db.Uuid
  email         String      @unique @db.VarChar(255)
  username      String      @unique @db.VarChar(50)
  name          String      @db.VarChar(100)
  avatarUrl     String?     @db.Text
  bio           String?     @db.VarChar(280)
  website       String?     @db.VarChar(255)
  github        String?     @db.VarChar(100)
  role          Role        @default(USER)
  status        UserStatus  @default(PENDING_VERIFICATION)
  createdAt     DateTime    @default(now()) @db.Timestamptz(6)
  updatedAt     DateTime    @updatedAt @db.Timestamptz(6)

  posts         Post[]
  comments      Comment[]
  discussions   Discussion[]
  replies       Reply[]
  likes         Like[]
  saves         Save[]
  notifications Notification[]
  reportsFiled  Report[]    @relation("UserReportsFiled")
  auditActions  AuditLog[]  @relation("ActorAuditLogs")

  // Following relationships
  following     Follow[]    @relation("UserFollowing")
  followers     Follow[]    @relation("UserFollowers")
  topicFollows  TopicFollow[]

  @@index([username])
  @@index([email])
  @@index([status])
}

model Topic {
  id          String        @id @default(uuid()) @db.Uuid
  name        String        @unique @db.VarChar(50)
  slug        String        @unique @db.VarChar(50)
  description String?       @db.VarChar(200)
  createdAt   DateTime      @default(now()) @db.Timestamptz(6)

  posts       PostTopic[]
  discussions Discussion[]
  followers   TopicFollow[]

  @@index([slug])
}

model Post {
  id          String      @id @default(uuid()) @db.Uuid
  authorId    String      @db.Uuid
  title       String      @db.VarChar(255)
  slug        String      @unique @db.VarChar(280)
  excerpt     String?     @db.VarChar(500)
  content     String      @db.Text
  coverImage  String?     @db.Text
  status      PostStatus  @default(DRAFT)
  readingTime Int         @default(1)
  publishedAt DateTime?   @db.Timestamptz(6)
  createdAt   DateTime    @default(now()) @db.Timestamptz(6)
  updatedAt   DateTime    @updatedAt @db.Timestamptz(6)

  author      User        @relation(fields: [authorId], references: [id], onDelete: Cascade)
  topics      PostTopic[]
  comments    Comment[]
  likes       Like[]
  saves       Save[]

  @@index([authorId])
  @@index([slug])
  @@index([status, publishedAt(sort: Desc)])
}

model PostTopic {
  postId  String @db.Uuid
  topicId String @db.Uuid

  post    Post   @relation(fields: [postId], references: [id], onDelete: Cascade)
  topic   Topic  @relation(fields: [topicId], references: [id], onDelete: Cascade)

  @@id([postId, topicId])
  @@index([topicId])
}

model Comment {
  id        String      @id @default(uuid()) @db.Uuid
  postId    String      @db.Uuid
  authorId  String      @db.Uuid
  parentId  String?     @db.Uuid
  content   String      @db.Text
  pinned    Boolean     @default(false)
  isRemoved Boolean     @default(false)
  createdAt DateTime    @default(now()) @db.Timestamptz(6)
  updatedAt DateTime    @updatedAt @db.Timestamptz(6)

  post      Post        @relation(fields: [postId], references: [id], onDelete: Cascade)
  author    User        @relation(fields: [authorId], references: [id], onDelete: Cascade)
  parent    Comment?    @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies   Comment[]   @relation("CommentReplies")
  likes     Like[]

  @@index([postId, createdAt(sort: Asc)])
  @@index([parentId])
  @@index([authorId])
}

model Discussion {
  id          String      @id @default(uuid()) @db.Uuid
  authorId    String      @db.Uuid
  topicId     String      @db.Uuid
  title       String      @db.VarChar(255)
  content     String      @db.Text
  isPinned    Boolean     @default(false)
  isClosed    Boolean     @default(false)
  isRemoved   Boolean     @default(false)
  createdAt   DateTime    @default(now()) @db.Timestamptz(6)
  updatedAt   DateTime    @updatedAt @db.Timestamptz(6)

  author      User        @relation(fields: [authorId], references: [id], onDelete: Cascade)
  topic       Topic       @relation(fields: [topicId], references: [id], onDelete: Restrict)
  replies     Reply[]
  saves       Save[]

  @@index([topicId, createdAt(sort: Desc)])
  @@index([authorId])
}

model Reply {
  id           String      @id @default(uuid()) @db.Uuid
  discussionId String      @db.Uuid
  authorId     String      @db.Uuid
  parentId     String?     @db.Uuid
  depth        Int         @default(1)
  content      String      @db.Text
  isSolution   Boolean     @default(false)
  isRemoved    Boolean     @default(false)
  createdAt    DateTime    @default(now()) @db.Timestamptz(6)
  updatedAt    DateTime    @updatedAt @db.Timestamptz(6)

  discussion   Discussion  @relation(fields: [discussionId], references: [id], onDelete: Cascade)
  author       User        @relation(fields: [authorId], references: [id], onDelete: Cascade)
  parent       Reply?      @relation("ReplyHierarchy", fields: [parentId], references: [id], onDelete: Cascade)
  children     Reply[]     @relation("ReplyHierarchy")

  @@index([discussionId, createdAt(sort: Asc)])
  @@index([parentId])
}

model Follow {
  followerId  String   @db.Uuid
  followingId String   @db.Uuid
  createdAt   DateTime @default(now()) @db.Timestamptz(6)

  follower    User     @relation("UserFollowing", fields: [followerId], references: [id], onDelete: Cascade)
  following   User     @relation("UserFollowers", fields: [followingId], references: [id], onDelete: Cascade)

  @@id([followerId, followingId])
  @@index([followingId])
}

model TopicFollow {
  userId    String   @db.Uuid
  topicId   String   @db.Uuid
  createdAt DateTime @default(now()) @db.Timestamptz(6)

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  topic     Topic    @relation(fields: [topicId], references: [id], onDelete: Cascade)

  @@id([userId, topicId])
  @@index([topicId])
}

model Like {
  id        String    @id @default(uuid()) @db.Uuid
  userId    String    @db.Uuid
  postId    String?   @db.Uuid
  commentId String?   @db.Uuid
  createdAt DateTime  @default(now()) @db.Timestamptz(6)

  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  post      Post?     @relation(fields: [postId], references: [id], onDelete: Cascade)
  comment   Comment?  @relation(fields: [commentId], references: [id], onDelete: Cascade)

  @@unique([userId, postId])
  @@unique([userId, commentId])
  @@index([postId])
  @@index([commentId])
}

model Save {
  id           String      @id @default(uuid()) @db.Uuid
  userId       String      @db.Uuid
  postId       String?     @db.Uuid
  discussionId String?     @db.Uuid
  createdAt    DateTime    @default(now()) @db.Timestamptz(6)

  user         User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  post         Post?       @relation(fields: [postId], references: [id], onDelete: Cascade)
  discussion   Discussion? @relation(fields: [discussionId], references: [id], onDelete: Cascade)

  @@unique([userId, postId])
  @@unique([userId, discussionId])
  @@index([userId, createdAt(sort: Desc)])
}

model Notification {
  id        String           @id @default(uuid()) @db.Uuid
  userId    String           @db.Uuid
  type      NotificationType
  payload   Json
  read      Boolean          @default(false)
  createdAt DateTime         @default(now()) @db.Timestamptz(6)

  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, read, createdAt(sort: Desc)])
}

model Report {
  id         String       @id @default(uuid()) @db.Uuid
  reporterId String       @db.Uuid
  targetType TargetType
  targetId   String       @db.Uuid
  reason     String       @db.VarChar(500)
  status     ReportStatus @default(PENDING)
  createdAt  DateTime     @default(now()) @db.Timestamptz(6)
  updatedAt  DateTime     @updatedAt @db.Timestamptz(6)

  reporter   User         @relation("UserReportsFiled", fields: [reporterId], references: [id], onDelete: Cascade)

  @@index([status, createdAt(sort: Desc)])
  @@index([targetType, targetId])
}

model AuditLog {
  id         String     @id @default(uuid()) @db.Uuid
  actorId    String     @db.Uuid
  action     String     @db.VarChar(100)
  targetType TargetType
  targetId   String     @db.Uuid
  metadata   Json?
  createdAt  DateTime   @default(now()) @db.Timestamptz(6)

  actor      User       @relation("ActorAuditLogs", fields: [actorId], references: [id], onDelete: Cascade)

  @@index([actorId, createdAt(sort: Desc)])
  @@index([targetType, targetId])
}
```

---

## 5. Strict Authorization & Security Engine (`lib/authz.ts`)

Every mutation API handler **MUST** execute the authorization pipeline via `lib/authz.ts`. Never perform manual ad-hoc authorization checks inside Route Handlers.

```typescript
import { Role, UserStatus } from '@prisma/client';
import { NextResponse } from 'next/server';

export interface AuthContext {
  userId: string;
  role: Role;
  status: UserStatus;
}

export type PermissionCheck = (ctx: AuthContext, resourceOwnerId?: string) => boolean;

export const Permissions = {
  // Publishing & Interaction Guards
  canPublish: (ctx: AuthContext) => 
    ctx.status === UserStatus.ACTIVE,

  canModifyResource: (ctx: AuthContext, resourceOwnerId?: string) => 
    ctx.status === UserStatus.ACTIVE && 
    (ctx.userId === resourceOwnerId || ctx.role === Role.ADMIN || ctx.role === Role.MODERATOR),

  canDeleteResource: (ctx: AuthContext, resourceOwnerId?: string) => 
    ctx.status === UserStatus.ACTIVE && 
    (ctx.userId === resourceOwnerId || ctx.role === Role.ADMIN),

  canModerate: (ctx: AuthContext) => 
    ctx.status === UserStatus.ACTIVE && 
    (ctx.role === Role.MODERATOR || ctx.role === Role.ADMIN),

  canAdminister: (ctx: AuthContext) => 
    ctx.status === UserStatus.ACTIVE && ctx.role === Role.ADMIN,
};

export function assertAuthorized(
  ctx: AuthContext | null,
  check: PermissionCheck,
  resourceOwnerId?: string
): void {
  if (!ctx) {
    throw new ApiError(401, 'UNAUTHORIZED', 'Authentication credentials missing or invalid.');
  }
  if (ctx.status === UserStatus.SUSPENDED || ctx.status === UserStatus.DELETED) {
    throw new ApiError(403, 'ACCOUNT_LOCKED', 'User account is suspended or deactivated.');
  }
  if (!check(ctx, resourceOwnerId)) {
    throw new ApiError(403, 'FORBIDDEN', 'Insufficient permissions to perform this operation.');
  }
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: { code: error.code, message: error.message } },
      { status: error.statusCode }
    );
  }
  console.error('[UNHANDLED_API_ERROR]', error);
  return NextResponse.json(
    { error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred.' } },
    { status: 500 }
  );
}
```

---

## 6. Universal Validation Contracts (`lib/validation/*.ts`)

All inbound payloads must strictly pass Zod parsing with `.strict()`, rejecting unmapped fields.

### `lib/validation/post.schema.ts`
```typescript
import { z } from 'zod';

export const CreatePostSchema = z.object({
  title: z.string().trim().min(5, 'Title must be at least 5 characters').max(255),
  content: z.string().trim().min(20, 'Content must contain at least 20 characters'),
  excerpt: z.string().trim().max(500).optional(),
  coverImage: z.string().url().optional().nullable(),
  topicIds: z.array(z.string().uuid()).min(1, 'Select at least one topic').max(5, 'Max 5 topics'),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('DRAFT'),
}).strict();

export const UpdatePostSchema = CreatePostSchema.partial().strict();

export const PostQuerySchema = z.object({
  cursor: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  topic: z.string().optional(),
  feed: z.enum(['for-you', 'following', 'latest']).default('latest'),
  author: z.string().optional(),
});
```

### `lib/validation/discussion.schema.ts`
```typescript
import { z } from 'zod';

export const CreateDiscussionSchema = z.object({
  title: z.string().trim().min(8, 'Title must be at least 8 characters').max(255),
  content: z.string().trim().min(30, 'Content must provide sufficient context (min 30 chars)'),
  topicId: z.string().uuid('Invalid topic ID'),
}).strict();

export const CreateReplySchema = z.object({
  content: z.string().trim().min(3, 'Reply must be at least 3 characters'),
  parentId: z.string().uuid().optional().nullable(),
}).strict();
```

### `lib/validation/moderation.schema.ts`
```typescript
import { z } from 'zod';

export const CreateReportSchema = z.object({
  targetType: z.enum(['POST', 'COMMENT', 'DISCUSSION', 'REPLY', 'USER']),
  targetId: z.string().uuid('Invalid target UUID'),
  reason: z.string().trim().min(10, 'Reason must be at least 10 characters').max(500),
}).strict();

export const ResolveReportSchema = z.object({
  action: z.enum(['DISMISS', 'REMOVE_CONTENT', 'WARN_USER', 'SUSPEND_USER']),
  note: z.string().trim().max(500).optional(),
}).strict();
```

---

## 7. API Route Specifications & Error Contract

All JSON responses follow standard HTTP semantics with uniform envelopes:

- **Success Response Envelope:** `{ "data": T, "meta"?: { "nextCursor"?: string, "hasMore"?: boolean } }`
- **Error Response Envelope:** `{ "error": { "code": string, "message": string, "details"?: unknown } }`

| Method | Endpoint | Auth Required | Min Status / Role | Description |
|---|---|---|---|---|
| `GET` | `/api/posts` | Optional | Guest | Paginated cursor feed (Latest, Following, For You) |
| `POST` | `/api/posts` | Mandatory | `ACTIVE` | Create draft or publish article |
| `GET` | `/api/posts/[slug]` | Optional | Guest | Retrieve post detail with author and tags |
| `PATCH` | `/api/posts/[slug]` | Mandatory | Owner / Admin | Update post fields or toggle status |
| `DELETE` | `/api/posts/[slug]` | Mandatory | Owner / Admin | Delete post (cascades comments/likes) |
| `GET` | `/api/posts/[id]/comments` | Optional | Guest | Fetch threaded comments for post |
| `POST` | `/api/posts/[id]/comments` | Mandatory | `ACTIVE` | Post comment or nested reply |
| `POST` | `/api/interactions/like` | Mandatory | `ACTIVE` | Toggle like on post or comment (idempotent) |
| `POST` | `/api/interactions/save` | Mandatory | `ACTIVE` | Toggle bookmark on post or discussion |
| `GET` | `/api/discussions` | Optional | Guest | List discussions with reply/view counts |
| `POST` | `/api/discussions` | Mandatory | `ACTIVE` | Create discussion thread |
| `POST` | `/api/discussions/[id]/replies` | Mandatory | `ACTIVE` | Reply to discussion (max depth 3 enforced) |
| `GET` | `/api/notifications` | Mandatory | Registered | Fetch unread notifications |
| `PATCH` | `/api/notifications/read` | Mandatory | Registered | Mark single or all notifications as read |
| `POST` | `/api/moderation/reports` | Mandatory | `ACTIVE` | Submit abuse/spam report |
| `GET` | `/api/admin/reports` | Mandatory | `MODERATOR` / `ADMIN` | List pending moderation queue |
| `POST` | `/api/admin/reports/[id]/resolve` | Mandatory | `MODERATOR` / `ADMIN` | Apply moderation action & write audit log |

---

## 8. Deterministic 9-Phase Agent Execution Protocol

Execute these phases sequentially. **Rules for Agent Execution:**
1. Execute one phase per session.
2. Complete all listed acceptance criteria, empty-state verifications, and automated tests before moving forward.
3. Keep code modular, strictly typed, zero-mock, and zero-redundancy.

---

### Phase 1 — Project Foundation, Design Tokens & Static Shell
**Prompt Block for Manager / Subagent:**
```text
Task: Initialize Next.js 14 App Router project with TypeScript, Tailwind CSS, and shadcn/ui primitives.
Scope:
1. Initialize Tailwind theme matching Commun Dark-First palette:
   - Background: #090a0f, Card/Surface: #141720, Border: #1f2330, Accent: #f97316 (orange-500).
   - Fonts: Inter/Geist (Sans) and JetBrains Mono (Code).
2. Install shadcn/ui components: button, dialog, dropdown-menu, avatar, toast, tabs, tooltip.
3. Build responsive app shell layout components in components/nav/:
   - TopHeader: Logo, Global Search input, Notification Bell placeholder, User Profile Menu.
   - LeftSidebar: Nav items (Home, Explore, Subscriptions, Community, Saved, Profile, Settings) + Write CTA.
   - MobileBottomNav: 5 icons (Home, Explore, Write, Community, Profile).
   - RightSidebar: Sticky Trending Topics chip container + Suggested Writers cards.
4. Setup (public)/page.tsx layout grid with empty feed container.
5. Setup strict TypeScript (strict: true in tsconfig.json), ESLint, and Prettier.

Acceptance Criteria:
- Zero mock data arrays or hardcoded placeholder items anywhere in components.
- npm run build succeeds with zero errors or TypeScript warnings.
- Layout perfectly displays 3 columns on desktop (>=1280px), 2 columns on tablet, 1 column with bottom nav on mobile (<768px).
```

---

### Phase 2 — Supabase SSR Auth, Session Engine & Role Gates
**Prompt Block for Manager / Subagent:**
```text
Task: Implement production-grade Supabase SSR Authentication and Session Management.
Scope:
1. Setup lib/supabase/server.ts and lib/supabase/client.ts using @supabase/ssr with cookie handlers.
2. Create middleware.ts to refresh session cookies on all requests and protect (app)/* and (admin)/* route groups.
3. Build Auth pages in app/(auth)/:
   - /login: Email + password & Google OAuth sign-in.
   - /register: Full name, username, email, password. Creates Supabase Auth user & triggers Prisma User record.
   - /verify-email: Informational screen for pending verification.
   - /forgot-password & /reset-password: Password recovery flow.
4. Implement lib/auth.ts (getCurrentUser, requireAuth, requireRole helpers).
5. Implement lib/authz.ts with complete permission assertions and ApiError handler.
6. Write Vitest unit tests for lib/authz.ts and Playwright E2E tests for login, register, and protected route redirection.

Acceptance Criteria:
- Unauthenticated access to /write or /settings immediately redirects to /login with ?next= return URL.
- Auth cookies are httpOnly, secure, sameSite: 'lax'. Zero token storage in localStorage.
- All test suites pass: npx vitest run and npx playwright test tests/auth.spec.ts.
```

---

### Phase 3 — Profiles, User Settings & Follow System
**Prompt Block for Manager / Subagent:**
```text
Task: Implement Developer Profiles, Avatar Uploads, and Follow Engine.
Scope:
1. Setup Supabase Storage bucket 'avatars' with public read and authenticated write RLS.
2. Create API routes:
   - GET /api/users/[username]: Fetch public profile, follower/following counts, published posts count.
   - PATCH /api/users/me: Update bio, website, github, name, avatarUrl (Zod validated).
   - POST /api/interactions/follow: Toggle follow user (followerId -> followingId) or follow topic.
3. Build UI screens:
   - app/(public)/profile/[username]/page.tsx: Hero banner, avatar, bio, metadata badges, follow button, tabs (Articles, Discussions, About). Honest empty state: "@username hasn't published anything yet."
   - app/(app)/settings/page.tsx: Edit profile form with live image cropper/uploader and account status view.
4. Use TanStack Query for optimistic follow/unfollow toggle with automatic cache invalidation.

Acceptance Criteria:
- Profiles display real 0 counts on empty profiles (0 followers, 0 following, 0 articles).
- Users can upload avatars up to 2MB (jpg/png/webp) and edit profile metadata.
- Non-logged-in users clicking "Follow" are redirected to login with redirect-back.
- Users cannot follow themselves (enforced in API and UI).
```

---

### Phase 4 — Editorial Post Publishing & Feed Pipeline
**Prompt Block for Manager / Subagent:**
```text
Task: Implement Article Editor, Draft Management, Feed Engine, and Article Detail Reader.
Scope:
1. Create Post editor in app/(app)/write/page.tsx:
   - Markdown / Rich editor with code block syntax highlighting, cover image URL, and topic multi-select (1–5 topics).
   - Auto-save draft functionality (local draft debounce or remote PATCH).
   - "Publish" action setting status: PUBLISHED, publishedAt: now(), calculating readingTime (words / 200). Block unverified users with verify-email alert.
2. Create Post API routes:
   - GET /api/posts: Cursor-paginated (feed=for-you|following|latest, topic=slug). Real DB query only.
   - POST /api/posts: Create draft or published post.
   - GET /api/posts/[slug]: Full post content with sanitized HTML (isomorphic-dompurify).
   - PATCH /api/posts/[slug]: Update post (assertAuthorized owner/admin).
   - DELETE /api/posts/[slug]: Delete post (assertAuthorized owner/admin).
3. Build Views with Honest Empty States:
   - app/(public)/page.tsx: Feed tabs (For You, Following, Latest). Empty states: "No posts yet. Be the first to publish something." (Global) and "You're not following anyone yet." (Following tab).
   - app/(public)/explore/page.tsx: Topic chips filter, Search bar, empty state: "No developers here yet — invite someone or be the first to publish."
   - app/(public)/post/[slug]/page.tsx: 720px reading width, Table of Contents, Code Blocks with Copy button, Sticky Interaction bar.

Acceptance Criteria:
- No hardcoded mock posts anywhere in code or UI.
- Slug auto-generation with collision-handling (e.g. title-slug-xyz).
- Drafts are invisible to everyone except the author and admin.
- Playwright test verifies draft creation -> publish -> appearance on feed.
```

---

### Phase 5 — Threaded Comments, Likes & Bookmarks
**Prompt Block for Manager / Subagent:**
```text
Task: Implement Nested Comments, Pinning, Idempotent Likes, and Bookmark Library.
Scope:
1. Implement Comment API:
   - GET /api/posts/[id]/comments: Retrieve threaded comments (ordered by pinned DESC, createdAt ASC).
   - POST /api/posts/[id]/comments: Add root comment or reply to parentId (max depth 2). Gated to verified active users.
   - PATCH /api/comments/[id]/pin: Article author can pin/unpin 1 top comment.
   - DELETE /api/comments/[id]: Author/admin can soft-delete (content replaced with "[deleted]").
2. Implement Interaction APIs:
   - POST /api/interactions/like: Toggle like on Post or Comment (optimistic update via React Query).
   - POST /api/interactions/save: Toggle bookmark on Post or Discussion.
   - GET /api/saves: List saved items for authenticated user.
3. Build UI:
   - Post comments thread component with reply box, like button, author badge, and pin badge. Empty state: "No comments yet. Start the conversation."
   - app/(app)/saved/page.tsx: Filter tabs (All, Articles, Discussions) with empty state: "No saved articles or discussions yet."

Acceptance Criteria:
- Zero fake comment fixtures.
- Nested comments indent cleanly up to depth 2 on both mobile and desktop.
- Liking/unliking is instant with zero screen flicker (optimistic cache mutation) and persists in PostgreSQL.
- Pinned comment always stays at the top of the discussion thread.
```

---

### Phase 6 — Community Discussions & Q&A
**Prompt Block for Manager / Subagent:**
```text
Task: Implement Community Forum, Threaded Discussions, and Solution Marking.
Scope:
1. Create Discussion APIs:
   - GET /api/discussions: Paginated list (filter by topic, sort by trending|latest).
   - POST /api/discussions: Create new discussion with topicId. Gated to verified active users.
   - GET /api/discussions/[id]: Thread detail with author and nested replies.
   - POST /api/discussions/[id]/replies: Add nested reply (depth 1 to 3 enforced by server).
   - PATCH /api/discussions/[id]/replies/[replyId]/solution: OP can mark one reply as accepted solution.
2. Build Views:
   - app/(app)/community/page.tsx: Topic filter sidebar, discussion list cards with reply count badge, "Start Discussion" button. Empty state: "No discussions started yet."
   - app/(app)/community/[id]/page.tsx: Thread header, original problem content, nested replies tree with "Mark as Solution" and "Accepted Solution" green banner.

Acceptance Criteria:
- Enforce max reply depth of 3: replies to depth 3 items are attached at depth 3 with @mention prefix.
- Only the original poster (OP) or moderator can mark/unmark an accepted solution.
```

---

### Phase 7 — Realtime Notifications System
**Prompt Block for Manager / Subagent:**
```text
Task: Implement Server-Side Notification Triggers and Supabase Realtime Subscription.
Scope:
1. Create notification trigger helper in lib/notifications.ts:
   - Inserts Notification row when: User gets liked, commented on, replied to, followed, or when a followed author publishes a post.
   - Deduplicates rapid duplicate notifications (e.g. rapid like/unlike).
2. Setup Supabase Realtime channel in lib/realtime.ts subscribing to notifications table for auth.uid().
3. Build UI components in components/nav/NotificationBell.tsx:
   - Real-time unread counter badge.
   - Dropdown preview of recent 5 notifications.
   - app/(app)/notifications/page.tsx: Full notification inbox with "Mark all as read" and filter tabs. Empty state: "You're all caught up."
4. Add live comment/like counter broadcast on open post pages using Supabase Realtime Broadcast.

Acceptance Criteria:
- Real Postgres CDC event streams to client; zero setInterval polling.
- Action in one browser window immediately updates the notification badge in another without full page reload.
- Notification bell unread count updates accurately and clears upon "Mark all as read".
```

---

### Phase 8 — Moderation Queue, Audit Logs & Admin Dashboard
**Prompt Block for Manager / Subagent:**
```text
Task: Implement Abuse Reporting, Moderator Workflow, Audit Logging, and Admin Dashboard.
Scope:
1. Create Reporting API & UI:
   - Report modal component on all Posts, Comments, Discussions, and Users.
   - POST /api/moderation/reports (Zod validated).
2. Create Admin & Mod Route Group app/(admin)/* protected by requireRole(MODERATOR | ADMIN):
   - app/(admin)/dashboard/page.tsx: KPI summary cards (Total Users, Posts Published, Active Discussions, Open Reports) calculated from real DB counts.
   - app/(admin)/reports/page.tsx: Queue of pending reports with quick actions (Dismiss, Remove Content, Suspend User).
   - app/(admin)/audit-logs/page.tsx: Read-only table of all admin/mod interventions.
3. Wire audit logging: Every moderation action writes an AuditLog entry with actorId, targetId, action, and timestamp.

Acceptance Criteria:
- Non-admin/mod users navigating to /admin/* receive a strict 404/403.
- Removing content updates isRemoved / status: REMOVED and hides content across public feeds immediately.
- AuditLog cannot be modified or deleted via any API endpoint.
```

---

### Phase 9 — Production Hardening, Security Sweeps & Performance Pass
**Prompt Block for Manager / Subagent:**
```text
Task: Execute Security Audit, IDOR Testing, Rate Limiting, Accessibility & Lighthouse Optimization.
Scope:
1. Security & IDOR Sweep:
   - Write Playwright security test suite tests/security.spec.ts: User A attempts to edit/delete User B's post, comment, and profile -> Assert 403 Forbidden.
   - Sanitize all markdown rendering via DOMPurify against XSS script injection.
2. Rate Limiting:
   - Add Upstash / memory rate-limiting on sensitive endpoints: /api/auth/* (5 req/min), /api/posts POST (10 req/hour), /api/comments POST (30 req/hour).
3. Accessibility & SEO:
   - Run a11y audit: Ensure all buttons have aria-label, all images have alt, keyboard Tab navigation works through dialogs and menus.
   - Add OpenGraph metadata tags, dynamic robots.txt, and sitemap.ts generation.
4. Performance & Zero-Mock Verification Pass:
   - Run automated scan asserting zero hardcoded mock names ("Marcus Chen", "Sarah Jenkins", placeholder Unsplash arrays).
   - Verify zero unpaginated SELECT * database queries.
   - Run Lighthouse audit asserting >=95 Performance, >=95 Accessibility, 100 SEO.

Acceptance Criteria:
- All automated security and IDOR tests pass.
- Zero TypeScript, ESLint, or runtime console errors.
- Production build (npm run build) executes cleanly and generates optimized static + SSR routes.
```

---

## 9. Execution Quick-Start Checklist

```bash
# 1. Initialize repository with template dependencies
npx create-next-app@latest commun-dev --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"

# 2. Setup database and ORM
npx prisma init
# (Paste Section 4 Prisma schema into prisma/schema.prisma)
npx prisma db push

# 3. Setup environment variables in .env.local
NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres"

# 4. Run development server
npm run dev
```
