# Revenue Intelligence Console

A single-page dashboard application that helps CROs (Chief Revenue Officers) understand quarterly revenue performance through data-driven insights, risk analysis, and actionable recommendations.

![Dashboard Screenshot](https://img.shields.io/badge/Stack-React%20%7C%20TypeScript%20%7C%20Express%20%7C%20SQLite-blue)
![Status](https://img.shields.io/badge/Status-MVP-green)

---

## 📊 Overview

This Revenue Intelligence Console analyzes 1 year of sales data to answer:

> **"Why are we behind (or ahead) on revenue this quarter, and what should we focus on right now?"**

### Key Features
- **Revenue Summary:** Current quarter performance vs target with YoY comparison
- **Revenue Drivers:** Pipeline metrics (size, win rate, avg deal size, sales cycle time)
- **Strategic Recommendations:** 3-5 actionable suggestions based on data analysis
- **Risk Factors:** Identify stale deals, underperforming reps, and low-activity accounts

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Summary  │  │ Drivers  │  │  Risks   │  │   Recs   │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│         Material UI Components + D3 Charts                  │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP (Axios)
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                BACKEND (Express + TypeScript)               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │   /summary  │  │  /drivers   │  │   /risks    │  ...   │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
│            Metrics Service (Business Logic)                 │
└────────────────────┬────────────────────────────────────────┘
                     │ SQL Queries
                     ↓
┌─────────────────────────────────────────────────────────────┐
│                  DATABASE (SQLite)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ accounts │  │   reps   │  │  deals   │  │activities│   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│  ┌──────────┐                                               │
│  │ targets  │  Indexes on stage, closed_at, rep_id, etc.   │
│  └──────────┘                                               │
└─────────────────────────────────────────────────────────────┘
                     ↑ Seed from JSON
┌─────────────────────────────────────────────────────────────┐
│                      DATA (JSON Files)                      │
│  accounts.json • reps.json • deals.json • activities.json   │
│  targets.json                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 18+** (with npm)
- **Git**
- **Windows Users:** You'll need Windows Build Tools for SQLite native compilation:
  ```bash
  # Option 1: Install Visual Studio Build Tools (recommended)
  # Download from: https://visualstudio.microsoft.com/downloads/
  # Install "Desktop development with C++" workload
  
  # Option 2: Install windows-build-tools via npm (as Administrator)
  npm install --global windows-build-tools
  
  # Option 3: Use WSL2 (Windows Subsystem for Linux)
  # Follow: https://docs.microsoft.com/en-us/windows/wsl/install
  ```

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd SkyGeni
   ```

2. **Install backend dependencies:**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies:**
   ```bash
   cd ../frontend
   npm install
   ```

### Running the Application

1. **Start the backend server** (Terminal 1):
   ```bash
   cd backend
   npm run dev
   ```
   The backend will:
   - Initialize SQLite database at `backend/database.sqlite`
   - Auto-seed data from `/data/*.json` files (if database is empty)
   - Start Express server on http://localhost:3001

2. **Start the frontend dev server** (Terminal 2):
   ```bash
   cd frontend
   npm run dev
   ```
   The frontend will start on http://localhost:5173

3. **Open the dashboard:**
   Navigate to http://localhost:5173 in your browser

---

## 📡 API Documentation

Base URL: `http://localhost:3001/api`

### 1. GET `/api/summary`
Returns current quarter revenue summary with target comparison.

**Response:**
```json
{
  "currentQuarterRevenue": 125000,
  "target": 150000,
  "gapPercent": -16.67,
  "yoyChange": 12.5
}
```

**Fields:**
- `currentQuarterRevenue`: Total revenue for Q1 2026 (Closed Won, excluding null amounts)
- `target`: Sum of monthly targets for Q1 2026
- `gapPercent`: Percentage gap to target (negative = behind, positive = ahead)
- `yoyChange`: Year-over-year growth vs Q1 2025 (null if no prior year data)

---

### 2. GET `/api/drivers`
Returns key revenue performance drivers.

**Response:**
```json
{
  "pipelineSize": 185,
  "winRate": 42.5,
  "avgDealSize": 45000,
  "salesCycleTime": 67
}
```

**Fields:**
- `pipelineSize`: Count of deals in Prospecting or Negotiation stages
- `winRate`: Percentage of closed deals that were won (Won / (Won + Lost) × 100)
- `avgDealSize`: Average deal amount for Closed Won deals (excluding nulls)
- `salesCycleTime`: Average days from created_at to closed_at for closed deals

---

### 3. GET `/api/risk-factors`
Identifies deals, reps, and accounts that need attention.

**Response:**
```json
{
  "staleDeals": [
    {
      "dealId": "D123",
      "accountName": "Company_45",
      "segment": "Enterprise",
      "repName": "John Doe",
      "stage": "Negotiation",
      "amount": 75000,
      "ageDays": 95,
      "daysSinceActivity": 72
    }
  ],
  "underperformingReps": [
    {
      "repId": "R5",
      "name": "Jane Smith",
      "dealsWon": 3,
      "dealsLost": 8,
      "winRate": 27.3,
      "q1Revenue": 85000
    }
  ],
  "lowActivityAccounts": [
    {
      "accountId": "A89",
      "name": "Company_89",
      "segment": "Mid-Market",
      "industry": "SaaS",
      "openDeals": 2,
      "recentActivityCount": 0
    }
  ]
}
```

**Risk Definitions:**
- **Stale Deals:** In Prospecting/Negotiation with no activity in 60+ days AND age > 30 days
- **Underperforming Reps:** Win rate below team average OR Q1 revenue below per-rep target
- **Low Activity Accounts:** Have open deals but < 2 activities in last 90 days

---

### 4. GET `/api/recommendations`
Returns 3-5 actionable recommendations prioritized by impact.

**Response:**
```json
{
  "recommendations": [
    {
      "priority": "High",
      "action": "Focus on 12 Enterprise deals older than 30 days with no recent activity",
      "metric": "Stale Enterprise Deals",
      "detail": "These high-value deals risk going cold. Schedule immediate follow-ups."
    },
    {
      "priority": "High",
      "action": "Coach Jane Smith on win rate improvement (currently 27.3%)",
      "metric": "Rep Performance",
      "detail": "Win rate below team average. Focus on objection handling and closing techniques."
    },
    {
      "priority": "Medium",
      "action": "Streamline sales process - current cycle is 67 days",
      "metric": "Sales Velocity",
      "detail": "Identify bottlenecks in negotiation stage. Consider automation tools."
    }
  ]
}
```

**Priority Levels:**
- **High:** Immediate action required (revenue at risk)
- **Medium:** Important but not urgent (process improvements)
- **Low:** Nice-to-have optimizations

---

## 🛠️ Tech Stack

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Language:** TypeScript
- **Database:** SQLite (better-sqlite3)
- **Dev Tools:** tsx (TypeScript execution)

### Frontend
- **Framework:** React 18
- **Build Tool:** Vite
- **Language:** TypeScript
- **UI Library:** Material UI (MUI)
- **Charts:** D3.js
- **HTTP Client:** Axios

---

## 📂 Project Structure

```
SkyGeni/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── database.ts       # SQLite schema & initialization
│   │   │   └── seed.ts           # JSON → SQLite data loader
│   │   ├── routes/
│   │   │   ├── summary.ts        # /api/summary endpoint
│   │   │   ├── drivers.ts        # /api/drivers endpoint
│   │   │   ├── risk-factors.ts   # /api/risk-factors endpoint
│   │   │   └── recommendations.ts # /api/recommendations endpoint
│   │   ├── services/
│   │   │   └── metrics.ts        # Business logic & calculations
│   │   └── index.ts              # Express app entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── database.sqlite           # (generated on first run)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Summary.tsx       # Revenue summary with gauge chart
│   │   │   ├── Drivers.tsx       # Revenue drivers with bar chart
│   │   │   ├── RiskFactors.tsx   # Risk analysis with tables
│   │   │   └── Recommendations.tsx # Actionable suggestions
│   │   ├── services/
│   │   │   └── api.ts            # API client & TypeScript types
│   │   ├── App.tsx               # Main dashboard layout
│   │   └── main.tsx              # React entry point
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── data/
│   ├── accounts.json             # 120 customer accounts
│   ├── reps.json                 # 15 sales representatives
│   ├── deals.json                # 600 sales deals
│   ├── activities.json           # 250 activities (calls/emails/demos)
│   └── targets.json              # 12 monthly revenue targets (2025)
├── THINKING.md                   # Design decisions & reflections
└── README.md                     # This file
```

---

## 📊 Data Quality Notes

### Known Data Issues
1. **39% of deals have null amounts** (234/600 deals)
   - Including some "Closed Won" deals
   - **Strategy:** Excluded from revenue calculations (displayed as "excl. nulls")

2. **Inconsistent `closed_at` dates**
   - Some "Closed Won" deals have null `closed_at`
   - Some "Prospecting" deals have populated `closed_at`
   - **Strategy:** Use `closed_at` if present, else fall back to `created_at`

3. **41% of deals have no activities** (350/600 deals)
   - Only 250 activities for 600 deals
   - **Strategy:** Flag as "no activity data" in stale deals analysis

4. **No product/territory/quota data**
   - Limited segmentation options
   - **Strategy:** Use available fields (segment, industry, rep)

### Data Validation
The seed script logs warnings for:
- Deals with null amounts (count + percentage)
- Closed Won deals with null amounts
- Closed deals without `closed_at` dates
- Deals without any activities

---

## 🧪 Testing

### Manual API Testing
Use cURL or Postman to test endpoints:

```bash
# Summary
curl http://localhost:3001/api/summary

# Drivers
curl http://localhost:3001/api/drivers

# Risk Factors
curl http://localhost:3001/api/risk-factors

# Recommendations
curl http://localhost:3001/api/recommendations

# Health Check
curl http://localhost:3001/health
```

### Expected Behavior
- Backend starts without errors and auto-seeds database
- Frontend loads all 4 sections (Summary, Drivers, Recommendations, Risks)
- Charts render correctly (gauge chart, bar chart)
- Tables display data with proper formatting
- Null amounts shown as "N/A" in UI

---

## 🔧 Development Commands

### Backend
```bash
cd backend

# Development (watch mode)
npm run dev

# Seed database (clear & reload)
npm run db:seed

# Build for production
npm run build

# Run production build
npm start
```

### Frontend
```bash
cd frontend

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

---

## 🚀 Production Deployment

### Backend
1. Set `NODE_ENV=production`
2. Use PostgreSQL instead of SQLite (update `database.ts`)
3. Configure CORS whitelist for production domain
4. Enable rate limiting (express-rate-limit)
5. Set up monitoring (Datadog, New Relic)
6. Deploy to AWS EC2, Heroku, or Render

### Frontend
1. Update `API_BASE_URL` in `api.ts` to production backend URL
2. Build: `npm run build` (outputs to `dist/`)
3. Deploy `dist/` folder to:
   - **Vercel:** `vercel deploy`
   - **Netlify:** `netlify deploy --prod`
   - **AWS S3 + CloudFront:** Static hosting

---

## 📈 Future Enhancements

### Scalability
- [ ] Migrate to PostgreSQL with read replicas
- [ ] Add Redis caching layer (5-min TTL)
- [ ] Implement pagination for large datasets (> 100 rows)
- [ ] Background jobs for metric precomputation (Airflow, cron)

### Features
- [ ] Segment-specific staleness thresholds (Enterprise: 90d, SMB: 30d)
- [ ] Drill-down into deals/accounts/reps for detailed view
- [ ] Export reports as PDF/CSV
- [ ] Real-time updates via WebSocket
- [ ] Multi-currency support

### Data Quality
- [ ] Estimate null amounts using segment/industry averages
- [ ] Data validation pipeline (Great Expectations)
- [ ] Audit logging for data changes
- [ ] Automated data quality monitoring & alerts

### UX Improvements
- [ ] Dark mode toggle
- [ ] Customizable date ranges (not just Q1 2026)
- [ ] Save/share dashboard configurations
- [ ] Mobile-responsive design

---

## 🤝 Contributing

This is a technical assessment project. Contributions are not expected, but feedback is welcome!

---

## 📄 License

This project is for demonstration purposes only.

---

## 📞 Support

For questions or issues:
1. Check [THINKING.md](THINKING.md) for design decisions and known limitations
2. Review API documentation above
3. Inspect browser console for frontend errors
4. Check backend terminal logs for server errors

### Common Issues

#### Windows: `better-sqlite3` build failed
**Error:** `gyp ERR! find VS` or `Could not find any Visual Studio installation`

**Solution:**
1. Install [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/) with "Desktop development with C++" workload
2. Or use [WSL2](https://docs.microsoft.com/en-us/windows/wsl/install) and run the project in Linux environment
3. Alternative: Replace `better-sqlite3` with `sql.js` (pure JavaScript SQLite) in [backend/src/db/database.ts](backend/src/db/database.ts)

#### Backend won't start
- Check if port 3001 is already in use: `netstat -ano | findstr :3001` (Windows) or `lsof -i :3001` (Mac/Linux)
- Verify Node.js version: `node --version` (should be 18+)
- Delete `backend/node_modules` and `backend/database.sqlite`, then reinstall: `npm install`

#### Frontend can't connect to backend
- Ensure backend is running on http://localhost:3001
- Check browser console for CORS errors
- Verify `vite.config.ts` proxy configuration
- Try accessing http://localhost:3001/health directly in browser

---

**Built with ❤️ for revenue intelligence**
