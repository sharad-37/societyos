<div align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" />
  <img src="https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript" />
  <img src="https://img.shields.io/badge/Supabase-PostgreSQL-green?style=for-the-badge&logo=supabase" />
  <img src="https://img.shields.io/badge/Deployed-Vercel-black?style=for-the-badge&logo=vercel" />
</div>

<br />

<div align="center">
  <h1>🏢 SocietyOS</h1>
  <p><strong>Premium Housing Society Management Platform for India</strong></p>
  <p>A production-grade multi-tenant SaaS built with Next.js 15, TypeScript, and PostgreSQL</p>

  <br />

  <a href="https://societyos.vercel.app">
    <img src="https://img.shields.io/badge/🌐 Live Demo-societyos.vercel.app-blue?style=for-the-badge" />
  </a>
</div>

---

## 📸 Screenshots

| Landing Page     | Dashboard        | Mobile            |
| ---------------- | ---------------- | ----------------- |
| Apple-style hero | Analytics charts | Bottom navigation |

---

## ✨ Features

### 🔐 Security First

- **Passwordless OTP login** — no passwords stored
- **JWT tokens** — 15min access + 7day refresh
- **HttpOnly cookies** — XSS prevention
- **Rate limiting** — Redis-based (3 OTPs/hour)
- **SHA-256 vote hashing** — tamper-evident voting
- **RBAC** — 5 roles, 20+ granular permissions
- **Full audit trail** — every action logged

### 💰 Billing System

- Auto-generate monthly maintenance bills
- Track payment status (Pending/Paid/Overdue)
- Late fee calculation
- PDF report export
- Mark bills as paid/overdue

### 📢 Complaint Management

- Raise complaints with priority levels
- Status flow: Open → Assigned → In Progress → Resolved
- SLA breach tracking
- Committee assignment workflow

### 📋 Notice Board

- Post categorized notices (7 categories)
- Pin urgent announcements
- Read tracking with view count
- Expiry dates for time-sensitive notices

### 🗳️ Digital Voting

- One-flat-one-vote enforcement
- Anonymous voting option
- SHA-256 tamper-evident hashing
- Real-time vote progress display

### 👥 Visitor Management

- Generate OTP guest passes
- Time-limited (2h to 72h)
- Guard verification system
- Entry/exit audit trail

### 💼 Fund Transparency

- Complete expense ledger
- Category-wise breakdown
- Approval workflow (Treasurer → President)
- Resident read-only access

### 📊 Analytics Dashboard

- Collection rate radial gauge
- 6-month area chart
- Expense pie chart
- Complaint category breakdown

---

## 🛠️ Tech Stack

### Frontend

| Technology      | Version | Purpose              |
| --------------- | ------- | -------------------- |
| Next.js         | 15.x    | Full-stack framework |
| TypeScript      | 5.x     | Type safety          |
| Tailwind CSS    | 3.x     | Styling              |
| Shadcn/ui       | Latest  | Base components      |
| Recharts        | 2.x     | Analytics charts     |
| Lucide React    | Latest  | Icons                |
| React Hot Toast | Latest  | Notifications        |

### Backend

| Technology         | Version | Purpose          |
| ------------------ | ------- | ---------------- |
| Next.js API Routes | 15.x    | REST API         |
| Prisma ORM         | 6.x     | Database queries |
| Zod                | 3.x     | Input validation |
| Jose               | 5.x     | JWT management   |
| jsPDF              | Latest  | PDF generation   |

### Infrastructure

| Service  | Plan | Purpose             |
| -------- | ---- | ------------------- |
| Supabase | Free | PostgreSQL + Auth   |
| Upstash  | Free | Redis rate limiting |
| Resend   | Free | OTP emails          |
| Vercel   | Free | Deployment + CDN    |

---

## 🏗️ Architecture
