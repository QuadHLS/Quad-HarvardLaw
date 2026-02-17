# QuadHLS

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

## Architecture Overview

QuadHLS is built using a modern full-stack architecture:

- Client: React + TypeScript (SPA)
- Backend: Supabase (Postgres, Auth, Realtime, Storage)
- Database: PostgreSQL with Row Level Security (RLS)
- Realtime: Supabase Realtime subscriptions
- Deployment: Vercel (CI/CD connected to main branch)

The application uses a modular component architecture with typed APIs and
strict database access controls.

