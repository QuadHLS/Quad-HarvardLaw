# QuadHLS

**Current version:** v1.0

QuadHLS is an integrated digital platform designed for Harvard Law School students. It brings together academic resources, campus communication, and student life tools into a single, centralized system.

Law school information is often fragmented across shared drives, spreadsheets, and group chats. QuadHLS consolidates these resources into one platform to make it easier for students to stay organized, collaborate effectively, and access institutional knowledge.

---

## Features

### Academic Resources
- Upload and browse course outlines
- Search the exam bank by course or professor
- Read and submit course reviews
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

### Additional Features
- Quadle, a built-in word game for study breaks

---

## Purpose

QuadHLS was built to simplify the law school experience by centralizing academic materials, improving transparency across courses, and strengthening student connectivity within the community.

---

## Security

- Row Level Security (RLS) enforced at the database layer
- Authenticated access via Supabase Auth
- Role-based permissions for content submission and moderation
- Real-time subscriptions scoped per user/session

---

## Architecture Overview

QuadHLS is built using a modern full-stack architecture:

- **Client:** React + TypeScript (Vite SPA)
- **Backend:** Supabase (Postgres, Auth, Realtime, Storage)
- **Database:** PostgreSQL with Row Level Security (RLS)
- **Deployment:** Vercel (CI/CD from main)

The app uses a modular component structure, typed APIs, and strict database access controls.

---

## Contributions

This repository is not open for external contributions. For partnership or collaboration inquiries, contact the repository owner.
