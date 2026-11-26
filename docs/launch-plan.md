# Jobora AI: Launch and Marketing Plan

*Prepared November 2026. Updates the earlier competitor research and 90-day plan (docs/marketing-plan.md in the old folder).*

---

## 1. Bottom line

Launch Jobora as **the honest, free AI career copilot for the UAE, GCC and India**, starting on one campus you already belong to (UOWD), then expanding to other Dubai universities, then to communities and Product Hunt. Grow with free channels first: the free CV checker, campus careers departments, founder content and job-seeker communities. No paid ads until at least 40% of new sign-ups reach their first fit report.

**Positioning statement**

> For students and early-career job seekers in the UAE, GCC and India, Jobora is a free AI career copilot that finds live jobs from employers' own career pages, shows a fit score you can check, writes CVs and letters only from your real experience, and explains Gulf visas and graduate programmes in English and Arabic. Unlike auto-apply bots, nothing is ever sent without your approval.

Three words to own: **Honest. Regional. Free.**

---

## 2. Audience, in launch order

| Order | Segment | Why them first | Main hook |
|---|---|---|---|
| 1 | **UOWD students and recent graduates** | You are one of them; the careers department is a trusted channel; Dubai is the core market | Free CV check, internships and graduate roles in the UAE, application tracker |
| 2 | Students at other Dubai and Abu Dhabi universities (AUD, Middlesex Dubai, Heriot-Watt Dubai, BITS Dubai, Amity Dubai, Manipal Dubai, Zayed, AUS, Khalifa) | Same need, same city, reachable through careers offices and student societies | Same as above, plus GCC guide |
| 3 | Indian and Egyptian professionals targeting Gulf jobs | Large, active online communities; the GCC guide is a strong hook | Live Gulf roles, visa basics with official links |
| 4 | Arabic-first job seekers | Very few competitors offer Arabic | Arabic interface |
| 5 (later) | University careers centres as partners (B2B) | Scales once students use it | Cohort use, workshop materials |

---

## 3. Launch phases (Product Hunt-style "ORB" approach)

**Owned** channels (site, CV checker, LinkedIn, email list) build an audience you control. **Rented** channels (LinkedIn, Instagram, Reddit) bring reach. **Borrowed** channels (careers departments, student societies, press, influencers) lend trust.

### Phase 0: Ready (week 0, before telling anyone)
| Task | Owner | Status |
|---|---|---|
| Rotate the leaked Supabase secret and Gemini key | You | **Open: blocker** |
| Take a database backup | You | **Open: blocker** |
| Sign up as admin and check /admin | You | Open |
| Free CV checker live at /cv-check | Built | Done |
| Funnel analytics on /admin | Built | Done |
| Record a 30–60 second tour video (screen recording + voice) | You | Open |
| Test sign-up, CV upload, job search and tracker on a phone | You | Open |

### Phase 1: Private beta at UOWD (weeks 1–2)
- Ask 15–25 classmates and society members to use it for a week. Watch 3–5 of them use it in person and note where they get stuck.
- Collect 5 honest quotes (with permission) for the landing page and the careers department.
- Email the UOWD careers department (draft in section 7). Ask for: a slot in their newsletter or portal, a 45-minute workshop, and feedback.
- Fix the top 3 problems you see.

### Phase 2: Campus launch at UOWD (weeks 3–4)
- **Workshop:** "Get your CV past the ATS in 45 minutes": students run /cv-check live, fix their CV, then track their first 3 applications.
- Student societies: IT, business, engineering and the Indian, Pakistani and Arab student societies. Offer the same workshop.
- Posters and table-tents with a QR code to `jobora.vercel.app/cv-check`.
- Track sign-ups from campus. Use `?from=uowd` on campus links so the admin page shows them by source.

### Phase 3: Dubai universities (weeks 5–8)
- Use the UOWD workshop results (number of CVs checked and improved) as proof when emailing other careers offices.
- Recruit 1–2 student ambassadors per university; give each a personal link (`?from=ambassador-name`).
- Target 5 workshops across 3–5 universities.

### Phase 4: Public launch (weeks 8–10)
- **Product Hunt** on a Tuesday–Thursday at 12:01 am Pacific (11:01 am Dubai). Prepare the gallery images, tour video, first comment and a list of supporters a week before.
- Same week: LinkedIn launch post, Reddit posts (r/dubai, r/UAE, r/developersIndia, r/cscareerquestionsMENA: follow each community's rules, share the free tool rather than an ad), Hacker News "Show HN" for the honest, no-auto-apply angle.
- Regional press pitch: Wamda, Gulf News, Khaleej Times education pages, Arabian Business startups.

### Phase 5: Keep going (weeks 10+)
- Weekly "New jobs and internships in the UAE" post, built from Jobora's live data.
- A referral link inside the app ("Invite a friend").
- Monthly public update: what shipped, numbers, what is next.

---

## 4. Channels and weekly rhythm

| Channel | Cadence | Content |
|---|---|---|
| LinkedIn (your personal account) | 3 posts a week | Build-in-public story as a UOWD student; CV teardowns (with permission); "this week's internships in Dubai" from Jobora's data; visa tips with official links |
| Instagram Reels / TikTok / YouTube Shorts | 2 a week | 30-second screen recordings: "I checked my CV against ATS software", "find internships in Dubai in 60 seconds" |
| Communities (Reddit, Discord, WhatsApp and Telegram job groups) | 2–3 helpful replies a week | Answer real questions; link the free CV checker only when it helps |
| Careers departments and societies | 2 new contacts a week | Workshop offer (see section 7) |
| Search (later) | 2 pages a week | Public pages such as "Graduate jobs in Dubai", "Internships in UAE for students", "How to get a UAE work visa as a fresh graduate" |

---

## 5. Messaging

| Audience | Headline | Supporting line |
|---|---|---|
| Students | "Can hiring software read your CV? Check it free." | Then find internships and graduate jobs in the UAE and track every application in one place. |
| Careers departments | "A free tool that helps your students apply better, not more." | ATS-ready CVs, honest fit scores, and nothing sent without the student's approval. |
| Professionals moving to the Gulf | "Live Gulf jobs, plus the visa basics, in one place." | Roles from employers' own career pages, with links to official visa sources. |

**Proof points you can say truthfully today:**
- Free.
- Jobs come from employers' own career pages (about 40 boards) and are refreshed daily.
- CVs and letters are built only from what the user enters, and nothing is sent without approval.
- The free CV check stores nothing.
- Available in English and Arabic.

**Do not say** (until true): user counts, success rates, "AI that gets you hired", or any partnership that is not signed.

---

## 6. Metrics and targets

**North Star:** weekly activated users, meaning people who ran a fit report or CV check **and** tracked at least one application that week.

| Stage | Measure (on /admin) | First target (reset after 2 weeks of data) |
|---|---|---|
| Reach | Free CV checks | 300 in the first month |
| Conversion | "Create account" clicks ÷ CV checks | 15% |
| Sign-up | Sign-ups, by source | 150 in the first month |
| Activation | Profile ready ÷ accounts | 50% |
| Engagement | Tracking at least one application ÷ accounts | 30% |
| Campus proof | Workshops delivered | 1 at UOWD by week 4, 5 by week 8 |

These are starting guesses, not forecasts.

---

## 7. Cold email: UOWD careers department

**Before sending:**
- Find the right contact on UOWD's student portal or website (usually Careers and Alumni Services, or the Student Experience team).
- Fill in the bracketed parts.
- Send from your UOWD student email.

**Subject:** A free CV and job-search tool built by a UOWD student

Dear [Name],

I'm [Your name], a [year / programme] student at UOWD. I've built Jobora, a free career tool for students looking for internships and graduate jobs in the UAE, and I'd value your team's view on whether it could help other students.

Students can:

- **Check their CV for free, with no account** at jobora.vercel.app/cv-check. It shows whether applicant tracking software can read the CV and which job keywords are missing, and the CV is not stored.
- **Find live internships and graduate roles** in the UAE, the wider GCC and India, taken from employers' own career pages and refreshed daily.
- **Track every application** with deadlines, interview dates and follow-up reminders, and practise interviews with feedback.

CVs and cover letters are written only from what the student enters, and nothing is ever sent to an employer without their approval.

Would you be open to a 15-minute call or meeting so I can show you how it works? If it looks useful, I'd be glad to run a free 45-minute "Get your CV past the ATS" session for students, or to share it in a careers newsletter, whichever suits your team.

Thank you for your time.

Kind regards,
[Your name]
[Programme, year] · UOWD student ID [optional]
[Phone] · [LinkedIn]

**Follow-up (5 working days later, same thread):**

> Dear [Name], I wanted to follow up briefly on Jobora. If a session isn't possible this term, I'd still be grateful for any feedback on the free CV check (jobora.vercel.app/cv-check). Thank you. [Your name]

**One-line version for a WhatsApp group or society chat:**

> Built a free tool as a UOWD student: check if ATS software can read your CV (no sign-up, nothing stored) → jobora.vercel.app/cv-check?from=uowd

---

## 8. Next skills to use
- `/launch-strategy` for the Product Hunt day plan in detail (week 6).
- `/social-content` for the first 12 LinkedIn posts.
- `/programmatic-seo` for the public "jobs in Dubai" pages.
- `/cold-email` again for the other universities' careers offices, once UOWD gives you a result to point to.
