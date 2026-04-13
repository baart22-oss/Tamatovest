# 🍅 Tamatovest — Smart Tomato Investment Platform

A full-stack investment platform with a tomato-themed aesthetic (red/green/white), built with React.js and Node.js/Express.

## ✨ Features

- **13 Investment Tiers**: R80 to R12,000 (Seedling → Premium)
- **5% Daily Returns** (non-compounded) for 60 days (300% total return)
- **3-Tier Referral System**: 12% (L1) / 5% (L2) / 1% (L3)
- **Proof of Payment (POP)** upload for investment activation
- **Withdrawal System** with full banking details
- **Admin Dashboard**: Approve/reject POPs, manage withdrawals and users

## 🏗️ Project Structure

```
Tamatovest/
├── frontend/          # React.js app
│   ├── src/
│   │   ├── pages/     # Login, Register, Dashboard, Packages, etc.
│   │   ├── components/# Layout, StatusBadge
│   │   ├── context/   # AuthContext (JWT auth)
│   │   └── utils/     # Axios API client
│   └── public/
├── backend/           # Node.js/Express API
│   ├── src/
│   │   ├── routes/    # auth, investments, withdrawals, referrals, admin
│   │   ├── db/        # PostgreSQL pool + migrations
│   │   ├── middleware/ # JWT auth middleware
│   │   └── utils/     # Constants (packages, rates)
│   └── uploads/       # POP image storage
├── render.yaml        # Render deployment config
└── README.md
```

## 🚀 Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL (local or Render)

### Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your DATABASE_URL and JWT_SECRET
npm install
npm run migrate   # Run DB migrations
npm run dev       # Start dev server on :5000
```

### Frontend Setup

```bash
cd frontend
cp .env.example .env
# Edit .env: REACT_APP_API_URL=http://localhost:5000
npm install
npm start         # Start on :3000
```

## 🌐 Deployment on Render

### Option 1: render.yaml (Recommended)
1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New → Blueprint
3. Connect this repo — Render will auto-configure from `render.yaml`

### Option 2: Manual Setup

**Database:**
1. Render → New → PostgreSQL → Create `tamatovest-db`

**Backend:**
1. Render → New → Web Service → connect repo
2. Root Dir: `backend`
3. Build: `npm install`
4. Start: `npm start`
5. Add env vars: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `NODE_ENV=production`

**Frontend:**
1. Render → New → Static Site → connect repo
2. Root Dir: `frontend`
3. Build: `npm install && npm run build`
4. Publish: `./build`
5. Add env var: `REACT_APP_API_URL=https://your-backend.onrender.com`

## 📊 Investment Packages

| Package | Amount | Daily Profit | Total Profit (60d) |
|---------|--------|-------------|-------------------|
| Seedling | R80 | R4.00 | R240.00 |
| Sprout | R150 | R7.50 | R450.00 |
| Sapling | R300 | R15.00 | R900.00 |
| Budding | R500 | R25.00 | R1,500.00 |
| Blossoming | R800 | R40.00 | R2,400.00 |
| Growing | R1,200 | R60.00 | R3,600.00 |
| Thriving | R2,000 | R100.00 | R6,000.00 |
| Flourishing | R3,000 | R150.00 | R9,000.00 |
| Abundant | R4,500 | R225.00 | R13,500.00 |
| Prosperous | R6,000 | R300.00 | R18,000.00 |
| Wealthy | R8,000 | R400.00 | R24,000.00 |
| Elite | R10,000 | R500.00 | R30,000.00 |
| Premium | R12,000 | R600.00 | R36,000.00 |

## 🔐 Admin Access

Create an admin user directly in the database:
```sql
UPDATE users SET role = 'admin' WHERE email = 'admin@example.com';
```

## 🛠️ Tech Stack

- **Frontend**: React.js, React Router v6, Axios, react-hot-toast
- **Backend**: Node.js, Express.js, JWT, bcrypt, Multer
- **Database**: PostgreSQL
- **Deployment**: Render (backend + DB), Render Static Site / Vercel (frontend)
