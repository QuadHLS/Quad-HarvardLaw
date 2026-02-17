# QuadHLS

**Current Version:** v1.0  
**Status:** Active Development

QuadHLS is an integrated platform built to simplify life at Harvard Law School. It centralizes academic resources, campus communication, and student tools into one cohesive system.

In practice, outlines, exam materials, and course insights are often scattered across shared drives, spreadsheets, and group chats. QuadHLS brings these resources together in a structured, searchable platform—making it easier for students to stay organized, collaborate effectively, and preserve institutional knowledge across graduating classes.

---

## Features

### Academic Resources
- Upload and browse course outlines
- Search the exam bank by course or professor
- Read and submit structured course reviews
- Access bar preparation resources and a BigLaw guide

### Planning and Organization
- Integrated study planner
- Semester calendar
- Structured academic resource management

### Community and Communication
- Real-time campus feed
- Direct messaging
- Dedicated club spaces for announcements and discussions
- Student directory

### Additional Tools
- Quadle, a built-in word game for study breaks

---

## Purpose

QuadHLS was created to reduce fragmentation in the law school experience. By centralizing academic materials, increasing course transparency, and preserving shared knowledge across classes, the platform strengthens both individual performance and community collaboration.

---

## Security

- Row Level Security (RLS) enforced at the database layer
- Authenticated access via Supabase Auth
- Role-based permissions for content submission and moderation
- Real-time subscriptions scoped per authenticated user
- Strict data isolation between users and organizations

---

## Architecture Overview

QuadHLS is built using a modern, scalable full-stack architecture:

- **Client:** React + TypeScript (Vite single-page application)
- **Backend:** Supabase (Postgres, Auth, Realtime, Storage)
- **Database:** PostgreSQL with Row Level Security (RLS)
- **Deployment:** Vercel with CI/CD from main

The system uses a modular component architecture, strongly typed APIs, and database-enforced access controls to ensure maintainability, security, and long-term scalability.

---

## Contributions

This repository is not open for external contributions.

For partnership, collaboration, or licensing inquiries, please contact the repository owner.
