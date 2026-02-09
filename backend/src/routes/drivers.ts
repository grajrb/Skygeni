import { Router, Request, Response } from 'express';
import {
  getPipelineSize,
  getWinRate,
  getAvgDealSize,
  getSalesCycleTime
} from '../services/metrics';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  try {
    const pipelineSize = getPipelineSize();
    const winRate = getWinRate();
    const avgDealSize = getAvgDealSize();
    const salesCycleTime = getSalesCycleTime();

    res.json({
      pipelineSize,
      winRate: Number(winRate.toFixed(2)),
      avgDealSize: Math.round(avgDealSize),
      salesCycleTime: Math.round(salesCycleTime)
    });
  } catch (error) {
    console.error('Error in /api/drivers:', error);
    res.status(500).json({ error: 'Failed to fetch drivers data' });
  }
});

export default router;
