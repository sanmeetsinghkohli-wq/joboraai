# Jobora AI — The Intelligent AI Career Copilot

<div align="center">

**Land Your Dream Job Faster with Autonomous AI Career Intelligence**

[![Live Demo](https://img.shields.io/badge/Live_Production-jobora.vercel.app-3525cd?style=for-the-badge&logo=vercel&logoColor=white)](https://jobora.vercel.app)
[![Next.js 14](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)

[**Explore Live App →**](https://jobora.vercel.app) · [**Dashboard**](https://jobora.vercel.app/dashboard) · [**Job Search**](https://jobora.vercel.app/jobs) · [**CV Studio**](https://jobora.vercel.app/cv-studio)

</div>

---

## Overview

**Jobora AI** is an all-in-one AI Career Copilot built for modern candidates. Instead of juggling spreadsheets, generic resume templates, and dozens of job boards, Jobora unifies **live global job discovery**, **AI-powered CV optimization**, **automated application tracking**, **personalized recruiter outreach**, **AI mock interview coaching**, and **real-time market salary intelligence** into a single cohesive platform.

Designed with the **Atmospheric Minimalism & High-Craft UI** system (`Plus Jakarta Sans` + `Inter`, deep indigo `#3525cd` accents, and glassmorphic surfaces), every workflow is engineered for clarity, speed, and measurable career outcomes.

---

## Core Features

### 1. Multi-Step AI Copilot Onboarding (`/onboarding`)
- **5-Step Guided Setup:** Captures Personal Profile, Role & Work-Mode Preferences (`Remote`, `Hybrid`, `On-Site`), Education & Core Skills, and Resume Upload.
- **Instant Resume Parsing & Extracted Insights:** Upload `.PDF`, `.DOCX`, or `.TXT` resumes to automatically extract skills, experience timeline, and profile readiness scores in real time.

### 2. Command Center Dashboard (`/dashboard`)
- **Live Career Telemetry:** Tracks Profile Readiness, Jobs Matched, Applications Submitted, and Upcoming Interviews at a glance.
- **High-Match Job Feed:** Surfaces live roles ranked by personalized AI match percentage based on your target role, skills, and location preferences.
- **Application Pipeline Velocity:** Visualizes your active applications from *Saved* and *Applied* through *Interview* and *Offer*.

### 3. Master-Detail Live Job Discovery (`/jobs`)
- **Real-Time Global Job Aggregation:** Fetches live openings from Remotive and Arbetsförmedlingen APIs alongside curated high-growth tech roles.
- **Split-Pane Master-Detail Explorer:** Browse filterable job cards on the left while inspecting full role requirements, AI skill-match breakdowns, compensation bands, and direct application links on the right.
- **Smart Filtering:** Filter by search query, location, work arrangement (`Remote`, `Hybrid`, `On-Site`), and high-match threshold (`85%+`).

### 4. AI CV Studio & ATS Optimizer (`/cv-studio`)
- **Interactive Live Resume Canvas:** Edit your professional summary, work experience, education, and skills with live A4 print-ready previewing.
- **AI Bullet Enhancer:** One-click AI rewriting to transform passive duties into high-impact, metric-driven executive achievements.
- **Real-Time ATS Score & Keyword Gap Analysis:** Evaluates your CV against target job descriptions and highlights missing technical and leadership keywords.
- **Instant PDF Export:** Export clean, ATS-compliant resumes directly from the browser.

### 5. Application Tracker & Pipeline CRM (`/applications`)
- **Kanban & Table Views:** Manage every job application across `Saved`, `Applied`, `Interviewing`, `Offer`, and `Rejected` stages.
- **Live Status Toggling:** Move candidates between pipeline stages with instant persistence and conversion analytics.
- **AI Next-Step Recommendations:** Contextual follow-up prompts and interview prep triggers for active applications.

### 6. AI Application Email & Cover Letter Composer (`/email-composer` & `/cover-letters`)
- **Context-Aware Outreach Generation:** Generates tailored recruiter cold emails, hiring manager follow-ups, and role-specific cover letters grounded in your real CV and the target company.
- **Tone & Length Controls:** Switch seamlessly between *Executive*, *Confident*, *Warm*, and *Concise* tones before copying or sending.

### 7. AI Interview Preparation Coach (`/interview`)
- **Role-Specific Mock Interviews:** Practice Behavioral (`STAR` method), System Design, Technical, and Leadership questions tailored to your target role.
- **Interactive Answer Evaluation:** Submit written or spoken responses and receive structured AI feedback on clarity, impact metrics, and executive presence.

### 8. Career Insights & Market Alignment (`/career-insights`)
- **Compensation Benchmarks:** Compare your target salary expectations against real-time 25th, 50th, and 90th percentile market bands.
- **Skill Demand Matrix:** Identifies high-leverage skills to acquire for maximum salary and match-rate lift.

### 9. Mailbox & Calendar Integrations (`/settings/integrations`)
- **Automated Inbox Sync:** Connect Gmail, Outlook, LinkedIn, and Google Calendar to automatically detect recruiter replies, interview invites, and status changes.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | Next.js 14.2 (App Router, React 18, Server & Client Components) |
| **Language** | TypeScript 5 |
| **Styling & Design System** | Tailwind CSS, Google Stitch Design System (`Plus Jakarta Sans`, `Inter`, `Material Symbols Outlined`) |
| **State & Persistence** | React Context (`AppDataContext`) with local storage + REST API synchronization |
| **Authentication** | JWT Cookie Session Auth (`/api/auth/signup`, `/api/auth/login`, `/api/auth/me`) |
| **Live Job Feeds** | Remotive API + Arbetsförmedlingen JobTech API (`/api/jobs`) |
| **Deployment** | Vercel Production (`https://jobora.vercel.app`) |

---

## Project Structure

```text
jobora/
├── apps/
│   └── web/
│       ├── src/
│       │   ├── app/
│       │   │   ├── page.tsx                  # Landing Page
│       │   │   ├── auth/                     # Sign In / Sign Up Portal
│       │   │   ├── verify-email/             # Email Verification Flow
│       │   │   ├── onboarding/               # 5-Step AI Copilot Setup Wizard
│       │   │   ├── dashboard/                # Career Command Center
│       │   │   ├── jobs/                     # Master-Detail Live Job Search
│       │   │   ├── cv-studio/                # Interactive AI Resume Builder & ATS Scorer
│       │   │   ├── applications/             # Application Pipeline CRM
│       │   │   ├── email-composer/           # AI Recruiter Outreach Composer
│       │   │   ├── cover-letters/            # AI Cover Letter Generator
│       │   │   ├── interview/                # AI Mock Interview Studio
│       │   │   ├── career-insights/          # Market & Compensation Intelligence
│       │   │   ├── saved-jobs/               # Bookmarked Roles
│       │   │   ├── documents/                # Resume & Document Vault
│       │   │   ├── settings/                 # Account & Mailbox Integrations
│       │   │   └── api/                      # Next.js Route Handlers (Auth, Jobs, Onboarding, Resumes)
│       │   ├── components/
│       │   │   └── StitchShell.tsx           # Unified Application Sidebar & Top Navigation Shell
│       │   └── context/
│       │       └── AppDataContext.tsx        # Real-time User Profile, Jobs, CV & Applications Store
├── packages/                                 # Shared workspace packages (DB, AI, Config)
├── vercel.json                               # Vercel build configuration
└── package.json                              # Monorepo root configuration
```

---

## Getting Started Locally

### Prerequisites
- **Node.js** `>= 18.17.0`
- **npm** `>= 9.0.0`

### 1. Clone the repository
```bash
git clone https://github.com/sanmeetsinghkohli-wq/joboraai.git
cd joboraai
```

### 2. Install dependencies
```bash
npm install
```

### 3. Start the development server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Production build
```bash
npm run build
```

---

## Live Deployment

The production application is deployed on Vercel:
- **Production URL:** [https://jobora.vercel.app](https://jobora.vercel.app)

---

## License

Copyright © 2026 Jobora AI. All rights reserved.
