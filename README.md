# 🏦 Gram Nidhi — Village Loan Management System

A transparent, online village lending/chit-fund management system built with Next.js 14 + Supabase + Tailwind CSS.

## Features

### Admin (Head of Group)
- ✅ Add/manage investor members with profile photos
- ✅ Record contributions (fixed or variable per member)
- ✅ Issue loans to group members or outsiders (with guarantor)
- ✅ Record repayments anytime, mark loans as settled
- ✅ Year-end profit distribution to investors
- ✅ Full dashboard with pool balance, active loans, repayments

### Investors (Members)
- ✅ Login and view personal dashboard
- ✅ See total pool balance and all active loans
- ✅ See which loans they are guarantor for
- ✅ View their own contribution & distribution history
- ✅ Upload profile photo
- ✅ **Print statement** as PDF

### Interest Calculation
- Calendar Year Compounding (same as https://investment-calculator-one-rouge.vercel.app/calculator)
- Monthly interest rate × principal, compounded at year end
- Built-in calculator on the Loans page

---

## Setup

### Step 1 — Install Node.js (if not installed)
Download from https://nodejs.org (LTS version)

### Step 2 — Run Setup Script
```bash
node setup.js
```
This will:
- Create all database tables in Supabase
- Create your admin account (amit.gangaur@gmail.com)
- Show next steps

### Step 3 — Push to GitHub
```bash
git add .
git commit -m "Gram Nidhi — initial commit"
git push origin main
```

### Step 4 — Deploy on Vercel
1. Go to https://vercel.com → **New Project**
2. Import `village-loan-system` from GitHub
3. Add **Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL` = `https://risiadudlqtfatpaapov.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJpc2lhZHVkbHF0ZmF0cGFhcG92Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMDg3MjAsImV4cCI6MjA4OTU4NDcyMH0.1OfKm3IFmVrrImHsCXyx8U7Nvo2C15SgmtwGQ2npkTo`
4. Click **Deploy** 🎉

---

## Admin Login
- **Email:** amit.gangaur@gmail.com  
- **Password:** bikashamit

---

## Tech Stack
- **Frontend:** Next.js 14 (App Router) + TypeScript
- **Styling:** Tailwind CSS + Playfair Display font
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Deployment:** Vercel (auto-deploy on every GitHub push)
