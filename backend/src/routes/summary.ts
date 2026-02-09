import { Router, Request, Response } from 'express';
import {
  getCurrentQuarterRevenue,
  getQuarterlyTarget,
  calculateGap,
  getYoYChange
} from '../services/metrics';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const currentQuarterRevenue = getCurrentQuarterRevenue();
    const target = getQuarterlyTarget();
    const gapPercent = calculateGap(currentQuarterRevenue, target);
    const yoyChange = getYoYChange();

    res.json({
      currentQuarterRevenue: Math.round(currentQuarterRevenue),
      target: Math.round(target),
      gapPercent: Number(gapPercent.toFixed(2)),
      yoyChange: yoyChange !== null ? Number(yoyChange.toFixed(2)) : null
    });
  } catch (error) {
    console.error('Error in /api/summary:', error);
    res.status(500).json({ error: 'Failed to fetch summary data' });
  }
});

export default router;
