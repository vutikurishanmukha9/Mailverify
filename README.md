# MailVerify — Enterprise Email Verification & Deliverability Platform

A high-precision, developer-grade email deliverability and verification platform designed with a focused, dark-only enterprise design system.

## 🚀 Features

- **Single Email Verification**: 8-point RFC 5322 syntax, DNS MX records, SMTP handshake simulation, disposable mailbox detection, role-based account classification, and spam trap filtering with raw diagnostic inspection.
- **Bulk Verification Pipeline**: High-throughput list verification supporting CSV/TXT file upload with column auto-discovery, Google Sheets synchronization, and manual contact list paste.
- **Platform Integrations**: Native integrations for cold outreach platforms (ReachInbox, Instantly.ai, Smartlead.ai) and Google Sheets.
- **Developer API & Sandbox**: Scoped API key lifecycle management (full access, verify only, read only), secret masking, and interactive multi-language code snippets (cURL, Node.js/TypeScript, Python, Go).
- **Stripe-Inspired Credit Ledger**: Real-time balance deduction, transparent add-on credit packages, and full historical usage audit trail.
- **Enterprise Settings & Telemetry**: Profile management, 2FA security controls, job notification webhooks, live system uptime telemetry, and searchable technical documentation.

## 🛠 Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **Icons**: Lucide React
- **Typography**: Inter & JetBrains Mono (tabular numerals)
- **Deployment**: Vercel configuration (`vercel.json`) with SPA routing rewrites

## 📦 Getting Started

### Local Development

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Production Build

```bash
cd frontend
npm run build
```

## 🌐 Deploy to Vercel

### Option 1: Automatic (Default Root)
The repository includes a root `vercel.json` configured to build `frontend/` automatically.
- Import the repository in [Vercel](https://vercel.com) and click **Deploy**.

### Option 2: Root Directory Set to `frontend`
In the Vercel project import settings:
- Set **Root Directory** to `frontend`
- Build Command: `npm run build`
- Output Directory: `dist`
- Click **Deploy**.
