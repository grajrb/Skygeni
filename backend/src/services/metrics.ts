import { queryAll, queryGet } from '../db/database';

export interface QuarterInfo {
  startDate: string;
  endDate: string;
  quarter: string;
  year: number;
}

// Get Q1 2026 (current quarter based on current date: Feb 9, 2026)
export function getCurrentQuarter(): QuarterInfo {
  return {
    startDate: '2026-01-01',
    endDate: '2026-03-31',
    quarter: 'Q1',
    year: 2026
  };
}

// Get Q1 2025 for YoY comparison
export function getPreviousYearQuarter(): QuarterInfo {
  return {
    startDate: '2025-01-01',
    endDate: '2025-03-31',
    quarter: 'Q1',
    year: 2025
  };
}

/**
 * Get revenue for a specific date range
 * Uses closed_at for Closed Won deals, falls back to created_at if closed_at is null
 * Excludes deals with null amounts
 */
export async function getRevenueForPeriod(startDate: string, endDate: string): Promise<number> {
  const query = `
    SELECT COALESCE(SUM(amount), 0) as revenue
    FROM deals
    WHERE stage = 'Closed Won'
      AND amount IS NOT NULL
      AND (
        (closed_at IS NOT NULL AND closed_at >= ? AND closed_at <= ?)
        OR (closed_at IS NULL AND created_at >= ? AND created_at <= ?)
      )
  `;
  
  const result = await queryGet<{ revenue: number }>(query, [startDate, endDate, startDate, endDate]);
  return result.revenue || 0;
}

/**
 * Get current quarter revenue
 */
export async function getCurrentQuarterRevenue(): Promise<number> {
  const quarter = getCurrentQuarter();
  return getRevenueForPeriod(quarter.startDate, quarter.endDate);
}

/**
 * Get quarterly target (sum of monthly targets for Q1 2026)
 */
export async function getQuarterlyTarget(): Promise<number> {
  const query = `
    SELECT COALESCE(SUM(target), 0) as total_target
    FROM targets
    WHERE month IN ('2026-01', '2026-02', '2026-03')
  `;

  const result = await queryGet<{ total_target: number }>(query);
  return result.total_target || 0;
}

/**
 * Calculate gap percentage between actual and target
 */
export function calculateGap(actual: number, target: number): number {
  if (target === 0) return 0;
  return ((actual - target) / target) * 100;
}

/**
 * Get YoY change percentage
 */
export async function getYoYChange(): Promise<number | null> {
  const currentQuarter = getCurrentQuarter();
  const previousQuarter = getPreviousYearQuarter();

  const currentRevenue = await getRevenueForPeriod(currentQuarter.startDate, currentQuarter.endDate);
  const previousRevenue = await getRevenueForPeriod(previousQuarter.startDate, previousQuarter.endDate);

  if (previousRevenue === 0) return null;

  return ((currentRevenue - previousRevenue) / previousRevenue) * 100;
}

/**
 * Get pipeline size (count of deals in Prospecting or Negotiation)
 */
export async function getPipelineSize(): Promise<number> {
  const query = `
    SELECT COUNT(*) as count
    FROM deals
    WHERE stage IN ('Prospecting', 'Negotiation')
  `;

  const result = await queryGet<{ count: number }>(query);
  return result.count || 0;
}

/**
 * Calculate win rate (percentage of closed deals that were won)
 */
export async function getWinRate(): Promise<number> {
  const query = `
    SELECT 
      COUNT(CASE WHEN stage = 'Closed Won' THEN 1 END) as won,
      COUNT(CASE WHEN stage IN ('Closed Won', 'Closed Lost') THEN 1 END) as total_closed
    FROM deals
  `;
  
  const result = await queryGet<{ won: number; total_closed: number }>(query);

  if (!result.total_closed) return 0;
  return (result.won / result.total_closed) * 100;
}

/**
 * Calculate average deal size for won deals (excluding null amounts)
 */
export async function getAvgDealSize(): Promise<number> {
  const query = `
    SELECT COALESCE(AVG(amount), 0) as avg_size
    FROM deals
    WHERE stage = 'Closed Won' AND amount IS NOT NULL
  `;

  const result = await queryGet<{ avg_size: number }>(query);
  return result.avg_size || 0;
}

/**
 * Calculate average sales cycle time in days
 * Only for deals with both created_at and closed_at dates
 */
export async function getSalesCycleTime(): Promise<number> {
  const query = `
    SELECT AVG(JULIANDAY(closed_at) - JULIANDAY(created_at)) as avg_cycle
    FROM deals
    WHERE closed_at IS NOT NULL AND stage IN ('Closed Won', 'Closed Lost')
  `;

  const result = await queryGet<{ avg_cycle: number | null }>(query);
  return result.avg_cycle || 0;
}

/**
 * Get stale deals (in Prospecting/Negotiation with no activity in 60+ days or no activity at all)
 * Current date: 2026-02-09
 */
export async function getStaleDeals() {
  const query = `
    SELECT 
      d.deal_id,
      d.stage,
      d.amount,
      d.created_at,
      a.name as account_name,
      a.segment,
      r.name as rep_name,
      JULIANDAY('2026-02-09') - JULIANDAY(d.created_at) as age_days,
      JULIANDAY('2026-02-09') - JULIANDAY(COALESCE(last_activity.last_timestamp, d.created_at)) as days_since_activity
    FROM deals d
    JOIN accounts a ON d.account_id = a.account_id
    JOIN reps r ON d.rep_id = r.rep_id
    LEFT JOIN (
      SELECT deal_id, MAX(timestamp) as last_timestamp
      FROM activities
      GROUP BY deal_id
    ) last_activity ON d.deal_id = last_activity.deal_id
    WHERE d.stage IN ('Prospecting', 'Negotiation')
      AND (
        last_activity.last_timestamp IS NULL 
        OR JULIANDAY('2026-02-09') - JULIANDAY(last_activity.last_timestamp) > 60
      )
      AND JULIANDAY('2026-02-09') - JULIANDAY(d.created_at) > 30
    ORDER BY days_since_activity DESC
  `;
  
  return queryAll(query);
}

/**
 * Get underperforming reps (win rate below average or Q1 revenue below target)
 */
export async function getUnderperformingReps() {
  const avgWinRate = await getWinRate();
  const quarterlyTarget = await getQuarterlyTarget();
  const perRepTarget = quarterlyTarget / 15; // 15 reps total
  
  const query = `
    SELECT 
      r.rep_id,
      r.name,
      COUNT(CASE WHEN d.stage = 'Closed Won' THEN 1 END) as deals_won,
      COUNT(CASE WHEN d.stage = 'Closed Lost' THEN 1 END) as deals_lost,
      COUNT(CASE WHEN d.stage IN ('Closed Won', 'Closed Lost') THEN 1 END) as total_closed,
      CASE 
        WHEN COUNT(CASE WHEN d.stage IN ('Closed Won', 'Closed Lost') THEN 1 END) > 0
        THEN (COUNT(CASE WHEN d.stage = 'Closed Won' THEN 1 END) * 100.0 / 
              COUNT(CASE WHEN d.stage IN ('Closed Won', 'Closed Lost') THEN 1 END))
        ELSE 0
      END as win_rate,
      COALESCE(SUM(CASE 
        WHEN d.stage = 'Closed Won' 
          AND d.amount IS NOT NULL 
          AND ((d.closed_at IS NOT NULL AND d.closed_at >= '2026-01-01' AND d.closed_at <= '2026-03-31')
               OR (d.closed_at IS NULL AND d.created_at >= '2026-01-01' AND d.created_at <= '2026-03-31'))
        THEN d.amount 
        ELSE 0 
      END), 0) as q1_revenue
    FROM reps r
    LEFT JOIN deals d ON r.rep_id = d.rep_id
    GROUP BY r.rep_id, r.name
    HAVING win_rate < ? OR q1_revenue < ?
    ORDER BY win_rate ASC, q1_revenue ASC
  `;
  
  return queryAll(query, [avgWinRate, perRepTarget]);
}

/**
 * Get accounts with low activity (have open deals but < 2 activities in last 90 days)
 */
export async function getLowActivityAccounts() {
  const query = `
    SELECT 
      a.account_id,
      a.name,
      a.segment,
      a.industry,
      COUNT(DISTINCT d.deal_id) as open_deals,
      COUNT(DISTINCT CASE 
        WHEN act.timestamp >= DATE('2026-02-09', '-90 days') 
        THEN act.activity_id 
      END) as recent_activity_count
    FROM accounts a
    JOIN deals d ON a.account_id = d.account_id
    LEFT JOIN activities act ON d.deal_id = act.deal_id
    WHERE d.stage IN ('Prospecting', 'Negotiation')
    GROUP BY a.account_id, a.name, a.segment, a.industry
    HAVING recent_activity_count < 2
    ORDER BY open_deals DESC, recent_activity_count ASC
  `;
  
  return queryAll(query);
}

/**
 * Generate actionable recommendations based on data analysis
 */
export async function generateRecommendations() {
  const recommendations: Array<{
    priority: 'High' | 'Medium' | 'Low';
    action: string;
    metric: string;
    detail: string;
  }> = [];

  // Check stale deals
  const staleDeals = await getStaleDeals();
  if (staleDeals.length > 0) {
    const enterpriseStale = staleDeals.filter((d: any) => d.segment === 'Enterprise');
    if (enterpriseStale.length > 5) {
      recommendations.push({
        priority: 'High',
        action: `Focus on ${enterpriseStale.length} Enterprise deals older than 30 days with no recent activity`,
        metric: 'Stale Enterprise Deals',
        detail: `These high-value deals risk going cold. Schedule immediate follow-ups.`
      });
    } else if (staleDeals.length > 10) {
      recommendations.push({
        priority: 'Medium',
        action: `Re-engage ${staleDeals.length} stale deals with no activity in 60+ days`,
        metric: 'Stale Deals',
        detail: `Prioritize deals by segment: Enterprise > Mid-Market > SMB`
      });
    }
  }

  // Check underperforming reps
  const underperformingReps = await getUnderperformingReps();
  if (underperformingReps.length > 0) {
    const lowestRep = underperformingReps[0] as any;
    recommendations.push({
      priority: 'High',
      action: `Coach ${lowestRep.name} on win rate improvement (currently ${lowestRep.win_rate.toFixed(1)}%)`,
      metric: 'Rep Performance',
      detail: `Win rate below team average. Focus on objection handling and closing techniques.`
    });
  }

  // Check low activity accounts
  const lowActivityAccounts = await getLowActivityAccounts();
  if (lowActivityAccounts.length > 0) {
    const midMarketLowActivity = lowActivityAccounts.filter((a: any) => a.segment === 'Mid-Market');
    if (midMarketLowActivity.length >= 3) {
      recommendations.push({
        priority: 'Medium',
        action: `Increase activity for ${midMarketLowActivity.length} Mid-Market accounts with open deals`,
        metric: 'Account Engagement',
        detail: `Schedule demos and discovery calls to maintain momentum.`
      });
    }
  }

  // Check sales cycle
  const avgCycle = await getSalesCycleTime();
  if (avgCycle > 90) {
    recommendations.push({
      priority: 'Medium',
      action: `Streamline sales process - current cycle is ${Math.round(avgCycle)} days`,
      metric: 'Sales Velocity',
      detail: `Identify bottlenecks in negotiation stage. Consider automation tools.`
    });
  }

  // Check pipeline size
  const pipelineSize = await getPipelineSize();
  if (pipelineSize < 50) {
    recommendations.push({
      priority: 'High',
      action: `Pipeline low (${pipelineSize} deals) - prioritize prospecting and lead generation`,
      metric: 'Pipeline Health',
      detail: `Target 100+ active opportunities for sustainable revenue growth.`
    });
  }

  // Check revenue gap
  const currentRevenue = await getCurrentQuarterRevenue();
  const target = await getQuarterlyTarget();
  const gap = calculateGap(currentRevenue, target);
  
  if (gap < -20) {
    recommendations.push({
      priority: 'High',
      action: `Revenue ${Math.abs(gap).toFixed(0)}% behind target - accelerate deal closures`,
      metric: 'Revenue Gap',
      detail: `Focus on deals in Negotiation stage. Offer limited-time incentives.`
    });
  }

  // Limit to top 5 recommendations
  return recommendations.slice(0, 5);
}
