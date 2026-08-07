# QuadHLS

[Live site](https://www.quadhls.com) · [Justin Li on LinkedIn](https://www.linkedin.com/in/justinjunzeli)

QuadHLS is an independent, authentication-gated academic resource and community platform for Harvard Law students. It launched during the week of November 17, 2025, ahead of Harvard Law School's Thanksgiving Recess (November 26-28). QuadHLS is not owned, sponsored, commissioned, or endorsed by Harvard University or Harvard Law School.

This public repository preserves the primary feature-development record through February 18, 2026. Later production snapshots document continued usage and availability.

## Verified Product Scale

- **716 registered accounts by November 23, 2025.** This is a dated registration count, not a claim about active, unique, or currently enrolled students.
- **842 accounts matched configured Harvard Law JD/LLM cohort domains as of July 17, 2026.**
- **7,903 indexed academic documents across 117 course labels.** The corpus contains 5,099 outlines and 2,804 exams. Partners acquired and organized legacy student-shared material, while the product also accepted new submissions; Justin integrated the corpus into the searchable catalog and preview/download workflows. This is a centralized corpus metric, not a user-upload count.
- **20,881 document preview/download interactions from 220 conservatively filtered users** between December 11, 2025, and July 13, 2026, after removing nine test/service accounts explicitly excluded in the application source.
- **5,367 course relationships across 750 completed profiles.** These are product onboarding relationships, not official school enrollment records.

The figures above come from dated aggregate production snapshots and code-defined filters. No private user-level data is published in this repository.

## Role and Collaboration

Justin Li served as **Co-Creator and Primary Engineer**, leading the large majority of the implementation across authentication, onboarding, resources, data modeling, feeds, integrations, performance work, and deployment. Nick made early contributions to the Supabase data foundation and architectural planning. Jesus Sanchez Peguero contributed targeted interface edits to messaging and calendar workflows. Other collaborators contributed product and domain input.

## Product Scope

The current source includes:

- Account authentication, onboarding, profiles, and a student directory
- Searchable outline and exam collections with PDF/DOCX preview and download workflows
- Course reviews, registration planning, and course-scoped context
- Campus and course feeds with posts, polls, comments, and reactions
- Bar-review resources, a Big Law guide, and the Quadle word game

Messaging, calendar integrations, and club spaces remain available through direct routes but are no longer featured in primary navigation.

## Architecture

![QuadHLS source architecture](docs/quad-hls-architecture.svg)

The diagram summarizes the implementation visible in this repository.

- **Client:** React 18, TypeScript, Vite, TanStack Query, and Radix UI
- **Backend:** Supabase Auth, PostgreSQL, Realtime, Storage, database functions/triggers, and Edge Functions
- **Deployment configuration:** Vercel SPA and serverless API configuration
- **Resource access:** private Storage buckets, signed URLs, Row Level Security policies, and feature-specific membership checks
- **Performance design:** lazy routes, manual chunking, paginated data access, selective query persistence, and deferred loading

## Local Setup

Use Node.js 20 or another runtime supported by the dependencies.

```bash
npm ci
```

Copy `.env.example` to `.env.local`, then provide a Supabase project URL and public anonymous key:

```dotenv
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Run the development server:

```bash
npm run dev
```

Create a production bundle:

```bash
npm run build
```

The bundle can be built without backend credentials. Functional authentication and data workflows require a compatible Supabase backend.

## License and Contributions

This source is publicly available for portfolio and evaluation under the repository's proprietary [LICENSE](LICENSE). External contributions are not currently accepted.
