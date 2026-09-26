# Commun — Project Memory & Architecture Log

## 1. Product Summary & Philosophy
- **Product**: **Commun**
- **Vision**: An authentic, Substack-inspired editorial developer publishing and community platform where engineers and students read, write, discover, discuss, and save high-signal technical content.
- **Design Philosophy**:
  - Dark-first editorial palette (`#090a0f` base, `#141720` surface, `#1f2330` border, `#f97316` warm orange accent).
  - Modern typography (`Geist` / `Inter` + `JetBrains Mono` code blocks).
  - Clean, flat, distraction-free information architecture (no excessive neon, no glassmorphism, no fake AI cards).
  - 3-column desktop layout (Left Nav, Center Feed/Reader, Right Discovery) collapsing seamlessly to mobile with a bottom navigation bar.

---

## 2. Complete Pages Index & Features

### 1. Home / Feed (`index.html`)
- **Left Navigation**: Logo, Home, Explore, Subscriptions, Community, Saved, Profile, Settings, Help, and primary "Create" CTA.
- **Center Area**: Quick composer ("What are you building or learning today?"), feed filter tabs (For You, Following, Latest), vertical editorial post items with authentic developer titles, excerpts, thumbnails, reading time, and interactive engagement controls (Like, Comment, Save).
- **Right Sidebar**: Search bar, topic chips (Backend, System Design, Docker, PostgreSQL, Spring Boot, Rust), writers to follow, community pulse.
- **Mobile Navigation**: Sticky bottom bar (Home, Explore, Create, Community, Profile).

### 2. Explore (`explore.html`)
- Search bar with instant topic filters (All, Backend, System Design, Frontend, DevOps, Cloud, AI & ML, PostgreSQL, Rust, Open Source).
- Featured Editorial hero spotlight.
- Popular writers and creator cards with quick follow actions.
- Curated collection reading lists ("The Staff Engineer Roadmap", "Zero to Kubernetes in Production", "Production Database Hardening").

### 3. Subscriptions (`subscriptions.html`)
- Following feed with author activity alerts ("NEW POST").
- Subscribed creator cards with latest published article previews and follow/unfollow toggle.
- Direct quick links to saved articles and reader views.

### 4. Community Discussions (`community.html`)
- Lightweight, high-signal developer forum with tabs (Trending, Latest, Showcase, Architecture & Q&A).
- "Start a Discussion" CTA.
- Thread previews with reply counts, view counts, and topic tags.

### 5. Discussion Detail View (`discussion.html`)
- Clean discussion reading experience with original post markdown, problem breakdown, and code snippets.
- Interactive reply composer with instant toast notifications.
- Chronological developer replies and advice from community peers.

### 6. Article Reader (`article.html`)
- Distraction-free reading width (720px) with large headline, author badge, reading time, and publication source.
- Formatted technical content: subheadings, code snippets (`ip link show`, `docker network create`), inline code, and bullet checklists.
- Sticky interaction header with Like, Save, and Share buttons.
- Right sidebar with automated Table of Contents and "More from author" recommendations.
- Author bio card with Follow button.

### 7. Creator Profile (`profile.html`)
- Public developer header: Avatar, Name, Handle (`@pradumnsaindane`), Bio, location, and follower counts.
- Action buttons: Share Profile, Edit Profile.
- Tabs: Articles, Discussions & Replies, About.
- Chronological list of published technical articles.

### 8. Saved Library (`saved.html`)
- Bookmarks management with filter tabs (All, Articles, Discussions).
- One-click access to saved technical articles and bookmarked threads.

### 9. Write & Publish (`write.html`)
- Minimalist, distraction-free technical writing interface.
- Top action bar with "Save Draft" and "Publish" CTAs.
- Full formatting toolbar (Headings, Bold, Italic, Code Blocks, Inline Code, Links, Lists, Quotes, Image upload).

---

## 3. Build & System Health
- **Bundler**: Vite 5 multi-page build (`vite.config.js`).
- **Dependencies**: Clean Vanilla CSS + modular JavaScript (`main.js`).
- **Build Status**: Production bundle generated with zero errors.
