# 🏢 SocietyOS

A production-grade Housing Society (RWA) Management Platform
built for India. Manages billing, complaints, notices, and more.

## 🔗 Live Demo

**[https://societyos.vercel.app](https://societyos.vercel.app)**

### Test Credentials

| Role      | Email                   | Access          |
| --------- | ----------------------- | --------------- |
| Treasurer | mananisharad1@gmail.com | Full committee  |
| Resident  | mananisharad1@gmail.com | Resident portal |

> OTP sent to email — no password needed

---

## 🛠️ Tech Stack

### Frontend

- **Next.js 15** — App Router + Server Components
- **TypeScript** — Full type safety
- **Tailwind CSS** — Utility-first styling
- **Shadcn/ui** — Accessible component library
- **Recharts** — Dashboard analytics charts

### Backend

- **Next.js API Routes** — REST API
- **Prisma ORM** — Type-safe database queries
- **Zod** — Runtime input validation
- **Jose** — JWT token management

### Infrastructure

- **Supabase** — PostgreSQL database
- **Upstash Redis** — Rate limiting + OTP cache
- **Resend** — Transactional email (OTP)
- **Vercel** — Deployment + CDN

---

## ✨ Features

### 🔐 Authentication

- Passwordless OTP login via email
- JWT access tokens (15 min) + Refresh tokens (7 days)
- HttpOnly secure cookies
- Rate limiting (3 OTPs/hour per email)

### 👥 Multi-Tenant Architecture

- Single database, multiple societies
- Complete data isolation via society_id
- Row-level security enforcement

### 💰 Maintenance Billing

- Auto-generate monthly bills for all flats
- Track payment status (Pending/Paid/Overdue)
- Mark payments as confirmed
- Late fee tracking

### 📢 Complaint Management

- Raise complaints with priority levels
- Status flow: Open → Assigned → In Progress → Resolved
- Committee assignment and tracking
- SLA monitoring

### 📋 Notice Board

- Post categorized society notices
- Pin urgent announcements
- Search and filter notices
- Read tracking

### 💼 Fund Transparency

- Record all society expenses
- Category breakdown with charts
- Approval workflow (Treasurer → President)
- Full audit trail

### 🔒 Security

- Role-based access control (5 roles)
- API rate limiting
- SQL injection prevention (Prisma)
- XSS protection headers
- Audit logging for all actions

---

## 🏗️ Architecture

\`\`\`
┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Next.js │────▶│ Supabase │ │ Upstash │
│ (Vercel) │ │ PostgreSQL │ │ Redis │
│ │ │ │ │ │
│ Frontend │ │ 18 Tables │ │ Rate Limit │
│ API Routes │ │ Multi- │ │ OTP Cache │
│ Middleware │ │ Tenant │ │ │
└─────────────┘ └─────────────┘ └─────────────┘
│
▼
┌─────────────┐
│ Resend │
│ Email │
│ Service │
└─────────────┘
\`\`\`

---

## 🚀 Local Setup

\`\`\`bash

# Clone repository

git clone https://github.com/mananisharad/societyos
cd societyos

# Install dependencies

pnpm install

# Setup environment variables

cp .env.production.example .env.local

# Fill in your values

# Push database schema

npx prisma db push

# Seed sample data

npx prisma db seed

# Start development server

pnpm dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000)

---

## 📁 Project Structure

\`\`\`
src/
├── app/
│ ├── (auth)/ # Login + OTP pages
│ ├── (dashboard)/ # Protected dashboard pages
│ │ ├── resident/ # Resident portal
│ │ └── committee/ # Committee portal
│ └── api/ # REST API routes
├── components/
│ ├── ui/ # Shadcn components
│ └── shared/ # Reusable components
├── lib/ # Core utilities
├── hooks/ # Custom React hooks
├── types/ # TypeScript definitions
└── constants/ # App configuration
\`\`\`

---

## 👨‍💻 Built By

**Sharad Manani**
Cybersecurity Engineering Student — SAKEC

[![GitHub](https://img.shields.io/badge/GitHub-mananisharad-black)](https://github.com/mananisharad)

---

_Built as a portfolio project demonstrating full-stack SaaS development_
