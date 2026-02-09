import { Router, Request, Response } from 'express';
import {
  getStaleDeals,
  getUnderperformingReps,
  getLowActivityAccounts
} from '../services/metrics';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const staleDeals = await getStaleDeals();
    const underperformingReps = await getUnderperformingReps();
    const lowActivityAccounts = await getLowActivityAccounts();

    res.json({
      staleDeals: staleDeals.map((deal: any) => ({
        dealId: deal.deal_id,
        accountName: deal.account_name,
        segment: deal.segment,
        repName: deal.rep_name,
        stage: deal.stage,
        amount: deal.amount,
        ageDays: Math.round(deal.age_days),
        daysSinceActivity: Math.round(deal.days_since_activity)
      })),
      underperformingReps: underperformingReps.map((rep: any) => ({
        repId: rep.rep_id,
        name: rep.name,
        dealsWon: rep.deals_won,
        dealsLost: rep.deals_lost,
        winRate: Number(rep.win_rate.toFixed(2)),
        q1Revenue: Math.round(rep.q1_revenue)
      })),
      lowActivityAccounts: lowActivityAccounts.map((account: any) => ({
        accountId: account.account_id,
        name: account.name,
        segment: account.segment,
        industry: account.industry,
        openDeals: account.open_deals,
        recentActivityCount: account.recent_activity_count
      }))
    });
  } catch (error) {
    console.error('Error in /api/risk-factors:', error);
    res.status(500).json({ error: 'Failed to fetch risk factors data' });
  }
});

export default router;
