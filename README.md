# 🏙️ CivicFix

**CivicFix** is a modern civic issue reporting and management platform that connects citizens with municipal authorities. Citizens can report local issues (potholes, broken streetlights, waste, etc.), track resolution progress, and rate the service — while officers and admins manage complaints through dedicated dashboards.

---

## ✨ Features

### 👤 For Citizens
- **Report Issues** — Submit complaints with photos, location, and description
- **Track Progress** — Real-time status updates with a timeline view
- **Explore Issues** — Browse open issues in your city on a map
- **Rate & Feedback** — Rate resolutions and leave feedback
- **Upvote** — Upvote existing complaints to prioritize high-impact issues

### 🛡️ For Officers
- **Officer Dashboard** — View and manage complaints assigned to your department
- **Status Updates** — Update complaint status (In Progress → Resolved) with GPS-verified location
- **Upload Resolution Photos** — Attach before/after images to resolved complaints

### 🔑 For Admins
- **Admin Dashboard** — City-wide overview with analytics and charts
- **Escalation Management** — Handle SLA breaches and escalated complaints
- **Officer Management** — Approve/reject officer registrations and manage accounts
- **Auto-Assignment** — Complaints are auto-assigned to available department officers

### ⚙️ Platform Highlights
- **Multi-city support** — Bengaluru, Mumbai, Delhi (and more)
- **Role-based access control** — Citizen / Officer / Admin roles
- **24-hour SLA enforcement** — Automatic escalation for unaccepted complaints
- **Supabase backend** — Real-time database with Row Level Security (RLS)

---

## 🛠️ Tech Stack

| Layer       | Technology                          |
|-------------|-------------------------------------|
| Framework   | Next.js 15 (App Router)             |
| Language    | TypeScript                          |
| Styling     | Tailwind CSS                        |
| UI Icons    | Heroicons, Lucide React             |
| Charts      | Recharts                            |
| Forms       | React Hook Form                     |
| Backend/DB  | Supabase (PostgreSQL + Auth + RLS)  |
| Toasts      | Sonner                              |
| Deployment  | Netlify                             |

---

## 🚀 Installation

### Prerequisites

- **Node.js** v18 or later
- **npm** or **yarn**
- A **Supabase** project (free tier works)

### 1. Clone the repository

```bash
git clone https://github.com/your-username/civicfix.git
cd civicfix
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> [!TIP]
> Find these values in your Supabase project under **Settings → API**.

### 4. Set up the database

Run the SQL schema in your Supabase SQL Editor:

```bash
# Copy the contents of supabase/schema.sql and execute it in:
# Supabase Dashboard → SQL Editor → New Query
```

This will create the required tables (`profiles`, `complaints`, `departments`, `complaint_updates`) and seed default department data for Bengaluru, Mumbai, and Delhi.

### 5. Start the development server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:4028](http://localhost:4028) in your browser.

---

## 📁 Project Structure

```
civicfix/
├── public/
│   └── assets/            # Static assets and images
├── src/
│   ├── app/               # Next.js App Router pages
│   │   ├── admin-dashboard/        # Admin management views
│   │   ├── citizen-dashboard/      # Citizen complaint history
│   │   ├── citizen-home/           # Citizen landing page
│   │   ├── complaint/              # Individual complaint details
│   │   ├── explore/                # Map-based issue explorer
│   │   ├── officer-dashboard/      # Officer task management
│   │   ├── report-an-issue/        # Issue submission form
│   │   ├── sign-up/                # Registration (citizen/officer)
│   │   ├── sign-up-login-screen/   # Login page
│   │   ├── layout.tsx              # Root layout
│   │   └── page.tsx                # Root redirect (role-based)
│   ├── components/        # Shared UI components
│   │   ├── ui/                     # Base UI primitives
│   │   ├── AdminLayout.tsx
│   │   ├── CitizenLayout.tsx
│   │   ├── CitizenTopbar.tsx
│   │   ├── OfficerLayout.tsx
│   │   └── RouteGuard.tsx          # Role-based route protection
│   ├── context/
│   │   └── AuthContext.tsx         # Global auth state
│   ├── lib/
│   │   ├── supabase/               # Supabase client setup
│   │   ├── auth.ts                 # Auth utilities & role routing
│   │   ├── location.ts             # GPS/location helpers
│   │   └── officersStore.ts        # Officer data store
│   └── styles/            # Global CSS and Tailwind config
├── supabase/
│   └── schema.sql         # Database schema & seed data
├── next.config.mjs
├── tailwind.config.js
└── package.json
```

---

## 📦 Available Scripts

| Command              | Description                              |
|----------------------|------------------------------------------|
| `npm run dev`        | Start development server on port 4028    |
| `npm run build`      | Build the application for production     |
| `npm run start`      | Start dev server (alias for `dev`)       |
| `npm run serve`      | Start production server                  |
| `npm run lint`       | Run ESLint                               |
| `npm run lint:fix`   | Auto-fix ESLint issues                   |
| `npm run format`     | Format code with Prettier                |
| `npm run type-check` | Run TypeScript type checker              |

---

## 🗃️ Database Schema

The Supabase database includes four main tables:

- **`departments`** — City departments (Roads, Sanitation, Water, Lighting, Parks)
- **`profiles`** — User accounts extending Supabase Auth (citizen / officer / admin)
- **`complaints`** — Issue reports with status, priority, location, photos, and resolution tracking
- **`complaint_updates`** — Activity timeline for each complaint

> [!NOTE]
> Row Level Security (RLS) is enabled on all tables. Officers and admins have elevated permissions; citizens can only read/write their own data.

---

## 📱 Deployment

### Netlify (recommended)

The project includes `@netlify/plugin-nextjs`. Connect your GitHub repository to Netlify and set the environment variables (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`) in the Netlify dashboard.

### Manual build

```bash
npm run build
npm run serve
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m "feat: add your feature"`
4. Push and open a Pull Request

---

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

Built with ❤️ to empower citizens and improve cities.