# Lawzunction — Corporate Law Portal & Case Management Platform

![React 19](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-20.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-4.21-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose_ODM-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.0-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-Clean_0_Errors-4B32C3?style=for-the-badge&logo=eslint&logoColor=white)

**Lawzunction** is a corporate law portal and case management platform built on the **MERN Stack** (MongoDB, Express.js, React 19, Node.js). It seamlessly integrates a public legal portal for client consultations, practice area showcases, advocate profiles, and legal insights with an internal client portal for case progress tracking, document management, and communication with counsel.

---

## 🚀 Key Feature Modules

### ⚖️ Public Legal Portal
- **Practice Area Showcase**: Detailed guides for M&A, Intellectual Property prosecution, Startup Advisory, Taxation, and Litigation Defense.
- **Advocate & Counsel Directory**: Detailed advocate bios, representative legal matters, practice focus tags, and contact options.
- **Paid Consultation Engine**: Date & time slot picker with fee calculation, lawyer preference selection, and virtual Zoom link dispatch.
- **Knowledge & Insights Hub**: Regulatory updates, legal whitepapers, newsletters, and publication archives with search & filter.
- **Interactive AI Assistant & Contact Channels**: Floating contact widget featuring quick calls, WhatsApp redirection, and an automated AI legal assistant.
- **Privilege-Shielded Intake**: Contact and enquiry forms compliant with Bar Council of India (BCI) guidelines.

### 🏢 Internal Portals & Management
- **Client Portal**: Track real-time case progress (0–100%), review case status milestones, upload confidential case files, view scheduled consultations, and communicate with lead advocates.
- **Lawyer & Admin Management**: Role-based backend APIs for managing active client cases, updating case progress milestones, managing consultation schedules, issuing legal credentials, and maintaining system logs.

---

## 🛠️ Technology Stack & Architecture

- **Frontend**: React 19, Vite, Lucide React Icons, Vanilla CSS Design System with dark mode tokens & responsive glassmorphism styles.
- **Backend API**: Node.js, Express.js, Mongoose ODM, Helmet (HTTP headers security), CORS, Rate Limiting, Resend (Automated Email Notifications).
- **Database**: MongoDB (via MongoDB Atlas or local MongoDB instance).
- **Storage Pipeline**: Client document vault upload simulation with preview pipeline.

---

## 📁 Optimized Project Directory Structure

```text
Lawzunction/
├── src/
│   ├── assets/               # Branding assets & logo artwork
│   ├── components/
│   │   └── common/           # Common components (Navbar, Footer, BookingModal, FloatingContactWidget)
│   ├── config/               # Application & document vault storage configurations
│   ├── context/              # Global application context (AppContext)
│   ├── pages/
│   │   ├── auth/             # Password management views (ResetPassword, ForceChangePassword)
│   │   ├── client/           # Secure Client Portal dashboard
│   │   └── public/           # Client-facing pages (Home, About, PracticeAreas, Lawyers, CaseStudies, Insights, Contact, LegalDocs)
│   ├── App.jsx               # Client-side router & dynamic page layout engine
│   ├── App.css               # Core app layout stylesheet
│   ├── main.jsx              # React application entry point
│   └── index.css             # Design system tokens, variables, & utility classes
├── server/
│   ├── src/
│   │   ├── config/           # Database connectivity (`db.js`) & auto-seeder (`seed.js`)
│   │   ├── middleware/       # JWT authentication & security middlewares
│   │   ├── models/           # Mongoose ODM schemas (User, Case, Appointment, Document, Enquiry, Newsletter, etc.)
│   │   ├── routes/           # Express REST API routes (auth, client, lawyer, admin, public)
│   │   └── utils/            # Resend mailer, activity logger, & seed data
│   ├── server.js             # Express API server entry point
│   └── package.json          # Backend server dependencies & scripts
├── public/                   # Static assets & favicon
├── render.yaml               # Render backend deployment configuration
├── vercel.json               # Vercel SPA rewrite & reverse proxy configuration
├── vite.config.js            # Vite build configuration
├── eslint.config.js          # ESLint flat configuration (ES2024 / React 19 / Node)
└── package.json              # Frontend scripts & dependencies
```

---

## 📡 REST API Endpoint Map

| Category | HTTP Method | Endpoint Path | Description |
| :--- | :--- | :--- | :--- |
| **Public** | `POST` | `/api/public/consultations/book` | Schedule legal consultation |
| **Public** | `POST` | `/api/public/enquiry` | Submit privilege-shielded inquiry |
| **Public** | `POST` | `/api/public/careers/apply` | Submit associate/paralegal application |
| **Public** | `POST` | `/api/public/newsletter/subscribe` | Subscribe to legal newsletter |
| **Public** | `GET` | `/api/public/advocates` | Fetch directory of legal advocates |
| **Auth** | `POST` | `/api/auth/login` | Portal user authentication |
| **Auth** | `POST` | `/api/auth/forgot-password` | Trigger password reset link |
| **Auth** | `POST` | `/api/auth/reset-password` | Complete password reset |
| **Client** | `GET` | `/api/client/cases` | Fetch authenticated client matters |
| **Client** | `POST` | `/api/client/documents/upload` | Upload document to vault |
| **Lawyer** | `PATCH` | `/api/lawyer/cases/:id/status` | Update case progress milestone |
| **Admin** | `POST` | `/api/admin/users/create` | Provision new client or lawyer user |
| **System** | `GET` | `/api/health` | API & MongoDB connectivity status check |

---

## ⚙️ Local Development Setup

### 1. Environment Setup

Copy `.env.example` in the root directory for the frontend app:

```bash
cp .env.example .env
```

Frontend `.env`:
```env
VITE_API_URL=http://localhost:5000
```

Configure backend environment settings in `server/.env`:
```env
PORT=5000
MONGODB_URI="mongodb+srv://<username>:<password>@cluster0.mongodb.net/lawzunction?retryWrites=true&w=majority"
JWT_SECRET="your_jwt_secret_key"
RESEND_API_KEY="your_resend_api_key"
```

> *Note: For local MongoDB without credentials, set `MONGODB_URI="mongodb://127.0.0.1:27017/lawzunction"`.*

### 2. Installation & Running Services

#### Frontend (Vite)
```bash
npm install
npm run dev
```
The frontend dev server runs at `http://localhost:5173`.

#### Backend Server (Express + Mongoose)
```bash
cd server
npm install
npm run dev
```
The API server connects to MongoDB, auto-seeds default practice areas, lawyer profiles, and legal articles, and initializes administrator accounts using `INITIAL_ADMIN_PASSWORD` (or prompts for password change upon first login), running at `http://localhost:5000`.

---

## 🔐 Security Architecture & Secret Safety Guide

> [!WARNING]
> ### 🚨 Mandatory Secret Rotation Before Production Deployment
> If any database connection string (MongoDB URI), API key (Resend), JWT secret, or demo password was ever placed in code or tested in previous Git commits, **that old value remains in Git history.**
> 
> **You MUST complete these security actions prior to live deployment:**
> 1. **Rotate MongoDB Atlas Credentials**: Generate a new MongoDB database user password in MongoDB Atlas Dashboard and update your production `MONGODB_URI` environment variable.
> 2. **Rotate Resend API Key**: Revoke any previous API keys in [Resend Dashboard](https://resend.com/api-keys) and generate a fresh production key.
> 3. **Generate a Fresh JWT Secret**: Never reuse test JWT secrets. Generate a new cryptographically secure secret (e.g. `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`) for `JWT_SECRET` in Render.
> 4. **Set Custom Admin Password**: Provide a strong custom password via `INITIAL_ADMIN_PASSWORD` in your production environment variables before running the database seeder.

### Secret Handling Checklist

- **Zero Hardcoded Secrets**: All credentials, API tokens, database URIs, and JWT signing keys are strictly loaded via `process.env`.
- **Server-Side Isolation**: Sensitive tokens (`JWT_SECRET`, `RESEND_API_KEY`, `MONGODB_URI`) are strictly server-side and never exposed to the frontend browser bundle.
- **Git Protection**: Both root `.env` and `server/.env` are strictly included in `.gitignore`. Only `.env.example` templates with sanitized placeholder values are tracked in version control.
- **Log Sanitization**: Error handlers and database connection logic automatically mask and sanitize connection strings and passwords to prevent credential leakage in application logs.
- **Frontend Hygiene**: All frontend API calls route through relative `/api` paths with Vite/Vercel proxies. No `NEXT_PUBLIC_`, `REACT_APP_`, or `VITE_` variables expose sensitive backend keys.

---

## 🧪 Code Quality & Build Checks

- **Lint Check**: `npm run lint` (0 errors, 0 warnings across all React 19 & Express modules).
- **Production Build**: `npm run build` (compiles production bundle to `dist/`).

---

## 🚀 Deployment Guide

### Deploying Frontend to Vercel
1. Connect your repository to **Vercel**.
2. Set Build Command: `npm run build` and Output Directory: `dist`.
3. All API calls use relative `/api/*` routes routed to your Render backend via `vercel.json`.

### Deploying Backend to Render
1. Connect repository to **Render**.
2. Deploy as a Web Service or using [`render.yaml`](file:///c:/Users/ransu/Desktop/Lawzunction/render.yaml).
3. Set environment variables (`MONGODB_URI`, `JWT_SECRET`, `RESEND_API_KEY`, `CLIENT_URL`, `FRONTEND_URL`).
4. Set Build Command: `cd server && npm install`
5. Set Start Command: `cd server && npm start`

---

## 📄 Compliance & Copyright

© 2026 Lawzunction. All rights reserved. Compliant with Bar Council of India (BCI) guidelines regarding legal practice representations and advocacy disclaimers.
