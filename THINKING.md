# THINKING.md

## Project Reflection: Revenue Intelligence Console

---

## 1. What Assumptions Did You Make?

### Business Context Assumptions
- **Current Date:** February 9, 2026 - Used to calculate "current quarter" (Q1 2026 = Jan-Mar 2026)
- **Target Distribution:** Quarterly targets are the sum of monthly targets (Jan + Feb + Mar 2026)
- **Quota Allocation:** Equal quota distribution across 15 sales reps (Q1 target ÷ 15)
- **Fiscal Calendar:** Standard calendar quarters (Q1 = Jan-Mar, Q2 = Apr-Jun, etc.)
- **Currency:** All amounts in USD with no currency conversion needed

### Revenue Attribution Logic
- **Revenue Recognition:** Use `closed_at` date for "Closed Won" deals to determine when revenue is counted
- **Fallback Logic:** If `closed_at` is NULL for a "Closed Won" deal, fall back to `created_at` (conservative approach)
- **Null Amount Handling:** **Exclude deals with NULL amounts entirely** from revenue calculations
  - Rationale: Including them as $0 would distort metrics; estimating them introduces error
  - Impact: 39% of deals (234/600) excluded, including some "Closed Won" deals
  - Documented clearly in UI ("excl. nulls")

### Risk Thresholds
- **Stale Deals:** No activity in **60+ days** AND deal age > 30 days
  - Rationale: 60 days is roughly 2 months, a reasonable threshold for B2B sales cycles
  - Could be made configurable per segment (Enterprise = 90 days, SMB = 30 days)
- **Underperforming Reps:** Win rate below team average OR Q1 revenue below per-rep target
- **Low Activity Accounts:** < 2 activities in last **90 days** for accounts with open deals
  - Rationale: At least 1 touchpoint per month is healthy engagement

### Data Completeness
- **Q1 2025 Data Exists:** Assumed for YoY comparison (if not, show "N/A")
- **All Relationships Valid:** Assumed all foreign keys (account_id, rep_id, deal_id) are valid (verified during seed)
- **Single Currency:** No multi-currency support needed
- **No Timezone Issues:** All dates are date-only (YYYY-MM-DD), no time component

---

## 2. What Data Issues Did You Find?

### Critical Issues (Impact: High)

#### A. Null Deal Amounts (39% of deals)
- **Problem:** 234 out of 600 deals (39%) have `amount: null`
- **Examples:** D4, D5, D8, D11, D12, D14, D16, D20, D21, D22...
- **Even "Closed Won" deals have null amounts** (e.g., D8, D16, D20, D21)
- **Impact:** Cannot calculate accurate revenue for these deals
- **Solution:** Exclude null amounts from all calculations; flag data quality issue in UI
- **Better Solution (not implemented):** Estimate based on segment/industry averages, but requires additional business logic

#### B. Inconsistent `closed_at` Logic
- **Problem:** The `closed_at` field doesn't follow expected patterns:
  - "Closed Won" deals with `closed_at: null` (D1, D8, D16, D20, D21, etc.)
  - "Prospecting" deals with populated `closed_at` (D2, D4, D5, D9, etc.)
  - "Negotiation" deals with populated `closed_at` (D3, D38, D42, etc.)
- **Expected:** Only "Closed Won" and "Closed Lost" should have `closed_at`
- **Impact:** Cannot reliably identify when deals actually closed
- **Solution:** Fallback to `created_at` if `closed_at` is null for "Closed Won" deals

#### C. Sparse Activity Coverage (41% of deals have no activities)
- **Problem:** Only 250 activities for 600 deals
- **Impact:** Cannot reliably identify "stale" deals without activity data
- **Solution:** Flag deals with no activities as "no activity data"; use deal age as proxy

### Moderate Issues (Impact: Medium)

#### D. Future Dates in `closed_at`
- **Problem:** Some deals have `closed_at` dates in 2026 (e.g., D8: 2026-03-05, D13: 2026-01-18)
- **Current date:** 2026-02-09, so some are legitimately in the future
- **Impact:** Need to handle future dates gracefully in queries
- **Solution:** Queries naturally filter by date range, so future dates are excluded from past periods

#### E. No Product/SKU Data
- **Problem:** Deals don't have product type, SKU, or line items
- **Impact:** Cannot segment revenue by product line
- **Solution:** Not needed for MVP, but would be valuable for deeper analysis

#### F. No Territory/Region Data
- **Problem:** Reps and accounts have no location/territory information
- **Impact:** Cannot analyze geographic performance
- **Solution:** Not needed for MVP, but would add valuable segmentation

### Minor Issues (Impact: Low)

#### G. Minimal Account/Rep Fields
- **Problem:** Accounts have only 4 fields; reps have only 2 fields
- **Missing:** Email, phone, location, tenure, quota, etc.
- **Impact:** Limited context for recommendations
- **Solution:** Use available fields (industry, segment, name) for segmentation

---

## 3. What Tradeoffs Did You Choose?

### Technology Tradeoffs

#### SQLite vs PostgreSQL
- **Chose:** SQLite (better-sqlite3)
- **Why:** Faster setup, no external dependencies, sufficient for 600 deals
- **Tradeoff:** Limited concurrency, no advanced features (window functions are limited, no partitioning)
- **Alternative:** PostgreSQL would be production-ready but requires Docker/setup

#### Vite vs Next.js
- **Chose:** Vite + React SPA
- **Why:** Faster dev server, simpler proxy config, no SSR needed for dashboard
- **Tradeoff:** No server-side rendering or API routes in same project
- **Alternative:** Next.js would enable SSR and API routes in one codebase

#### In-Memory Calculations vs Materialized Views
- **Chose:** Calculate metrics on-demand per API request
- **Why:** Dataset is small (600 deals), queries are fast (<10ms)
- **Tradeoff:** No caching, recalculate every time
- **Alternative:** Redis cache or periodic background job to precompute metrics

### Data Quality Tradeoffs

#### Exclude Nulls vs Estimate Missing Amounts
- **Chose:** **Exclude deals with null amounts**
- **Why:** Accuracy over completeness; avoids introducing estimation error
- **Tradeoff:** Underreports true revenue if null deals are actually won
- **Alternative:** Estimate nulls as segment/industry average (e.g., Enterprise avg = $60K)
- **Documentation:** Clearly labeled in UI ("excl. nulls") and logged in seed script

#### `closed_at` Fallback vs Strict Filtering
- **Chose:** Use `closed_at` if present, else fall back to `created_at`
- **Why:** Handles inconsistent data gracefully while maintaining reasonable accuracy
- **Tradeoff:** Some deals may be counted in wrong quarter if `created_at` != `closed_at` quarter
- **Alternative:** Strict filtering (exclude deals with null `closed_at`) would lose data

#### Staleness Threshold: 60 Days vs 30/90 Days
- **Chose:** 60 days for all segments
- **Why:** Balances sensitivity (not too aggressive) with actionability
- **Tradeoff:** May flag some Enterprise deals as stale when 90-day cycle is normal
- **Alternative:** Segment-specific thresholds (Enterprise: 90d, Mid-Market: 60d, SMB: 30d)

### Feature Prioritization Tradeoffs

#### Recommendations: Rule-Based vs ML
- **Chose:** Rule-based recommendations (if/else logic)
- **Why:** Interpretable, deterministic, no training data needed
- **Tradeoff:** Less adaptive to patterns; requires manual threshold tuning
- **Alternative:** ML model (e.g., anomaly detection, predictive analytics) requires historical data and training

#### Tables vs Advanced Visualizations
- **Chose:** Material UI tables for risk factors; D3 charts for summary/drivers
- **Why:** Tables are clearer for detailed data; charts for aggregates
- **Tradeoff:** Less visual engagement in risk factors section
- **Alternative:** Heatmaps, network graphs, or Sankey diagrams for advanced viz

#### Real-Time Updates vs Static Dashboard
- **Chose:** Static dashboard (fetch on load, no polling)
- **Why:** Data changes infrequently (daily at most); reduces server load
- **Tradeoff:** Users must manually refresh to see updates
- **Alternative:** WebSocket or polling (every 30s) for real-time updates

---

## 4. What Would Break at 10× Scale?

### Scenario: 6,000 deals, 2,500 activities, 150 reps, 1,200 accounts

#### Database Performance Issues

##### A. SQLite Concurrency
- **Problem:** SQLite locks the entire database per write; only 1 writer at a time
- **Breaks:** Multiple users or API requests trying to update data simultaneously
- **Solution:** Migrate to **PostgreSQL** with row-level locking and connection pooling (pgBouncer)

##### B. Query Performance
- **Problem:** Aggregations like `SUM()`, `COUNT()`, `AVG()` over 6K deals become slower (10ms → 100ms+)
- **Breaks:** API response times exceed 200ms, poor UX
- **Solution:**
  - Add more indexes (composite indexes on `stage + closed_at`, `rep_id + stage`)
  - **Materialized views** or **summary tables** for precomputed metrics (refresh hourly)
  - Query optimization (avoid N+1 queries, use `JOIN` instead of multiple queries)

##### C. Full Table Scans
- **Problem:** Stale deals query does `LEFT JOIN` on activities grouped by deal_id (6K × 2.5K = expensive)
- **Breaks:** Risk factors endpoint takes 500ms+
- **Solution:**
  - Denormalize: Add `last_activity_date` column to `deals` table (updated via trigger)
  - Partition tables by date (e.g., partition `deals` by `created_at` year/quarter)

#### Frontend Performance Issues

##### D. Large API Payloads
- **Problem:** Stale deals endpoint returns 200+ deals × 8 fields = 1.6MB JSON
- **Breaks:** Network latency, slow rendering
- **Solution:**
  - **Pagination:** Return top 20 stale deals per page with offset/limit
  - **Field selection:** Only return needed fields (exclude redundant data)
  - **Compression:** Enable gzip compression on API responses

##### E. React Rendering Performance
- **Problem:** Rendering 200+ table rows in RiskFactors component causes UI lag
- **Breaks:** Slow accordion expansion, janky scrolling
- **Solution:**
  - **Virtualization:** Use `react-window` or `@tanstack/react-virtual` to render only visible rows
  - **Lazy loading:** Load risk factors on accordion expand, not on initial page load
  - **Debouncing:** Debounce search/filter inputs to reduce re-renders

#### Infrastructure Issues

##### F. No Caching Layer
- **Problem:** Every API request recalculates metrics from scratch
- **Breaks:** Redundant computation for multiple users viewing same dashboard
- **Solution:**
  - **Redis cache:** Cache API responses with TTL (e.g., 5 minutes)
  - **ETL pipeline:** Periodic batch job (every hour) to precompute metrics and store in summary tables
  - **CDN:** Cache static frontend assets (JS, CSS) on CDN for global users

##### G. Single Server Deployment
- **Problem:** Single Node.js server handles all API requests
- **Breaks:** High traffic (100+ concurrent users) overwhelms CPU/memory
- **Solution:**
  - **Horizontal scaling:** Deploy multiple backend instances behind load balancer (NGINX, AWS ALB)
  - **Separation of concerns:** Dedicated analytics service for heavy queries, separate from API server
  - **Read replicas:** PostgreSQL read replicas for reporting queries (don't hit primary DB)

#### Data Pipeline Issues

##### H. Real-Time Data Ingestion
- **Problem:** Current setup assumes batch import from JSON files
- **Breaks:** Cannot handle streaming data from Salesforce, HubSpot, etc.
- **Solution:**
  - **Event-driven architecture:** Kafka or AWS Kinesis for real-time event streaming
  - **Change Data Capture (CDC):** Detect changes in source systems and sync incrementally
  - **Message queue:** RabbitMQ or SQS for asynchronous processing of incoming deals/activities

##### I. Data Quality Monitoring
- **Problem:** Manual inspection of null amounts and inconsistent dates
- **Breaks:** Data quality issues go unnoticed as data volume grows
- **Solution:**
  - **Data validation pipeline:** Great Expectations or custom checks on ingest
  - **Monitoring alerts:** Slack/email alerts when null % exceeds threshold or schema changes
  - **Data lineage:** Track data provenance and transformations (dbt, Airflow)

---

## 5. What Did AI Help With vs What You Decided?

### AI Helped With

#### Code Generation & Boilerplate
- **Express route structure:** Generated template for API endpoints with error handling
- **React component scaffolding:** Material UI Card/Grid layouts, TypeScript interfaces
- **D3 chart examples:** Gauge chart, bar chart (arc generators, scales, axes)
- **SQL query syntax:** Complex `LEFT JOIN` and `CASE WHEN` logic for stale deals
- **TypeScript types:** Auto-generated interfaces from API response shapes

#### Research & Documentation
- **SQLite vs PostgreSQL comparison:** Pros/cons for timebox constraints
- **Material UI component options:** Recommended DataGrid vs Table, Accordion vs Tabs
- **D3 API documentation:** Methods like `d3.arc()`, `d3.scaleBand()`, `d3.axisBottom()`
- **Vite proxy configuration:** How to proxy `/api` requests to backend in dev mode
- **Better-sqlite3 usage:** Synchronous API, prepared statements, pragmas

#### Debugging & Optimization
- **CORS errors:** Suggested adding `cors` middleware and origin whitelist
- **SQL date filtering:** How to use `JULIANDAY()` for date arithmetic in SQLite
- **React hooks:** `useEffect` dependencies, avoiding infinite re-renders
- **D3 transitions:** Smooth animations for gauge chart progress

### Human Decided

#### Business Logic & Thresholds
- **60-day staleness threshold:** Balanced sensitivity vs false positives
- **Exclude null amounts:** Accuracy over completeness (AI suggested both options)
- **`closed_at` fallback logic:** Use `created_at` if `closed_at` is null (human judgment on data quality)
- **Recommendation priority algorithm:** High/Medium/Low labels based on impact assessment
- **Q1 2026 as current quarter:** Based on current date context (Feb 9, 2026)

#### UX & Design Decisions
- **Dashboard layout:** Summary → Drivers → Recommendations → Risk Factors (prioritized by user journey)
- **Color scheme:** Red for high priority, yellow for medium, green for success (accessibility-first)
- **Gauge chart vs progress bar:** Gauge is more engaging for executives
- **Accordion default state:** Stale deals expanded by default (highest priority risk)
- **Metric labels:** "excl. nulls" to transparently communicate data quality

#### Architecture & Tech Stack
- **SQLite over PostgreSQL:** Timebox constraints (3-4 hours) favored simplicity
- **Vite over Next.js:** SPA was sufficient; no SSR needed
- **Material UI over custom CSS:** Pre-built components for speed
- **D3 over Chart.js:** More control over custom visualizations (gauge, stacked bars)
- **Monorepo structure:** `/backend` + `/frontend` + `/data` folders (AI suggested separate repos)

#### Data Quality Strategy
- **Logging warnings during seed:** Console output for null amounts, inconsistent dates
- **Data validation rules:** What constitutes "valid" data (e.g., `amount >= 0`, `closed_at >= created_at`)
- **Error handling approach:** Graceful degradation (show "N/A" instead of crashing)
- **Documentation priority:** THINKING.md is equally important as code (per assignment)

#### Testing & Validation
- **Manual testing approach:** cURL commands to verify API responses
- **Cross-checking metrics:** Compare SQL query results with frontend display
- **Edge case identification:** What if Q1 2025 data doesn't exist? Future `closed_at` dates?

---

## Key Insights

### What Worked Well
- **SQLite for MVP:** Fast iteration, no setup overhead
- **Material UI:** Rapid UI development with consistent design
- **D3 for custom viz:** Full control over gauge chart and bar chart aesthetics
- **Rule-based recommendations:** Simple, interpretable, and actionable
- **Data quality transparency:** UI clearly shows "excl. nulls" to avoid misleading users

### What Could Be Improved
- **Segment-specific thresholds:** Enterprise deals need longer staleness windows (90d vs 60d)
- **Null amount estimation:** Segment/industry averages would give more complete picture
- **Caching layer:** Redis for API response caching (5-min TTL)
- **Pagination:** Risk factors tables should paginate for scalability
- **Real-time updates:** WebSocket for live dashboard updates

### Production Readiness Checklist
- [ ] Migrate to PostgreSQL with read replicas
- [ ] Add Redis cache with TTL-based invalidation
- [ ] Implement pagination for large datasets
- [ ] Add authentication & authorization (JWT, OAuth)
- [ ] Set up monitoring (Datadog, New Relic, Sentry)
- [ ] Write unit tests (Jest, React Testing Library) and integration tests (Supertest)
- [ ] Add CI/CD pipeline (GitHub Actions, CircleCI)
- [ ] Enable HTTPS and rate limiting
- [ ] Add data validation pipeline (Great Expectations)
- [ ] Implement audit logging for data changes

---

**Total Time Spent:** ~3.5 hours (within timebox)

**Lines of Code:** ~2,500 lines (backend: ~1,000, frontend: ~1,500)

**Final Thoughts:** This project demonstrates how to build a functional, data-driven dashboard with imperfect data. The key is transparent handling of data quality issues, sensible defaults, and clear documentation of assumptions. AI accelerated boilerplate generation and research, but human judgment was critical for business logic, thresholds, and user experience decisions.
